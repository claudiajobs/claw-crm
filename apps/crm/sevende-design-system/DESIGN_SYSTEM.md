# Sevende CRM — Design System Specification
> Hand this file (and the others in this folder) to Claude Code as context before building any screen.

---

## Stack assumption
React + Tailwind CSS (or plain CSS with these variables). All tokens below are defined as CSS custom properties. If using Tailwind, extend the theme with these values.

---

## 1. Brand identity

- **Product name:** sevende
- **Logo mark:** Bold "S" in white on a `#5B47E0` rounded square (9px radius)
- **Wordmark:** "sevende" in Plus Jakarta Sans 700, `#2A2A40`
- **Tagline:** "Feito para vender. Desenhado para encantar."
- **Language:** Brazilian Portuguese throughout the UI

---

## 2. Color tokens

```css
:root {
  /* Primary — Purple */
  --color-primary:        #5B47E0;
  --color-primary-mid:    #8B7FF0;
  --color-primary-dark:   #3D2EB8;
  --color-primary-light:  #EEF0FD;

  /* Semantic */
  --color-success:        #00C9A7;
  --color-success-light:  #E0FAF5;
  --color-warning:        #FFAA00;
  --color-warning-light:  #FFF8E6;
  --color-danger:         #FF6B6B;
  --color-danger-light:   #FFF0F0;
  --color-info:           #4A9EFF;
  --color-info-light:     #EAF4FF;

  /* Neutrals */
  --color-gray-50:        #F8F8FA;
  --color-gray-100:       #EFEFEF;
  --color-gray-200:       #E0E0E8;
  --color-gray-400:       #9898A8;
  --color-gray-600:       #5A5A70;
  --color-gray-800:       #2A2A40;

  /* Surfaces */
  --color-bg-page:        #F8F8FA;
  --color-bg-card:        #FFFFFF;
  --color-bg-sidebar:     #FFFFFF;

  /* Borders */
  --color-border-default: #E0E0E8;  /* 0.5px */
  --color-border-focus:   #5B47E0;
  --color-border-error:   #FF6B6B;
  --color-border-success: #00C9A7;
}
```

### Usage rules
| Context | Color |
|---|---|
| Primary actions (buttons, links, active nav) | `--color-primary` |
| Hover on primary | `--color-primary-dark` |
| Selected / highlighted backgrounds | `--color-primary-light` |
| Success states, "Ganho" stage | `--color-success` |
| Warning states, "Negociação" stage | `--color-warning` |
| Danger / destructive / "Perdido" | `--color-danger` |
| Informational / "Qualificado" stage | `--color-info` |
| Page background | `--color-gray-50` |
| Card background | `#FFFFFF` |
| Primary text | `--color-gray-800` |
| Secondary / muted text | `--color-gray-400` |
| Labels, captions | `--color-gray-600` |

### Pipeline stage colors
| Stage | Dot / accent | Light bg | Text |
|---|---|---|---|
| Prospecção | `#5B47E0` | `#EEF0FD` | `#3D2EB8` |
| Qualificado | `#4A9EFF` | `#EAF4FF` | `#1A5FAD` |
| Proposta | `#FFAA00` | `#FFF8E6` | `#9A6600` |
| Negociação | `#FF6B6B` | `#FFF0F0` | `#C44040` |
| Ganho | `#00C9A7` | `#E0FAF5` | `#007A61` |
| Perdido | `#9898A8` | `#EFEFEF` | `#5A5A70` |

---

## 3. Typography

```css
/* Import in <head> or global CSS */
@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&family=Fraunces:ital,wght@0,700;1,400&display=swap');

:root {
  --font-display: 'Fraunces', Georgia, serif;  /* headlines, marketing copy */
  --font-ui:      'Plus Jakarta Sans', system-ui, sans-serif; /* all UI */
  --font-mono:    'JetBrains Mono', 'Fira Code', monospace;   /* IDs, code */
}
```

