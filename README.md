# RADAR — AI Regulatory Due Diligence Engine

> An agentic AI compliance prototype that analyses AI policy documents against the EU AI Act and produces structured gap reports, risk memos, and remediation tickets.

---

## What is RADAR?

**RADAR** is a hackathon-grade prototype for AI regulatory due diligence. It takes a company’s AI policy text, runs it through a 7-agent orchestrated workflow, and produces an audit-grade compliance report covering:

- **Risk classification** under EU AI Act Annex III
- **Article-level gap analysis** across all applicable obligations
- **Evidence-traced findings** (policy language → violated article)
- **Quantified trust score** and investor/founder risk memo
- **Structured remediation tickets** with owners and deadlines
- **Multi-modal delivery** via chat, voice briefing, and email

This is intentionally a **focused demo**, not a full platform. The primary goal is one working end-to-end flow: enter company details → call the Dify workflow API → display the compliance report → allow follow-up chat.

---

## Live Demo

Try three pre-built demo scenarios without any API key:

| Scenario | Industry | Risk Level | Trust Score |
|----------|----------|------------|-------------|
| **FinCore AG** | Fintech (Credit Scoring) | High | 38 |
| **MedTriage GmbH** | HealthTech (Medical Triage) | High | 52 |
| **AutoVision Systems** | Manufacturing (Vision AI) | Medium | 65 |

Each includes a fully populated compliance report, gap analysis, risk memo, and remediation tickets.

---

## Architecture

### 7-Agent Pipeline

RADAR coordinates 7 specialised agents, each with a defined responsibility:

| # | Agent | Role |
|---|-------|------|
| 1 | **Document Intake** | Parses and structures policy text; extracts AI system descriptors |
| 2 | **Risk Classification** | Applies EU AI Act Annex III taxonomy to determine risk category |
| 3 | **EU AI Act Mapping** | Maps policy coverage against 47 applicable articles |
| 4 | **Gap Analysis** | Identifies specific compliance gaps with article-level citations |
| 5 | **Evidence Retrieval** | Traces each gap finding to exact language in the source document |
| 6 | **Report Generation** | Produces structured report with risk score, tickets, and risk memo |
| 7 | **Briefing & Delivery** | Delivers findings via conversational chat, voice briefing, and email |

### Why Agentic Instead of RAG?

Standard RAG retrieves relevant chunks and passes them to a single LLM call. RADAR’s agentic workflow:

