import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";

const NAV = [
  { to: "/", label: "Reativação" },
  { to: "/funil", label: "Funil" },
  { to: "/clientes", label: "Clientes" },
  { to: "/ofertas", label: "Ofertas" },
  { to: "/importar", label: "Importar CSV" },
] as const;

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-paper text-ink font-sans antialiased text-[14px]">
      <div className="mx-auto max-w-[1360px] lg:grid lg:grid-cols-[224px_1fr]">
        <aside className="border-b border-line px-5 py-5 lg:border-b-0 lg:border-r lg:py-7">
          <div className="flex items-center gap-3">
            <span className="grid size-9 place-items-center rounded-md bg-ink text-paper text-[11px] font-mono tracking-tight">
              56
            </span>
            <div className="leading-tight">
              <p className="text-[15px] font-semibold tracking-tight">Empório 56</p>
              <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-faint">
                Reativação
              </p>
            </div>
          </div>
          <nav className="mt-6 flex flex-wrap gap-1 lg:mt-9 lg:flex-col lg:space-y-1">
            {NAV.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                activeOptions={{ exact: item.to === "/" }}
                className="flex items-center gap-3 rounded-md px-3 py-2 text-ink-soft transition-colors hover:bg-black/5 data-[status=active]:bg-ink data-[status=active]:text-paper"
              >
                <span className="h-1.5 w-1.5 rounded-full bg-line" />
                <span className="text-[13px]">{item.label}</span>
              </Link>
            ))}
          </nav>
        </aside>

        <main className="px-5 py-6 sm:px-8">{children}</main>
      </div>
    </div>
  );
}
