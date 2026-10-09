# Night Ledger

An ink-dark assignment tracker. Add your classes and free hours, add homework, and Night Ledger
splits it into study blocks, plans them around your schedule, and keeps it fixed as time passes.

Every visitor starts with a **blank ledger**: no sample classes, assignments or free hours.
All data is stored in the visitor's own browser (`localStorage`), so two students on the same
site see completely separate ledgers. There are no accounts yet.

## Run locally

```bash
npm install
npm run dev      # http://localhost:3000
npm run build    # production build in dist/
npm run lint     # type-check
```

## Deploy to Netlify

`netlify.toml` is already set up (build `npm run build`, publish `dist`). Either connect the repo
in Netlify and set the base directory to `App`, or drag the built `dist` folder into Netlify Drop.

## Views

- **Week** – the weekly ledger: next up, open work per class, due-today counter, days with their
  assignments and planned study blocks. Click a class tag in the bars to filter by class.
- **Today** – what to do right now, today's study blocks, and what is due today.
- **Homework** – every assignment grouped by when it is due, with search and filters.

## What runs in real time

- The clock ticks every 20 seconds (and instantly when you return to the tab), so today, the week
  number, "next up", Late flags and the reminder banner stay current, including across midnight.
- A study block that ends unfinished is moved to the next open slot automatically
  (switch off with *Auto-rebalance* in the footer).
- Open the app in two tabs and changes show up in both.
- The focus timer is wall-clock based and shows the countdown in the tab title.

## Time tracking for future reasoning

Besides the current state, Night Ledger keeps timestamps on assignments (added, started, finished),
on study blocks (planned slot, completed at, planned vs actual minutes), a per-category pace model,
and an append-only activity log (`nightledger_activity_v1`, capped at 2000 entries). All of it is
included in *Export backup*.

## Where things live

| Path | Purpose |
| --- | --- |
| `src/utils/schedulerEngine.ts` | Urgency-first scheduler, capacity check, auto-rebalance |
| `src/utils/learningEngine.ts` | Per-category pace learning, class colour palette |
| `src/utils/storage.ts` | Persistence layer. Swap this for an API when accounts arrive |
| `src/utils/ledger.ts` | Palette constants, date helpers, ledger numbers |
| `src/components/` | UI (Night Ledger design system in `ui.tsx` and `Rows.tsx`) |

## Design

Palette and type come from the Night Ledger design files: ink `#15121A`, paper `#F1EBDD`,
dust `#A59FB0`, rule `#3A3445`; Instrument Serif, Bricolage Grotesque and DM Mono; hard corners
everywhere and a single circle (the add button). Class colours extend the five highlighter
pastels with four more in the same family so students with many classes never repeat one.
