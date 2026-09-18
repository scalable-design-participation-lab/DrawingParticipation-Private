import type { z } from 'zod'

/**
 * A component contract is the machine-readable description of one generalized
 * component: what it accepts, what it emits, which slots it has, and whether it
 * still owns hidden state. Contracts are the single source of truth for the
 * verifier, the JSON schema export, and (later) the LLM prompt.
 */
export interface ComponentContract {
  /** Registry name, e.g. "BackgroundMap". */
  name: string
  description: string
  /** Props as a strict zod object: unknown props are a verifier error (unless `looseProps`). */
  props: z.ZodObject<z.ZodRawShape>
  /**
   * Accept props beyond `props` (UI primitives like Button that forward
   * everything to Nuxt UI). The verifier still validates the declared ones.
   */
  looseProps?: boolean
  emits?: string[]
  slots?: string[]
  /**
   * True when the component still reads/writes a pinia store on its own.
   * Such components render from JSON but their behaviour is not fully
   * described by their props (see docs/COMPONENT-INVENTORY.md).
   */
  stateful?: boolean
}
