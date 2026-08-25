import { Link } from "react-router-dom";
import { MapPin, Users, Coins } from "lucide-react";
import { motion } from "framer-motion";

export interface CampaignCardProps {
  id: string;
  title: string;
  category: string;
  coverImageUrl?: string | null;
  rewardPerParticipant: number;
  rewardTokenSymbol: string;
  maxParticipants: number;
  participantCount?: number;
  locationLabel?: string;
}

export function CampaignCard(props: CampaignCardProps) {
  return (
    <motion.div
      whileHover={{ y: -4 }}
      className="glass-card overflow-hidden group"
    >
      <div className="h-40 w-full overflow-hidden bg-brand-gradient">
        {props.coverImageUrl && (
          <img
            src={props.coverImageUrl}
            alt={props.title}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
          />
        )}
      </div>
      <div className="p-5">
        <div className="mb-2 flex items-center justify-between">
          <span className="inline-block rounded-full bg-brand-100 px-3 py-1 text-xs font-semibold text-brand-700 dark:bg-brand-900/40 dark:text-brand-300">
            {props.category.replace(/_/g, " ")}
          </span>
          {(props.participantCount ?? 0) >= props.maxParticipants && (
            <span className="inline-block rounded-full bg-slate-200 px-3 py-1 text-xs font-semibold text-slate-700 dark:bg-slate-700 dark:text-slate-300">
              Full
            </span>
          )}
        </div>
        <h3 className="mb-2 font-semibold text-slate-900 dark:text-white line-clamp-1">{props.title}</h3>

        <div className="mb-4 flex flex-wrap gap-3 text-xs text-slate-500 dark:text-slate-400">
          {props.locationLabel && (
            <span className="flex items-center gap-1">
              <MapPin size={12} /> {props.locationLabel}
            </span>
          )}
          <span className="flex items-center gap-1">
            <Users size={12} /> {props.participantCount ?? 0}/{props.maxParticipants}
          </span>
          <span className="flex items-center gap-1 text-brand-600 font-medium">
            <Coins size={12} /> {props.rewardPerParticipant} {props.rewardTokenSymbol}
          </span>
        </div>

        <Link to={`/campaigns/${props.id}`} className="btn-primary w-full !py-2 text-sm">
          View Campaign
        </Link>
      </div>
    </motion.div>
  );
}
