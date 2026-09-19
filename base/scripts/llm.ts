/**
 * The one place that talks to a model. Every caller asks for a zod-typed
 * answer and gets it parsed, or an error; nothing else in the repo knows
 * which provider ran.
 *
 *   anthropic  Messages API with structured outputs (the zod schema becomes
 *              the output format, so the reply always parses).
 *   stub       answers read from files on disk in call order, for tests and
 *              for running the loops without a key.
 *
 * ANTHROPIC_API_KEY is read from the environment, or from a `.env` next to
 * the repo root / base when it is not set.
 */
import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import process from 'node:process'
import Anthropic from '@anthropic-ai/sdk'
import { zodOutputFormat } from '@anthropic-ai/sdk/helpers/zod'
import type { z } from 'zod'

export type Content = string | Anthropic.ContentBlockParam[]

/** Ask for an answer shaped like `schema`. `label` names the call in errors and logs. */
export type Ask = <T extends z.ZodType>(schema: T, system: string, content: Content, label: string) => Promise<z.infer<T>>

export function loadEnv() {
  const repoRoot = resolve(import.meta.dirname, '../..')
  for (const file of [resolve(repoRoot, '.env'), resolve(repoRoot, 'base/.env')]) {
    if (!process.env.ANTHROPIC_API_KEY && existsSync(file)) {
      process.loadEnvFile(file)
    }
  }
}

export function stubProvider(files: string[], resolveFile: (p: string) => string): Ask {
  let call = 0
  return async (schema, _system, _content, label) => {
    const file = files[call++]
    if (!file) {
      throw new Error(`stub: no file for call ${call} (${label}); pass --stub a.json,b.json,… in call order`)
    }
    return schema.parse(JSON.parse(readFileSync(resolveFile(file), 'utf8')))
  }
}

export function anthropicProvider(options: { model?: string, effort?: 'low' | 'medium' | 'high' | 'xhigh' | 'max' } = {}): Ask {
  loadEnv()
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error('ANTHROPIC_API_KEY is not set (export it, or put it in .env at the repo root)')
  }
  const client = new Anthropic()
  const model = options.model ?? 'claude-opus-5'
  return async (schema, system, content, label) => {
    const message = await client.messages.parse({
      model,
      max_tokens: 16000,
      system,
      messages: [{ role: 'user', content }],
      output_config: { format: zodOutputFormat(schema), ...(options.effort && { effort: options.effort }) },
    })
    if (message.stop_reason === 'refusal') {
      throw new Error(`${label}: the model refused (${message.stop_details?.explanation ?? 'no explanation'})`)
    }
    if (message.stop_reason === 'max_tokens') {
      throw new Error(`${label}: answer truncated at max_tokens`)
    }
    if (message.parsed_output == null) {
      throw new Error(`${label}: answer did not match the schema`)
    }
    console.error(`${label}: ${message.usage.input_tokens} in / ${message.usage.output_tokens} out (${model})`)
    return message.parsed_output as z.infer<typeof schema>
  }
}

/** `--provider stub|anthropic` (+ `--stub`, `--model`, `--effort`) from argv. */
export function providerFromArgs(flag: (name: string) => string | undefined, resolveFile: (p: string) => string): Ask {
  const name = flag('provider') ?? 'stub'
  if (name === 'stub') {
    return stubProvider((flag('stub') ?? '').split(',').filter(Boolean), resolveFile)
  }
  if (name === 'anthropic') {
    return anthropicProvider({ model: flag('model'), effort: flag('effort') as 'low' | undefined })
  }
  throw new Error(`unknown provider "${name}"; use stub | anthropic`)
}
