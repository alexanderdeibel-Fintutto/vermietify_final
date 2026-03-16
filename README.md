# Fintutto Monorepo

Monorepo for all Fintutto ecosystem apps — property management, tenant portals, financial tools, and more.

## Architecture

```
fintutto-monorepo/
├── apps/
│   ├── vermietify/          # Property management dashboard
│   ├── financial-compass/   # Financial planning & tax tools
│   ├── bescheidboxer/       # Bürgergeld/Sozialrecht KI-Assistent
│   # Future apps:
│   # ├── mieterportal/      # Tenant self-service portal
│   # ├── hausmeister/       # Caretaker management
│   # ├── ablesung/          # Meter readings
│   # └── admin/             # Admin dashboard
├── packages/
│   ├── ui/                  # Shared shadcn/radix UI components
│   ├── supabase/            # Shared Supabase client & types
│   └── shared/              # Shared utils, hooks, types
├── supabase/                # Supabase config, migrations, functions
├── turbo.json               # Turborepo pipeline config
└── pnpm-workspace.yaml      # Workspace config
```

## Tech Stack

- **Build**: Turborepo + pnpm workspaces
- **Frontend**: React 18, TypeScript, Vite
- **Styling**: Tailwind CSS, shadcn/ui (Radix primitives)
- **Backend**: Supabase (PostgreSQL, Auth, Edge Functions, Storage)
- **Deployment**: Vercel (per-app deployments)

## Getting Started

```bash
# Install pnpm if not present
npm i -g pnpm

# Install all dependencies
pnpm install

# Run vermietify in development
pnpm dev:vermietify

# Build all apps
pnpm build

# Run tests across all apps
pnpm test
```

## Adding a New App

1. Create `apps/<app-name>/` with its own `package.json`
2. Import shared packages: `@fintutto/ui`, `@fintutto/supabase`, `@fintutto/shared`
3. Run `pnpm install` from root to link workspace dependencies
4. Add app-specific scripts to root `package.json` if needed

## Shared Packages

| Package | Description | Usage |
|---------|-------------|-------|
| `@fintutto/ui` | 50+ shadcn/radix components | `import { Button } from "@fintutto/ui"` |
| `@fintutto/supabase` | Supabase client + DB types | `import { supabase } from "@fintutto/supabase"` |
| `@fintutto/shared` | Utils, auth hooks, validators | `import { useAuth, cn } from "@fintutto/shared"` |