- Structures the **full** policy, not just retrieved chunks
- Applies **domain-specific** classification (Annex III taxonomy)
- Scores obligations against **47 articles**, not a generic summary
- Generates **actionable deliverables** (tickets, memos, voice scripts)
- Enables **follow-up interaction** through chat and voice

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | [TanStack Start](https://tanstack.com/start) (React 19 + Vite 7 + SSR) |
| Router | TanStack Router (file-based routing) |
| Styling | Tailwind CSS v4 with custom dark navy theme |
| UI Components | Radix UI primitives + shadcn/ui |
| Icons | Lucide React |
| State | sessionStorage (frontend-only prototype) |
| Backend | TanStack `createServerFn` (server functions) |
| AI Workflow | [Dify.ai](https://dify.ai) Workflow API |
| Chat | Moonshot AI (Kimi API) |
| Runtime | Cloudflare Workers (Edge) |

---

## Project Structure

```
├── src/
│   ├── routes/                     # File-based TanStack routes
│   │   ├── __root.tsx              # Root layout (shell + providers)
│   │   ├── index.tsx               # Landing page with hero, demos, agent pipeline
│   │   ├── assessment.tsx          # Assessment form → calls Dify workflow
│   │   ├── results.tsx             # Compliance report display
│   │   ├── chat.tsx                # Compliance chatbot (Kimi API)
│   │   ├── voice.tsx               # Voice briefing agent (prepared UI)
│   │   ├── email.tsx               # Email report delivery (prepared UI)
│   │   └── api/
│   │       ├── send-report.ts      # Email report endpoint
│   │       └── voice-briefing.ts   # Voice briefing endpoint
│   ├── components/
│   │   ├── TopNav.tsx              # Global navigation
│   │   ├── AgentWorkflow.tsx       # Animated workflow step indicator
│   │   ├── ComplianceChat.tsx      # Chat interface component
│   │   └── VoiceAgent.tsx          # Voice agent component
│   ├── lib/
│   │   ├── radar-store.ts          # sessionStorage store + demo data
│   │   ├── dify.functions.ts       # Dify workflow server function
│   │   ├── chat.functions.ts       # Kimi chat server function
│   │   └── error-capture.ts        # Error handling utilities
│   ├── services/
│   │   ├── reportService.ts        # Report download/generation
│   │   └── emailService.ts         # Email delivery service
│   ├── styles.css                  # Tailwind v4 theme + custom tokens
│   ├── router.tsx                  # TanStack Router setup
│   └── start.ts                    # App entry point
├── vite.config.ts                  # Vite config (TanStack Start)
├── wrangler.jsonc                  # Cloudflare Workers config
└── package.json
```

---

## Routes

| Route | Description |
|-------|-------------|
| `/` | Landing page — hero, agent pipeline visualization, demo scenarios, RAG vs Agentic comparison |
| `/assessment` | Input form — company details, policy text, file upload (TXT). Calls Dify workflow API |
| `/results` | Compliance report — executive summary, gap analysis, risk memo, tickets, raw Dify output |
| `/chat` | Ask RADAR — follow-up questions about your report via Kimi API |
| `/voice` | Voice briefing — prepared UI for text-to-speech delivery |
| `/email` | Email report — prepared UI for sending reports to stakeholders |

---

## Environment Variables

Create a `.env` file in the project root (values are read server-side only):

```bash
# Required for live Dify workflow assessment
DIFY_API_KEY=your-dify-api-key

# Required for compliance chat
KIMI_API_KEY=your-moonshot-api-key
KIMI_BASE_URL=https://api.moonshot.cn/v1   # optional
KIMI_MODEL=moonshot-v1-8k                  # optional

# Optional for email delivery
EMAIL_API_KEY=...
```

> **Note:** If `DIFY_API_KEY` is not set, the app gracefully falls back to a built-in demo report so the UI and flow still work.

---

## Getting Started

### Prerequisites

- [Bun](https://bun.sh) or Node.js 20+
- A Dify.ai account with a workflow configured (optional — demo works without it)
- A Moonshot AI (Kimi) API key (optional — chat shows an error message without it)

### Install & Run

```bash
# Install dependencies
bun install

# Start development server
bun dev
```

The dev server runs at `http://localhost:3000` by default.

### Build

```bash
# Production build (Cloudflare Workers compatible)
bun run build

# Preview production build locally
bun run preview
```

---

## Dify Workflow Integration

The assessment page (`/assessment`) calls a Dify workflow via the server function in `src/lib/dify.functions.ts`.

### Workflow Inputs

The following fields are sent to Dify as `inputs`:

- `company_name`
- `industry`
- `country`
- `company_stage`
- `product_description`
- `policy_text`

### Expected Outputs

Your Dify workflow should return these fields in `data.outputs`:

- `company_name` — string
- `compliance_report` — object or JSON string with `summary`, `risk_class`, `eu_ai_act_applicability`, `gaps[]`
- `risk_actions` — object or JSON string with `trust_score`, `critical_gaps`, `warning_gaps`, `validated_controls`, `investor_memo`, `tickets[]`, `voice_briefing_script`

### Error Handling

If Dify returns an error, the UI displays a red error card with:
- HTTP status code
- Error message
- Contextual suggestion (e.g., timeout → reduce policy length)

---

## Chat Integration

The chat page (`/chat`) uses the Moonshot AI (Kimi) API to answer follow-up questions about your compliance report.

The server function (`src/lib/chat.functions.ts`):
1. Loads the current assessment from context
2. Injects the report as system context (truncated to ~16K characters)
3. Sends user messages to Kimi with the report as grounding

If `KIMI_API_KEY` is not configured, the chat shows a friendly error message explaining that demo mode is active.

---

## Design System

RADAR uses a custom **dark navy enterprise theme** built on Tailwind CSS v4:

- **Background:** Deep navy (`oklch(0.16 0.035 260)`)
- **Surface:** Slightly elevated navy (`oklch(0.22 0.04 260)`)
- **Primary:** Soft cyan-blue (`oklch(0.7 0.16 230)`)
- **Semantic colors:** Success (green), Warning (amber), Critical (red)
- **Typography:** Inter (system fallback)
- **Effects:** Subtle radial gradient background, glassmorphism cards with `backdrop-blur`

---

## Key Features

### Assessment Flow
- **Form validation** with required fields
- **File upload** support for `.txt` files (PDF/DOCX prompts user to paste extracted text)
- **3 demo scenarios** — one-click load with realistic policy text
- **Animated workflow steps** — visual progress through the 5 Dify workflow stages
- **Graceful degradation** — works without any API keys via fallback demo data

### Results Page
- **Executive summary** with EU AI Act applicability statement
- **Gap analysis cards** — each gap shows article, title, severity, policy evidence, gap description, remediation, owner, and deadline
- **Investor & Founder Risk Memo** — quantified risk, red flags, conditions before investment, RADAR recommendation
- **Remediation tickets** — structured action items with priority, owner, deadline, and acceptance criteria
- **Voice briefing script** — printable/speakable executive summary
- **Raw Dify output** — collapsible panel for debugging
- **Export options** — Download HTML, Print, Email, Chat

### Prepared Screens
- **Voice briefing** (`/voice`) — UI prepared for browser TTS / ElevenLabs integration
- **Email report** (`/email`) — UI prepared for email delivery workflow
- These do not break the main assessment flow and can be wired to real services when ready.

---

## Roadmap / Future Features

These screens are prepared in the UI and ready for backend integration:

1. **Payments** — One-time per-assessment pricing + Pro subscription (requires Lovable Cloud)
2. **PDF Parser** — Server-side extraction for uploaded PDF/DOCX files
3. **Voice Agent** — Browser SpeechSynthesis or ElevenLabs TTS for the briefing script
4. **Email Delivery** — SendGrid/Resend integration for stakeholder report sharing
5. **Auth & History** — User accounts and assessment history (requires Lovable Cloud)

---

## Disclaimer

**RADAR is a prototype / hackathon demo.** The compliance reports it generates are for demonstration purposes only and do **not** constitute legal advice. Always consult a qualified EU AI Act legal specialist before making compliance decisions.

---

## License

MIT — Built for demonstration and educational purposes.
