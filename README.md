# DrawingParticipation-Private

## Using Base components

In your `nuxt.config.ts`, add this

```ts
import path from "path"
vite: {
  resolve: {
    alias: {
      '@base': path.resolve(__dirname, '../../base/app'),
    },
  },
}
```

In your `tsconfig.ts`, add this

```ts
  {
    "compilerOptions": {
      "baseUrl": "./",
      "paths": {
        "@base/*": [
          "../../base/app/*"
        ]
      }
    }
  }
```

After adding the option you might want to reset your server or IDE, and you should be able to use `@base` to access the base components.

## Testing Practices

Testing should be done in `__test__/` folder in each applications.
Testing your Vue Components should be in `unit/` and should be placed in similar structure of your components

For Example:

```

project
│ README.md
└───app1/
│ └───components/
| | └───**test**/
| | | └───unit/
| | | | └───HelloWorldComponents/
| | | | |   HelloWorld.test.ts
| | | └───integration/
| | └───HelloWorldComponents/
| | |   HelloWorld.vue

```

Example project structure:

```

project
│ README.md
└───app1/
│ └───components/
| | └───**test**/
| | | └───unit
| | | └───integration
└───base
│ └───components/
| | └───**test**/
| | | └───unit
| | | └───integration

```

### Configuration

In your `tsconfig.json` add this alias

```json
{
  "compilerOptions": {
    "baseUrl": "./",
    "paths": {
      "@components/*": [
        "app/components/*"
      ]
    }
  }
}
```

In your `vitest.config.mjs` add this alias

```js
import path from 'node:path'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  base: './',
  test: {
    globals: true,
    environment: 'jsdom',
  },
  resolve: {
    alias: {
      '@components': '/app/components',
      '#ui': path.resolve(
        __dirname,
        './node_modules/@nuxt/ui/dist/runtime/ui.mjs',
      ),
    },
  },
})
```

After you do that, you will be able to import your components for testing using `@components`

```ts
import YourComponent from '@components/path/to/components'
```

### Start script

1. Running specific test suit for local app
   Example:

   ```bash
   cd apps/restart-ukraine/
   yarn run test
   ```

2. Running all tests
   Example:
   ```bash
   cd path/to/root/
   yarn run test
   ```

### Packages for Testing

Testing packages should be installed in `package.json` for each applications

| **Package**           | **Purpose**                                                                       | **Required?**                                                                 | **Docs**                                                              |
| --------------------- | --------------------------------------------------------------------------------- | ----------------------------------------------------------------------------- | --------------------------------------------------------------------- |
| `vitest`              | Testing framework similar to Jest but optimized for Vite.                         | **Keep**                                                                      | [Vitest Docs](https://vitest.dev/)                                    |
| `@nuxt/test-utils`    | Provides utilities for testing Nuxt applications.                                 | **Keep** if you're testing Nuxt apps.                                         | [Nuxt Test Utils Docs](https://nuxt.com/docs/getting-started/testing) |
| `@pinia/testing`      | Utilities for testing stores built with Pinia.                                    | **Keep** if you're using Pinia for state management and testing its behavior. | [Pinia Testing Docs](https://pinia.vuejs.org/cookbook/testing.html)   |
| `@vitejs/plugin-vue`  | Vite plugin for handling Vue single-file components.                              | **Keep** if you're using Vite to build your app.                              | [Vite Plugin Vue Docs](https://vitejs.dev/guide/features.html#vue)    |
| `@vue/test-utils`     | Core testing utilities for Vue components.                                        | **Keep**, it's essential for testing Vue components.                          | [Vue Test Utils Docs](https://test-utils.vuejs.org/)                  |
| `jsdom`               | Provides a virtual DOM environment for Node.js, used in testing DOM-related code. | **Keep**, essential for testing DOM-related code.                             | [JSDOM Docs](https://github.com/jsdom/jsdom#readme)                   |
| `@vitest/coverage-v8` | Adds V8-based code coverage to Vitest.                                            | **Optional**, but useful if you want detailed code coverage reports.          | [Vitest Coverage V8 Docs](https://vitest.dev/guide/coverage.html#v8)  |
| `happy-dom`           | A DOM environment alternative to JSDOM for faster tests.                          | **Optional**, keep if you face performance issues with JSDOM.                 | [Happy DOM Docs](https://github.com/capricorn86/happy-dom#readme)     |

```

```
