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

  const joinMutation = useMutation({
    mutationFn: async () => api.post(`/campaigns/${id}/join`),
    onSuccess: () => {
      toast.success("You joined the campaign! Upload your proof once you've completed the activity.");
      queryClient.invalidateQueries({ queryKey: ["campaign", id] });
    },
    onError: (err: any) => toast.error(err.response?.data?.message ?? "Could not join campaign"),
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

          {user?.role === "participant" ? (
            <button
              onClick={() => joinMutation.mutate()}
              disabled={joinMutation.isPending}
              className="btn-primary"
            >
              {joinMutation.isPending ? "Joining..." : "Join Campaign"}
            </button>
          ) : (
            <p className="text-sm text-slate-500">Sign in as a participant to join this campaign.</p>
          )}
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
