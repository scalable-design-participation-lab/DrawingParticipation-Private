import { z } from 'zod'
import './utils/styles'
import { declareHandler, registerContract } from '../../../base/app/contracts'

/**
 * Contracts for MNC's own components and handlers, so the pages can be specs.
 * Plain module (no Nuxt auto-imports): the verifier CLI loads it with
 * `--contracts apps/mnc/app/contracts.ts`.
 */
const Row = z.record(z.string(), z.unknown())
const Rows = z.array(Row)
const Coordinate = z.tuple([z.number(), z.number()])

registerContract({
  name: 'MncMap',
  description: 'The MNC map: category pins for the visible entries plus the QuickLook card. `selected` / `quickLook` are owned by the page; taps on the empty map emit `add-at` (desktop) or `pick` while `picking`.',
  props: z.strictObject({
    features: Rows.optional(),
    visibleTags: z.array(z.string()).optional(),
    selected: Row.nullable().optional(),
    quickLook: z.boolean().optional(),
    picking: z.boolean().optional(),
    pin: Coordinate.nullable().optional(),
    mapType: z.enum(['vector', 'satellite']).optional(),
    isMobile: z.boolean().optional(),
  }),
  emits: ['update:selected', 'update:quickLook', 'expand', 'pick', 'addAt'],
})

registerContract({
  name: 'ThemeFilterBar',
  description: 'Theme chips at the top of the map; `toggle-tag` emits the tag to show/hide.',
  props: z.strictObject({ features: Rows.optional(), visibleTags: z.array(z.string()).optional() }),
  emits: ['toggleTag'],
})

registerContract({
  name: 'BottomBar',
  description: 'Desktop toolbar (map / list / info / add); the highlighted mode follows the open flags.',
  props: z.strictObject({ contributeOpen: z.boolean().optional(), listOpen: z.boolean().optional(), infoOpen: z.boolean().optional() }),
  emits: ['map', 'list', 'info', 'add'],
})

registerContract({
  name: 'FilteredSelectionSidebar',
  description: 'Category accordion with counts and per-theme visibility; `select` emits an entry.',
  props: z.strictObject({ features: Rows.optional(), visibleTags: z.array(z.string()).optional() }),
  emits: ['select', 'toggleTag'],
})

registerContract({
  name: 'ProjectListPanel',
  description: 'Searchable card grid of the visible entries (a modal); `select` emits an entry.',
  props: z.strictObject({ features: Rows.optional(), visibleTags: z.array(z.string()).optional() }),
  emits: ['select', 'close'],
})

registerContract({
  name: 'MobileProximityList',
  description: 'Mobile list sorted by distance (with location permission) or date; `select` emits an entry.',
  props: z.strictObject({ features: Rows.optional() }),
  emits: ['select'],
})

registerContract({
  name: 'MobileHeader',
  description: 'Mobile top bar with the language menu and the vector / satellite toggle (`update:mapType`).',
  props: z.strictObject({ title: z.string().optional(), titleLink: z.boolean().optional(), mapType: z.enum(['vector', 'satellite']).optional() }),
  emits: ['update:mapType'],
})

registerContract({
  name: 'MobileBottomNav',
  description: 'Mobile tab pill: map / list / info / more (add). `update:activeView` emits the view name.',
  props: z.strictObject({ activeView: z.enum(['map', 'list', 'info', 'more']), projectSelected: z.boolean().optional() }),
  emits: ['update:activeView', 'showOnMap', 'readMore', 'nextProject', 'closeProject'],
})

registerContract({
  name: 'MobileContributeFlow',
  description: '"Join Our Research" wizard. `pick-location` asks the page to let the user tap the map; `pickedCoordinate` feeds the tap back; `submit` emits the whole payload (title, theme, coordinate, answers, files).',
  props: z.strictObject({ pickedCoordinate: Coordinate.nullable().optional() }),
  emits: ['close', 'pickLocation', 'submit'],
})

registerContract({
  name: 'MobileInfoPopup',
  description: 'Mobile bottom sheet for one entry (compact or full). Contributions come from the page; `contribute` / `approve` / `delete` go back to it.',
  props: z.strictObject({ entry: Row, state: z.enum(['expanded', 'full']).optional(), contributions: Rows.optional(), isAdmin: z.boolean().optional() }),
  emits: ['close', 'update:state', 'contribute', 'approve', 'delete'],
})

