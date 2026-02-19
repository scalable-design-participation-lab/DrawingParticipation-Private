import { z } from 'zod'

export default {
  collections: {
    mappingMNC: {
      type: 'data',
      source: 'content/mappingMNC.csv',
      schema: z.object({
        title: z.string(),
        location: z.string(),
        date: z.string(),
        latitude: z.number(),
        longitude: z.number(),
        shortDescription: z.string(),
        description: z.string(),
        connectionToMobileNetworkedCreativity: z.string(),
        mediaCaptains: z.string(),
        links: z.string()
      })
    }
  }
}