### Scale
| Token | Size | Weight | Use |
|---|---|---|---|
| `--text-display` | 32px / lh 1.15 | 700 | Page heroes, empty states |
| `--text-h1` | 20px / lh 1.2 | 700 | Page titles |
| `--text-h2` | 16px / lh 1.3 | 700 | Card titles, section headers |
| `--text-h3` | 14px / lh 1.4 | 700 | Sub-section labels |
| `--text-body` | 13px / lh 1.6 | 400 | Body copy, table cells |
| `--text-label` | 11px / lh 1.4 | 700 | Form labels, column headers |
| `--text-caption` | 11px / lh 1.4 | 600 | Timestamps, hints, metadata |
| `--text-micro` | 10px / lh 1.4 | 700 | Badges, pills, dots |

### Rules
- Always sentence case. Never Title Case or ALL CAPS in UI (only in `--text-label` with `letter-spacing: 0.06em`)
- Metric values: `font-size: 22–28px; font-weight: 700; letter-spacing: -0.03em`
- Never use `font-weight` below 400 or above 700

---

## 4. Spacing

Base unit: **4px**. All spacing is a multiple of 4.

```
4px   — xs  (icon gaps, tight inline)
8px   — sm  (component internal padding)
12px  — md  (between related elements)
16px  — lg  (card padding, section gaps)
20px  — xl  (content area padding)
24px  — 2xl (between cards)
32px  — 3xl (between sections)
48px  — 4xl (major section breaks)
```

---

## 5. Border radius

```css
:root {
  --radius-xs:   4px;   /* tags, small chips */
  --radius-sm:   8px;   /* inputs, buttons, small cards */
  --radius-md:   12px;  /* cards, modals */
  --radius-lg:   16px;  /* main cards, panels */
  --radius-xl:   24px;  /* hero cards, feature blocks */
  --radius-full: 9999px; /* pills, avatars, toggles */
}
```

---

## 6. Shadows

Keep shadows subtle. The design system is flat — shadows only for interactive feedback.

```css
/* No decorative shadows. Use borders instead. */
--shadow-focus:  0 0 0 3px rgba(91, 71, 224, 0.12); /* focus ring on inputs */
--shadow-focus-error: 0 0 0 3px rgba(255, 107, 107, 0.12);
```

---

## 7. Borders

```css
--border-default:  0.5px solid #E0E0E8;  /* all cards, dividers */
--border-emphasis: 1px solid #E0E0E8;    /* inputs, ghost buttons */
--border-strong:   2px solid #5B47E0;    /* featured/selected cards only */
--border-focus:    1px solid #5B47E0;
--border-error:    1px solid #FF6B6B;
--border-success:  1px solid #00C9A7;
```

---

## 8. Icons

Use **Tabler Icons** (outline variant only).

```bash
npm install @tabler/icons-react
# or CDN: https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@latest/tabler-icons.min.css
```

```jsx
import { IconUsers, IconBriefcase } from '@tabler/icons-react';
<IconUsers size={16} stroke={1.5} />
```

### Size rules
| Context | Size | Stroke |
|---|---|---|
| Inline in text / labels | 14–16px | 1.5 |
| Button icons | 16px | 1.5 |
| Navigation items | 17px | 1.5 |
| Metric card icons | 18px | 1.5 |
| Decorative / empty states | 24px | 1.25 |

### Key icons used in this product
```
Dashboard      → IconLayoutDashboard
Contacts       → IconUsers
Deals          → IconBriefcase
Pipeline       → IconTimeline
Activities     → IconCalendar
Reports        → IconChartBar
Email          → IconMail
Goals          → IconStar
Settings       → IconSettings
Notifications  → IconBell
Search         → IconSearch
Add            → IconPlus
Edit           → IconEdit
Delete         → IconTrash
Phone          → IconPhone
Company        → IconBuilding
Location       → IconMapPin
LinkedIn       → IconBrandLinkedin
Tag            → IconTag
Filter         → IconAdjustmentsHorizontal
Export         → IconDownload
Drag handle    → IconGripVertical
Won (check)    → IconCircleCheck
Lost (x)       → IconCircleX
Trending up    → IconTrendingUp
Trending down  → IconTrendingDown
Clock/Days     → IconClock
Money          → IconCurrencyDollar
Pie chart      → IconChartPie
```

