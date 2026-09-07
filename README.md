# Larder 🍲

**Larder** is a modern, responsive culinary recipe knowledge base built with **React 19**, **Node.js (Express)**, **PostgreSQL 16**, **Drizzle ORM**, **shadcn/ui**, and **Tailwind CSS v4** in full **TypeScript**.

It is configured as a standalone installable **PWA (Progressive Web App)** and is **Docker/Portainer-ready** for 1-click deployment.

---

## Key Features

### 1. Rich Recipe Attributes
- **Title, Description, Yield / Servings**
- **Times**: Preparation time, Cooking time, Total time
- **Ingredients**: Structured with amounts, units, items, and prep notes
- **Instructions**: Step-by-step method with numbering
- **Tags & Taxonomies**: Categorized (e.g. *Season*, *Course*, *Cuisine*, *Dietary*, *Difficulty*)
- **Media & Source**: High-res image URL, source reference, and chef's notes

### 2. Multi-Element "Any" vs "All" Filter Drawer
- Slide-out **Filter Drawer** (keyboard shortcut `F` or `Cmd/Ctrl + F`)
- Full-text search across titles, descriptions, ingredients, and instructions (`Cmd/Ctrl + K`)
- **Per-Element Match Mode**:
  - **Ingredients**: Toggle between **ANY** (e.g., has garlic *or* butter) vs **ALL** (must have garlic *and* olive oil).
  - **Tags**: Set match modes per category! E.g. Season on **ANY** (Winter *or* Autumn), but Dietary on **ALL** (Vegetarian *and* Gluten-Free).
- **Time & Yield Filters**: Quick chips for total time (&le;15m, &le;30m, &le;45m, &le;60m).
- **Special Views**: Filter by "Has Image", "Missing Image", and "Conflicts Only".
- Active filter pill badges with 1-click individual removal and a "Reset All" action.

### 3. Global Metadata Configurations & Conflict Resolution
- **Configurable Mandatory Attributes**:
  - Make attributes globally mandatory (e.g., require photos, cook times, or tags in specific categories).
  - Baseline mandatory fields: Title, Ingredients, Instructions.
- **Automated Conflict Detection**:
  - When metadata rules are updated, all existing recipes are analyzed against the new rules.
  - Non-compliant recipes are flagged with a dedicated **Conflicts** view.
  - Each conflicting recipe displays its exact violations with a 1-click **"Quick Fix"** action.

### 4. Tag Taxonomy Management with Conflict Resolution
- **Create & Edit Tag Categories**: Manage taxonomies (e.g. *Season*, *Course*, *Cuisine*, *Dietary*).
- **Rename Tags**: Renaming a tag (e.g. `"spring"` &rarr; `"Spring"`) automatically cascades across all recipes with zero conflicts.
- **Delete Tags with Conflict Resolution**:
  - If recipes currently use the tag, a conflict dialog prompts you to either:
    1. **Reassign**: Automatically reassign all affected recipes to another tag in the same category.
    2. **Strip**: Cleanly remove the tag from all affected recipes and delete it.

### 5. Lightweight ORM (Drizzle ORM)
- Database queries, schemas, and migrations are powered by **Drizzle ORM** (`drizzle-orm/node-postgres`).
- Zero binary overhead, instant startup, and full end-to-end TypeScript types.

### 6. Installable PWA (Progressive Web App)
- Works offline, caches static assets via Workbox service worker (`vite-plugin-pwa`).
- Standalone window mode on Desktop (macOS, Windows, Linux) and Mobile (iOS, Android).
- In-app install banner / button appears when installable.

### 7. Keyboard Shortcuts & Rapid Entry
- `Cmd/Ctrl + K` or `/`: Focus search / filter
- `Cmd/Ctrl + F` or `F`: Toggle Filter Drawer
- `Cmd/Ctrl + N` or `N`: New Recipe modal
- `Cmd/Ctrl + M` or `M`: Metadata Configuration modal
- `Esc`: Close open drawers and dialogs
- In Recipe Form: Press **Enter** on ingredient or instruction to automatically add and focus the next line!

---

## Local Development

```bash
# 1. Install dependencies
pnpm install

# 2. Start local PostgreSQL container (optional if you already have Postgres running)
pnpm docker:dev:db

# 3. Start development server (backend on 3001 + Vite frontend on 5173 with proxy)
pnpm dev
```

---

## Portainer / Docker Deployment

### Deploy with Portainer

1. Open **Portainer** &rarr; **Stacks** &rarr; **Add stack**.
2. Name the stack `larder`.
3. Choose **Web editor** and paste [`docker-compose.yml`](./docker-compose.yml), or link your Git repository.
4. (Optional) Adjust variables:
   - `POSTGRES_USER`: `coquinaria`
   - `POSTGRES_PASSWORD`: `<your-secure-password>`
   - `POSTGRES_DB`: `coquinaria`
   - `APP_PORT`: `3000`
5. Click **Deploy the stack**.

The web application and PWA will be available on port `3000`.
