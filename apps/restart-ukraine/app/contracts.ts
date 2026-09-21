import { z } from 'zod'
import { declareHandler, registerCollection } from '../../../base/app/contracts'

/**
 * Contracts for restart-ukraine's own components and handlers, so the pages
 * can be specs. Plain module (no Nuxt auto-imports): the verifier CLI loads
 * it with `--contracts apps/restart-ukraine/app/contracts.ts`.
 */

/** Registration form answers (validated by the `register` handler). */
export const UserSchema = registerCollection('user', z.strictObject({
  lastname: z.string().min(1, 'Прізвище є обов’язковим'),
  firstname: z.string().min(1, 'Ім’я є обов’язковим'),
  age: z.number({ error: 'Вік має бути числом' }).int('Вік має бути цілим числом').positive('Вік має бути позитивним числом'),
  gender: z.enum(['male', 'female', 'other'], { error: 'Оберіть коректну стать' }),
  educationLevel: z.enum(['average', 'incomplete_higher', 'higher'], { error: 'Оберіть коректний рівень освіти' }),
  residentSince: z.enum(['less_than_1_year', '1_5_years', '5_10_years', 'more_than_10_years'], { error: 'Оберіть коректний варіант' }),
  residentNearRiverSince: z.enum(['yes', 'no', 'unfamiliar'], { error: 'Оберіть коректний варіант' }),
}))

declareHandler('checkUser', 'Sign in anonymously; a returning participant lands in state.user and state.returning becomes true.')
declareHandler('register', 'Validate the registration form (payload), sign in, save the participant into state.user; field errors go to state.formErrors.')
declareHandler('saveProject', 'Save the features given as args (e.g. "$state.features") as one project document.')
declareHandler('loadResults', 'Load every saved project; the flattened features land in state.features.')
