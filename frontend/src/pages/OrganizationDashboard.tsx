import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Wallet, Plus } from "lucide-react";
import { api } from "../lib/api";
import { wallet } from "../lib/wallet";
import { soroban } from "../lib/soroban";
import { useAuthStore } from "../store/authStore";

export default function OrganizationDashboard() {
  const { user, setSession, token } = useAuthStore();
  const [connecting, setConnecting] = useState(false);
  const [isCreatingOrg, setIsCreatingOrg] = useState(false);
  const queryClient = useQueryClient();

  const { data: orgs, isLoading: loadingOrgs } = useQuery({
    queryKey: ["my-organizations"],
    queryFn: async () => (await api.get("/organizations/me")).data.data as any[],
  });

  const org = orgs?.[0];

  const { data: campaigns } = useQuery({
    queryKey: ["org-campaigns", org?._id],
    queryFn: async () => (await api.get("/campaigns", { params: { organizationId: org._id } })).data.data as any[],
    enabled: !!org?._id,
  });

  const createOrgMutation = useMutation({
    mutationFn: async (data: any) => await api.post("/organizations", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-organizations"] });
      toast.success("Organization profile created!");
      setIsCreatingOrg(false);
    },
    onError: (err: any) => toast.error(err.response?.data?.error || "Failed to create organization"),
  });

  const createCampaignMutation = useMutation({
    mutationFn: async (data: any) => {
      // 1. Send transaction on-chain
      const txHash = await soroban.createCampaign(
        user!.walletAddress!,
        data.title,
        data.rewardPerParticipant,
        data.maxParticipants
      );
      toast.success(
        <div>
          On-chain campaign created! <br />
          <a href={`https://stellar.expert/explorer/testnet/tx/${txHash}`} target="_blank" rel="noreferrer" className="underline font-medium text-emerald-700">View on Stellar Expert</a>
        </div>
      );
      
      // 3. Save to database
      return await api.post("/campaigns", { ...data, organizationId: org._id });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["org-campaigns"] });
      queryClient.invalidateQueries({ queryKey: ["wallet-balance"] });
      toast.success("Campaign created successfully!");
    },
    onError: (err: any) => toast.error(err.message || "Failed to create campaign"),
  });

  async function handleConnectWallet() {
    setConnecting(true);
    try {
      const available = await wallet.isAvailable();
      if (!available) {
        toast.error("Freighter wallet extension not detected.");
        return;
      }
      const address = await wallet.connect();
      await api.post("/auth/wallet", { walletAddress: address });
      if (user && token) setSession({ ...user, walletAddress: address }, token);
      toast.success("Wallet connected!");
    } catch (err: any) {
      toast.error(err.message ?? "Failed to connect wallet");
    } finally {
      setConnecting(false);
    }
  }

  if (loadingOrgs) return <div className="p-10 text-center">Loading dashboard...</div>;

  if (!org || isCreatingOrg) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
        <h1 className="mb-6 text-3xl font-bold">Create Organization Profile</h1>
        <form
          className="glass-card p-6"
          onSubmit={(e) => {
            e.preventDefault();
            const formData = new FormData(e.currentTarget);
            createOrgMutation.mutate(Object.fromEntries(formData));
          }}
        >
          <div className="mb-4">
            <label className="mb-1 block text-sm font-medium">Organization Name</label>
            <input name="name" required className="w-full rounded-xl border p-2" />
          </div>
          <div className="mb-4">
            <label className="mb-1 block text-sm font-medium">Type</label>
            <select name="type" required className="w-full rounded-xl border p-2">
              <option value="ngo">NGO</option>
              <option value="school">School</option>
              <option value="csr">Corporate CSR</option>
            </select>
          </div>
          <button type="submit" disabled={createOrgMutation.isPending} className="btn-primary w-full py-2">
            {createOrgMutation.isPending ? "Creating..." : "Create Organization"}
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Organization Dashboard</h1>
          <p className="text-slate-500">Managing {org.name}</p>
        </div>
      </div>

      {!user?.walletAddress && (
        <div className="glass-card mb-8 flex flex-col items-center gap-3 p-6 sm:flex-row sm:justify-between">
          <div>
            <h3 className="font-semibold text-slate-900 dark:text-white">Connect your Freighter wallet</h3>
            <p className="text-sm text-slate-500">Required to create campaigns on the Stellar network.</p>
          </div>
          <button onClick={handleConnectWallet} disabled={connecting} className="btn-primary shrink-0">
            <Wallet size={16} /> {connecting ? "Connecting..." : "Connect Wallet"}
          </button>
        </div>
      )}

      <div className="mb-8 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-1">
          <div className="glass-card p-6">
            <h2 className="mb-4 text-xl font-semibold flex items-center gap-2"><Plus size={20}/> New Campaign</h2>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!user?.walletAddress) return toast.error("Connect wallet first!");
                const formData = new FormData(e.currentTarget);
                const data = {
                  title: formData.get("title"),
                  description: "Help us clean the environment!", // hardcoded for brevity
                  category: "tree_plantation",
                  rewardPerParticipant: Number(formData.get("rewardPerParticipant")),
                  maxParticipants: Number(formData.get("maxParticipants")),
                  startDate: new Date().toISOString(),
                  endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
                };
                createCampaignMutation.mutate(data);
              }}
            >
              <div className="mb-4">
                <label className="mb-1 block text-sm font-medium">Campaign Title</label>
                <input name="title" required className="w-full rounded-xl border p-2 text-slate-900" />
              </div>
              <div className="mb-4">
                <label className="mb-1 block text-sm font-medium">Reward (XLM) per Participant</label>
                <input name="rewardPerParticipant" type="number" step="0.01" required className="w-full rounded-xl border p-2 text-slate-900" />
              </div>
              <div className="mb-4">
                <label className="mb-1 block text-sm font-medium">Max Participants</label>
                <input name="maxParticipants" type="number" required className="w-full rounded-xl border p-2 text-slate-900" />
              </div>
              <button type="submit" disabled={createCampaignMutation.isPending} className="btn-primary w-full py-2">
                {createCampaignMutation.isPending ? "Deploying..." : "Create Campaign"}
              </button>
            </form>
          </div>
        </div>

        <div className="lg:col-span-2">
          <h2 className="mb-4 text-xl font-semibold text-slate-900 dark:text-white">Active Campaigns</h2>
          <div className="glass-card overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-left text-slate-500 dark:bg-slate-800">
                <tr>
                  <th className="px-4 py-3">Title</th>
                  <th className="px-4 py-3">Reward</th>
                  <th className="px-4 py-3">Participants</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {campaigns?.map((c) => (
                  <tr key={c._id} className="border-t border-slate-100 dark:border-slate-800">
                    <td className="px-4 py-3 font-medium text-slate-800 dark:text-white">{c.title}</td>
                    <td className="px-4 py-3">{c.rewardPerParticipant} {c.rewardTokenSymbol}</td>
                    <td className="px-4 py-3">0 / {c.maxParticipants}</td>
                    <td className="px-4 py-3">
                      <span className="rounded-full bg-emerald-100 px-2 py-1 text-emerald-700">{c.status}</span>
                    </td>
                  </tr>
                ))}
                {(!campaigns || campaigns.length === 0) && (
                  <tr>
                    <td colSpan={4} className="px-4 py-8 text-center text-slate-400">
                      No campaigns created yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
