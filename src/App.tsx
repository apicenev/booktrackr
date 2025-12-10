import AppRouter from "./router/AppRouter";
import { BrowserRouter } from "react-router-dom";
import { useAuth } from "./lib/hooks/useAuth";

function App() {
  const { initializing } = useAuth();

  // While Firebase checks login status
  if (initializing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-slate-100">
        <p className="text-slate-400 animate-pulse">Loading BookTrackr...</p>
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


