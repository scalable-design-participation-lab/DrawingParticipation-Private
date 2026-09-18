// Loads the app's app/contracts.ts on the server (collection schemas the
// collections API validates against). `#spec/app-contracts` is a virtual
// module generated in base/nuxt.config.ts; importing a value from it keeps
// the import (and the app module, marked as side-effectful) from being
// tree-shaken out of the Nitro bundle.
import { loaded } from '#spec/app-contracts'

export default defineNitroPlugin(() => {
  if (!loaded) {
    console.info('[collections] no app/contracts.ts: the collections API validates nothing')
  }
})
