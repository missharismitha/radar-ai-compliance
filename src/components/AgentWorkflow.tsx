import { CheckCircle2, Loader2, FileText, ShieldAlert, BookOpen, AlertTriangle, FileCheck, Zap } from "lucide-react";

const AGENTS = [
  {
    id: 1,
    name: "User Input",
    desc: "Reading company and policy details",
    icon: FileText,
    logs: [
      "Receiving company name and industry…",
      "Policy document loaded",
      "Input validated and structured",
    ],
  },
  {
    id: 2,
    name: "Knowledge Retrieval",
    desc: "Retrieving EU AI Act obligations from Dify Knowledge Base",
    icon: BookOpen,
    logs: [
      "Querying EU AI Act knowledge base…",
      "Retrieving relevant obligations and articles…",
      "Knowledge retrieved successfully",
    ],
  },
  {
    id: 3,
    name: "Gap Analysis Agent",
    desc: "Identifying compliance gaps",
    icon: AlertTriangle,
    logs: [
      "Mapping policy against EU AI Act requirements…",
      "Identifying compliance gaps per article…",
      "Gap analysis complete",
    ],
  },
  {
    id: 4,
    name: "Risk and Action Agent",
    desc: "Creating risk memo and remediation tickets",
    icon: ShieldAlert,
    logs: [
      "Assessing investor and founder risk…",
      "Generating remediation tickets…",
      "Risk memo compiled",
    ],
  },
  {
    id: 5,
    name: "Output",
    desc: "Preparing final compliance report",
    icon: FileCheck,
    logs: [
      "Assembling compliance report…",
      "Calculating trust score and metrics…",
      "Report ready",
    ],
  },
];

type Props = {
  currentStep: number;
};

export function AgentWorkflow({ currentStep }: Props) {
  return (
    <div className="rounded-2xl border border-border/60 bg-surface/60 p-6 backdrop-blur">
      <div className="mb-6 flex items-center gap-2">
        <Zap className="h-4 w-4 text-primary animate-pulse" />
        <span className="text-sm font-semibold text-foreground">Agentic Workflow Running</span>
        <span className="ml-auto text-xs text-muted-foreground">
          {currentStep < AGENTS.length ? `Agent ${currentStep + 1} of ${AGENTS.length}` : "Complete"}
        </span>
      </div>

      <ol className="space-y-3">
        {AGENTS.map((agent, i) => {
          const isDone = i < currentStep;
          const isActive = i === currentStep;
          const isPending = i > currentStep;
          const Icon = agent.icon;

          return (
            <li key={agent.id}>
              <div className={`flex items-start gap-3 rounded-xl border p-4 transition-all duration-500 ${
                isActive
                  ? "border-primary/50 bg-primary/10"
                  : isDone
                    ? "border-success/30 bg-success/5"
                    : "border-border/40 bg-background/30 opacity-50"
              }`}>
                <div className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                  isActive ? "bg-primary/20 text-primary" : isDone ? "bg-success/20 text-success" : "bg-muted/50 text-muted-foreground"
                }`}>
                  {isActive ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : isDone ? (
                    <CheckCircle2 className="h-4 w-4" />
                  ) : (
                    <Icon className="h-4 w-4" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className={`text-sm font-semibold ${isActive ? "text-primary" : isDone ? "text-success" : "text-muted-foreground"}`}>
                      {agent.name}
                    </span>
                    {isDone && (
                      <span className="text-[10px] font-medium text-success bg-success/10 border border-success/20 rounded-full px-2 py-0.5">
                        DONE
                      </span>
                    )}
                    {isActive && (
                      <span className="text-[10px] font-medium text-primary bg-primary/10 border border-primary/20 rounded-full px-2 py-0.5 animate-pulse">
                        RUNNING
                      </span>
                    )}
                  </div>
                  <p className="mt-0.5 text-xs text-muted-foreground">{agent.desc}</p>

                  {isActive && (
                    <div className="mt-2 space-y-1">
                      {agent.logs.map((log, li) => (
                        <div
                          key={li}
                          className="flex items-center gap-2 text-[11px] text-foreground/70"
                          style={{ animationDelay: `${li * 0.3}s` }}
                        >
                          <span className="h-1 w-1 rounded-full bg-primary shrink-0" />
                          {log}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
