import AuthForm from "../components/auth/AuthForm";
import { useAuth } from "../lib/auth/useAuth";

const LoginPage = () => {
  const { login } = useAuth();

  return (
    <AuthForm
      title="Log in"
      submitLabel="Log in"
      pendingLabel="Logging in…"
      passwordAutoComplete="current-password"
      onSubmit={login}
      footer={{ prompt: "Don't have an account?", linkLabel: "Sign up", to: "/signup" }}
    />
  );
};

export default LoginPage;