registerContract({
  name: 'EntryDetail',
  description: 'Desktop detail panel for one entry: text, gallery, voice notes, links, community contributions. `show-tag` emits the theme to narrow to.',
  props: z.strictObject({ entry: Row, contributions: Rows.optional(), loading: z.boolean().optional(), isAdmin: z.boolean().optional() }),
  emits: ['close', 'showTag', 'contribute', 'approve', 'delete'],
})

registerContract({
  name: 'ModerationPanel',
  description: 'Moderator review queue (pending entries + contributions). `fly-to` emits a string_id.',
  props: z.strictObject({ moderation: Rows.optional(), pending: Rows.optional(), features: Rows.optional(), isSuperAdmin: z.boolean().optional() }),
  emits: ['approveEntry', 'deleteEntry', 'approveContribution', 'deleteContribution', 'flyTo', 'signOut', 'close'],
})

registerContract({
  name: 'AdminAccounts',
  description: 'Account management page body: sign in / register, then (super admin) promote registrations and manage moderators. Bind `errors` to `$errors` for outcomes.',
  props: z.strictObject({ auth: Row.optional(), accounts: Rows.optional(), registrations: Rows.optional(), loading: z.boolean().optional(), errors: Row.optional() }),
  emits: ['signIn', 'register', 'resetPassword', 'claimAdmin', 'signOut', 'refresh', 'promote', 'removeRegistration', 'setRole', 'revoke', 'sendReset', 'create'],
})

registerContract({
  name: 'OnboardingModal',
  description: 'Welcome / about card with the language chips; `close` when the user starts.',
  props: z.strictObject({ isVisible: z.boolean() }),
  emits: ['close'],
})

registerContract({ name: 'LoadingScreen', description: 'Full-screen splash with a fake progress bar.', props: z.strictObject({}) })
registerContract({ name: 'LocaleSwitcher', description: 'Header pill showing the current language with a dropdown of all locales.', props: z.strictObject({}) })

declareHandler('watchViewport', 'state.isMobile follows the viewport (< 768px).')
declareHandler('setLocale', 'Switch the UI language; payload is the locale code.')
declareHandler('watchAuth', 'Keep state.auth in sync with Firebase Auth; admins also get the review queues.')
declareHandler('signIn', 'Sign in with { email, password }.')
declareHandler('signInModerator', 'Sign in with { email, password } and require moderator rights.')
declareHandler('register', 'Create a plain account with { email, password }.')
declareHandler('signOut', 'Sign out.')
declareHandler('resetPassword', 'Email a password-reset link; payload is the email.')
declareHandler('claimAdmin', 'Bootstrap: a project owner grants themselves the admin role.')
declareHandler('loadCatalog', 'Load the curated case studies into state.features.')
declareHandler('watchSolutions', 'Live-sync user entries into state.features (+ state.moderation for admins).')
declareHandler('submitEntry', 'Persist a "Join Our Research" submission as a pending entry.')
declareHandler('approveEntry', 'Moderator: approve a user entry (payload from state.moderation).')
declareHandler('deleteEntry', 'Moderator: delete a user entry (payload from state.moderation).')
declareHandler('loadContributions', 'Load a project\'s contributions into state.contributions; payload is the string_id.')
declareHandler('addContribution', 'Save an uploaded contribution { projectId, comment, media }.')
declareHandler('loadPending', 'Moderator: unapproved contributions into state.pendingContributions.')
declareHandler('approveContribution', 'Moderator: approve a contribution (payload).')
declareHandler('deleteContribution', 'Moderator: delete a contribution (payload).')
declareHandler('selectEntry', 'Select the entry with the given string_id into state.selected.')
declareHandler('showOnlyTag', 'Narrow the map to one theme and open the list.')
declareHandler('loadAccounts', 'Super admin: state.accounts and state.registrations.')
declareHandler('promote', 'Super admin: grant a registration rights; payload { uid, email, role }.')
declareHandler('removeRegistration', 'Super admin: drop a registration (payload: uid).')
declareHandler('setRole', 'Super admin: change an account\'s role; payload { uid, role }.')
declareHandler('revoke', 'Super admin: remove moderation rights (payload: uid).')
declareHandler('createAccount', 'Super admin: create a login; payload { email, password, role }.')
