/**
 * A single piece of user-uploaded media attached to an MNC project.
 *
 * The binary file lives in Firebase Storage under
 * `contributions/<projectId>/...`, and this record (the metadata) is embedded
 * inside a Firestore `contributions` document.
 */
export interface MediaItem {
  /** Public download URL returned by Firebase Storage. */
  url: string
  /** Full Storage object path, kept so the file can be deleted later. */
  path: string
  /** Original file name chosen by the uploader. */
  name: string
  /** File size in bytes. */
  size: number
  /** MIME type, e.g. "image/png". */
  contentType: string
  /** High-level kind. Only "image" is produced today; "video" is planned. */
  kind: 'image' | 'video'
}

/**
 * A community contribution attached to an existing MNC project.
 *
 * Contributions are keyed by the project's `string_id` (the stable id used in
 * apps/mnc/content/mncData.json and in public/Solution_Photos/<string_id>/),
 * so user uploads augment an existing case-study pin rather than create a new
 * one. One Firestore document per submission in the `contributions` collection.
 */
export interface Contribution {
  /** Firestore document id (populated when read back). */
  id?: string
  /** The MNC project this contribution belongs to (mncData.json `string_id`). */
  projectId: string
  /** Optional free-text comment left by the uploader. */
  comment: string
  /** Uploaded media items (images for now). */
  media: MediaItem[]
  /** Author id; "anonymous" until authentication is wired in. */
  userId: string
  /** ISO timestamp of when the contribution was created (from serverTimestamp). */
  createdAt: string
}
