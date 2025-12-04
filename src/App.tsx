import './App.css';

function App() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      {/* Glow background effect */}
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.14),_transparent_55%),radial-gradient(circle_at_bottom,_rgba(129,140,248,0.18),_transparent_55%)]" />

      <div className="relative z-10 w-full max-w-3xl rounded-3xl border border-slate-800 bg-slate-900/60 backdrop-blur-xl p-8 shadow-[0_18px_60px_rgba(0,0,0,0.65)]">
        {/* Logo / Title */}
        <div className="flex items-center gap-3 mb-6">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-indigo-500/90 shadow-lg shadow-indigo-500/40">
            <span className="text-xl">📚</span>
          </div>
          <div>
            <h1 className="text-xl font-semibold tracking-tight">BookTrackr</h1>
          </div>
        </div>

        {/* Main content */}
        <div className="space-y-6">
          <div>
            <p className="inline-flex items-center rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-300 ring-1 ring-emerald-500/30 mb-4">
              <span className="mr-2 h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              In development
            </p>
            <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
              Something for your reading life
              <span className="block text-indigo-300">is coming soon.</span>
            </h2>
          </div>

          <p className="text-sm leading-relaxed text-slate-300">
            BookTrackr helps you turn books into action: track your reading, capture key
            ideas, and connect insights directly to your projects. No more forgotten
            highlights buried in old notes.
          </p>

          {/* Bottom meta info */}
          <div className="flex flex-col gap-2 border-t border-slate-800 pt-4 text-[11px] text-slate-500 sm:flex-row sm:items-center sm:justify-between">
            <span>
              Built by{' '}
              <span className="font-medium text-slate-300">
                Nevio Apicella
              </span>
            </span>
            <span className="flex items-center gap-2">
              <span className="h-1 w-1 rounded-full bg-slate-600" />
              Early prototype · {new Date().getFullYear()}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;


