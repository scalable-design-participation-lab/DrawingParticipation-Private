import type { InjectionKey, Ref } from 'vue'

/**
 * Translation as data: `app/i18n/<locale>.json` files (nested objects), a
 * current locale, and `t(key)` with dotted keys. `"$t.some.key"` in a spec
 * resolves through this; apps that ship vue-i18n keep using its `$t` instead.
 */
export type Messages = Record<string, unknown>

export interface SpecI18n {
  locale: Ref<string>
  locales: string[]
  translate: (key: string) => string
}

export const SPEC_I18N: InjectionKey<SpecI18n> = Symbol('spec-i18n')

/** "a.b.c" -> messages.a.b.c when it is a string. */
export function lookup(messages: Messages | undefined, key: string): string | undefined {
  const value = key.split('.').reduce<unknown>((acc, part) => (acc && typeof acc === 'object' ? (acc as Record<string, unknown>)[part] : undefined), messages)
  return typeof value === 'string' ? value : undefined
}

/** Current locale first, then the default locale, then the key itself. */
export function createTranslator(all: Record<string, Messages>, locale: Ref<string>, fallback: string) {
  return (key: string) => lookup(all[locale.value], key) ?? lookup(all[fallback], key) ?? key
}
