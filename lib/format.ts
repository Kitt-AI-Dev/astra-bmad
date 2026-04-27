const SIGN_LABELS: Record<string, string> = {
  aries: 'Aries', taurus: 'Taurus', gemini: 'Gemini', cancer: 'Cancer',
  leo: 'Leo', virgo: 'Virgo', libra: 'Libra', scorpio: 'Scorpio',
  sagittarius: 'Sagittarius', capricorn: 'Capricorn', aquarius: 'Aquarius', pisces: 'Pisces',
}

const ROLE_LABELS: Record<string, string> = {
  'software-engineer': 'Software Engineer',
  'devops': 'DevOps',
  'qa': 'QA',
  'frontend': 'Frontend',
  'product-manager': 'Product Manager',
  'project-manager': 'Project Manager',
  'data-scientist': 'Data Scientist',
  'designer': 'Designer',
  'solutions-architect': 'Solutions Architect',
  'pr-manager': 'PR Manager',
  'hr-manager': 'HR Manager',
  'marketing': 'Marketing',
}

export function formatSign(slug: string): string {
  return SIGN_LABELS[slug] ?? slug
}

export function formatRole(slug: string): string {
  return ROLE_LABELS[slug] ?? slug
}
