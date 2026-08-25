# To Start

npm install --global yarn

yarn install

yarn dev

## Toolchain

- Recommended: use Volta to pin Node and Yarn for this project. Install with:

```bash
curl https://get.volta.sh | bash
```

- Volta handles per-project pins so the correct Node/Yarn versions are used automatically. Alternatively, use `nvm` and run `nvm use` in this folder (the repo contains `.nvmrc`).

# Notes

MNC was made by duplicating the restart-ukraine project and editing it, therefore there is lots of legacy code and files that are not being used.

# /stores - Data

apps/mnc/content/mncData.json - Where the data for MNC is pulled from
TODO - Make sure link labels can be linked, Merge this data from the spreadsheet.
TODO - Split up link lables for "The Health Wagon: Mobilizing Healthcare in Rural Virginia"

apps/mnc/app/stores/types/store.ts -- We use Features from base and ammend it with properties specific to MNC, defined here.
TODO - Add the links and the link lables to properties from apps/mnc/content/mncLinks.csv

apps/mnc/app/stores/db.ts -- Features are create here, and icons are assigned here.

# mnc/components

apps/mnc/app/components/BackgroundMap.vue -- The main map of the app. Builds instance of quick look and info popup component. Handles opening and closing the quick look and info popup. Generalized map calls open quick look.
TODO - Quick look needs to move with the icon when the map moves

apps/mnc/app/components/infoPopup.vue -- The expanded view. Uses UCard, UBadge components from React library.
TODO - Follow the UI design in the Figma
TODO - Add the tags
TODO - Make the links clickable
TODO - Attach the captions to the image.
TODO - Make the image a carasoul.

apps/mnc/app/components/QuickLook.vue -- The tiny view.

# base/components

base/app/components/DrawingLayer/DrawingLayer.vue - For this project, its main role is placing icons on the map.
TODO - The icons need to be fiddled with to resolve the following issues:
_ Icons are too big
_ Clear icons are hard to understand
_ What to do when there are 2 icons in the same location - Pakistan
_ Icons only click on the bottom left side, rather than anywhere on the icon.

# Firebase & User Contributions

Users can attach photos + a comment to an existing MNC project (case-study pin).
Uploaded images go to Firebase Storage; one metadata document per submission is
written to the Firestore `contributions` collection, keyed by the project's
`string_id`. They are read back and shown in the project's expanded detail view.

Key files:

- apps/mnc/app/stores/contributions.ts -- upload to Storage + read/write Firestore
- apps/mnc/app/stores/types/contribution.ts -- MediaItem / Contribution types
- apps/mnc/app/components/ImageUploadModal.vue -- real upload UI (opened from infoPopup)
- apps/mnc/app/components/infoPopup.vue -- "Add photo or comment" button + contributions list
- apps/mnc/app/firestoreSchema.js -- documents the `contributions` shape

Setup:

1. Copy apps/mnc/.env.example to apps/mnc/.env and fill in the FIREBASE\_\* values
   (FIREBASE_STORAGE_BUCKET is required for uploads).
2. Enable Firestore + Storage in the Firebase console.
3. Deploy the security rules (from apps/mnc): `firebase deploy --only firestore:rules,storage`
   (rules live in apps/mnc/firestore.rules and apps/mnc/storage.rules).

Not done yet: video upload (images only for now), authentication (userId defaults
to "anonymous"), unifying the separate CommentModal path.

# MVP TODOS

- connect to firebase -- DONE (image contributions + user solutions); needs Firebase Storage enabled + rules deployed for live persistence
- bottom toolbar -- DONE (filter toggle, theme quick-filters, "+" add-solution)
- filter functionality -- DONE (FilteredSelectionSidebar + bottom-bar theme toggles)
- add mnc solutions functionality -- DONE (click "+" then the map to drop a new pin; contributions = photos/comments on any pin)

# infoPopup TODOs (status)

- Add the tags -- DONE
- Make the links clickable -- DONE (real URLs from content/mncLinks.json)
- Attach the captions to the image -- DONE (carousel caption overlay)
- Make the image a carousel -- DONE (PhotoCarousel.vue, all /Solution_Photos/<id>/\*)
