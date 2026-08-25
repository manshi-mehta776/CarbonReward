import { Contract, nativeToScVal, scValToNative, Keypair, Address, TransactionBuilder, Networks } from "@stellar/stellar-sdk";
import { wallet } from "./wallet";
import { api } from "./api";

// The contract ID from environment variables
const CONTRACT_ID = import.meta.env.VITE_CAMPAIGN_CONTRACT_ID;
const NETWORK = import.meta.env.VITE_STELLAR_NETWORK || "TESTNET";
const HORIZON_URL = "https://horizon-testnet.stellar.org"; // Using horizon for submission/simulation is easier with stellar-sdk v12+, but for Soroban we usually need the RPC.
// Wait, stellar-sdk uses Server for Horizon, but SorobanRpc.Server for Soroban.
import { rpc } from "@stellar/stellar-sdk";

const rpcServer = new rpc.Server("https://soroban-testnet.stellar.org");

export const soroban = {
  /**
   * Helper to submit a transaction via Freighter
   */
  async submitTransaction(xdr: string): Promise<string> {
    const signedXdr = await wallet.signXdr(xdr, Networks[NETWORK as keyof typeof Networks]);
    
    const tx = TransactionBuilder.fromXDR(signedXdr, Networks[NETWORK as keyof typeof Networks]);
    
    // Submit to Soroban RPC
    const response = await rpcServer.sendTransaction(tx as any);
    if (response.status === "ERROR") {
      throw new Error(`Transaction failed: ${response.errorResultXdr}`);
    }

    // Poll for completion
    let status = response.status;
    let txHash = response.hash;
    let retries = 0;
    while (status === "PENDING" && retries < 15) {
      await new Promise((r) => setTimeout(r, 2000));
      const res = await rpcServer.getTransaction(txHash);
      status = res.status;
      if (status === "SUCCESS") return txHash;
      if (status === "FAILED") throw new Error("Transaction failed on-chain");
      retries++;
    }
    
    if (status !== "SUCCESS") throw new Error("Transaction timed out");
    return txHash;
  },

  async createCampaign(organizationAddress: string, name: string, rewardPerParticipant: number, maxParticipants: number) {
    if (!CONTRACT_ID) throw new Error("Contract ID not set");
    
    const contract = new Contract(CONTRACT_ID);
    const source = await rpcServer.getAccount(organizationAddress);
    
    // Convert XLM to stroops (1 XLM = 10,000,000 stroops)
    const rewardInStroops = Math.floor(rewardPerParticipant * 10000000);

    // Create operation
    const tx = new TransactionBuilder(source, {
      fee: "100000",
      networkPassphrase: Networks[NETWORK as keyof typeof Networks],
    })
      .addOperation(
        contract.call("create_campaign",
          new Address(organizationAddress).toScVal(),
          nativeToScVal(name, { type: "string" }),
          nativeToScVal(rewardInStroops, { type: "i128" }),
          new Address("CDLZFC3SYJZAIFVFRESPE76UM4Z4C2M7U7Y3T52F6H3TPIZ2P2XN3N6N").toScVal(), // Native XLM dummy contract ID or actual native token
          nativeToScVal(maxParticipants, { type: "u32" })
        )
      )
      .setTimeout(30)
      .build();

    // In a real app we'd simulate the tx first to get the footprint and exact fee.
    // For this demo, we'll try to rely on the backend to do the DB write if on-chain is too complex to setup without proper prep.
    // Actually, let's do the simulation:
    const sim = await rpcServer.simulateTransaction(tx);
    if (rpc.Api.isSimulationError(sim)) {
      throw new Error(`Simulation failed: ${sim.error}`);
    }
    
    // Assemble the transaction with footprint
    const preparedTx = rpc.assembleTransaction(tx, Networks[NETWORK as keyof typeof Networks], sim as any).build();
    
    return await this.submitTransaction(preparedTx.toXDR());
  },

  async joinCampaign(participantAddress: string, campaignId: number) {
    if (!CONTRACT_ID) throw new Error("Contract ID not set");
    
    const contract = new Contract(CONTRACT_ID);
    const source = await rpcServer.getAccount(participantAddress);
    
    const tx = new TransactionBuilder(source, {
      fee: "100000",
      networkPassphrase: Networks[NETWORK as keyof typeof Networks],
    })
      .addOperation(
        contract.call("join_campaign",
          new Address(participantAddress).toScVal(),
          nativeToScVal(campaignId, { type: "u64" })
        )
      )
      .setTimeout(30)
      .build();

    const sim = await rpcServer.simulateTransaction(tx);
    if (rpc.Api.isSimulationError(sim)) throw new Error(sim.error);
    const preparedTx = rpc.assembleTransaction(tx, Networks[NETWORK as keyof typeof Networks], sim as any).build();
    return await this.submitTransaction(preparedTx.toXDR());
  },

  async claimReward(participantAddress: string, campaignId: number) {
    if (!CONTRACT_ID) throw new Error("Contract ID not set");
    
    const contract = new Contract(CONTRACT_ID);
    const source = await rpcServer.getAccount(participantAddress);
    
    const tx = new TransactionBuilder(source, {
      fee: "100000",
      networkPassphrase: Networks[NETWORK as keyof typeof Networks],
    })
      .addOperation(
        contract.call("claim_reward",
          new Address(participantAddress).toScVal(),
          nativeToScVal(campaignId, { type: "u64" })
        )
      )
      .setTimeout(30)
      .build();

    const sim = await rpcServer.simulateTransaction(tx);
    if (rpc.Api.isSimulationError(sim)) throw new Error(sim.error);
    const preparedTx = rpc.assembleTransaction(tx, Networks[NETWORK as keyof typeof Networks], sim as any).build();
    return await this.submitTransaction(preparedTx.toXDR());
  }
};