---

## 9. Components

### 9.1 Layout shell

```
┌─────────────────────────────────────────────┐
│  Sidebar (200px fixed)  │  Main area (flex) │
│                         │  ┌─ Topbar ──────┐│
│  Logo                   │  │ Title + CTAs  ││
│  Nav items              │  └───────────────┘│
│                         │  ┌─ Content ─────┐│
│  (bottom)               │  │ Page content  ││
│  User avatar            │  └───────────────┘│
└─────────────────────────────────────────────┘
```

**Sidebar**
- Width: `200px`, fixed
- Background: `#FFFFFF`
- Right border: `0.5px solid #E0E0E8`
- Padding: `18px 10px`
- Nav item height: `36px`, `border-radius: 8px`
- Active state: `background: #EEF0FD; color: #5B47E0; font-weight: 600`
- Section labels: `10px, font-weight 700, letter-spacing 0.1em, color #9898A8, uppercase`
- Notification badges: `background: #FF6B6B; color: #fff; border-radius: 9999px; font-size: 10px; padding: 1px 6px`

**Topbar**
- Height: `58px`
- Background: `#FFFFFF`
- Bottom border: `0.5px solid #E0E0E8`
- Padding: `0 24px`
- Left: page title (`20px 700`) + subtitle (`11px, color #9898A8`)
- Right: action buttons

**Content area**
- Background: `#F8F8FA`
- Padding: `20–24px`

---

### 9.2 Buttons

```css
/* Base */
.btn {
  font-family: var(--font-ui);
  font-size: 12px;
  font-weight: 600;
  height: 34px;
  padding: 0 14px;
  border-radius: 8px;
  border: none;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  transition: background 0.15s, opacity 0.15s;
}
```

| Variant | bg | color | border |
|---|---|---|---|
| Primary | `#5B47E0` | `#fff` | none |
| Primary hover | `#3D2EB8` | `#fff` | none |
| Secondary | `#EEF0FD` | `#5B47E0` | none |
| Ghost | transparent | `#5A5A70` | `1px solid #E0E0E8` |
| Ghost hover | `#F8F8FA` | `#5A5A70` | same |
| Danger | `#FFF0F0` | `#C44040` | none |
| Success | `#E0FAF5` | `#007A61` | none |

**Sizes**
| Size | Height | Padding | Font | Radius |
|---|---|---|---|---|
| sm | 28px | 0 10px | 11px | 6px |
| md (default) | 34px | 0 14px | 12px | 8px |
| lg | 44px | 0 22px | 14px | 12px |

---

### 9.3 Form inputs

```css
.input {
  font-family: var(--font-ui);
  font-size: 13px;
  color: #2A2A40;
  background: #FFFFFF;
  border: 1px solid #E0E0E8;
  border-radius: 8px;
  padding: 0 12px;
  height: 38px;
  width: 100%;
  outline: none;
  transition: border-color 0.15s, box-shadow 0.15s;
}
.input:focus {
  border-color: #5B47E0;
  box-shadow: 0 0 0 3px rgba(91, 71, 224, 0.1);
}
.input.error {
  border-color: #FF6B6B;
  box-shadow: 0 0 0 3px rgba(255, 107, 107, 0.1);
}
.input.success { border-color: #00C9A7; }
```

- **Label:** `11px, font-weight 700, color #5A5A70, margin-bottom 5px`
- **Required asterisk:** `color: #FF6B6B`
- **Error message:** `11px, font-weight 600, color #C44040` with `IconAlertCircle` at 12px
- **Hint/helper:** `11px, color #9898A8, margin-top 3px`
- **Icon prefix:** wrap input in relative container; icon at `left: 11px`, `color: #9898A8`; add `padding-left: 36px` to input
- **Textarea:** same styles, `height: 80px`, `padding: 10px 12px`, `resize: none`, `line-height: 1.5`
- **Select:** add `appearance: none` + custom chevron SVG as `background-image`

---

### 9.4 Cards

**Base card**
```css
.card {
  background: #FFFFFF;
  border: 0.5px solid #E0E0E8;
  border-radius: 16px;
  padding: 20px 22px;
}
```

