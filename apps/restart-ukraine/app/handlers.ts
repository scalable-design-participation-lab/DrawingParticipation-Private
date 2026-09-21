import { getAuth, signInAnonymously } from 'firebase/auth'
import { addDoc, collection, getDocs, getFirestore, query, where } from 'firebase/firestore'
import { registerHandler } from '../../../base/app/utils/handlers'
import { verifyRows } from '../../../base/app/verifier'
import { UserSchema } from './contracts'

/**
 * Side effects a spec may `call`. The pages are JSON; everything that talks
 * to Firebase lives here. Handlers that load something write it into page
 * state (the key is named in their description).
 */

interface Point { lat: number, lon: number, timestamp: string, comment: string }
interface Shape { geometry: string, timestamp: string, comment: string }
interface MapFeature {
  id?: unknown
  type: 'Point' | 'LineString' | 'Polygon'
  coordinates: unknown
  iconName?: string
  frequency?: string
  isProhibit?: boolean
  comment?: string
  timestamp?: string
}

// Firestore document layout of one participant's answers (the "project").
const FREQUENCY: Record<string, string> = { 'every day': 'everyday', 'every week': 'everyweek', 'sometimes': 'sometimes', 'only once': 'once', 'never': 'never' }
const BELONGING: Record<string, string> = { dislike: 'negative', heart: 'love', smile: 'positive' }
const SAFETY: Record<string, string> = { broken: 'unsafe', calm: 'safe', lock: 'great' }
const ENVIRONMENT: Record<string, string> = { pollution: 'pollution', trash: 'trash', leaf: 'flora-fauna' }

export function registerHandlers() {
  // Anonymous Firebase sign-in; a returning participant is recognised by uid.
  registerHandler('checkUser', async (_payload, ctx) => {
    const { user } = await signInAnonymously(getAuth())
    const snapshot = await getDocs(query(collection(getFirestore(), 'users'), where('uid', '==', user.uid)))
    if (!snapshot.empty) {
      ctx.state.user = snapshot.docs[0].data()
      ctx.state.returning = true
    }
  }, 'Sign in anonymously and load the participant into state.user when they registered before (state.returning = true).')

  registerHandler('register', async (payload, ctx) => {
    // Untouched inputs are undefined; the schema's own messages want strings.
    const form = { lastname: '', firstname: '', gender: '', educationLevel: '', residentSince: '', residentNearRiverSince: '', ...(payload as Record<string, unknown> ?? {}) }
    const check = verifyRows([{ ...form, age: Number(form.age) }], UserSchema)
    ctx.state.formErrors = Object.fromEntries(check.errors.map(e => [e.path.replace(/^\[0\]\./, ''), e.message]))
    if (!check.pass) {
      throw new Error('Перевірте відповіді')
    }
    const { user } = await signInAnonymously(getAuth())
    const data = {
      'uid': user.uid,
      'name': { lastname: String(form.lastname), firstname: String(form.firstname) },
      'age': Number(form.age),
      'gender': form.gender,
      'education level': form.educationLevel,
      'city resident': form.residentSince,
      'river resident': form.residentNearRiverSince,
      'createdAt': new Date(),
      'isAnonymous': true,
    }
    await addDoc(collection(getFirestore(), 'users'), data)
    ctx.state.user = data
  }, 'Validate the registration form (state.formErrors gets field messages), sign in anonymously, save the participant and put them in state.user.')

  // The drawn features, grouped the way the analysis expects, as one "project" document.
  registerHandler('saveProject', async (_payload, ctx, args) => {
    const features = (Array.isArray(args) ? args : []) as MapFeature[]
    const user = ctx.state.user as { uid?: string, name?: { firstname: string, lastname: string } } | null
    const timestamp = new Date().toISOString()
    const point = (f: MapFeature): Point => ({ lat: (f.coordinates as number[])[1], lon: (f.coordinates as number[])[0], timestamp: f.timestamp || timestamp, comment: f.comment || '' })
    const shape = (f: MapFeature): Shape => ({ geometry: JSON.stringify(f.coordinates), timestamp: f.timestamp || timestamp, comment: f.comment || '' })
    const group = (keys: string[]) => Object.fromEntries(keys.map(k => [k, [] as (Point | Shape)[]]))
    const project = {
      userId: user?.uid || 'anonymous',
      name: user?.name ?? null,
      timestamp,
      space: group(['everyday', 'everyweek', 'sometimes', 'once', 'never', 'recreational', 'restricted', 'prohibit']),
      belonging: group(['negative', 'love', 'positive']),
      safety: group(['safe', 'unsafe', 'great']),
      environment: group(['pollution', 'flora-fauna', 'trash']),
    }
    for (const f of features) {
      if (f.type === 'Polygon') {
        project.space.recreational.push(shape(f))
      }
      else if (f.type === 'LineString') {
        project.space.restricted.push(shape(f))
      }
      else if (f.isProhibit) {
        project.space.prohibit.push(point(f))
      }
      else if (f.iconName) {
        const bucket = BELONGING[f.iconName] ? project.belonging[BELONGING[f.iconName]] : SAFETY[f.iconName] ? project.safety[SAFETY[f.iconName]] : ENVIRONMENT[f.iconName] ? project.environment[ENVIRONMENT[f.iconName]] : null
        bucket?.push(point(f))
      }
      else if (f.frequency) {
        project.space[FREQUENCY[f.frequency] ?? 'sometimes'].push(point(f))
      }
    }
    await addDoc(collection(getFirestore(), 'projects'), project)
  }, 'Save the features given as args (e.g. "$state.features") as one project document for the current participant.')

  // Every participant's features, flattened, for the results map.
  registerHandler('loadResults', async (_payload, ctx) => {
    const snapshot = await getDocs(collection(getFirestore(), 'projects'))
    const features: MapFeature[] = []
    let id = 0
    const push = (f: Omit<MapFeature, 'id'>) => features.push({ id: ++id, ...f })
    for (const doc of snapshot.docs) {
      const project = doc.data() as Record<string, Record<string, (Point & Shape)[]>>
      for (const [key, rows] of Object.entries(project.space ?? {})) {
        for (const row of Array.isArray(rows) ? rows : []) {
          if (key === 'recreational') {
            push({ type: 'Polygon', coordinates: JSON.parse(row.geometry), comment: row.comment, timestamp: row.timestamp })
          }
          else if (key === 'restricted') {
            push({ type: 'LineString', coordinates: JSON.parse(row.geometry), comment: row.comment, timestamp: row.timestamp })
          }
          else if (key === 'prohibit') {
            push({ type: 'Point', coordinates: [row.lon, row.lat], isProhibit: true, comment: row.comment, timestamp: row.timestamp })
          }
          else {
            push({ type: 'Point', coordinates: [row.lon, row.lat], frequency: key, comment: row.comment, timestamp: row.timestamp })
          }
        }
      }
      for (const category of ['belonging', 'safety', 'environment']) {
        for (const [key, rows] of Object.entries(project[category] ?? {})) {
          for (const row of Array.isArray(rows) ? rows : []) {
            push({ type: 'Point', coordinates: [row.lon, row.lat], iconName: key, comment: row.comment, timestamp: row.timestamp })
          }
        }
      }
    }
    ctx.state.features = features
  }, 'Load every saved project and put the flattened features into state.features.')
}
