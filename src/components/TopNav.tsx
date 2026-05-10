import { Link } from "@tanstack/react-router";
import { Radar, ShieldCheck } from "lucide-react";

const links = [
  { to: "/", label: "Home" },
  { to: "/assessment", label: "Assessment" },
  { to: "/results", label: "Report" },
  { to: "/chat", label: "Ask RADAR" },
  { to: "/voice", label: "Voice" },
  { to: "/email", label: "Email" },
] as const;

export function TopNav() {
  return (
    <header className="sticky top-0 z-40 border-b border-border/40 bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-3.5">
        <Link to="/" className="flex items-center gap-2.5 group">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/15 text-primary ring-1 ring-primary/30 transition-all group-hover:bg-primary/25">
            <Radar className="h-4 w-4" />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-bold tracking-tight leading-none">RADAR</span>
            <span className="hidden text-[10px] text-muted-foreground sm:block leading-none mt-0.5">AI Compliance Agent</span>
          </div>
        </Link>

        <nav className="flex flex-wrap items-center gap-0.5 text-sm">
          {links.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              activeProps={{ className: "bg-secondary text-foreground" }}
              activeOptions={{ exact: l.to === "/" }}
              className="rounded-md px-3 py-1.5 text-xs font-medium text-muted-foreground transition-all hover:bg-secondary hover:text-foreground"
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-1.5 sm:flex">
          <div className="flex h-5 w-5 items-center justify-center rounded-full bg-success/15">
            <ShieldCheck className="h-3 w-3 text-success" />
          </div>
          <span className="text-[10px] font-medium text-success">EU AI Act 2024</span>
        </div>
      </div>
    </header>
  );
}
