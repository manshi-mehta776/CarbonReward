import { useForm } from "react-hook-form";
import { useNavigate, Link } from "react-router-dom";
import { useState } from "react";
import { toast } from "sonner";
import { api } from "../lib/api";
import { useAuthStore } from "../store/authStore";

interface FormValues {
  name: string;
  email: string;
  password: string;
  role: "participant" | "supervisor" | "organization" | "sponsor";
}

const roleOptions = [
  { value: "participant", label: "Participant" },
  { value: "organization", label: "Organization" },
  { value: "supervisor", label: "Supervisor" },
  { value: "sponsor", label: "Sponsor" },
];

export default function Register() {
  const { register, handleSubmit, formState: { errors } } = useForm<FormValues>({
    defaultValues: { role: "participant" },
  });
  const setSession = useAuthStore((s) => s.setSession);
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  async function onSubmit(values: FormValues) {
    setLoading(true);
    try {
      const res = await api.post("/auth/register", values);
      setSession(res.data.data.user, res.data.data.token);
      toast.success("Account created — welcome to CarbonReward!");
      navigate("/dashboard");
    } catch (err: any) {
      toast.error(err.response?.data?.message ?? "Registration failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto flex min-h-[80vh] max-w-md flex-col justify-center px-4 py-10">
      <div className="glass-card p-8">
        <h1 className="mb-1 text-2xl font-bold text-slate-900 dark:text-white">Create your account</h1>
        <p className="mb-6 text-sm text-slate-500">Join as a participant, organization, supervisor or sponsor.</p>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Full name</label>
            <input
              className="w-full rounded-xl border border-slate-200 px-4 py-2.5 outline-none focus:border-brand-500 dark:border-slate-700 dark:bg-slate-800"
              {...register("name", { required: "Name is required" })}
            />
            {errors.name && <p className="mt-1 text-xs text-red-500">{errors.name.message}</p>}
          </div>
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
              {...register("password", { required: "Password is required", minLength: { value: 8, message: "Min 8 characters" } })}
            />
            {errors.password && <p className="mt-1 text-xs text-red-500">{errors.password.message}</p>}
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">I am a...</label>
            <select
              className="w-full rounded-xl border border-slate-200 px-4 py-2.5 outline-none focus:border-brand-500 dark:border-slate-700 dark:bg-slate-800"
              {...register("role")}
            >
              {roleOptions.map((r) => (
                <option key={r.value} value={r.value}>{r.label}</option>
              ))}
            </select>
          </div>
          <button type="submit" disabled={loading} className="btn-primary w-full">
            {loading ? "Creating account..." : "Create Account"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-500">
          Already have an account?{" "}
          <Link to="/login" className="font-medium text-brand-600">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
