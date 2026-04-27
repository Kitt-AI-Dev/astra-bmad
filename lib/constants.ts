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

export type Sign = typeof SIGNS[number]
export type Role = typeof ROLES[number]
export type BatchStatus = typeof BATCH_STATUSES[number]
