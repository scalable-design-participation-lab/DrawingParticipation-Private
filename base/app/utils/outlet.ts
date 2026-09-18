import type { ComputedRef, InjectionKey } from 'vue'
import type { RootSpec } from '../contracts/spec'

/** SpecPage provides the current page spec; Outlet (inside the shell spec) injects it. */
export const OUTLET_SPEC: InjectionKey<ComputedRef<RootSpec | undefined>> = Symbol('outlet-spec')
