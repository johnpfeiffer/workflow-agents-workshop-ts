import { test } from 'node:test'
import assert from 'node:assert/strict'
import { resolveClient, resolveModelSpec } from '@workshop/agent'
import type { CompleteArgs } from '@workshop/agent'

test('resolveModelSpec maps tiers and infers providers', () => {
  assert.equal(resolveModelSpec('medium').provider, 'openai')
  assert.equal(resolveModelSpec('medium').model, 'gpt-4o')
  assert.equal(resolveModelSpec().model, resolveModelSpec('medium').model) // default = medium
  assert.equal(resolveModelSpec('gpt-4o').provider, 'openai')
  assert.equal(resolveModelSpec('claude-sonnet-4-6').provider, 'anthropic')

  // Composite keys resolve to the correct provider and model
  assert.equal(resolveModelSpec('openai:medium').provider, 'openai')
  assert.equal(resolveModelSpec('openai:medium').model, 'gpt-4o')
  assert.equal(resolveModelSpec('openai:small').model, 'gpt-4o-mini')
  assert.equal(resolveModelSpec('openai:large').model, 'gpt-4.1')
  assert.equal(resolveModelSpec('anthropic:medium').provider, 'anthropic')
  assert.equal(resolveModelSpec('anthropic:medium').model, 'claude-sonnet-4-6')

  // Provider passed separately with a bare tier
  assert.equal(resolveModelSpec('medium', 'anthropic').model, 'claude-sonnet-4-6')
  assert.equal(resolveModelSpec('medium', 'openai').model, 'gpt-4o')
})

function args(system: string): CompleteArgs {
  return {
    model: { provider: 'mock', model: 'mock' },
    system,
    tools: [],
    messages: [{ role: 'user', content: [{ type: 'text', text: 'hi' }] }],
    signal: new AbortController().signal,
  }
}

test('mock client returns a JSON verdict for the judge', async () => {
  const client = resolveClient({ provider: 'mock', model: 'mock' })
  const res = await client.complete(args('# Judge\nYou decide.'))
  const text = res.content.map((b) => (b.type === 'text' ? b.text : '')).join('')
  const parsed = JSON.parse(text)
  assert.equal(parsed.verdict, 'approve')
})

test('mock client returns a finding for a reviewer', async () => {
  const client = resolveClient({ provider: 'mock', model: 'mock' })
  const res = await client.complete(args('# Security reviewer'))
  const text = res.content.map((b) => (b.type === 'text' ? b.text : '')).join('')
  assert.match(text, /severity/)
})
