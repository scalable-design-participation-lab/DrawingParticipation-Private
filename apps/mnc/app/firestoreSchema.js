/**
 * Firestore schema for the MNC mapping app (documentation only — this file is
 * never imported at runtime; it describes the shapes the app reads/writes).
 *
 * The static case-study catalog still lives in apps/mnc/content/mncData.json
 * and apps/mnc/public/Solution_Photos/<string_id>/. Firestore is used only for
 * USER-GENERATED content layered on top of those existing projects.
 */
const firestoreSchema = {
  /**
   * `contributions` — one document per user submission, attached to an existing
   * MNC project via `projectId` (the project's `string_id`). Written by
   * apps/mnc/app/stores/contributions.ts (addContribution) and read back by the
   * project detail view (infoPopup.vue).
   */
  contributions: {
    contributionId: {
      // The MNC project this contribution belongs to (mncData.json string_id),
      // e.g. "mindanao-the_habal_habal".
      projectId: 'string',
      // Optional free-text comment from the uploader.
      comment: 'string',
      // Uploaded media. Files live in Firebase Storage under
      // `contributions/<projectId>/<timestamp>-<filename>`; only the metadata
      // is stored here. Images for now; `kind: "video"` is reserved for later.
      media: [
        {
          url: 'string', // public Firebase Storage download URL
          path: 'string', // full Storage object path (for later deletion)
          name: 'string', // original file name
          size: 0, // bytes
          contentType: 'string', // MIME type, e.g. "image/png"
          kind: 'image', // 'image' | 'video'
        },
      ],
      // Author id; "anonymous" until auth (base/layers/auth) is wired in.
      userId: 'string',
      // Firestore serverTimestamp() set on write.
      createdAt: 'Timestamp',
    },
  },
}

export default firestoreSchema
