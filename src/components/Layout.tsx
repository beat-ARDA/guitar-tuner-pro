import { Link, Outlet } from "react-router-dom";

export const Layout = () => {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-50">
      <div className="flex min-h-screen flex-col">
        <header className="sticky top-0 z-10 w-full border-b border-white/10 bg-slate-950/90 backdrop-blur">
          <div className="mx-auto flex w-full max-w-5xl items-center justify-center px-4 py-4">
            <Link to="/" className="text-base font-semibold tracking-tight">
              Guitar Tuner Pro
            </Link>
          </div>
        </header>

        <main className="flex flex-1 items-center">
          <div className="mx-auto flex w-full max-w-5xl flex-1 justify-center px-4 py-10">
            <Outlet />
          </div>
        </main>

        <footer className="sticky bottom-0 mt-auto w-full border-t border-white/10 bg-slate-950/90 backdrop-blur">
          <div className="mx-auto flex w-full max-w-5xl items-center justify-center px-4 py-4 text-xs text-slate-400">
            Guitar Tuner Pro 2026
          </div>
        </footer>
      </div>
    </div>
  );
};
