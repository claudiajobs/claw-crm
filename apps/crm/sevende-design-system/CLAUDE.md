# sevende CRM — Claude Code Context
# Paste this file as your first message (or into CLAUDE.md) when starting a new session.

## Project overview
You are building **sevende**, a Brazilian CRM web application.
Language: **Brazilian Portuguese** throughout all UI text.
Stack: React 18 + TypeScript + CSS (using tokens.css variables) + Tabler Icons React + @dnd-kit + Recharts.

---

## File structure of this design system
```
sevende-design-system/
├── CLAUDE.md          ← this file (project instructions for Claude Code)
├── DESIGN_SYSTEM.md   ← full visual spec: colors, typography, components, rules
├── tokens.css         ← all CSS custom properties + base component classes
└── types.ts           ← TypeScript types, constants, and utility helpers
```

**Before writing any code, read all four files.** They are the single source of truth.

---

## Critical rules (never break these)

1. **All UI text in Brazilian Portuguese.** Labels, placeholders, error messages, tooltips — everything.
2. **Import `tokens.css` globally.** Never hardcode a color hex — always use a `--color-*` or `--stage-*` variable, or a class from tokens.css.
3. **Use Tabler Icons React only.** `import { IconUsers } from '@tabler/icons-react'`. Always `size={16} stroke={1.5}` unless noted otherwise. Add `aria-hidden` to decorative icons.
4. **Use @dnd-kit for drag and drop** on the Kanban board. Never `HTML5 drag API` directly.
5. **Use Recharts** for all charts. Configure with the design system colors.
6. **Never use `font-weight` 600 or 700 on body copy.** Reserve bold for headings, labels, and values only.
7. **Always `Math.round()` numbers before display.** No floating point artifacts on screen.
8. **Format BRL currency** using `formatCurrencyCompact()` for compact (card) display and `formatCurrency()` for full display. Both are in `types.ts`.
9. **Auto-format phone and CNPJ** using `formatPhone()` and `formatCNPJ()` from `types.ts` on `onChange`.
10. **LGPD notice** must appear on all forms that collect personal data.

---

## App shell

```tsx
// src/App.tsx
// Layout: fixed 200px sidebar + flex main area
// Active nav item: background #EEF0FD, color #5B47E0
// Page background: #F8F8FA
// Card background: #FFFFFF with 0.5px border #E0E0E8

import './tokens.css'; // must be first import
```

---

## Pages to build (in priority order)

### 1. Dashboard (`/`)
Sections:
- Topbar: "Dashboard" title + "Visão geral · [month year]" subtitle + month filter chip + bell icon + "Novo negócio" button
- 4 metric cards in a row: MRR, Negócios ativos, Taxa de conversão, Ciclo médio
  - Each has a colored `border-top: 3px solid <color>` accent
  - Use `DashboardMetrics` type from `types.ts`
- 2-column mid section:
  - Left (wider): bar chart "Receita mensal" — 6 months, realized vs goal bars side by side
  - Right: pipeline funnel "Pipeline por etapa" — horizontal bars per stage
- 2-column bottom section:
  - Left: deals table (Contact, Value, Stage badge, Owner avatar)
  - Right column split vertically:
    - Activity feed (icon + title + description + timestamp)
    - Monthly goal donut ring + realized vs remaining

### 2. Pipeline — Kanban (`/pipeline`)
- Topbar: "Pipeline" + subtitle + filter/export buttons + "Novo negócio"
- Filter bar: search input + Todos / Quente / Meus / Atrasados chips
- 5 kanban columns: Prospecção → Qualificado → Proposta → Negociação → Ganho
- Each column: colored dot + title + count badge + total value
- Deal cards: contact name + company + value + tags + divider + owner avatar + days + probability
- Drag and drop between columns using @dnd-kit
- Toast on drop: "Luna Ferreira → Ganho" using `--color-success` left border
- "+ Adicionar" dashed button at bottom of each column

### 3. Novo contato (`/contacts/new`)
Form layout: main form (flex: 1) + sticky sidebar (220px)

