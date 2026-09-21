import { deleteApp, getApp, initializeApp } from 'firebase/app'
import { connectAuthEmulator, createUserWithEmailAndPassword, signOut as fbSignOut, getAuth, onAuthStateChanged, sendPasswordResetEmail, signInAnonymously, signInWithEmailAndPassword } from 'firebase/auth'
import { addDoc, collection, deleteDoc, doc, getDoc, getDocs, getFirestore, onSnapshot, query, serverTimestamp, setDoc, updateDoc, where } from 'firebase/firestore'
import { fromLonLat, toLonLat } from 'ol/proj'
import { getHandler, registerHandler } from '../../../base/app/utils/handlers'
import type { SpecContext } from '../../../base/app/utils/spec-context'
import mncLinks from '../content/mncLinks.json'
import mncPhotos from '../content/mncPhotos.json'
import mncI18n from '../content/mncData.i18n.json'
import { PRIMARY_TAGS } from './composables/catalog'
import type { Entry, EntryProperties } from './composables/catalog'
import { addContribution, approveContribution, currentUid, deleteContribution, fetchContributions, fetchPendingContributions, uploadFile } from './api/firebase'
import type { Contribution, MediaItem } from './api/firebase'

/**
 * Everything the pages need that is not rendering: Firebase auth and data,
 * viewport, locale. Each handler says which state keys it writes. The pages
 * themselves are JSON (app/specs).
 */
const SOLUTIONS = 'userSolutions'

type AdminRole = 'admin' | 'moderator'
interface AuthState { uid: string | null, email: string | null, isAnonymous: boolean, isAdmin: boolean, isSuperAdmin: boolean, role: AdminRole | null, ready: boolean }
interface ModeratedEntry { id: string, string_id: string, title: string, primaryTag: string, location: string, approved: boolean, i18n?: EntryProperties['i18n'] }

const roleFromAdminDoc = (data: Record<string, unknown> | undefined): AdminRole => (data?.role === 'moderator' ? 'moderator' : 'admin')
const slugify = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '').slice(0, 40)

let nextId = 0
const newId = () => (nextId = Math.max(Date.now(), nextId + 1))

function entryFrom(s: { string_id: string, title: string, shortDesc?: string, description?: string, primaryTag?: string, location?: string, coordinate: [number, number], approved?: boolean, mncConnection?: string, date?: string, photos?: string[], audio?: string[], i18n?: EntryProperties['i18n'] }): Entry {
  return {
    id: newId(),
    type: 'Point',
    coordinates: s.coordinate,
    comment: s.title,
    timestamp: new Date().toISOString(),
    iconName: s.primaryTag,
    properties: {
      location: s.location,
      date: s.date || '',
      shortDesc: s.shortDesc,
      description: s.description,
      mncConnection: s.mncConnection || '',
      primaryTag: s.primaryTag,
      string_id: s.string_id,
      linkList: [],
      photos: s.photos || [],
      audio: s.audio || [],
      i18n: s.i18n,
      pending: s.approved === false,
    },
  }
}

const auth = (ctx: SpecContext) => (ctx.state.auth ?? {}) as Partial<AuthState>
const features = (ctx: SpecContext) => (ctx.state.features ?? []) as Entry[]
const t = (ctx: SpecContext, key: string) => ctx.translate?.(key) ?? key

function ensureTagVisible(ctx: SpecContext, tag: string | undefined) {
  const tags = (ctx.state.visibleTags ?? []) as string[]
  if (tag && !tags.includes(tag)) {
    ctx.state.visibleTags = [...tags, tag]
  }
}

async function refreshAdmin(ctx: SpecContext, u: { uid: string, isAnonymous: boolean, email: string | null } | null) {
  let isAdmin = false
  let role: AdminRole | null = null
  if (u && !u.isAnonymous) {
    try {
      const snap = await getDoc(doc(getFirestore(), 'admins', u.uid))
      isAdmin = snap.exists()
      role = snap.exists() ? roleFromAdminDoc(snap.data()) : null
    }
    catch { /* not an admin */ }
  }
  ctx.state.auth = { uid: u?.uid ?? null, email: u?.email ?? null, isAnonymous: u?.isAnonymous ?? true, isAdmin, isSuperAdmin: isAdmin && role === 'admin', role, ready: true } satisfies AuthState
}

