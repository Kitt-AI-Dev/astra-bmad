import { test, expect } from '@playwright/test'
import { buildPrompt, buildTeamPrompt } from '../scripts/batch-utils'

// Verifies the prompt templates output the v3.0 field schema (Story 10.1).
// These tests call pure functions — no browser or server required.

test('buildPrompt includes all new v3.0 fields', () => {
  const prompt = buildPrompt('leo', 'frontend', '2026-05-01', 'Q2 crunch')

  // New fields must be present
  expect(prompt).toContain('deploy_luck')
  expect(prompt).toContain('deploy_luck_note')
  expect(prompt).toContain('bug_risk_index')
  expect(prompt).toContain('bug_risk_note')
  expect(prompt).toContain('sprint_energy')
  expect(prompt).toContain('sprint_energy_note')
  expect(prompt).toContain('coffee_requirement')
  expect(prompt).toContain('cursed_commit')
  expect(prompt).toContain('avoid')
  expect(prompt).toContain('general_reading')
})

test('buildPrompt does NOT include legacy v2.x fields', () => {
  const prompt = buildPrompt('scorpio', 'devops', '2026-05-01', 'Q2 crunch')

  expect(prompt).not.toContain('lucky_value')
  expect(prompt).not.toContain('planetary_influence')
})

test('buildTeamPrompt includes JSON format with new fields', () => {
  const prompt = buildTeamPrompt('2026-05-01', 1, 'Q2 crunch')

  // New JSON fields
  expect(prompt).toContain('heading')
  expect(prompt).toContain('body')
  expect(prompt).toContain('deploy_luck')
  expect(prompt).toContain('bug_risk_index')
  expect(prompt).toContain('sprint_energy')
  expect(prompt).toContain('coffee_requirement')
  expect(prompt).toContain('cursed_commit')
  expect(prompt).toContain('avoid')
})

test('buildTeamPrompt does NOT use old markdown format', () => {
  const prompt = buildTeamPrompt('2026-05-01', 2, 'Q2 crunch')

  // Old markdown markers must be gone
  expect(prompt).not.toContain('**QA will**')
  expect(prompt).not.toContain('**PM will**')
  expect(prompt).not.toContain('**Dev will**')
  expect(prompt).not.toContain('**Designer will**')
  expect(prompt).not.toContain('**Lucky move:**')
  expect(prompt).not.toContain('**Avoid:**')
  // No longer starts with markdown ## heading instruction
  expect(prompt).not.toMatch(/^## /)
})

test('buildTeamPrompt body guidance mentions role weaving', () => {
  const prompt = buildTeamPrompt('2026-05-01', 3, 'Q2 crunch')

  // roles are woven into body prose — prompt must mention role vocabulary
  expect(prompt).toContain('QA')
  expect(prompt).toContain('PM')
  expect(prompt).toContain('Dev')
  expect(prompt).toContain('Designer')
  // must NOT have a separate role_predictions field
  expect(prompt).not.toContain('role_predictions')
})
