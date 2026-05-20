/**
 * sevende CRM — TypeScript Types
 * Full data model for all entities in the system.
 */

// ─── ENUMS ────────────────────────────────────────────────

export type PipelineStage = 'prosp' | 'qual' | 'prop' | 'neg' | 'won' | 'lost';

export type ContactTag =
  | 'hot'       // Quente
  | 'cold'      // Frio
  | 'enterprise'
  | 'smb'
  | 'upsell'
  | 'inbound'
  | 'referral'; // Indicação

export type CompanySize = 'mei' | 'pequena' | 'media' | 'grande' | 'enterprise';

export type Segment =
  | 'tecnologia'
  | 'varejo'
  | 'industria'
  | 'servicos'
  | 'saude'
  | 'financeiro'
  | 'educacao'
  | 'outro';

export type BrazilianState =
  | 'AC' | 'AL' | 'AP' | 'AM' | 'BA' | 'CE' | 'DF' | 'ES' | 'GO'
  | 'MA' | 'MT' | 'MS' | 'MG' | 'PA' | 'PB' | 'PR' | 'PE' | 'PI'
  | 'RJ' | 'RN' | 'RS' | 'RO' | 'RR' | 'SC' | 'SP' | 'SE' | 'TO';

export type UserRole = 'admin' | 'sales' | 'viewer';

export type AvatarColor = 'purple' | 'teal' | 'coral' | 'blue' | 'amber';

export type ActivityType =
  | 'call'
  | 'email'
  | 'meeting'
  | 'note'
  | 'deal_created'
  | 'deal_moved'
  | 'deal_won'
  | 'deal_lost'
  | 'contact_created';

// ─── ENTITIES ─────────────────────────────────────────────

export interface User {
  id: string;
  name: string;
  initials: string;         // 2 uppercase chars, e.g. "MR"
  email: string;
  role: UserRole;
  avatarColor: AvatarColor;
  createdAt: Date;
}

export interface ContactPreferences {
  emailMarketing: boolean;
  whatsapp: boolean;
  phone: boolean;
  reports: boolean;
}

export interface Contact {
  id: string;

  // Personal
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;           // formatted: (11) 99999-0000
  role?: string;            // job title
  linkedin?: string;

  // Company
  company?: string;
  segment?: Segment;
  cnpj?: string;            // formatted: 00.000.000/0001-00
  companySize?: CompanySize;
  website?: string;

  // Location
  city?: string;
  state?: BrazilianState;

  // CRM
  stage: PipelineStage;
  ownerId: string;
  tags: ContactTag[];
  leadScore: number;        // 0–100
  notes?: string;
  prefs: ContactPreferences;

  // Computed display
  fullName: string;         // `${firstName} ${lastName}`
  initials: string;         // first 2 chars of name, uppercase
  avatarColor: AvatarColor;

  createdAt: Date;
  updatedAt: Date;
}

export interface Deal {
  id: string;
  contactId: string;
  contactName: string;
  company: string;
  value: number;            // BRL, in reais (not cents)
  stage: PipelineStage;
  probability: number;      // 0–100
  ownerId: string;
  tags: ContactTag[];
  daysInStage: number;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
  closedAt?: Date;
}

export interface Activity {
  id: string;
  type: ActivityType;
  contactId?: string;
  dealId?: string;
  title: string;
  description?: string;
  ownerId: string;
  createdAt: Date;
  scheduledAt?: Date;
}

export interface DashboardMetrics {
  mrr: number;              // BRL
  mrrDelta: number;         // percentage vs prev month
  activeDeals: number;
  dealsDelta: number;       // count vs prev week
  conversionRate: number;   // 0–100
  conversionDelta: number;  // percentage points vs prev month
  avgCycleDays: number;
  cycleDelta: number;       // days difference (positive = faster)
  monthlyGoal: number;      // BRL target
  monthlyRealized: number;  // BRL achieved so far
  daysRemainingInMonth: number;
}

export interface PipelineColumn {
  id: PipelineStage;
  label: string;            // Portuguese label
  color: string;            // hex accent
  lightColor: string;       // hex light bg
  textColor: string;        // hex text on light bg
  deals: Deal[];
}

export interface RevenueDataPoint {
  month: string;            // e.g. "Mai"
  realized: number;         // BRL
  goal: number;             // BRL
}

// ─── FORM STATE ───────────────────────────────────────────

export interface ContactFormValues {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  role: string;
  linkedin: string;
  company: string;
  segment: Segment | '';
  cnpj: string;
  companySize: CompanySize | '';
  website: string;
  city: string;
  state: BrazilianState | '';
  stage: PipelineStage;
  ownerId: string;
  tags: ContactTag[];
  leadScore: number;
  notes: string;
  prefs: ContactPreferences;
}

export interface ContactFormErrors {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  company?: string;
}

// ─── CONSTANTS ────────────────────────────────────────────