**Metric card** (KPI)
```css
.metric-card {
  /* same as .card */
  border-top: 3px solid <stage-or-semantic-color>;
  /* No border-radius on top edge when using border-top accent:
     keep border-radius on all corners, the top border sits inside */
}
```
Structure: icon block (36×36, colored bg + icon) → label (11px uppercase) → value (22px 700) → delta (11px with trending icon)

**Deal card** (Kanban)
```css
.deal-card {
  background: #FFFFFF;
  border: 0.5px solid #E0E0E8;
  border-radius: 12px;
  padding: 12px;
  cursor: grab;
  transition: border-color 0.15s;
}
.deal-card:hover { border-color: #8B7FF0; }
.deal-card.dragging { opacity: 0.45; transform: scale(0.97); }
```

---

### 9.5 Badges / pills

```css
.badge {
  font-size: 10px;
  font-weight: 700;
  padding: 2px 8px;
  border-radius: 9999px;
  display: inline-flex;
  align-items: center;
  gap: 4px;
}
```

| Variant | bg | text color |
|---|---|---|
| Purple (Prospecção/Proposta) | `#EEF0FD` | `#3D2EB8` |
| Blue (Qualificado/Info) | `#EAF4FF` | `#1A5FAD` |
| Amber (Negociação/Warning) | `#FFF8E6` | `#9A6600` |
| Teal (Ganho/Success) | `#E0FAF5` | `#007A61` |
| Coral (Perdido/Danger) | `#FFF0F0` | `#C44040` |
| Gray (Archived/Neutral) | `#EFEFEF` | `#5A5A70` |

Square variant (pipeline tags): `border-radius: 6px; padding: 3px 9px`

---

### 9.6 Avatars

```css
.avatar {
  width: 32px; height: 32px;
  border-radius: 50%;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  font-weight: 700;
  flex-shrink: 0;
}
```

Sizes: `sm` 24px/9px font, `md` 32px/11px font, `lg` 52px/18px font, `xl` 64px/22px font

Color pairings (rotate through):
- Purple: `bg #EEF0FD, color #3D2EB8`
- Teal: `bg #E0FAF5, color #007A61`
- Coral: `bg #FFF0F0, color #C44040`
- Blue: `bg #EAF4FF, color #1A5FAD`
- Amber: `bg #FFF8E6, color #9A6600`

---

### 9.7 Progress bars

```css
.progress-track {
  height: 6px;
  background: #EFEFEF;
  border-radius: 9999px;
  overflow: hidden;
}
.progress-fill {
  height: 100%;
  border-radius: 9999px;
  transition: width 0.3s ease;
}
```

Use pipeline stage colors for fills. Show label + count above, value below.

---

### 9.8 Toggles

```css
/* Track: width 38px, height 22px, border-radius 9999px */
/* Off: background #E0E0E8 */
/* On: background #5B47E0 */
/* Thumb: width 16px, height 16px, white, border-radius 50%, top 3px, left 3px */
/* Transition: transform 0.2s (translateX 16px when on) */
```

---

### 9.9 Toast notifications

```css
.toast {
  display: flex;
  align-items: center;
  gap: 10px;
  background: #FFFFFF;
  border: 0.5px solid #E0E0E8;
  border-radius: 12px;
  padding: 10px 14px;
  font-size: 12px;
  font-weight: 600;
  color: #2A2A40;
  min-width: 220px;
}
```

Left border accent (3px): success `#00C9A7`, warning `#FFAA00`, danger `#FF6B6B`, info `#4A9EFF`

Position: `position: fixed; bottom: 20px; right: 20px; z-index: 9999`
Animation: fade in + `translateY(8px → 0)` over 300ms. Auto-dismiss after 3s.

---

### 9.10 Data tables

