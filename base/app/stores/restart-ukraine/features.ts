import { defineStore } from 'pinia';
import { reactive } from 'vue';

export const useFeatureStore = defineStore("features", () => {
  const features = reactive([]);
  const comment = ref('')

  function addFeature(feature) {
    features.push({
      id: Date.now(),
      ...feature,
    });
  }

  function deleteFeature(featureId) {
    const index = features.findIndex(f => f.id === featureId);
    if (index !== -1) {
      features.splice(index, 1);
    }
  }
  function getComment(pointId) {
    const feature = features.find((f) => f.id === pointId)
    return feature?.comment || ''
  }
  function addComment(pointId, newComment) {
    const feature = features.find((f) => f.id === pointId)
    if (feature) {
      feature.comment = newComment
    }
    console.log('Comment added:', newComment)
  }
  function updateFeatureImages(featureId, images) {
    const feature = features.find((f) => f.id === featureId)
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
  };
});