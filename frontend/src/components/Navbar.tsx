import { Link, NavLink } from "react-router-dom";
import { Leaf, Menu, X } from "lucide-react";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuthStore } from "../store/authStore";
import { wallet } from "../lib/wallet";

const links = [
  { to: "/campaigns", label: "Campaigns" },
  { to: "/leaderboard", label: "Leaderboard" },
  { to: "/about", label: "About" },
];

export function Navbar() {
  const { user, logout } = useAuthStore();
  const [open, setOpen] = useState(false);

  const { data: balance } = useQuery({
    queryKey: ["wallet-balance", user?.walletAddress],
    queryFn: () => wallet.getBalance(user!.walletAddress!),
    enabled: !!user?.walletAddress,
    refetchInterval: 10000,
  });

  return (
    <header className="sticky top-0 z-50 border-b border-white/40 bg-white/70 backdrop-blur-xl dark:bg-slate-950/70 dark:border-slate-800">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
        <Link to="/" className="flex items-center gap-2 font-bold text-lg text-slate-900 dark:text-white">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-brand-gradient text-white">
            <Leaf size={18} />
          </span>
          CarbonReward
        </Link>

        <div className="hidden md:flex items-center gap-6">
          {links.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              className={({ isActive }) =>
                `text-sm font-medium transition-colors ${
                  isActive ? "text-brand-600" : "text-slate-600 hover:text-brand-600 dark:text-slate-300"
                }`
              }
            >
              {l.label}
            </NavLink>
          ))}
        </div>

        <div className="hidden md:flex items-center gap-3">
          {user ? (
            <>
              {user.walletAddress && (
                <div className="flex items-center gap-2 rounded-full border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-700 dark:border-slate-800 dark:text-slate-300" title={user.walletAddress}>
                  <span className="h-2 w-2 rounded-full bg-emerald-500"></span>
                  {balance ? `${parseFloat(balance).toFixed(2)} XLM` : "..."}
                </div>
              )}
              <Link to="/dashboard" className="btn-secondary !py-2 !px-4 text-sm">
                Dashboard
              </Link>
              <button onClick={logout} className="text-sm text-slate-500 hover:text-red-500">
                Sign out
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="text-sm font-medium text-slate-600 dark:text-slate-300">
                Sign in
              </Link>
              <Link to="/register" className="btn-primary !py-2 !px-4 text-sm">
                Get Started
              </Link>
            </>
          )}
        </div>

        <button className="md:hidden" onClick={() => setOpen(!open)} aria-label="Toggle menu">
          {open ? <X /> : <Menu />}
        </button>
      </nav>

      {open && (
        <div className="md:hidden flex flex-col gap-3 border-t border-slate-100 px-4 py-4 dark:border-slate-800">
          {links.map((l) => (
            <Link key={l.to} to={l.to} onClick={() => setOpen(false)} className="text-slate-700 dark:text-slate-200">
              {l.label}
            </Link>
          ))}
          {user ? (
            <Link to="/dashboard" className="btn-primary text-sm">
              Dashboard
            </Link>
          ) : (
            <Link to="/register" className="btn-primary text-sm">
              Get Started
            </Link>
          )}
        </div>
      )}
    </header>
  );
}
