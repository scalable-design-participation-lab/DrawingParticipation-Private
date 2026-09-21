import { z } from 'zod'
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
  name: 'MobileContributeFlow',
  description: '"Join Our Research" wizard. `pick-location` asks the page to let the user tap the map; `pickedCoordinate` feeds the tap back; `submit` emits the whole payload (title, theme, coordinate, answers, files).',
  props: z.strictObject({ pickedCoordinate: Coordinate.nullable().optional() }),
  emits: ['close', 'pickLocation', 'submit'],
})

registerContract({
  name: 'MobileInfoPopup',
  description: 'How mnc reads one entry inside base Sheet (peek or full). Contributions come from the page; `contribute` / `approve` / `delete` go back to it.',
  props: z.strictObject({ entry: Row, state: z.enum(['peek', 'full']).optional(), contributions: Rows.optional(), isAdmin: z.boolean().optional() }),
  emits: ['close', 'update:state', 'contribute', 'approve', 'delete'],
})

registerContract({
  name: 'EntryDetail',
  description: 'Desktop detail panel for one entry: text, gallery, voice notes, links, community contributions. `show-tag` emits the theme to narrow to.',
  props: z.strictObject({ entry: Row, contributions: Rows.optional(), loading: z.boolean().optional(), isAdmin: z.boolean().optional() }),
  emits: ['close', 'showTag', 'contribute', 'approve', 'delete'],
})

registerContract({
  name: 'AdminAccounts',
  description: 'Account management page body: sign in / register, then (super admin) promote registrations and manage moderators. Bind `errors` to `$errors` for outcomes.',
  props: z.strictObject({ auth: Row.optional(), accounts: Rows.optional(), registrations: Rows.optional(), loading: z.boolean().optional(), errors: Row.optional() }),
  emits: ['signIn', 'register', 'resetPassword', 'claimAdmin', 'signOut', 'refresh', 'promote', 'removeRegistration', 'setRole', 'revoke', 'sendReset', 'create'],
})

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
declareHandler('loadPending', 'Moderator: unapproved contributions into state.pendingContributions, each carrying the projectTitle it belongs to.')
declareHandler('approveContribution', 'Moderator: approve a contribution (payload).')
declareHandler('deleteContribution', 'Moderator: delete a contribution (payload).')
declareHandler('loadAccounts', 'Super admin: state.accounts and state.registrations.')
declareHandler('promote', 'Super admin: grant a registration rights; payload { uid, email, role }.')
declareHandler('removeRegistration', 'Super admin: drop a registration (payload: uid).')
declareHandler('setRole', 'Super admin: change an account\'s role; payload { uid, role }.')
declareHandler('revoke', 'Super admin: remove moderation rights (payload: uid).')
declareHandler('createAccount', 'Super admin: create a login; payload { email, password, role }.')
