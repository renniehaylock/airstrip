# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/claude-code) when working with this codebase.

## Project Overview

Airstrip is a 24-month interactive cashflow forecasting tool for SaaS business financial planning. This is a **pnpm monorepo** containing:

- **@airstrip/web** - The main React forecasting application
- **@airstrip/landing** - Marketing/landing page (Astro)

## Monorepo Structure

```
airstrip/
├── apps/
│   ├── web/                 # React app → app.airstrip.com
│   │   ├── src/
│   │   │   ├── App.jsx      # Main application (~2000 lines)
│   │   │   ├── main.jsx     # React entry point
│   │   │   └── index.css    # Tailwind directives
│   │   ├── public/
│   │   ├── index.html
│   │   ├── package.json
│   │   ├── vite.config.js
│   │   └── tailwind.config.js
│   │
│   └── landing/             # Astro landing page → airstrip.com
│       ├── src/
│       │   ├── layouts/
│       │   └── pages/
│       ├── public/
│       ├── package.json
│       └── astro.config.mjs
│
├── packages/                 # Shared packages (future)
├── package.json              # Root workspace config
├── pnpm-workspace.yaml
└── CLAUDE.md
```

## Tech Stack

### Web App (@airstrip/web)
- **Framework**: React 18.2 with hooks
- **Build Tool**: Vite 5.0
- **Styling**: Tailwind CSS 3.4
- **Charts**: Recharts 2.10
- **Icons**: Lucide React

### Landing Page (@airstrip/landing)
- **Framework**: Astro 4.x
- **Styling**: Tailwind CSS 3.4

## Development Commands

```bash
# Install dependencies (from root)
pnpm install

# Run web app (port 5173)
pnpm dev

# Run landing page (port 4321)
pnpm dev:landing

# Build all
pnpm build

# Build specific app
pnpm build:web
pnpm build:landing
```

## Railway Deployment

Each app is deployed as a separate Railway service:
- **Web app**: Root Directory = `apps/web`
- **Landing page**: Root Directory = `apps/landing`

## Web App Architecture

### State Management
- Single monolithic state object via `useState`
- Factory function `getDefaultState()` provides initial state
- Generic updaters: `updateState(key, value)` and `updateArrayItem(key, id, field, value)`
- All state updates use immutable patterns (spread operators)

### URL-Based Persistence
State is encoded to URL parameters for sharing:
- Abbreviated keys: `ic` (initialCash), `mrr` (startingMRR), `nc` (newCustomers), etc.
- Arrays encoded as `"index:value,index:value"` format
- Complex objects JSON-stringified with abbreviated keys (`n`=name, `s`=salary, `h`=hidden)
- Uses `window.history.replaceState()` to avoid page reloads

### LocalStorage Persistence
- Scenarios stored under key `'cashflow-scenarios'`
- Format: `{ name, savedAt (ISO), data (full state copy) }`

### Calculations
All 24-month calculations happen in a `useMemo` block with formula:
```
Next MRR = (Current MRR - Churn Loss) + (New Customers × ARPU)
Net Cashflow = Total Inflows - Total Outflows
Cash Balance = Previous Balance + Net Cashflow
```

## Code Conventions

### Naming
- camelCase for variables and functions
- UPPERCASE for constants (e.g., `STORAGE_KEY`)
- URL parameters use abbreviated names

### Employee Structure
```jsx
{
  id: number,
  name: string,
  salary: number,
  hidden: boolean,
  startMonth: number,      // 0-23, when employee starts
  endMonth: number | null, // null = indefinite, 0-23 = termination month
  severanceMonths: number  // months of severance pay after endMonth
}
```

### Expense Item Structure
```jsx
{
  id: number,           // Date.now() or sequential
  name: string,
  salary/amount/percentage: number,
  month?: number,       // one-time expenses only
  hidden: boolean       // visibility toggle
}
```

### UI Components (internal to App.jsx)
- `SectionHeader` - Collapsible section with icon/badge
- `SidebarBox` - Collapsible settings box with count badge
- `InputField` - Labeled input with prefix/suffix
- `ExpenseRow` - Dynamic expense editor
- `CustomTooltip` - Recharts tooltip

### Styling
100% Tailwind utility classes. Key color conventions:
- Blue: primary actions
- Green: inflows/positive values
- Red: outflows/negative values
- Amber: warnings
- Gray: text/backgrounds

## Common Tasks

### Adding a New Expense Type
1. Add default array to `getDefaultState()`
2. Add URL encode/decode logic in `encodeState()`/`decodeState()`
3. Add calculation logic in the `useMemo` calculations block
4. Add UI section following existing patterns (collapsible section, expense rows)

### Modifying Calculations
All financial calculations are in the single `useMemo` block (~line 300-400). The calculation returns an array of 24 monthly objects containing all metrics.

### Adding New URL Parameters
1. Add short key mapping in `encodeState()`
2. Add decode logic in `decodeState()`
3. Add to `getDefaultState()` with sensible default
