import { declareHandler } from '../../../base/app/contracts'

/**
 * Handler contracts for MNC. Every component is base's, so this only names
 * what the specs may call and what each call means.
 * Plain module (no Nuxt auto-imports): the verifier CLI loads it with
 * `--contracts apps/mnc/app/contracts.ts`.
 */

declareHandler('watchAuth', 'Keep state.auth in sync with Firebase Auth; admins also get the review queues.')
declareHandler('signIn', 'Sign in with { email, password }.')
declareHandler('signInModerator', 'Sign in with { email, password } and require moderator rights.')
declareHandler('register', 'Create a plain account with { email, password }.')
declareHandler('signOut', 'Sign out.')
declareHandler('resetPassword', 'Email a password-reset link; payload is the email.')
declareHandler('claimAdmin', 'Bootstrap: a project owner grants themselves the admin role.')
declareHandler('loadLabels', 'Per-language theme and link label tables into state.tagLabels / state.linkLabels, for a Text labels binding.')
declareHandler('loadCatalog', 'Load the curated case studies into state.features.')
declareHandler('watchSolutions', 'Live-sync user entries into state.features (+ state.moderation for admins).')
declareHandler('submitEntry', 'Persist a "Join Our Research" submission as a pending entry.')
declareHandler('approveEntry', 'Moderator: approve a user entry (payload from state.moderation).')
declareHandler('deleteEntry', 'Moderator: delete a user entry (payload from state.moderation).')
declareHandler('loadContributions', 'Load a project\'s contributions into state.contributions; payload is the string_id.')
declareHandler('uploadMedia', 'Upload one file and return the stored media; UploadQueue calls it with { file, onProgress } and the project string_id as args.')
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
