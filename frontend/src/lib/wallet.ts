import {
  isConnected,
  setAllowed,
  getPublicKey,
  signTransaction,
} from "@stellar/freighter-api";

import { Horizon } from "@stellar/stellar-sdk";

/**
 * Thin wrapper around the Freighter browser extension API.
 * All calls degrade gracefully if Freighter isn't installed so the rest
 * of the UI can show an actionable "Install Freighter" prompt instead of
 * throwing.
 */
export const wallet = {
  async isAvailable(): Promise<boolean> {
    try {
      return await isConnected();
    } catch {
      return false;
    }
  },

  async connect(): Promise<string> {
    const access = await setAllowed();
    if (!access) throw new Error("User denied connection");
    const addr = await getPublicKey();
    if (!addr) throw new Error("Failed to get public key");
    return addr;
  },

  async getBalance(address: string): Promise<string> {
    try {
      const server = new Horizon.Server("https://horizon-testnet.stellar.org");
      const account = await server.loadAccount(address);
      const native = account.balances.find((b) => b.asset_type === "native");
      return native ? native.balance : "0";
    } catch (err) {
      return "0";
    }
  },

  async signXdr(xdr: string, networkPassphrase: string): Promise<string> {
    const result = await signTransaction(xdr, { networkPassphrase });
    if (!result) throw new Error("Transaction signature failed");
    return result as unknown as string;
  },
};
