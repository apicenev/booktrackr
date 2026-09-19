import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { authErrorMessage } from "../../lib/auth/authErrors";
import BrandMark from "../layout/BrandMark";

interface AuthFormProps {
  title: string;
  submitLabel: string;
  pendingLabel: string;
  passwordAutoComplete: "current-password" | "new-password";
  onSubmit: (email: string, password: string) => Promise<void>;
  footer: { prompt: string; linkLabel: string; to: string };
}

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
    <div className="flex min-h-screen flex-col items-center justify-center bg-canvas px-4 py-12">
      <div className="mb-8 flex flex-col items-center gap-3 text-center">
        <BrandMark size="lg" />
        <p className="font-serif text-xl font-semibold tracking-tight text-ink">BookTrackr</p>
        <p className="text-sm text-ink-muted">Track your reading. Keep what you learn.</p>
      </div>

      <form onSubmit={handleSubmit} className="card w-full max-w-sm space-y-5 p-6 sm:p-8">
        <h1 className="text-xl font-semibold tracking-tight text-ink">{title}</h1>

        {error && (
          <p role="alert" className="alert-error">
            {error}
          </p>
        )}

        <label className="field">
          Email
          <input
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="input"
            required
          />
        </label>

        <label className="field">
          Password
          <input
            type="password"
            autoComplete={passwordAutoComplete}
            minLength={passwordAutoComplete === "new-password" ? 6 : undefined}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="input"
            required
          />
        </label>

        <button type="submit" disabled={submitting} className="btn btn-primary h-10 w-full">
          {submitting ? pendingLabel : submitLabel}
        </button>
      </form>

      <p className="mt-6 text-sm text-ink-muted">
        {footer.prompt}{" "}
        <Link to={footer.to} className="link">
          {footer.linkLabel}
        </Link>
      </p>
    </div>
  );
}
