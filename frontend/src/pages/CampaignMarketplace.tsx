import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { api } from "../lib/api";
import { CampaignCard } from "../components/CampaignCard";
import { Search } from "lucide-react";

const categories = [
  "tree_plantation", "river_cleanup", "plastic_collection", "waste_segregation",
  "beach_cleanup", "recycling_drive", "water_conservation", "community_gardening", "awareness_program",
];

export default function CampaignMarketplace() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["campaigns", search, category],
    queryFn: async () => {
      const res = await api.get("/campaigns", { params: { search, category, status: "active" } });
      return res.data.data as any[];
    },
  });

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Campaign Marketplace</h1>
        <p className="mt-1 text-slate-500">Find a verified environmental campaign near you.</p>
      </div>

      <div className="mb-8 flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search campaigns..."
            className="w-full rounded-xl border border-slate-200 py-2.5 pl-10 pr-4 outline-none focus:border-brand-500 dark:border-slate-700 dark:bg-slate-800"
          />
        </div>
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="rounded-xl border border-slate-200 px-4 py-2.5 outline-none focus:border-brand-500 dark:border-slate-700 dark:bg-slate-800"
        >
          <option value="">All categories</option>
          {categories.map((c) => (
            <option key={c} value={c}>{c.replace(/_/g, " ")}</option>
          ))}
        </select>
      </div>

      {isLoading && (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="skeleton h-72" />
          ))}
        </div>
      )}

      {!isLoading && data?.length === 0 && (
        <div className="glass-card p-12 text-center text-slate-500">
          No campaigns found. Try a different search or check back soon.
        </div>
      )}

      {!isLoading && data && data.length > 0 && (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {data.map((c) => (
            <CampaignCard
              key={c._id}
              id={c._id}
              title={c.title}
              category={c.category}
              coverImageUrl={c.coverImageUrl}
              rewardPerParticipant={c.rewardPerParticipant}
              rewardTokenSymbol={c.rewardTokenSymbol}
              maxParticipants={c.maxParticipants}
              locationLabel={c.location?.label}
            />
          ))}
        </div>
      )}
    </div>
  );
}
