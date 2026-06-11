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
  // Structured citations (label + real URL), sourced from mncLinks.csv so the
  // detail view can render clickable "Learn More" links.
  linkList?: { label: string, url: string }[]
  // All photo paths under /Solution_Photos/<string_id>/ for the gallery carousel.
  photos?: string[]

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
    string_id?: string,
    linkList?: { label: string, url: string }[],
    photos?: string[]
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
    this.linkList = linkList
    this.photos = photos
  }
}
