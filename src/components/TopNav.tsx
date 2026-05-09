import { Link } from "@tanstack/react-router";
import { Radar } from "lucide-react";

const links = [
  { to: "/", label: "Home" },
  { to: "/assessment", label: "Assessment" },
  { to: "/results", label: "Results" },
  { to: "/chat", label: "Ask RADAR" },
  { to: "/voice", label: "Voice Agent" },
  { to: "/email", label: "Email Report" },
] as const;

export function TopNav() {
  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        <Link to="/" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/15 text-primary ring-1 ring-primary/30">
            <Radar className="h-4 w-4" />
          </div>
          <span className="font-semibold tracking-tight">RADAR</span>
          <span className="hidden text-xs text-muted-foreground sm:inline">EU AI Act Due Diligence</span>
        </Link>
        <nav className="flex flex-wrap items-center gap-1 text-sm">
          {links.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              activeProps={{ className: "bg-secondary text-foreground" }}
              activeOptions={{ exact: l.to === "/" }}
              className="rounded-md px-3 py-1.5 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
            >
              {l.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