export const PIPELINE_STAGES: Record<PipelineStage, {
  label: string;
  color: string;
  lightColor: string;
  textColor: string;
}> = {
  prosp: { label: 'Prospecção', color: '#5B47E0', lightColor: '#EEF0FD', textColor: '#3D2EB8' },
  qual:  { label: 'Qualificado', color: '#4A9EFF', lightColor: '#EAF4FF', textColor: '#1A5FAD' },
  prop:  { label: 'Proposta',    color: '#FFAA00', lightColor: '#FFF8E6', textColor: '#9A6600' },
  neg:   { label: 'Negociação',  color: '#FF6B6B', lightColor: '#FFF0F0', textColor: '#C44040' },
  won:   { label: 'Ganho',       color: '#00C9A7', lightColor: '#E0FAF5', textColor: '#007A61' },
  lost:  { label: 'Perdido',     color: '#9898A8', lightColor: '#EFEFEF', textColor: '#5A5A70' },
};

export const TAG_LABELS: Record<ContactTag, string> = {
  hot:        'Quente',
  cold:       'Frio',
  enterprise: 'Enterprise',
  smb:        'SMB',
  upsell:     'Upsell',
  inbound:    'Inbound',
  referral:   'Indicação',
};

export const SEGMENT_LABELS: Record<Segment, string> = {
  tecnologia: 'Tecnologia',
  varejo:     'Varejo',
  industria:  'Indústria',
  servicos:   'Serviços',
  saude:      'Saúde',
  financeiro: 'Financeiro',
  educacao:   'Educação',
  outro:      'Outro',
};

export const COMPANY_SIZE_LABELS: Record<CompanySize, string> = {
  mei:        'MEI / Micro',
  pequena:    'Pequena',
  media:      'Média',
  grande:     'Grande',
  enterprise: 'Enterprise',
};

export const AVATAR_COLORS: AvatarColor[] = ['purple', 'teal', 'coral', 'blue', 'amber'];

export const AVATAR_COLOR_STYLES: Record<AvatarColor, { bg: string; color: string }> = {
  purple: { bg: '#EEF0FD', color: '#3D2EB8' },
  teal:   { bg: '#E0FAF5', color: '#007A61' },
  coral:  { bg: '#FFF0F0', color: '#C44040' },
  blue:   { bg: '#EAF4FF', color: '#1A5FAD' },
  amber:  { bg: '#FFF8E6', color: '#9A6600' },
};

// ─── HELPERS ──────────────────────────────────────────────

/** Format BRL value for compact display: 84500 → "R$84,5k" */
export function formatCurrencyCompact(value: number): string {
  if (value >= 1_000_000) return `R$${(value / 1_000_000).toFixed(1).replace('.', ',')}M`;
  if (value >= 1_000)     return `R$${Math.round(value / 1_000)}k`;
  return `R$${value.toLocaleString('pt-BR')}`;
}

/** Format BRL value in full: 84500 → "R$ 84.500,00" */
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
}

/** Format phone: "11999990000" → "(11) 99999-0000" */
export function formatPhone(raw: string): string {
  const digits = raw.replace(/\D/g, '').slice(0, 11);
  if (digits.length > 10) return digits.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
  if (digits.length > 6)  return digits.replace(/(\d{2})(\d{4,5})(\d{0,4})/, '($1) $2-$3');
  if (digits.length > 2)  return digits.replace(/(\d{2})(\d+)/, '($1) $2');
  return digits;
}

/** Format CNPJ: "00000000000100" → "00.000.000/0001-00" */
export function formatCNPJ(raw: string): string {
  const digits = raw.replace(/\D/g, '').slice(0, 14);
  if (digits.length > 12) return digits.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d+)/, '$1.$2.$3/$4-$5');
  if (digits.length > 8)  return digits.replace(/(\d{2})(\d{3})(\d{3})(\d+)/, '$1.$2.$3/$4');
  if (digits.length > 5)  return digits.replace(/(\d{2})(\d{3})(\d+)/, '$1.$2.$3');
  if (digits.length > 2)  return digits.replace(/(\d{2})(\d+)/, '$1.$2');
  return digits;
}

/** Get initials from full name: "Luna Ferreira" → "LF" */
export function getInitials(fullName: string): string {
  const parts = fullName.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/** Get lead score color */
export function getScoreColor(score: number): string {
  if (score >= 70) return '#00C9A7';
  if (score >= 40) return '#FFAA00';
  return '#FF6B6B';
}

/** Get lead score label */
export function getScoreLabel(score: number): string {
  if (score >= 70) return 'Alto';
  if (score >= 40) return 'Moderado';
  return 'Baixo';
}

/** Get win probability color */
export function getProbColor(prob: number): string {
  if (prob >= 70) return '#007A61';
  if (prob >= 40) return '#9A6600';
  return '#9898A8';
}

/** Validate email */
export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/** Assign avatar color deterministically from name */
export function assignAvatarColor(name: string): AvatarColor {
  const idx = name.charCodeAt(0) % AVATAR_COLORS.length;
  return AVATAR_COLORS[idx];
}
