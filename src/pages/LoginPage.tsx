import { useState } from "react";
import { useAuth } from "../lib/hooks/useAuth";
import { useNavigate } from "react-router-dom";

const LoginPage = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await login(email, password);
      navigate("/dashboard");
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 text-slate-100">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md bg-slate-900 p-6 rounded-lg shadow-lg"
      >
        <h1 className="text-2xl font-semibold mb-4">Login</h1>
        {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full p-2 rounded bg-slate-800 text-slate-100"
            required
          />
        </div>
        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full p-2 rounded bg-slate-800 text-slate-100"
            required
          />
        </div>
        <button
          type="submit"
          className="w-full p-2 bg-indigo-500 rounded text-white font-medium hover:bg-indigo-400"
        >
          Login
        </button>
        <p className="text-sm text-slate-400 mt-4">
          Don't have an account? <a href="/signup" className="text-indigo-400">Sign up</a>
        </p>
      </form>
    </div>
  );
};

export default LoginPage;