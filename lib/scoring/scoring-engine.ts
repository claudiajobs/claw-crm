import { LeadScoringInput, SCORING_RULES, MAX_SCORE } from './scoring-rules.config'

export interface MatchedRule {
  id: string
  description: string
  points: number
}

export interface ScoringResult {
  score: number
  maxScore: number
  percentage: number
  matchedRules: MatchedRule[]
}

export function computeLeadScore(input: LeadScoringInput): ScoringResult {
  const matchedRules: MatchedRule[] = SCORING_RULES.filter((rule) =>
    rule.condition(input)
  ).map(({ id, description, points }) => ({ id, description, points }))

  const score = matchedRules.reduce((sum, r) => sum + r.points, 0)

  return {
    score,
    maxScore: MAX_SCORE,
    percentage: MAX_SCORE > 0 ? Math.round((score / MAX_SCORE) * 100) : 0,
    matchedRules,
  }
}