```css
.table { width: 100%; border-collapse: collapse; font-size: 12px; table-layout: fixed; }
.table th {
  text-align: left;
  font-size: 10px; font-weight: 700;
  color: #9898A8;
  text-transform: uppercase; letter-spacing: 0.06em;
  padding: 9px 14px;
  border-bottom: 1px solid #EFEFEF;
}
.table td {
  padding: 10px 14px;
  border-bottom: 0.5px solid #EFEFEF;
  color: #2A2A40;
  vertical-align: middle;
}
.table tr:last-child td { border-bottom: none; }
.table tr:hover td { background: #F8F8FA; }
```

---

## 10. Kanban board

**Board layout**
- Display: `flex; gap: 14px; padding: 18px 20px; overflow-x: auto; align-items: flex-start`
- Column width: `220px` fixed

**Column anatomy**
1. Header row: colored dot (9px circle) + title + count badge + total value below
2. Card list: `display: flex; flex-direction: column; gap: 8px; min-height: 80px`
3. Drop zone highlight: `background: rgba(91,71,224,0.07); outline: 2px dashed rgba(91,71,224,0.25)`
4. Add button at bottom: dashed border, hover turns purple

**Drag and drop** (use `@dnd-kit/core` in React)
```bash
npm install @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities
```
- `DndContext` wraps the board
- Each column is a `SortableContext` (strategy: `verticalListSortingStrategy`)
- `useDraggable` on each card, `useDroppable` on each column
- Show a placeholder `div` at drop position during drag
- On `onDragEnd`: move card to new column, show toast confirmation

**Deal card fields** (in order)
1. Contact name (`12px 700`) + Company (`11px, color #9898A8`)
2. Deal value (`15px 700, letter-spacing -0.02em`)
3. Tags row (badge pills)
4. Divider
5. Owner avatar + name / Days in stage + Win probability %

Win probability color: `≥70% → #007A61 (green)`, `40–69% → #9A6600 (amber)`, `<40% → #9898A8 (gray)`
Days overdue (>10): color `#C44040`

---

## 11. Contact form

**Sections** (in order)
1. Informações pessoais — avatar preview, nome, sobrenome*, e-mail*, telefone, cargo, LinkedIn
2. Empresa — nome empresa*, segmento (select), CNPJ (formatted), porte (select), site
3. Localização — cidade, estado (UF select)
4. Classificação — etapa pipeline (select), responsável (select), tags (multi-select chips), lead score (range slider 0–100), observações (textarea)
5. Preferências de comunicação — 4 toggles

**Live preview sidebar** (220px, sticky)
- Contact card showing initials avatar, full name, role·company, email, phone, company, city
- Lead score card with colored dot indicators
- Recent activities placeholder list

**Validation**
- Required fields: sobrenome, e-mail
- Email regex: `/^[^\s@]+@[^\s@]+\.[^\s@]+$/`
- Phone auto-format: `(XX) XXXXX-XXXX`
- CNPJ auto-format: `XX.XXX.XXX/XXXX-XX`
- Show error on submit attempt; clear on correction

**Lead score visual**
- 10-segment bar; filled color: `≥70 → #00C9A7`, `40–69 → #FFAA00`, `<40 → #FF6B6B`
- Hint text updates live with score range

**Footer**
- Left: LGPD badge (`IconShieldCheck` in teal + "Dados protegidos · LGPD")
- Right: Cancelar (ghost) + Limpar (danger) + Salvar contato (primary)

---

## 12. Data model (TypeScript types)

