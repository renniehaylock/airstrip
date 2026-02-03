# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/claude-code) when working with this codebase.

## Project Overview

Cashflow Model is a 24-month interactive cashflow forecasting tool for SaaS business financial planning. It's a single-page React application that allows users to model revenue streams, expenses, and visualize cash runway.

## Tech Stack

- **Framework**: React 18.2 with hooks (useState, useMemo, useEffect, useCallback, useRef)
- **Build Tool**: Vite 5.0
- **Styling**: Tailwind CSS 3.4 (utility-first, no custom CSS)
- **Charts**: Recharts 2.10 for visualization
- **Icons**: Lucide React

## Project Structure

```
src/
├── App.jsx       # Entire application (monolithic component, ~1085 lines)
├── main.jsx      # React entry point
└── index.css     # Tailwind directives only
```

This is a monolithic single-file application. All components, logic, and state management live in `App.jsx`.

## Development Commands

```bash
npm run dev      # Start development server (port 5173)
npm run build    # Production build to dist/
npm run preview  # Preview production build
```

## Architecture Patterns

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

## Testing

No testing infrastructure currently exists. When adding tests:
- Consider Vitest for Vite compatibility
- Focus on calculation logic in the `useMemo` block
- Test URL encoding/decoding functions

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
