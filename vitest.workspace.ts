import { defineWorkspace } from 'vitest/config'

export default defineWorkspace([
  'apps/*',
  'base',
  'base/layers/*',
])
