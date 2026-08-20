/**
 * Reads an entry's text in the current UI language from its stored `i18n` map
 * (written once at entry creation — see functions/), falling back to the
 * original text when the locale or field has no translation.
 */
export function useLocalizedEntry() {
  const { locale } = useI18n()

  function lf(properties: any, field: 'title' | 'shortDesc' | 'description' | 'mncConnection' | 'location', fallback = ''): string {
    return properties?.i18n?.[locale.value]?.[field] || fallback
  }

  return { lf }
}
