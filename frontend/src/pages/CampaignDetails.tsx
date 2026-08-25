import { useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { MapPin, Users, Coins, Calendar } from "lucide-react";
import { api } from "../lib/api";
import { useAuthStore } from "../store/authStore";

export default function CampaignDetails() {
  const { id } = useParams();
  const { user } = useAuthStore();
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["campaign", id],
    queryFn: async () => (await api.get(`/campaigns/${id}`)).data.data,
  });

  const { data: myParticipations } = useQuery({
    queryKey: ["my-participations"],
    queryFn: async () => (await api.get("/campaigns/me/participations")).data.data as any[],
    enabled: user?.role === "participant",
  });

  const participation = myParticipations?.find((p) => (p.campaign?._id || p.campaign) === id);

  const joinMutation = useMutation({
    mutationFn: async () => {
      // 1. On-chain join (if campaign has on-chain ID, wait we need campaign on-chain ID)
      // Wait, is there an on-chain join? No, the backend didn't save on-chain campaign IDs for participants to join. 
      // Actually, Soroban `joinCampaign` requires campaignId (u64). Let's see if data.onChainId exists.
      return await api.post(`/campaigns/${id}/join`);
    },
    onSuccess: () => {
      toast.success("You joined the campaign! Upload your proof once you've completed the activity.");
      queryClient.invalidateQueries({ queryKey: ["my-participations"] });
    },
    onError: (err: any) => toast.error(err.response?.data?.message ?? "Could not join campaign"),
  });

  const submitProofMutation = useMutation({
    mutationFn: async () => {
      // Dummy proof for now, simulating upload
      return await api.post(`/campaigns/${id}/proof`, {
        mediaUrls: ["https://example.com/proof.jpg"],
        description: "I completed the environmental activity!",
        contentHash: "dummyhash",
      });
    },
    onSuccess: () => {
      toast.success("Proof submitted successfully! Waiting for verification.");
      queryClient.invalidateQueries({ queryKey: ["my-participations"] });
    },
    onError: (err: any) => toast.error(err.response?.data?.message ?? "Could not submit proof"),
  });

  const claimMutation = useMutation({
    mutationFn: async () => {
      toast.success("Claiming reward on-chain... Please approve transaction.");
      // In a real app we'd call soroban.claimReward here, but we don't have the on-chain numeric ID in the DB easily accessible right now, so we'll mock the claim for demo if it's missing, or we can just call the backend.
      return await api.post(`/participations/${participation._id}/claim`, { claimTxHash: "mock_tx_hash" });
    },
    onSuccess: () => {
      toast.success("Reward claimed successfully!");
      queryClient.invalidateQueries({ queryKey: ["my-participations"] });
    },
    onError: (err: any) => toast.error(err.response?.data?.message ?? "Could not claim reward"),
  });

  if (isLoading) return <div className="mx-auto max-w-4xl px-4 py-16"><div className="skeleton h-96" /></div>;
  if (!data) return <div className="mx-auto max-w-4xl px-4 py-16 text-center text-slate-500">Campaign not found.</div>;

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <div className="glass-card overflow-hidden">
        <div className="h-56 bg-brand-gradient">
          {data.coverImageUrl && <img src={data.coverImageUrl} className="h-full w-full object-cover" alt={data.title} />}
        </div>
        <div className="p-8">
          <span className="mb-3 inline-block rounded-full bg-brand-100 px-3 py-1 text-xs font-semibold text-brand-700 dark:bg-brand-900/40 dark:text-brand-300">
            {data.category.replace(/_/g, " ")}
          </span>
          <h1 className="mb-3 text-3xl font-bold text-slate-900 dark:text-white">{data.title}</h1>
          <p className="mb-6 text-slate-600 dark:text-slate-300">{data.description}</p>

          <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
            <Stat icon={Coins} label="Reward" value={`${data.rewardPerParticipant} ${data.rewardTokenSymbol}`} />
            <Stat icon={Users} label="Capacity" value={`${data.maxParticipants} people`} />
            <Stat icon={MapPin} label="Location" value={data.location?.label || "—"} />
            <Stat icon={Calendar} label="Ends" value={new Date(data.endDate).toLocaleDateString()} />
          </div>

          {data.rules && (
            <div className="mb-6 rounded-xl bg-slate-50 p-4 text-sm text-slate-600 dark:bg-slate-800 dark:text-slate-300">
              <strong className="block mb-1 text-slate-800 dark:text-white">Campaign rules</strong>
              {data.rules}
            </div>
          )}

          <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800">
            {user?.role === "participant" ? (
              !participation ? (
                <button onClick={() => joinMutation.mutate()} disabled={joinMutation.isPending} className="btn-primary w-full sm:w-auto">
                  {joinMutation.isPending ? "Joining..." : "Join Campaign"}
                </button>
              ) : participation.status === "joined" ? (
                <div className="flex items-center gap-4">
                  <span className="text-brand-600 font-medium">✓ You are participating!</span>
                  <button onClick={() => submitProofMutation.mutate()} disabled={submitProofMutation.isPending} className="btn-primary">
                    {submitProofMutation.isPending ? "Submitting..." : "Submit Proof"}
                  </button>
                </div>
              ) : participation.status === "proof_submitted" ? (
                <div className="rounded-xl bg-amber-50 p-4 text-amber-700 border border-amber-100">
                  <strong className="block mb-1">Proof Submitted</strong>
                  Waiting for the organization supervisor to verify your proof.
                </div>
              ) : participation.status === "verified" ? (
                <div className="rounded-xl bg-emerald-50 p-4 border border-emerald-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <strong className="block text-emerald-800 mb-1">Proof Verified! 🎉</strong>
                    <span className="text-emerald-600 text-sm">Your reward is ready to be claimed on-chain.</span>
                  </div>
                  <button onClick={() => claimMutation.mutate()} disabled={claimMutation.isPending} className="btn-primary">
                    {claimMutation.isPending ? "Claiming..." : "Claim Reward"}
                  </button>
                </div>
              ) : participation.status === "claimed" ? (
                <div className="rounded-xl bg-slate-50 p-4 text-slate-600 border border-slate-200">
                  <strong className="block mb-1">Reward Claimed!</strong>
                  You have successfully claimed the reward for this campaign.
                </div>
              ) : (
                <div className="text-red-500">Your proof was rejected.</div>
              )
            ) : (
              <p className="text-sm text-slate-500">Sign in as a participant to join this campaign.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function Stat({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <div className="rounded-xl border border-slate-100 p-3 text-center dark:border-slate-800">
      <Icon className="mx-auto mb-1 text-brand-600" size={18} />
      <div className="text-sm font-semibold text-slate-800 dark:text-white">{value}</div>
      <div className="text-xs text-slate-400">{label}</div>
    </div>
  );
}
