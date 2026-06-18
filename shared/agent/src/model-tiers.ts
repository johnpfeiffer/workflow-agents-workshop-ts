/**
 * Model tier mapping. One place to update when new models ship.
 *
 *   medium          → defaults to anthropic:medium
 *   openai:medium   → resolves to gpt-4o
 *   gpt-4o          → raw passthrough, provider inferred
 */
import { inferProvider, isTier } from './helpers.js'
import type { ModelSpec } from './types.js'

export type ModelTier = 'small' | 'medium' | 'large'

export type ModelTierKey =
  | ModelTier
  | `anthropic:${ModelTier}`
  | `openai:${ModelTier}`

export const MODEL_TIERS: Record<ModelTierKey, ModelSpec> = {
  // Bare tier names default to OpenAI
  small:              { provider: 'openai', model: 'gpt-4o-mini' },
  medium:             { provider: 'openai', model: 'gpt-4o' },
  large:              { provider: 'openai', model: 'gpt-4.1' },
  // Explicit provider-prefixed keys
  'anthropic:small':  { provider: 'anthropic', model: 'claude-haiku-4-5' },
  'anthropic:medium': { provider: 'anthropic', model: 'claude-sonnet-4-6' },
  'anthropic:large':  { provider: 'anthropic', model: 'claude-opus-4-6' },
  'openai:small':     { provider: 'openai', model: 'gpt-4o-mini' },
  'openai:medium':    { provider: 'openai', model: 'gpt-4o' },
  'openai:large':     { provider: 'openai', model: 'gpt-4.1' },
}

function isTierKey(value: string): value is ModelTierKey {
  return value in MODEL_TIERS
}

export function resolveModelSpec(model?: string, provider?: string): ModelSpec {
  const modelName = model ?? 'medium'

  // If a provider was passed separately with a bare tier, build the composite key
  if (provider && isTier(modelName)) {
    const key = `${provider}:${modelName}`
    if (isTierKey(key)) return { ...MODEL_TIERS[key] }
  }

  // Support composite keys like 'openai:medium' and bare tiers like 'medium'
  if (isTierKey(modelName)) return { ...MODEL_TIERS[modelName] }

  return {
    provider: (provider as ModelSpec['provider']) ?? inferProvider(modelName),
    model: modelName,
  }
}
