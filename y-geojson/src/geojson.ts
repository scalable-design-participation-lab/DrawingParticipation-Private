import { v4 as uuidv4 } from 'uuid'
import * as Y from 'yjs'
import gjv from 'geojson-validation'

import { type GeoJSON, type Feature, BBox } from 'geojson'

interface OnFeatureChangeData { 
    addedIds: string[]
    deletedIds: string[]
    modifiedIds: string[]
}

interface OnPropertyChangeData {
  [key: string]: {
    addedKeys: string[]
    deletedKeys: string[]
    modifiedKeys: string[]
  }
}

type YFeature = Y.Map<any>
type Result<T = any> = { ok: boolean; result?: T; message?: string }

const ID_PREFIX = 'y-geojson-'

export default function YGeoJSON() {
  const doc = new Y.Doc()
  const clientId = uuidv4()
  const featuresMap = doc.getMap<YFeature>('features')
  const bbox = doc.getMap<BBox>('bbox')
  const undoManager = new Y.UndoManager(featuresMap, { trackedOrigins: new Set([clientId]) })

  /**
   * Operation inside transact will be bundled into one transaction, triggering the event once for all operations.
   */
  const transact = (fn: () => any) => {
   doc.transact(() => {
      fn()
    }, clientId)
  }

  const isIdInUse = (id: any) => {
    return featuresMap.has(`${id}`)
  }

  const generateFormattedFeatureId = () => {
    return `${ID_PREFIX}${uuidv4()}`
  }
  
  const isFeatureIdFormatted = (id: any) => {
    const idStr = `${id || ''}`
    return idStr.startsWith(ID_PREFIX)
  }

  /**
   * Format feature id, it will replace the original id with a new id.
   */
  const formatFeature = (feature: Feature): Feature => {
    const newFeature = JSON.parse(JSON.stringify(feature))

    const newId = generateFormattedFeatureId()
    if (!newFeature.properties) {
      newFeature.properties = {}
    }
    newFeature.properties.originalId = feature.id
    newFeature.id = newId

    return newFeature
  }

  const featureToYFeature = (feature: Feature): YFeature => {
    if (!isFeatureIdFormatted(feature.id)) {
      throw Error(`This feature does not have a valid id: ${feature.id}`)
    }

    // QUESTION: Is formatFeatureId() supposed to handle this and return an object like this featureObject?
    const featureObject = {
      type: 'Feature',
      id: `${feature.id}`,
      geometry: feature.geometry,
      bbox: feature.bbox,
      properties: new Y.Map(Object.entries(feature.properties ?? {}))
    }
    const yFeature = new Y.Map(Object.entries(featureObject)) as YFeature

    return yFeature
  }

  const yFeatureToFeature = (yFeature: YFeature): Feature => {
    // TODO: worth adding type check (e.g. zod) just for this?
    return yFeature.toJSON() as Feature
  }

  /**
   * Replaces each feature with the same id as the pass in features.
   */
  const updateFeatures = (features: Feature[]): Result => {
    try {
      const missingIds = features.filter(feature => !feature.id)
      if (missingIds.length > 0) {
        return {
          ok: false,
          message: 'Some features do not have ID'
        }
      }
      
      const nonExistingIds = features.filter(feature => 
        !isIdInUse(feature.id)
      )
      if (nonExistingIds.length > 0) {
        return {
          ok: false,
          message: `Features with IDs ${nonExistingIds.map(f => f.id).join(', ')} do not exist`
        }
      }

      transact(() => {
        features.forEach((feature) => {
          featuresMap.set(`${feature.id}`, featureToYFeature(feature))
        })
      })

      return { ok: true }
    } catch (error) {
      return {
        ok: false,
        message: error instanceof Error ? error.message : 'Unknown error updating features'
      }
    }
  }

  /**
    * Add features to the yjs map, original id will be replace with a new id
    */
  const addFeatures = (features: Feature[]): Result => {
    try {
      const result: string[] = []
      transact(() => {
        features.forEach((feature) => {
          const formattedFeature = formatFeature(feature)
          featuresMap.set(`${formattedFeature.id}`, featureToYFeature(formattedFeature))
          result.push(`${formattedFeature.id}`)
        })
      })

      return {
        ok: true,
        result
      }
    }
    catch (e) {
      return {
        ok: false,
        message: `Error occurs during addFeatures: ${e}`,
      }
    }
  }

  /**
    * Add feature to the yjs map, original id will be replace with a new id
    */
  const addFeature = (feature: Feature): Result => {
    return addFeatures([feature])
  }

  /**
   * Replaces existing feature with the same id as the pass in feature.
   */
  const updateFeature = (feature: Feature): Result => {
    return updateFeatures([feature])
  }

  /**
   * Deletes existing feature with the same id as the pass in feature.
   */
  const deleteFeature = (feature: Feature): Result => {
    const id = `${feature.id}`
    if (!id) {
      return {
        ok: false,
        message: 'Provided feature does not have an ID'
      }
    }
    
    return deleteFeatureById(id)
  }

  /**
   * Deletes existing feature with the same id as the pass in id.
   */
  const deleteFeatureById = (id: string): Result => {
    try {
      if (!isIdInUse(id)) {
        return {
          ok: false,
          message: `Feature with ID ${id} does not exist`
        }
      }
      
      transact(() => {
        featuresMap.delete(id)
      })
      return { ok: true }
    } catch (error) {
      return {
        ok: false,
        message: error instanceof Error ? error.message : 'Unknown error deleting feature'
      }
    }
  }

  /**
   * Sets a feature's properties by replacing the original object with the new one.
   */
  const setFeatureProperties = (id: string, properties: Record<string, any>): Result => {
    if (!isIdInUse(id)) {
      return {
        ok: false,
        message: `Cannot find feature with ID ${id}`
      }
    }

    try {
      transact(() => {
        const yFeature = featuresMap.get(id)!

        yFeature.get('properties').clear()
        Object.entries(properties).forEach(([key, val]) => {
          yFeature.get('properties').set(key, val)
        })
      })
      
      return { ok: true }
    } catch (error) {
      return {
        ok: false,
        message: error instanceof Error ? error.message : 'Unknown error setting properties'
      }
    }
  }

  /**
   * Updates a feature's properties by merging new values with the existing ones.
   * Only keys in the new properties object will be updated; others stay unchanged.
   */
  const updateFeatureProperties = (id: string, properties: Record<string, any>): Result => {
    if (!isIdInUse(id)) {
      return {
        ok: false,
        message: `Cannot find feature with ID ${id}`
      }
    }

    try {
      transact(() => {
        const yFeature = featuresMap.get(id)!
        Object.entries(properties).forEach(([key, value]) => {
          yFeature.get('properties').set(key, value)

          // TO BE DISCUSSED: should we clear a property if the value is null or undefined?
        })
      })
      
      return { ok: true }
    } catch (error) {
      return {
        ok: false,
        message: error instanceof Error ? error.message : 'Unknown error updating properties'
      }
    }
  }

  /**
   * Retrieves feature with the same id as passed-in id.
   */
  const getFeatureById = (id: string) => {
    if (!isIdInUse(id)) {
      return undefined
    }

    try {
      return JSON.parse(JSON.stringify(yFeatureToFeature(featuresMap.get(id)!)))
    } catch (error) {
      console.error(`Error retrieving feature with ID ${id}:`, error)
      return undefined
    }
  }

  /**
    * Loads FeatureCollection or Feature into Yjs document, does not check for duplicate ids in the object.
    */
  const loadGeojson = (obj: string | GeoJSON, mode: 'override' | 'skip' | 'drop' | 'replace'): Result => {
    try {
      const json: GeoJSON = typeof obj === 'string' ? JSON.parse(obj) : obj
      if (!gjv.valid(json)) {
        return {
          ok: false,
          message: 'Geojson object is not valid'
        }
      }

      const duplicateFeatures: Feature[] = []
      const newFeatures: Feature[] = []
      let globalBBox: BBox

      switch (json.type) {
        case 'FeatureCollection':
          if (json.bbox) {
            globalBBox = json.bbox
          }
          json.features.forEach((feature) => {
            if (isIdInUse(feature.id)) {
              duplicateFeatures.push(feature)
            }
            else {
              newFeatures.push(feature)
            }
          })
          break
        case 'Feature':
          if (isIdInUse(json.id)) {
            duplicateFeatures.push(json)
          }
          else {
            newFeatures.push(json)
          }
          break
        default:
          console.warn('Only FeatureCollection and Feature can be loaded')
          break
      }

      if (duplicateFeatures.length !== 0 && mode === 'drop') {
        return {
          ok: false,
          message: `Operation dropped, duplicate ids: ${duplicateFeatures.map(feature => feature.id).join(', ')}`
        }
      }

      let newIds: string[] = []

      transact(() => {
        if (mode === 'replace') {
          featuresMap.clear()
          addFeatures(duplicateFeatures)
        }

        if (mode === 'override') {
          updateFeatures(duplicateFeatures)
        }

        const result = addFeatures(newFeatures)
        if (result.ok) {
          newIds = result.result
        }

        if (globalBBox) {
          setBBox(globalBBox)
        }
      })

      return {
        ok: true,
        result: {
          duplicateIds: duplicateFeatures.map((feature) => `${feature.id}`),
          newIds
        }
      }
    }
    catch (e) {
      return {
        ok: false,
        message: `Failed to parse geojson object string: ${e}`
      }
    }
  }

  doc.getMap('features').observe((evt, transact) => {
    type ActionType = 'add' | 'update' | 'delete'
    
    const changes: Partial<Record<ActionType, string[]>> = {}
    
    evt.changes.keys.forEach((change, key) => {
      const action = change.action
      changes[action] ??= []
      changes[action].push(key)
    })

    const featureChange = new CustomEvent('y-geojson:onFeatureChange', {
      detail: { data: changes }
    })
    dispatchEvent(featureChange)
  })

  doc.getMap('features').observeDeep((evts) => {
    const changes: Record<string, { addedKeys: any[], deletedKeys: any[], modifiedKeys: any[] }> = {}
    evts.forEach((evt) => {
      if (evt.path[1] !== 'properties') {
        return
      }

      const addedKeys: string[] = []
      const deletedKeys: string[] = []
      const modifiedKeys: string[] = []
      evt.changes.keys.forEach((change, key) => {
        switch (change.action) {
          case 'add':
            addedKeys.push(key)
            break
          case 'update':
            modifiedKeys.push(key)
            break
          case 'delete':
            deletedKeys.push(key)
            break
        }
      })
      changes[`${evt.path}`] = { addedKeys, deletedKeys, modifiedKeys }
    })

    if (Object.keys(changes).length > 0) {
      const propertyChange = new CustomEvent<{ data: any }>('y-geojson:onPropertyChange', {
        detail: { data: changes }
      })
      dispatchEvent(propertyChange)
    }
  })

  /**
   * Gets BBox of the feature collection
   */
  const getBBox = () => {
    return bbox.get('FeatureCollection')
  }

  /**
   * Sets BBox for the feature collection
   */
  const setBBox = (bboxValue: BBox) => {
    bbox.set('FeatureCollection', bboxValue)
  }

  const getFeatures = () => {
    const features: Record<string, Feature> = {}
    featuresMap.forEach((feature) => {
      const id = `${feature.get('id')}`
      const featureObj = getFeatureById(id)
      if (featureObj) {
        features[id] = featureObj
      }
    })
    return features
  }

  /**
   * Retrieves current geojson object as plain object
   */
  const exportToJSON = () => {
    return {
      type: "FeatureCollection",
      bbox: bbox.get('FeatureCollection'),
      features: Object.values(featuresMap.toJSON()),
    }
  }

  const methods = {
    // basic CRUD
    updateFeature,
    updateFeatures,
    addFeature,
    addFeatures,
    deleteFeature,
    deleteFeatureById,
    // properties
    setFeatureProperties,
    updateFeatureProperties,
    // getter
    getFeatures,
    getFeatureById,
    // bounding Box
    getBBox,
    setBBox,
    // undoManager
    undo: () => undoManager.undo(),
    redo: () => undoManager.redo(),
    canUndo: () => undoManager.canUndo(),
    canRedo: () => undoManager.canRedo(),
    // utils
    exportToJSON,
    loadGeojson,
    transact,
  }

  const onFeatureChange = (cb: (data: OnFeatureChangeData) => void) => {
    const eventCb = (evt: Event) => {
      cb((<any>evt).detail.data)
    }
    addEventListener('y-geojson:onFeatureChange', eventCb)
    return () => removeEventListener('y-geojson:onFeatureChange', eventCb)
  }

  const onPropertyChange = (cb: (data: OnPropertyChangeData) => void) => {
    const eventCb = (evt: Event) => {
      cb((<any>evt).detail.data)
    }
    addEventListener('y-geojson:onPropertyChange', eventCb)
    return () => removeEventListener('y-geojson:onPropertyChange', eventCb)
  }

  const hooks = {
    onFeatureChange,
    onPropertyChange,
  }

  return {
    doc,
    map: featuresMap,
    undoManager,
    ...methods,
    ...hooks,
  }
}
