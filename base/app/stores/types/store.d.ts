/**
 * Represents the structure of user data.
 */
export interface UserData {
  userId: string
  [key: string]: any // Extendable to include additional user properties
}
/**
 * Represents a geospatial feature with various properties.
 */
export interface Feature {
  id?: number
  type?: DrawType
  coordinates?: [number, number][] | [number, number] | []
  frequency?: FrequencyType
  iconName?: IconType
  comment?: string
  isProhibit?: boolean
  timestamp?: unknown
  lat?: number
  lon?: number
  geometry?: string
  name?: {
    firstname: string
    lastname: string
  } | null
  images?: string[]
}
/**
 * Type Icon name for the sidebar.
 *
 */
export type IconType = 'dislike' | 'heart' | 'smile' | 'broken' | 'calm' | 'lock' | 'pollution' | 'trash' | 'leaf'

/**
 * Type of the frequency for the sidebar.
 */
export type FrequencyType = 'every day' | 'every week' | 'sometimes' | 'only once' | 'never'

/**
 * Defines the type of a drawn feature.
 */
export type DrawType = 'Point' | 'LineString' | 'Polygon'

/**
 * Represent the Map Type
 */
export type MapType = 'vector' | 'satellite'

/**
 * Represent the Icon category
 */
export type Category =
  | 'space.prohibit'
  | 'space.recreational'
  | 'space.restricted'
  | `space.${string}` // for other dynamic space keys
  | `belonging.${string}`
  | `safety.${string}`
  | `environment.${string}`