Main form sections (separate cards):
1. Informações pessoais: avatar preview + firstName, lastName*, email*, phone, role, linkedin
2. Empresa: company*, segment select, cnpj, companySize select, website
3. Localização: city + state (UF)
4. Classificação: stage select, owner select, tags multi-select, leadScore slider 0–100, notes textarea
5. Preferências de comunicação: 4 toggles

Sticky sidebar (220px):
- Contact preview card (initials avatar, name, role·company, email, phone, company, city)
- Lead score card (score number + colored dot indicators)
- Recent activities list (placeholder)

Validation:
- Required: lastName, email (regex: `/^[^\s@]+@[^\s@]+\.[^\s@]+$/`)
- Show errors on submit attempt; clear on correction
- Auto-format phone and CNPJ on input
- Success banner on valid submit

Footer: LGPD badge (IconShieldCheck teal + "Dados protegidos · LGPD") + Cancelar + Limpar + Salvar

---

## Component specifications

### Sidebar nav
```tsx
// Items with notification dots:
// - Negócios: <span className="nav-badge">12</span>
// - Atividades: <span className="nav-badge">3</span>
// Bottom: user avatar + name + role
// Active: className="nav-item active"
```

### Metric card
```tsx
<div className="metric-card" style={{ borderTopColor: '#5B47E0' }}>
  <div className="metric-icon" style={{ background: '#EEF0FD', color: '#5B47E0' }}>
    <IconCurrencyDollar size={18} stroke={1.5} aria-hidden />
  </div>
  <div className="metric-label">Receita MRR</div>
  <div className="metric-value">R$184k</div>
  <div className="metric-delta delta-pos">
    <IconTrendingUp size={12} stroke={1.5} aria-hidden />
    +14,2% vs. abr
  </div>
</div>
```

### Badge
```tsx
// Pipeline stage badge:
<span
  className="badge badge-sq"
  style={{ background: PIPELINE_STAGES[stage].lightColor, color: PIPELINE_STAGES[stage].textColor }}
>
  {PIPELINE_STAGES[stage].label}
</span>
```

### Avatar
```tsx
// Use assignAvatarColor(contact.name) to get color
const { bg, color } = AVATAR_COLOR_STYLES[contact.avatarColor];
<div className="avatar avatar-md" style={{ background: bg, color }}>
  {contact.initials}
</div>
```

### Toast
```tsx
// Show toasts in a fixed container bottom-right
// Auto-dismiss after 3000ms
// Variants: toast-success, toast-warning, toast-danger, toast-info
```

### Toggle
```tsx
<label className="toggle">
  <input type="checkbox" checked={value} onChange={onChange} />
  <div className="toggle-track">
    <div className="toggle-thumb" />
  </div>
</label>
```

---

## Recharts configuration

```tsx
// Bar chart — Revenue
<BarChart data={data} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
  <XAxis dataKey="month" tick={{ fill: '#9898A8', fontFamily: 'Plus Jakarta Sans', fontSize: 10 }} axisLine={false} tickLine={false} />
  <YAxis hide />
  <Bar dataKey="realized" fill="#5B47E0" radius={[4, 4, 0, 0]} />
  <Bar dataKey="goal" fill="#EEF0FD" stroke="#8B7FF0" strokeDasharray="4 2" radius={[4, 4, 0, 0]} />
</BarChart>

// Donut — Goal ring
<PieChart>
  <Pie data={[{ value: realized }, { value: remaining }]}
    cx="50%" cy="50%" innerRadius={34} outerRadius={46}
    startAngle={90} endAngle={-270} strokeWidth={0}
    dataKey="value"
  >
    <Cell fill="#5B47E0" />
    <Cell fill="#EFEFEF" />
  </Pie>
</PieChart>
```

---

## @dnd-kit setup (Kanban)

