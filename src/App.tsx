import AppRouter from "./router/AppRouter";
import { BrowserRouter } from "react-router-dom";
import { useAuth } from "./lib/auth/useAuth";
import BrandMark from "./components/layout/BrandMark";

function App() {
  const { initializing } = useAuth();

  // While Firebase checks login status
  if (initializing) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-canvas">
        <BrandMark size="lg" />
        <p className="animate-pulse text-sm text-ink-muted">Loading BookTrackr...</p>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <AppRouter />
    </BrowserRouter>
  );
}

export default App;


