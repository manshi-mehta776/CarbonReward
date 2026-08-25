import {
  isConnected,
  setAllowed,
  getPublicKey,
  signTransaction,
} from "@stellar/freighter-api";

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

  async signXdr(xdr: string, networkPassphrase: string): Promise<string> {
    const result = await signTransaction(xdr, { networkPassphrase });
    if (!result) throw new Error("Transaction signature failed");
    return result as unknown as string;
  },
};