```tsx
import { DndContext, closestCenter, DragEndEvent } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

// Board wraps in <DndContext onDragEnd={handleDragEnd}>
// Each column wraps cards in <SortableContext items={columnDealIds} strategy={verticalListSortingStrategy}>
// Each card uses useSortable({ id: deal.id })
// Apply transform: CSS.Transform.toString(transform) to dragging card

function handleDragEnd(event: DragEndEvent) {
  const { active, over } = event;
  if (!over || active.id === over.id) return;
  // Move deal from its current column to the column containing over.id
  // Show toast: `${dealName} → ${newStageLabel}`
}
```

---

## Form validation pattern

```tsx
const [errors, setErrors] = useState<ContactFormErrors>({});

function validate(values: ContactFormValues): ContactFormErrors {
  const errs: ContactFormErrors = {};
  if (!values.lastName.trim()) errs.lastName = 'Campo obrigatório';
  if (!values.email.trim()) errs.email = 'Campo obrigatório';
  else if (!isValidEmail(values.email)) errs.email = 'E-mail inválido';
  return errs;
}

function handleSubmit() {
  const errs = validate(values);
  setErrors(errs);
  if (Object.keys(errs).length > 0) return;
  // proceed
}
```

---

## Folder structure recommendation

```
src/
├── tokens.css              ← copy from design system
├── types.ts                ← copy from design system
├── App.tsx
├── components/
│   ├── layout/
│   │   ├── AppShell.tsx    ← sidebar + main area wrapper
│   │   ├── Sidebar.tsx
│   │   └── Topbar.tsx
│   ├── ui/
│   │   ├── Button.tsx
│   │   ├── Input.tsx       ← with icon prefix, error state
│   │   ├── Badge.tsx
│   │   ├── Avatar.tsx
│   │   ├── Card.tsx
│   │   ├── Toggle.tsx
│   │   ├── Toast.tsx       ← with useToast hook
│   │   ├── ProgressBar.tsx
│   │   └── ScoreBar.tsx
│   ├── dashboard/
│   │   ├── MetricCard.tsx
│   │   ├── RevenueChart.tsx
│   │   ├── PipelineFunnel.tsx
│   │   ├── DealsTable.tsx
│   │   ├── ActivityFeed.tsx
│   │   └── GoalRing.tsx
│   ├── kanban/
│   │   ├── KanbanBoard.tsx
│   │   ├── KanbanColumn.tsx
│   │   └── DealCard.tsx
│   └── contacts/
│       ├── ContactForm.tsx
│       ├── ContactPreviewCard.tsx
│       └── LeadScoreSlider.tsx
├── pages/
│   ├── DashboardPage.tsx
│   ├── PipelinePage.tsx
│   └── NewContactPage.tsx
├── hooks/
│   ├── useToast.ts
│   └── useContactForm.ts
└── data/
    └── mockData.ts         ← seed data for development
```

---

## Mock data seed (for development)

