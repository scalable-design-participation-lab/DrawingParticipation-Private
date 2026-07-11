# Testing MNC locally

The app stores user entries and community contributions in **Firebase**
(Firestore + Auth + Storage). There is no separate local database — a normal
`yarn dev` talks to the **cloud** project in `.firebaserc` (`drawing-participation`),
so anything you add goes to the real project.

To test the moderation loop (login → pending → approve/delete) **entirely on your
machine**, without touching the cloud, use the **Firebase Emulator Suite**.

## Option A — Local emulators (recommended for testing moderation)

Runs Firestore, Auth and Storage locally. Requires Java (already installed).

**Terminal 1 — start the emulators** (from `apps/mnc`):

```bash
yarn emulators
```

First run downloads `firebase-tools` + the emulator jars. It serves:
- Emulator UI → http://localhost:4000
- Auth :9099 · Firestore :8080 · Storage :9199

Rules are auto-loaded from `firestore.rules` / `storage.rules` — **no deploy needed**.

**Terminal 2 — start the app pointed at the emulators** (from `apps/mnc`):

```bash
yarn dev:emulators
# or, if .env.emulators is missing:  $env:VUEFIRE_EMULATORS='true'; yarn dev   (PowerShell)
```

`VUEFIRE_EMULATORS=true` is what switches the app from cloud to the local
emulators. A plain `yarn dev` still uses the cloud project.

> The emulator database starts **empty**, so the map shows only the 25 curated
> catalog pins (those come from `content/mncData.json`, not Firestore). Anything
> you add is stored in the local emulator.

### Make yourself a moderator (one-time, in the Emulator UI)

1. Open http://localhost:4000 → **Authentication** → **Add user** → enter an
   email + password → copy the generated **User UID**.
2. Go to **Firestore** → **Start collection** `admins` → **Document ID** = that
   UID → add any field (e.g. `role: "admin"`) → Save.
3. In the app (http://localhost:3000) click the **🔒** (bottom-left) → sign in
   with that email/password. The button becomes **Moderate**.

### Try the loop

1. Add an entry (click the map → fill the form → *Add to map*). You'll see a
   "Submitted for review" banner; on reload it's hidden (pending).
2. As moderator, open **Moderate** → **Entries** → **Approve**. Reload → it's now
   public. **Delete** removes it. Community contributions work the same way under
   the **Contributions** section.

To keep emulator data between runs:

```bash
npx -y firebase-tools emulators:start --import=./.emulator-data --export-on-exit
```

## Option B — Cloud project

Use the real project. Then the 3 one-time setup steps are:

1. Deploy the rules: `firebase deploy --only firestore:rules,storage`
2. Firebase console → Authentication → enable **Email/Password**; make sure
   **Storage** is enabled.
3. Create a moderator account, copy its uid (Authentication tab), and add an
   `admins/<uid>` document in Firestore. That account can approve/delete.
