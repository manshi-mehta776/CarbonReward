import { useQuery } from "@tanstack/react-query";
import { Trophy } from "lucide-react";
import { api } from "../lib/api";

export default function Leaderboard() {
  const { data, isLoading } = useQuery({
    queryKey: ["leaderboard"],
    queryFn: async () => (await api.get("/leaderboard")).data.data as any[],
  });

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <div className="mb-8 text-center">
        <Trophy className="mx-auto mb-2 text-brand-600" size={32} />
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Community Leaderboard</h1>
        <p className="text-slate-500">Top contributors making the biggest environmental impact.</p>
      </div>

      <div className="glass-card divide-y divide-slate-100 dark:divide-slate-800">
        {isLoading && Array.from({ length: 5 }).map((_, i) => <div key={i} className="skeleton m-4 h-12" />)}
        {data?.map((u, i) => (
          <div key={u._id} className="flex items-center gap-4 px-5 py-4">
            <div className={`grid h-8 w-8 place-items-center rounded-full font-bold text-sm ${
              i === 0 ? "bg-yellow-400 text-white" : i === 1 ? "bg-slate-300 text-white" : i === 2 ? "bg-amber-600 text-white" : "bg-slate-100 text-slate-500"
            }`}>
              {i + 1}
            </div>
            <div className="flex-1">
              <div className="font-medium text-slate-800 dark:text-white">{u.name}</div>
              <div className="text-xs text-slate-400">{u.totalContributions} contributions</div>
            </div>
            <div className="font-semibold text-brand-600">{u.totalRewardsEarned} XLM</div>
          </div>
        ))}
      </div>
    </div>
  );
}