/** Mirror a plain login into accounts/<uid> so it can be promoted on /admin. */
async function ensureAccountDoc(ctx: SpecContext, u: { uid: string, email: string | null, isAnonymous: boolean }) {
  if (u.isAnonymous || auth(ctx).isAdmin) {
    return true
  }
  try {
    const ref = doc(getFirestore(), 'accounts', u.uid)
    if (!(await getDoc(ref)).exists()) {
      await setDoc(ref, { email: u.email ?? '', createdAt: serverTimestamp() })
    }
    return true
  }
  catch (e) {
    console.warn('[auth] could not mirror registration to accounts/<uid>', e)
    return false
  }
}

const AUTH_ERRORS: Record<string, string> = {
  'auth/email-already-in-use': 'admin.errEmailInUse',
  'auth/invalid-email': 'admin.errInvalidEmail',
  'auth/weak-password': 'admin.errWeakPassword',
  'auth/operation-not-allowed': 'admin.errProviderDisabled',
}
function authError(ctx: SpecContext, e: unknown, fallback: string) {
  const code = (e as { code?: string })?.code
  return new Error(code && AUTH_ERRORS[code] ? t(ctx, AUTH_ERRORS[code]) : `${t(ctx, fallback)}${code ? ` [${code}]` : ''}`)
}

