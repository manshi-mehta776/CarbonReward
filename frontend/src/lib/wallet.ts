import {
  isConnected,
  requestAccess,
  getAddress,
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
      const res = await isConnected();
      return !res.error;
    } catch {
      return false;
    }
  },

  async connect(): Promise<string> {
    const access = await requestAccess();
    if (access.error) throw new Error(access.error);
    const addr = await getAddress();
    if (addr.error) throw new Error(addr.error);
    return addr.address;
  },

  async signXdr(xdr: string, networkPassphrase: string): Promise<string> {
    const result = await signTransaction(xdr, { networkPassphrase });
    if (result.error) throw new Error(result.error);
    return result.signedTxXdr;
  },
};
