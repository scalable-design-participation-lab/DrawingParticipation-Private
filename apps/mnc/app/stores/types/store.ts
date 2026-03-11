import type { Feature } from '@base/stores/types/store'

/**
 * Properties class for storing additional metadata about MNC features
 */
export class Properties {
  location?: string
  date?: string
  shortDesc?: string
  description?: string
  mncConnection?: string
  mediaCaptions?: string[]
  links?: string

  constructor(
    location?: string,
    date?: string,
    shortDesc?: string,
    description?: string,
    mncConnection?: string,
    mediaCaptions?: string[],
    links?: string
  ) {
    this.location = location
    this.date = date
    this.shortDesc = shortDesc
    this.description = description
    this.mncConnection = mncConnection
    this.mediaCaptions = mediaCaptions
    this.links = links
  }
}