export function registerHandlers() {
  // Moderator queues, loaded on sign-in and when a returning admin is recognised.
  const loadQueues = async (ctx: SpecContext) => {
    const handlers = await import('../../../base/app/utils/handlers')
    await handlers.getHandler('watchSolutions')?.(undefined, ctx, undefined)
    await handlers.getHandler('loadPending')?.(undefined, ctx, undefined)
  }

  // ---------------------------------------------------------------- auth
  registerHandler('watchAuth', (_p, ctx) => {
    onAuthStateChanged(getAuth(), async (u) => {
      if (!u) {
        // Visitors are anonymous so contributions get a stable per-device uid.
        signInAnonymously(getAuth()).catch(e => console.warn('Anonymous sign-in failed', e))
        return
      }
      await refreshAdmin(ctx, u)
      if (auth(ctx).isAdmin) {
        loadQueues(ctx)
      }
    })
  }, 'Keep state.auth { uid, email, isAnonymous, isAdmin, isSuperAdmin, role, ready } in sync with Firebase Auth (anonymous sign-in for visitors).')

  registerHandler('signIn', async (payload, ctx) => {
    const { email = '', password = '' } = (payload ?? {}) as { email?: string, password?: string }
    let cred
    try {
      cred = await signInWithEmailAndPassword(getAuth(), email.trim(), password)
    }
    catch (e) {
      throw authError(ctx, e, 'mod.signInFailed')
    }
    await refreshAdmin(ctx, cred.user)
    await ensureAccountDoc(ctx, cred.user)
  }, 'Sign in with { email, password }; state.auth is refreshed. Throws the translated reason on failure.')

  registerHandler('signInModerator', async (payload, ctx) => {
    await getHandler('signIn')!(payload, ctx, undefined)
    if (!auth(ctx).isAdmin) {
      throw new Error(t(ctx, 'mod.notModerator'))
    }
    await loadQueues(ctx)
  }, 'Sign in with { email, password } and require moderator rights; loads the review queues.')

  registerHandler('register', async (payload, ctx) => {
    const { email = '', password = '' } = (payload ?? {}) as { email?: string, password?: string }
    let cred
    try {
      cred = await createUserWithEmailAndPassword(getAuth(), email.trim(), password)
    }
    catch (e) {
      throw authError(ctx, e, 'admin.errRegister')
    }
    await refreshAdmin(ctx, cred.user)
    if (!(await ensureAccountDoc(ctx, cred.user))) {
      throw new Error(t(ctx, 'admin.errRegisterIncomplete'))
    }
  }, 'Create a plain account with { email, password } (mirrored to accounts/<uid> for an admin to promote).')

  registerHandler('signOut', async (_p, ctx) => {
    await fbSignOut(getAuth())
    ctx.state.auth = { ...auth(ctx), isAdmin: false, isSuperAdmin: false, role: null }
  }, 'Sign out; the auth watcher signs the visitor back in anonymously.')

  registerHandler('resetPassword', async (payload, ctx) => {
    const email = String(payload ?? '').trim()
    if (!email) {
      throw new Error(t(ctx, 'mod.enterEmailForReset'))
    }
    try {
      await sendPasswordResetEmail(getAuth(), email)
    }
    catch {
      throw new Error(t(ctx, 'mod.errReset'))
    }
  }, 'Email a password-reset link; payload is the email.')

  registerHandler('claimAdmin', async (_p, ctx) => {
    const u = getAuth().currentUser
    if (!u) {
      throw new Error('not-signed-in')
    }
    try {
      await setDoc(doc(getFirestore(), 'admins', u.uid), { email: u.email ?? '', role: 'admin', createdAt: serverTimestamp() })
    }
    catch {
      throw new Error(t(ctx, 'admin.claimFailed'))
    }
    await refreshAdmin(ctx, u)
  }, 'Bootstrap: a project owner grants themselves the admin role (rules reject everyone else).')

  // ---------------------------------------------------------------- catalogue + user entries
  registerHandler('loadCatalog', async (_p, ctx) => {
    const { default: data } = await import('../content/mncData.json') as { default: Record<string, unknown>[] }
    const links = mncLinks as Record<string, { label: string, url: string }[]>
    const photos = mncPhotos as Record<string, string[]>
    const i18n = mncI18n as Record<string, EntryProperties['i18n']>
    ctx.state.features = data.map((row): Entry => {
      const tag = String(row['Primary Tag'] ?? '')
      const id = String(row.string_id)
      return {
        id: newId(),
        type: 'Point',
        coordinates: fromLonLat([Number.parseFloat(String(row.Longitude)), Number.parseFloat(String(row.Latitude))]) as [number, number],
        comment: String(row.Title ?? ''),
        timestamp: new Date().toISOString(),
        iconName: (PRIMARY_TAGS as readonly string[]).includes(tag) ? tag : 'heart',
        properties: {
          location: row.Location as string,
          date: String(row.Date ?? ''),
          shortDesc: row['Short Description'] as string,
          description: row.Description as string,
          mncConnection: row['Connection to Mobile Networked Creativity'] as string,
          mediaCaptions: row['Media Captions'] as string[],
          links: row.Links as string,
          primaryTag: tag,
          secondaryTags: row['Secondary Tags'] as string[],
          string_id: id,
          linkList: links[id] || [],
          photos: photos[id] || [],
          i18n: i18n[id],
        },
      }
    })
  }, 'Load the curated case studies (content/mncData.json) into state.features.')

  let unsubscribe: (() => void) | null = null
  registerHandler('watchSolutions', (_p, ctx) => {
    const admin = Boolean(auth(ctx).isAdmin)
    unsubscribe?.()
    const col = collection(getFirestore(), SOLUTIONS)
    return new Promise<void>((resolve) => {
      unsubscribe = onSnapshot(
        admin ? query(col) : query(col, where('approved', '==', true)),
        (snapshot) => {
          const moderation: ModeratedEntry[] = []
          const live = new Map<string, Entry>()
          for (const d of snapshot.docs) {
            const data = d.data() as Record<string, unknown>
            if (typeof data.lon !== 'number' || typeof data.lat !== 'number') {
              continue
            }
            const approved = data.approved === true
            const string_id = String(data.string_id || d.id)
            if (admin) {
              moderation.push({ id: d.id, string_id, title: String(data.title || 'Untitled'), primaryTag: String(data.primaryTag || ''), location: String(data.location || ''), approved, i18n: data.i18n as EntryProperties['i18n'] })
            }
            ensureTagVisible(ctx, data.primaryTag as string)
            live.set(string_id, entryFrom({
              string_id,
              title: String(data.title || 'Untitled'),
              shortDesc: String(data.shortDesc || ''),
              description: String(data.description || ''),
              primaryTag: String(data.primaryTag || ''),
              location: String(data.location || ''),
              coordinate: fromLonLat([data.lon, data.lat]) as [number, number],
              approved,
              mncConnection: String(data.mncConnection || ''),
              date: String(data.date || ''),
              photos: Array.isArray(data.photos) ? data.photos as string[] : [],
              audio: Array.isArray(data.audio) ? data.audio as string[] : [],
              i18n: data.i18n as EntryProperties['i18n'],
            }))
          }
          // Catalogue entries stay; user entries are replaced by what Firestore says now.
          const catalogue = features(ctx).filter(f => !f.properties.string_id?.startsWith('user_'))
          ctx.state.features = [...catalogue, ...live.values()]
          ctx.state.moderation = moderation
          resolve()
        },
        (err) => {
          console.warn('Could not load user solutions:', err)
          resolve()
        },
      )
    })
  }, 'Live-sync user entries (userSolutions) into state.features; moderators also get state.moderation. Re-call after sign-in.')

  registerHandler('submitEntry', async (payload, ctx) => {
    const p = (payload ?? {}) as Record<string, unknown> & { coordinate?: [number, number] | null, files?: Record<string, File[]> }
    if (!p.coordinate) {
      return
    }
    // Files from every step, de-duplicated (the same photo may be attached twice).
    const seen = new Set<string>()
    const files = Object.values(p.files ?? {}).flat().filter((file) => {
      const key = `${file.name}|${file.size}|${file.lastModified}`
      return seen.has(key) ? false : (seen.add(key), true)
    })
    const photos: string[] = []
    const audio: string[] = []
    if (files.length) {
      const folder = `entry_${slugify(String(p.title || '')).slice(0, 30) || 'untitled'}_${Math.floor(Math.random() * 100000)}`
      for (const file of files) {
        try {
          const m = await uploadFile(folder, file)
          if (m.kind === 'audio') {
            audio.push(m.url)
          }
          else if (m.kind === 'image') {
            photos.push(m.url)
          }
        }
        catch (e) {
          console.warn('Could not upload entry file:', e)
        }
      }
    }
    const string_id = `user_${slugify(String(p.title || ''))}_${Math.floor(Math.random() * 100000)}`
    const entry = {
      string_id,
      title: String(p.title || ''),
      shortDesc: String(p.example || '').slice(0, 140),
      description: String(p.example || ''),
      primaryTag: String(p.primaryTag || ''),
      location: String(p.location || ''),
      coordinate: p.coordinate,
      mncConnection: String(p.why || ''),
      date: String(p.date || ''),
      photos,
      audio,
    }
    ensureTagVisible(ctx, entry.primaryTag)
    ctx.state.features = [...features(ctx), entryFrom({ ...entry, approved: false })]
    const [lon, lat] = toLonLat(p.coordinate)
    try {
      await addDoc(collection(getFirestore(), SOLUTIONS), { ...entry, lon, lat, userId: currentUid(), approved: false, createdAt: serverTimestamp() })
      // Personal contact info goes to the admin-only collection, never the pin.
      if (p.email || p.fullName) {
        await addDoc(collection(getFirestore(), 'entryContacts'), {
          entryStringId: string_id,
          connectInfo: p.connectInfo ?? null,
          fullName: String(p.fullName || ''),
          email: String(p.email || ''),
          country: String(p.country || ''),
          city: String(p.city || ''),
          userId: currentUid(),
          createdAt: serverTimestamp(),
        })
      }
    }
    catch (e) {
      console.warn('Could not persist entry:', e)
    }
  }, 'Persist a "Join Our Research" submission (payload from MobileContributeFlow) as a pending entry + its contact info; the pin appears in state.features at once.')

  // ---------------------------------------------------------------- moderation
  registerHandler('approveEntry', async (payload, ctx) => {
    const m = payload as ModeratedEntry
    await updateDoc(doc(getFirestore(), SOLUTIONS, m.id), { approved: true })
    ctx.state.moderation = ((ctx.state.moderation ?? []) as ModeratedEntry[]).map(x => (x.id === m.id ? { ...x, approved: true } : x))
    ctx.state.features = features(ctx).map(f => (f.properties.string_id === m.string_id ? { ...f, properties: { ...f.properties, pending: false } } : f))
  }, 'Moderator: approve a user entry (payload: an item of state.moderation).')

  registerHandler('deleteEntry', async (payload, ctx) => {
    const m = payload as ModeratedEntry
    await deleteDoc(doc(getFirestore(), SOLUTIONS, m.id))
    ctx.state.moderation = ((ctx.state.moderation ?? []) as ModeratedEntry[]).filter(x => x.id !== m.id)
    ctx.state.features = features(ctx).filter(f => f.properties.string_id !== m.string_id)
  }, 'Moderator: delete a user entry and its pin (payload: an item of state.moderation).')

  registerHandler('loadContributions', async (payload, ctx) => {
    ctx.state.contributionsLoading = true
    try {
      ctx.state.contributions = await fetchContributions(String(payload ?? ''), Boolean(auth(ctx).isAdmin))
    }
    finally {
      ctx.state.contributionsLoading = false
    }
  }, 'Load a project\'s community contributions into state.contributions; payload is the project string_id.')

  registerHandler('addContribution', async (payload, ctx) => {
    const { projectId, comment, media } = payload as { projectId: string, comment: string, media: MediaItem[] }
    await addContribution(projectId, { comment, media })
    ctx.state.contributions = await fetchContributions(projectId, Boolean(auth(ctx).isAdmin))
  }, 'Save an uploaded contribution { projectId, comment, media } and refresh state.contributions.')

  registerHandler('loadPending', async (_p, ctx) => {
    try {
      ctx.state.pendingContributions = await fetchPendingContributions()
    }
    catch (e) {
      console.warn('Could not load pending contributions:', e)
    }
  }, 'Moderator: every unapproved contribution into state.pendingContributions.')

  const without = (list: unknown, id: string | undefined) => ((list ?? []) as Contribution[]).filter(c => c.id !== id)
  registerHandler('approveContribution', async (payload, ctx) => {
    const c = payload as Contribution
    await approveContribution(c.id!)
    ctx.state.contributions = ((ctx.state.contributions ?? []) as Contribution[]).map(x => (x.id === c.id ? { ...x, approved: true } : x))
    ctx.state.pendingContributions = without(ctx.state.pendingContributions, c.id)
  }, 'Moderator: approve a contribution (payload: the contribution).')

  registerHandler('deleteContribution', async (payload, ctx) => {
    const c = payload as Contribution
    await deleteContribution(c)
    ctx.state.contributions = without(ctx.state.contributions, c.id)
    ctx.state.pendingContributions = without(ctx.state.pendingContributions, c.id)
  }, 'Moderator: delete a contribution and its files (payload: the contribution).')

  // ---------------------------------------------------------------- /admin accounts
  interface Account { uid: string, email: string, role?: AdminRole, createdAt?: string }
  const toDate = (v: unknown) => (v as { toDate?: () => Date } | undefined)?.toDate?.()?.toISOString()
  registerHandler('loadAccounts', async (_p, ctx) => {
    ctx.state.accountsLoading = true
    try {
      const db = getFirestore()
      const [adminSnap, regSnap] = await Promise.all([getDocs(collection(db, 'admins')), getDocs(collection(db, 'accounts'))])
      ctx.state.accounts = adminSnap.docs
        .map((d): Account => ({ uid: d.id, email: typeof d.data().email === 'string' ? d.data().email : '', role: roleFromAdminDoc(d.data()), createdAt: toDate(d.data().createdAt) }))
        .sort((a, b) => a.email.localeCompare(b.email))
      ctx.state.registrations = regSnap.docs
        .map((d): Account => ({ uid: d.id, email: typeof d.data().email === 'string' ? d.data().email : '', createdAt: toDate(d.data().createdAt) }))
        .sort((a, b) => (b.createdAt ?? '').localeCompare(a.createdAt ?? ''))
    }
    finally {
      ctx.state.accountsLoading = false
    }
  }, 'Super admin: state.accounts (admins/*) and state.registrations (accounts/*).')

  async function grant(ctx: SpecContext, uid: string, email: string, role: AdminRole) {
    await setDoc(doc(getFirestore(), 'admins', uid), { email, role, createdAt: serverTimestamp(), createdBy: auth(ctx).uid })
    ctx.state.accounts = [...((ctx.state.accounts ?? []) as Account[]), { uid, email, role, createdAt: new Date().toISOString() }].sort((a, b) => a.email.localeCompare(b.email))
  }
  registerHandler('promote', async (payload, ctx) => {
    const { uid, email, role } = payload as { uid: string, email: string, role: AdminRole }
    await grant(ctx, uid, email, role)
  }, 'Super admin: give a registration moderation rights; payload { uid, email, role }.')

  registerHandler('removeRegistration', async (payload, ctx) => {
    const uid = String(payload)
    await deleteDoc(doc(getFirestore(), 'accounts', uid))
    ctx.state.registrations = ((ctx.state.registrations ?? []) as Account[]).filter(r => r.uid !== uid)
  }, 'Super admin: drop a registration (payload: uid).')

  registerHandler('setRole', async (payload, ctx) => {
    const { uid, role } = payload as { uid: string, role: AdminRole }
    if (uid === auth(ctx).uid) {
      throw new Error('cannot-change-own-role')
    }
    await updateDoc(doc(getFirestore(), 'admins', uid), { role })
    ctx.state.accounts = ((ctx.state.accounts ?? []) as Account[]).map(a => (a.uid === uid ? { ...a, role } : a))
  }, 'Super admin: switch an account between admin and moderator; payload { uid, role }.')

  registerHandler('revoke', async (payload, ctx) => {
    const uid = String(payload)
    if (uid === auth(ctx).uid) {
      throw new Error('cannot-revoke-self')
    }
    await deleteDoc(doc(getFirestore(), 'admins', uid))
    ctx.state.accounts = ((ctx.state.accounts ?? []) as Account[]).filter(a => a.uid !== uid)
  }, 'Super admin: remove moderation rights (payload: uid).')

  registerHandler('createAccount', async (payload, ctx) => {
    const { email, password, role } = payload as { email: string, password: string, role: AdminRole }
    // A throwaway app so creating the user does not sign the admin out.
    const secondary = initializeApp(getApp().options, `account-creation-${Date.now()}`)
    try {
      const secondaryAuth = getAuth(secondary)
      const emu = getAuth().emulatorConfig
      if (emu) {
        connectAuthEmulator(secondaryAuth, `${emu.protocol}://${emu.host}:${emu.port}`, { disableWarnings: true })
      }
      let cred
      try {
        cred = await createUserWithEmailAndPassword(secondaryAuth, email.trim(), password)
      }
      catch (e) {
        throw authError(ctx, e, 'admin.errCreate')
      }
      await fbSignOut(secondaryAuth)
      await grant(ctx, cred.user.uid, email.trim(), role)
    }
    finally {
      await deleteApp(secondary).catch(() => {})
    }
  }, 'Super admin: create a login outright; payload { email, password, role }.')
}
