import type { Feature } from '@base/stores/types/store'
/**
 * Represents a structured project data object to be saved in Firestore.
 */
export interface ProjectData {
  userId: string
  name: {
    firstname: string
    lastname: string
  } | null
  timestamp: string
  space: {
    everyday: Feature[]
    everyweek: Feature[]
    sometimes: Feature[]
    once: Feature[]
    never: Feature[]
    recreational: Feature[]
    restricted: Feature[]
    prohibit: Feature[]
  }
  belonging: {
    negative: Feature[]
    love: Feature[]
    positive: Feature[]
  }
  safety: {
    safe: Feature[]
    unsafe: Feature[]
    great: Feature[]
  }
  environment: {
    'pollution': Feature[]
    'flora-fauna': Feature[]
    'trash': Feature[]
  }
}

