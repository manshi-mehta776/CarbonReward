import { useForm } from "react-hook-form";
import { useNavigate, Link } from "react-router-dom";
import { useState } from "react";
import { toast } from "sonner";
import { api } from "../lib/api";
import { useAuthStore } from "../store/authStore";

interface FormValues {
  email: string;
  password: string;
}

export default function Login() {
  const { register, handleSubmit, formState: { errors } } = useForm<FormValues>();
  const setSession = useAuthStore((s) => s.setSession);
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  async function onSubmit(values: FormValues) {
    setLoading(true);
    try {
      const res = await api.post("/auth/login", values);
      setSession(res.data.data.user, res.data.data.token);
      toast.success("Welcome back!");
      navigate("/dashboard");
    } catch (err: any) {
      toast.error(err.response?.data?.message ?? "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto flex min-h-[80vh] max-w-md flex-col justify-center px-4">
      <div className="glass-card p-8">
        <h1 className="mb-1 text-2xl font-bold text-slate-900 dark:text-white">Welcome back</h1>
        <p className="mb-6 text-sm text-slate-500">Sign in to continue your environmental journey.</p>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Email</label>
            <input
              type="email"
              className="w-full rounded-xl border border-slate-200 px-4 py-2.5 outline-none focus:border-brand-500 dark:border-slate-700 dark:bg-slate-800"
              {...register("email", { required: "Email is required" })}
            />
            {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email.message}</p>}
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Password</label>
            <input
              type="password"
              className="w-full rounded-xl border border-slate-200 px-4 py-2.5 outline-none focus:border-brand-500 dark:border-slate-700 dark:bg-slate-800"
              {...register("password", { required: "Password is required" })}
            />
            {errors.password && <p className="mt-1 text-xs text-red-500">{errors.password.message}</p>}
          </div>
          <button type="submit" disabled={loading} className="btn-primary w-full">
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-500">
          Don't have an account?{" "}
          <Link to="/register" className="font-medium text-brand-600">
            Create one
          </Link>
        </p>
      </div>
    </div>
  );
}
