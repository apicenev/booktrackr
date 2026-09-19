import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { authErrorMessage } from "../../lib/auth/authErrors";

interface AuthFormProps {
  title: string;
  submitLabel: string;
  pendingLabel: string;
  passwordAutoComplete: "current-password" | "new-password";
  onSubmit: (email: string, password: string) => Promise<void>;
  footer: { prompt: string; linkLabel: string; to: string };
}

const inputClass =
  "mt-1 w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/40";

export default function AuthForm({
  title,
  submitLabel,
  pendingLabel,
  passwordAutoComplete,
  onSubmit,
  footer,
}: AuthFormProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      // No navigation here: PublicOnlyRoute redirects once auth state updates.
      await onSubmit(email.trim(), password);
    } catch (err) {
      setError(authErrorMessage(err));
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 px-4 text-slate-100">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md space-y-4 rounded-2xl border border-slate-800 bg-slate-900/60 p-6 shadow-lg"
      >
        <div>
          <p className="text-sm font-medium text-indigo-300">BookTrackr</p>
          <h1 className="mt-1 text-2xl font-semibold">{title}</h1>
        </div>

        {error && (
          <p role="alert" className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-300">
            {error}
          </p>
        )}

        <label className="block text-sm font-medium text-slate-300">
          Email
          <input
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={inputClass}
            required
          />
        </label>

        <label className="block text-sm font-medium text-slate-300">
          Password
          <input
            type="password"
            autoComplete={passwordAutoComplete}
            minLength={passwordAutoComplete === "new-password" ? 6 : undefined}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={inputClass}
            required
          />
        </label>

        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-xl bg-indigo-600 p-2 font-medium text-white transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {submitting ? pendingLabel : submitLabel}
        </button>

        <p className="text-sm text-slate-400">
          {footer.prompt}{" "}
          <Link to={footer.to} className="text-indigo-400 hover:text-indigo-300">
            {footer.linkLabel}
          </Link>
        </p>
      </form>
    </div>
  );
}
