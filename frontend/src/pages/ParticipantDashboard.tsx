import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Wallet, Award, Leaf } from "lucide-react";
import { api } from "../lib/api";
import { wallet } from "../lib/wallet";
import { useAuthStore } from "../store/authStore";

export default function ParticipantDashboard() {
  const { user, setSession, token } = useAuthStore();
  const [connecting, setConnecting] = useState(false);

  const { data: participations } = useQuery({
    queryKey: ["my-participations"],
    queryFn: async () => (await api.get("/campaigns/me/participations")).data.data as any[],
  });

  async function handleConnectWallet() {
    setConnecting(true);
    try {
      const available = await wallet.isAvailable();
      if (!available) {
        toast.error("Freighter wallet extension not detected. Install it from freighter.app");
        return;
      }
      const address = await wallet.connect();
      const res = await api.post("/auth/wallet", { walletAddress: address });
      if (user && token) setSession({ ...user, walletAddress: address }, token);
      toast.success("Wallet connected!");
    } catch (err: any) {
      toast.error(err.message ?? "Failed to connect wallet");
    } finally {
      setConnecting(false);
    }
  }

  const claimedCount = participations?.filter((p) => p.status === "claimed").length ?? 0;
  const totalEarned = participations?.reduce((sum, p) => sum + (p.reward?.amount ?? 0), 0) ?? 0;

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <h1 className="mb-2 text-3xl font-bold text-slate-900 dark:text-white">
        Welcome back, {user?.name?.split(" ")[0]} 👋
      </h1>
      <p className="mb-8 text-slate-500">Track your environmental contributions and rewards.</p>

      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard icon={Leaf} label="Contributions" value={participations?.length ?? 0} />
        <StatCard icon={Award} label="Verified & Claimed" value={claimedCount} />
        <StatCard icon={Wallet} label="Total Earned" value={`${totalEarned} XLM`} />
      </div>

      {!user?.walletAddress && (
        <div className="glass-card mb-8 flex flex-col items-center gap-3 p-6 text-center sm:flex-row sm:justify-between sm:text-left">
          <div>
            <h3 className="font-semibold text-slate-900 dark:text-white">Connect your Freighter wallet</h3>
            <p className="text-sm text-slate-500">Required to claim rewards on the Stellar testnet.</p>
          </div>
          <button onClick={handleConnectWallet} disabled={connecting} className="btn-primary shrink-0">
            <Wallet size={16} /> {connecting ? "Connecting..." : "Connect Wallet"}
          </button>
        </div>
      )}

      <h2 className="mb-4 text-xl font-semibold text-slate-900 dark:text-white">My Campaigns</h2>
      <div className="glass-card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-slate-500 dark:bg-slate-800">
            <tr>
              <th className="px-4 py-3">Campaign</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Reward</th>
            </tr>
          </thead>
          <tbody>
            {participations?.map((p) => (
              <tr key={p._id} className="border-t border-slate-100 dark:border-slate-800">
                <td className="px-4 py-3 font-medium text-slate-800 dark:text-white">{p.campaign?.title}</td>
                <td className="px-4 py-3">
                  <StatusBadge status={p.status} />
                </td>
                <td className="px-4 py-3">{p.reward?.amount ?? p.campaign?.rewardPerParticipant} {p.campaign?.rewardTokenSymbol}</td>
              </tr>
            ))}
            {(!participations || participations.length === 0) && (
              <tr>
                <td colSpan={3} className="px-4 py-8 text-center text-slate-400">
                  No campaigns joined yet — explore the marketplace to get started.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value }: { icon: any; label: string; value: string | number }) {
  return (
    <div className="glass-card p-5">
      <div className="mb-2 grid h-10 w-10 place-items-center rounded-xl bg-brand-gradient text-white">
        <Icon size={18} />
      </div>
      <div className="text-2xl font-bold text-slate-900 dark:text-white">{value}</div>
      <div className="text-xs text-slate-500">{label}</div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    joined: "bg-slate-100 text-slate-600",
    proof_submitted: "bg-amber-100 text-amber-700",
    verified: "bg-emerald-100 text-emerald-700",
    rejected: "bg-red-100 text-red-700",
    claimed: "bg-brand-100 text-brand-700",
  };
  return (
    <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${colors[status] ?? "bg-slate-100"}`}>
      {status.replace(/_/g, " ")}
    </span>
  );
}
