import AuthForm from "../components/auth/AuthForm";
import { useAuth } from "../lib/auth/useAuth";

const SignupPage = () => {
  const { signup } = useAuth();

  return (
    <AuthForm
      title="Create your account"
      submitLabel="Sign up"
      pendingLabel="Creating account…"
      passwordAutoComplete="new-password"
      onSubmit={signup}
      footer={{ prompt: "Already have an account?", linkLabel: "Log in", to: "/login" }}
    />
  );
};

export default SignupPage;
