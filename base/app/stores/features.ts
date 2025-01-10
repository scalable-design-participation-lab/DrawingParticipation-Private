import { defineStore } from 'pinia'
import { reactive, ref } from 'vue'
import type { Feature } from './types/store'

/**
 * Pinia store for managing geospatial features and their associated metadata.
 */
export const useFeatureStore = defineStore('features', () => {
  /**
   * List of geospatial features.
   */
  const features = reactive<Feature[]>([])

  /**
   * A temporary or global comment variable.
   */
  const comment = ref<string>('')

  /**
   * Adds a new feature to the store.
   *
   * @param feature - The feature object to add.
   */
  function addFeature(feature: Omit<Feature, 'id'>): void {
    features.push({
      id: Date.now(),
      ...feature,
    })
  }

  /**
   * Deletes a feature from the store by its ID.
   *
   * @param featureId - The ID of the feature to delete.
   */
  function deleteFeature(featureId: number): void {
    const index = features.findIndex(f => f.id === featureId)
    if (index !== -1) {
      features.splice(index, 1)
    }
  }

  /**
   * Retrieves the comment for a specific feature by its ID.
   *
   * @param pointId - The ID of the feature to retrieve the comment for.
   * @returns The comment for the feature, or an empty string if not found.
   */
  function getComment(pointId: number): string {
    const feature = features.find(f => f.id === pointId)
    return feature?.comment || ''
  }

  /**
   * Adds or updates a comment for a specific feature by its ID.
   *
   * @param pointId - The ID of the feature to update the comment for.
   * @param newComment - The new comment to associate with the feature.
   */
  function addComment(pointId: number, newComment: string): void {
    const feature = features.find(f => f.id === pointId)
    if (feature) {
      feature.comment = newComment
    }
    console.log('Comment added:', newComment)
  }

  /**
   * Updates the images associated with a specific feature by its ID.
   *
   * @param featureId - The ID of the feature to update.
   * @param images - The array of image URLs to associate with the feature.
   */
  function updateFeatureImages(featureId: number, images: string[]): void {
    const feature = features.find(f => f.id === featureId)
    if (feature) {
      feature.images = images
    }
  }

  return {
    comment,
    getComment,
    addComment,
    updateFeatureImages,
    features,
    addFeature,
    deleteFeature,
  }
})
