import { Routes, Route } from "react-router-dom";
import { useEffect } from "react";
import { Navbar } from "./components/Navbar";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { initAnalytics } from "./lib/analytics";
import { useAuthStore } from "./store/authStore";

import Landing from "./pages/Landing";
import About from "./pages/About";
import Login from "./pages/Login";
import Register from "./pages/Register";
import CampaignMarketplace from "./pages/CampaignMarketplace";
import CampaignDetails from "./pages/CampaignDetails";
import ParticipantDashboard from "./pages/ParticipantDashboard";
import OrganizationDashboard from "./pages/OrganizationDashboard";
import Leaderboard from "./pages/Leaderboard";
import NotFound from "./pages/NotFound";

const DashboardRoute = () => {
  const { user } = useAuthStore();
  if (user?.role === "organization") return <OrganizationDashboard />;
  return <ParticipantDashboard />;
};

export default function App() {
  useEffect(() => {
    initAnalytics();
  }, []);

  return (
    <div className="min-h-screen text-slate-900 dark:text-white">
      <Navbar />
      <main>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/about" element={<About />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/campaigns" element={<CampaignMarketplace />} />
          <Route path="/campaigns/:id" element={<CampaignDetails />} />
          <Route path="/leaderboard" element={<Leaderboard />} />

          <Route element={<ProtectedRoute />}>
            <Route path="/dashboard" element={<DashboardRoute />} />
          </Route>

          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
    </div>
  );
}
