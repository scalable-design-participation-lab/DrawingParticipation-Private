import type { Feature } from '@base/stores/types/store'
import type { string } from 'yup'

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
  primaryTag?: string
  secondaryTags?: string[]
  string_id?: string

  constructor(
    location?: string,
    date?: string,
    shortDesc?: string,
    description?: string,
    mncConnection?: string,
    mediaCaptions?: string[],
    links?: string,
    primaryTag?: string,
    secondaryTags?: string[],
    string_id?: string
  ) {
    this.location = location
    this.date = date
    this.shortDesc = shortDesc
    this.description = description
    this.mncConnection = mncConnection
    this.mediaCaptions = mediaCaptions
    this.links = links
    this.primaryTag = primaryTag
    this.secondaryTags = secondaryTags
    this.string_id = string_id
  }
}