```typescript
// src/data/mockData.ts
// Import types from types.ts and seed with these values:

export const MOCK_USERS: User[] = [
  { id: 'u1', name: 'Marcos Ribeiro', initials: 'MR', email: 'marcos@sevende.com.br', role: 'admin', avatarColor: 'purple', createdAt: new Date() },
  { id: 'u2', name: 'Ana Souza',      initials: 'AS', email: 'ana@sevende.com.br',    role: 'sales', avatarColor: 'teal',   createdAt: new Date() },
  { id: 'u3', name: 'João Pedro',     initials: 'JP', email: 'joao@sevende.com.br',   role: 'sales', avatarColor: 'coral',  createdAt: new Date() },
  { id: 'u4', name: 'Laura Costa',    initials: 'LC', email: 'laura@sevende.com.br',  role: 'sales', avatarColor: 'blue',   createdAt: new Date() },
];

export const MOCK_DEALS: Deal[] = [
  { id: 'd1', contactId: 'c1', contactName: 'Luna Ferreira',    company: 'Acme Ltda',      value: 42000,  stage: 'prop',  probability: 72, ownerId: 'u1', tags: ['hot', 'enterprise'], daysInStage: 14, createdAt: new Date() },
  { id: 'd2', contactId: 'c2', contactName: 'Carlos Silva',     company: 'Nexus Tech',     value: 18000,  stage: 'won',   probability: 100,ownerId: 'u2', tags: ['smb'],               daysInStage: 2,  createdAt: new Date() },
  { id: 'd3', contactId: 'c3', contactName: 'Renata Alves',     company: 'Porto Digital',  value: 31000,  stage: 'neg',   probability: 55, ownerId: 'u1', tags: ['hot', 'enterprise'], daysInStage: 21, createdAt: new Date() },
  { id: 'd4', contactId: 'c4', contactName: 'João Pedro',       company: 'BritoGroup',     value: 67000,  stage: 'qual',  probability: 38, ownerId: 'u1', tags: ['enterprise'],        daysInStage: 12, createdAt: new Date() },
  { id: 'd5', contactId: 'c5', contactName: 'Bruno Nascimento', company: 'DataBR',         value: 18000,  stage: 'prosp', probability: 40, ownerId: 'u2', tags: ['smb'],               daysInStage: 8,  createdAt: new Date() },
  { id: 'd6', contactId: 'c6', contactName: 'Paula Ribeiro',    company: 'TecnoSul',       value: 88000,  stage: 'neg',   probability: 80, ownerId: 'u1', tags: ['hot', 'enterprise'], daysInStage: 9,  createdAt: new Date() },
  { id: 'd7', contactId: 'c7', contactName: 'Gustavo Lima',     company: 'CapMar',         value: 55000,  stage: 'prop',  probability: 68, ownerId: 'u3', tags: ['enterprise'],        daysInStage: 6,  createdAt: new Date() },
  { id: 'd8', contactId: 'c8', contactName: 'Ana Martins',      company: 'SulVentures',    value: 42000,  stage: 'won',   probability: 100,ownerId: 'u1', tags: ['enterprise'],        daysInStage: 4,  createdAt: new Date() },
];

export const MOCK_METRICS: DashboardMetrics = {
  mrr: 184000,
  mrrDelta: 14.2,
  activeDeals: 87,
  dealsDelta: 9,
  conversionRate: 67,
  conversionDelta: -2.1,
  avgCycleDays: 18,
  cycleDelta: 3,
  monthlyGoal: 275000,
  monthlyRealized: 184000,
  daysRemainingInMonth: 13,
};

export const MOCK_REVENUE: RevenueDataPoint[] = [
  { month: 'Dez', realized: 92000,  goal: 110000 },
  { month: 'Jan', realized: 108000, goal: 110000 },
  { month: 'Fev', realized: 97000,  goal: 120000 },
  { month: 'Mar', realized: 131000, goal: 140000 },
  { month: 'Abr', realized: 162000, goal: 160000 },
  { month: 'Mai', realized: 184000, goal: 180000 },
];
```

---

## Getting started commands

```bash
# Create app
npm create vite@latest sevende-crm -- --template react-ts
cd sevende-crm

# Install dependencies
npm install @tabler/icons-react @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities recharts

# Copy design system files
cp path/to/sevende-design-system/tokens.css src/tokens.css
cp path/to/sevende-design-system/types.ts src/types.ts

# Import tokens globally in src/main.tsx (before App)
# import './tokens.css'

npm run dev
```

---

## Checklist before shipping each page

- [ ] All text is in Brazilian Portuguese
- [ ] No hardcoded hex colors — only CSS variable references
- [ ] All icons have `aria-hidden` (decorative) or `aria-label` (interactive)
- [ ] All form fields have associated `<label>` via `htmlFor`
- [ ] Numbers displayed through `Math.round()` or `toFixed()`
- [ ] Currency formatted via `formatCurrencyCompact()` or `formatCurrency()`
- [ ] Phone/CNPJ auto-formatted on input
- [ ] Focus rings visible on keyboard navigation
- [ ] Toast feedback on all mutations (save, move, delete)
- [ ] LGPD badge on forms with personal data