```typescript
type PipelineStage = 'prosp' | 'qual' | 'prop' | 'neg' | 'won' | 'lost';
type ContactTag = 'hot' | 'cold' | 'enterprise' | 'smb' | 'upsell' | 'inbound' | 'referral';
type CompanySize = 'mei' | 'pequena' | 'media' | 'grande' | 'enterprise';
type Segment = 'tecnologia' | 'varejo' | 'industria' | 'servicos' | 'saude' | 'financeiro' | 'educacao' | 'outro';

interface Contact {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  role?: string;
  linkedin?: string;
  company?: string;
  segment?: Segment;
  cnpj?: string;
  companySize?: CompanySize;
  website?: string;
  city?: string;
  state?: string; // Brazilian UF
  stage: PipelineStage;
  ownerId: string;
  tags: ContactTag[];
  leadScore: number; // 0–100
  notes?: string;
  prefs: {
    emailMarketing: boolean;
    whatsapp: boolean;
    phone: boolean;
    reports: boolean;
  };
  createdAt: Date;
  updatedAt: Date;
}

interface Deal {
  id: string;
  contactId: string;
  contactName: string;
  company: string;
  value: number; // in BRL cents
  stage: PipelineStage;
  probability: number; // 0–100
  ownerId: string;
  tags: ContactTag[];
  daysInStage: number;
  createdAt: Date;
  updatedAt: Date;
}

interface User {
  id: string;
  name: string;
  initials: string; // 2 chars
  role: 'admin' | 'sales' | 'viewer';
  avatarColor: 'purple' | 'teal' | 'coral' | 'blue' | 'amber';
}

interface DashboardMetrics {
  mrr: number;
  activeDeals: number;
  conversionRate: number; // 0–100
  avgCycleDays: number;
  mrrDelta: number; // percentage change
  dealsDelta: number; // count change
  conversionDelta: number;
  cycleDelta: number; // days faster (positive = improvement)
}
```

---

## 13. Page inventory

| Page | Route | Status |
|---|---|---|
| Dashboard | `/` | Designed ✓ |
| Pipeline (Kanban) | `/pipeline` | Designed ✓ |
| Novo contato | `/contacts/new` | Designed ✓ |
| Lista de contatos | `/contacts` | To build |
| Detalhe do contato | `/contacts/:id` | To build |
| Lista de negócios | `/deals` | To build |
| Detalhe do negócio | `/deals/:id` | To build |
| Relatórios | `/reports` | To build |
| Configurações | `/settings` | To build |

---

## 14. Formatting conventions

- **Currency:** `Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })` — e.g. `R$\u00a084.500`
- **Short currency:** `R$84k`, `R$1,2M` (use `k` for thousands, `M` for millions in compact displays)
- **Phone:** `(11) 99999-0000`
- **CNPJ:** `00.000.000/0001-00`
- **Date:** `dd/mm/yyyy` or `17 mai. 2026` for relative display
- **Relative time:** `agora`, `há 5min`, `ontem`, `há 3 dias`
- **Percentages:** always `Math.round()` before display — never show floating point

---

## 15. Animation & motion

- **Transitions:** `150ms ease` for color/border changes, `200ms ease` for transforms
- **Card hover:** `border-color` change only — no lift/shadow
- **Button active:** `transform: scale(0.97)`
- **Toggle:** `200ms` track background + thumb translation
- **Toast:** `300ms` fade + `translateY(8px → 0)` on enter, reverse on exit
- **Drag ghost:** `opacity: 0.45; transform: scale(0.97)`
- **Drop zone:** instant `background` + `outline` on `dragover`
- **No page transitions** by default — keep it fast

---

## 16. Accessibility

- All icon-only buttons need `aria-label`
- Decorative icons: `aria-hidden="true"`
- Form fields: always associate `<label>` via `htmlFor` / `id`
- Error messages: `role="alert"` or `aria-live="polite"`
- Focus ring: `box-shadow: 0 0 0 3px rgba(91,71,224,0.12)` — never `outline: none` without replacement
- Color is never the sole indicator of state — always pair with text or icon
- Kanban columns: `role="list"`, cards: `role="listitem"`, announce drag events via `aria-live`

---

## 17. Recommended packages

```json
{
  "dependencies": {
    "react": "^18",
    "react-dom": "^18",
    "@tabler/icons-react": "^3",
    "@dnd-kit/core": "^6",
    "@dnd-kit/sortable": "^8",
    "@dnd-kit/utilities": "^3",
    "recharts": "^2"
  },
  "devDependencies": {
    "tailwindcss": "^3",
    "typescript": "^5"
  }
}
```

**Recharts** for dashboard charts (bar chart, donut/pie). Configure with these colors:
- Primary fill: `#5B47E0`
- Goal/secondary fill: `#EEF0FD` with dashed stroke `#8B7FF0`
- Axis text: `#9898A8`, font: `Plus Jakarta Sans`
- No chart borders or outer shadows

---

*End of design system specification.*
