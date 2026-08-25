import { Contract, nativeToScVal, Address, TransactionBuilder, Networks, Asset } from "@stellar/stellar-sdk";
import { wallet } from "./wallet";
import { rpc } from "@stellar/stellar-sdk";

const CONTRACT_ID = import.meta.env.VITE_CAMPAIGN_CONTRACT_ID;
const NETWORK = import.meta.env.VITE_STELLAR_NETWORK || "TESTNET";

const rpcServer = new rpc.Server("https://soroban-testnet.stellar.org");

export const soroban = {
  async submitTransaction(xdr: string): Promise<string> {
    const signedXdr = await wallet.signXdr(xdr, Networks[NETWORK as keyof typeof Networks]);
    
    const tx = TransactionBuilder.fromXDR(signedXdr, Networks[NETWORK as keyof typeof Networks]);
    
    const response = await rpcServer.sendTransaction(tx as any);
    if (response.status === "ERROR") {
      throw new Error(`Transaction failed: ${(response as any).errorResult}`);
    }

    let status = response.status as string;
    let txHash = response.hash;
    let retries = 0;
    while (status === "PENDING" && retries < 15) {
      await new Promise((r) => setTimeout(r, 2000));
      const res = await rpcServer.getTransaction(txHash);
      status = res.status as string;
      if (status === rpc.Api.GetTransactionStatus.SUCCESS) return txHash;
      if (status === rpc.Api.GetTransactionStatus.FAILED) throw new Error("Transaction failed on-chain");
      retries++;
    }
    
    if (status !== rpc.Api.GetTransactionStatus.SUCCESS) throw new Error("Transaction timed out");
    return txHash;
  },

  async createCampaign(organizationAddress: string, name: string, rewardPerParticipant: number, maxParticipants: number) {
    if (!CONTRACT_ID) throw new Error("Contract ID not set");
    
    const contract = new Contract(CONTRACT_ID);
    const source = await rpcServer.getAccount(organizationAddress);
    
    const rewardInStroops = Math.floor(rewardPerParticipant * 10000000);
    const networkPassphrase = Networks[NETWORK as keyof typeof Networks];

    const tx = new TransactionBuilder(source, {
      fee: "100000",
      networkPassphrase,
    })
      .addOperation(
        contract.call("create_campaign",
          new Address(organizationAddress).toScVal(),
          nativeToScVal(name, { type: "string" }),
          nativeToScVal(rewardInStroops, { type: "i128" }),
          new Address(Asset.native().contractId(networkPassphrase)).toScVal(),
          nativeToScVal(maxParticipants, { type: "u32" })
        )
      )
      .setTimeout(30)
      .build();

    const sim = await rpcServer.simulateTransaction(tx);
    if (rpc.Api.isSimulationError(sim)) {
      throw new Error(`Simulation failed: ${sim.error}`);
    }
    if (rpc.Api.isSimulationRestore(sim)) {
      throw new Error("Contract needs state restoration. Simulation returned restore response.");
    }
    
    // @ts-ignore
    const preparedTx = rpc.assembleTransaction(tx, sim).build();
    
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
    if (rpc.Api.isSimulationRestore(sim)) throw new Error("Contract needs state restoration.");
    if (!rpc.Api.isSimulationSuccess(sim)) throw new Error("Simulation was not successful.");
    
    if (!sim.result) {
      throw new Error("Simulation returned invalid results. Check console for details.");
    }
    
    // @ts-ignore
    const preparedTx = rpc.assembleTransaction(tx, sim).build();
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
    if (rpc.Api.isSimulationRestore(sim)) throw new Error("Contract needs state restoration.");
    if (!rpc.Api.isSimulationSuccess(sim)) throw new Error("Simulation was not successful.");
    
    if (!sim.result) {
      throw new Error("Simulation returned invalid results. Check console for details.");
    }
    
    // @ts-ignore
    const preparedTx = rpc.assembleTransaction(tx, sim).build();
    return await this.submitTransaction(preparedTx.toXDR());
  }
};
