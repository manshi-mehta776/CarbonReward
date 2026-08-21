import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Leaf, ShieldCheck, Coins, TrendingUp, Users, Sparkles } from "lucide-react";

const stats = [
  { label: "Campaigns Live", value: "120+" },
  { label: "Verified Contributions", value: "3,400+" },
  { label: "Rewards Distributed", value: "12,500 XLM" },
  { label: "Organizations", value: "45" },
];

const features = [
  { icon: ShieldCheck, title: "Verified On-Chain", desc: "Every contribution is signed off by an approved supervisor and recorded immutably via Soroban." },
  { icon: Coins, title: "Instant Rewards", desc: "No more waiting weeks for incentives — smart contracts release rewards the moment activity is verified." },
  { icon: TrendingUp, title: "Transparent Impact", desc: "Sponsors and organizations get real-time dashboards showing exactly how funds were distributed." },
  { icon: Users, title: "Built for Communities", desc: "Schools, NGOs, municipalities and CSR programs can launch campaigns in minutes." },
];

export default function Landing() {
  return (
    <div>
      <section className="relative overflow-hidden px-4 pt-20 pb-24 sm:px-6">
        <div className="absolute inset-0 -z-10 bg-brand-gradient opacity-10" />
        <div className="mx-auto max-w-4xl text-center">
          <motion.span
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 inline-flex items-center gap-2 rounded-full border border-brand-200 bg-brand-50 px-4 py-1.5 text-sm font-medium text-brand-700 dark:bg-brand-900/30 dark:border-brand-800 dark:text-brand-300"
          >
            <Sparkles size={14} /> Built on Stellar + Soroban
          </motion.span>
          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-6xl"
          >
            Verified environmental action,{" "}
            <span className="bg-brand-gradient bg-clip-text text-transparent">rewarded instantly.</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mx-auto mt-6 max-w-2xl text-lg text-slate-600 dark:text-slate-300"
          >
            CarbonReward replaces paper attendance and manual payouts with supervisor-verified,
            blockchain-backed incentives for tree plantations, cleanups, and conservation drives.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="mt-8 flex flex-wrap items-center justify-center gap-4"
          >
            <Link to="/campaigns" className="btn-primary text-base">
              <Leaf size={18} /> Explore Campaigns
            </Link>
            <Link to="/register" className="btn-secondary text-base">
              Launch a Campaign
            </Link>
          </motion.div>
        </div>

        <div className="mx-auto mt-16 grid max-w-4xl grid-cols-2 gap-4 sm:grid-cols-4">
          {stats.map((s) => (
            <div key={s.label} className="glass-card p-4 text-center">
              <div className="text-2xl font-bold text-brand-600">{s.value}</div>
              <div className="text-xs text-slate-500 dark:text-slate-400">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
        <h2 className="mb-12 text-center text-3xl font-bold text-slate-900 dark:text-white">
          How CarbonReward works
        </h2>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((f) => (
            <motion.div
              key={f.title}
              whileHover={{ y: -4 }}
              className="glass-card p-6"
            >
              <div className="mb-4 grid h-11 w-11 place-items-center rounded-xl bg-brand-gradient text-white">
                <f.icon size={20} />
              </div>
              <h3 className="mb-2 font-semibold text-slate-900 dark:text-white">{f.title}</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-4 pb-24 sm:px-6">
        <div className="glass-card flex flex-col items-center gap-4 bg-brand-gradient p-10 text-center text-white">
          <h2 className="text-3xl font-bold">Ready to make impact verifiable?</h2>
          <p className="max-w-xl text-brand-50">
            Join organizations already running transparent, on-chain environmental campaigns.
          </p>
          <Link to="/register" className="rounded-xl bg-white px-6 py-3 font-semibold text-brand-700 hover:scale-105 transition-transform">
            Get Started Free
          </Link>
        </div>
      </section>
    </div>
  );
}
