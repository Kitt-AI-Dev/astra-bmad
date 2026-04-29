export const SIGNS = [
  'aries', 'taurus', 'gemini', 'cancer', 'leo', 'virgo',
  'libra', 'scorpio', 'sagittarius', 'capricorn', 'aquarius', 'pisces',
] as const

export const ROLES = [
  'software-engineer', 'devops', 'qa', 'frontend',
  'product-manager', 'project-manager', 'data-scientist', 'designer',
  'solutions-architect', 'pr-manager', 'hr-manager', 'marketing',
] as const

export const BATCH_STATUSES = ['submitted', 'processing', 'ended', 'failed', 'processed'] as const

export const TEAM_ARCHETYPES: Record<number, string> = {
  1:  'The Crunch Team',
  2:  'The Alignment-Seekers',
  3:  'The Fire-Fighters',
  4:  'The Dreamers',
  5:  'The Nitpickers',
  6:  'The Overloaded',
  7:  'The Collaborators',
  8:  'The Slow Burners',
  9:  'The Grinders',
  10: 'The Pivoteers',
  11: 'The New Joiners',
  12: 'The Survivors',
}

export type Sign = typeof SIGNS[number]
export type Role = typeof ROLES[number]
export type BatchStatus = typeof BATCH_STATUSES[number]
