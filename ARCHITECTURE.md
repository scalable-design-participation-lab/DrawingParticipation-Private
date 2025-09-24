# Drawing Participation Framework Architecture

## Overview

The Drawing Participation Framework is a **monorepo-based component system** designed for rapid application development through **shared components and modular layers**. The core philosophy is: **build reusable components in base, compose them into specialized apps**.

## Repository Structure Analysis

### Monorepo Organization
```
DrawingParticipation-Private/
├── base/                     # Core framework and shared components
├── apps/                     # Application instances
├── package.json             # Root workspace configuration
├── vitest.workspace.ts      # Testing configuration
└── yarn.lock               # Dependency management
```

### Base Framework (`base/`)
The `base/` directory serves as the **component library and framework foundation**:

```
base/
├── app/                     # Core application structure
│   ├── components/          # Shared component library
│   ├── composables/         # Reusable Vue composables
│   ├── stores/              # Pinia state management
│   ├── layouts/             # Layout templates
│   ├── pages/               # Base page templates
│   └── types/               # TypeScript definitions
├── layers/                  # Nuxt layers for modular functionality
│   ├── auth/                # Authentication layer
│   ├── firebase/            # Firebase integration layer
│   ├── storage/             # Storage management layer
│   └── template/            # Layer template
├── server/                  # Server-side API endpoints
├── nuxt.config.ts          # Base Nuxt configuration
└── package.json            # Base dependencies
```

### Applications (`apps/`)
Each app extends the base framework for specific use cases:

```
apps/
├── drawing-participation/   # Core drawing participation app
├── open-sensing-frontend/   # Environmental sensing dashboard
├── restart-ukraine/         # Ukraine restart initiative
└── template/               # New app template
```

## Component System Architecture

### Shared Component Library (`base/app/components/`)

The base framework provides a comprehensive component library organized by functionality:

#### Core UI Components
```
components/
├── GeneralizedHeader.vue      # Configurable header with navigation
├── GeneralizedFooter.vue      # Standardized footer component
├── GeneralizedBackgroundMap.vue # Base map component
├── DataModal.vue              # Data display modal
├── DatePicker.client.vue      # Client-side date picker
├── HelpSlideover.vue         # Help panel component
├── NotificationsSlideover.vue # Notifications panel
├── NumberCounter.vue         # Animated counter component
├── TeamsDropdown.vue         # Team selection dropdown
└── UserDropdown.vue          # User menu dropdown
```

#### Specialized Component Groups

**Drawing & GeoSpatial Components**
```
DrawingLayer/
├── DrawingLayer.vue          # Main drawing interface
├── IconLayer.vue             # Icon overlay management  
├── LineStringLayer.vue       # Line drawing functionality
└── PolygonLayer.vue          # Polygon drawing tools

GeoSpatialLayer/
├── Buffer/                   # Buffer analysis tools
├── Grid/                     # Grid overlay system
├── HeatMap/                  # Heat map visualization
├── Interpolate/              # Data interpolation
├── Points/                   # Point data management
└── Tesselation/              # Spatial tessellation
```

**Filter & Sidebar Components**
```
FilterSidebar/
├── GenericFilterSidebar.vue  # Main filter container
├── GenericCheckboxGroup.vue  # Checkbox filter groups
├── GenericDateRangePicker.vue # Date range filtering
└── DatePicker.vue            # Basic date picker
```

**Dashboard & Analytics**
```
home/
├── HomeChart.client.vue      # Client-side charts
├── HomeChart.server.vue      # Server-side charts  
├── HomeCountries.vue         # Country selector
├── HomeDateRangePicker.vue   # Home page date picker
├── HomePeriodSelect.vue      # Time period selector
└── HomeSales.vue             # Sales metrics display
```

### State Management Architecture (`base/app/stores/`)

Pinia stores organize application state by domain:

```
stores/
├── data.ts                   # GeoJSON data management
├── drawing.ts                # Drawing state and interactions
├── features.ts               # Feature collection management  
├── map.ts                    # Map state and controls
├── route-features.ts         # Route-based feature loading
├── sidebar.ts                # Sidebar state management
├── user.ts                   # User authentication state
└── all-features.ts           # Aggregated feature management
```

#### Data Store Pattern
```typescript
// stores/data.ts - Centralized data management
export const useDataStore = defineStore('data', () => {
  const data = ref<FeatureCollection<Geometry> | null>(null)
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  function setData(newData: FeatureCollection<Geometry>) { /* ... */ }
  function clearData() { /* ... */ }
  async function fetchData(url: string) { /* ... */ }
  function processGeoJSONFile(file: File) { /* ... */ }

  return { data, isLoading, error, setData, clearData, fetchData, processGeoJSONFile }
})
```

### Composable System (`base/app/composables/`)

Reusable business logic through Vue composables:

```
composables/
├── useDashboard.ts           # Dashboard state management
├── useFilters.ts             # Filter state and operations  
├── useLayerSettings.ts       # Layer configuration management
└── useTimeRange.ts           # Time range selection logic
```

## Nuxt Layers Architecture (`base/layers/`)

The framework uses **Nuxt Layers** for modular functionality extension:

### Layer Structure
```
layers/
├── auth/                     # Authentication layer
│   ├── app/                  # Auth-specific components & composables
│   ├── nuxt.config.ts        # Layer configuration
│   └── package.json          # Layer dependencies
├── firebase/                 # Firebase integration layer  
│   ├── app/                  # Firebase utilities & plugins
│   ├── types/                # Firebase type definitions
│   └── nuxt.config.ts        # Firebase configuration
├── storage/                  # Storage management layer
│   ├── app/                  # Storage utilities
│   ├── server/               # Server-side storage handlers
│   └── nuxt.config.ts        # Storage configuration
└── template/                 # Template for new layers
    ├── nuxt.config.ts        # Base layer template
    └── package.json          # Template dependencies
```

### Layer Extension Pattern
Each app can selectively include layers in their `nuxt.config.ts`:

```typescript
// apps/restart-ukraine/nuxt.config.ts
export default defineNuxtConfig({
  extends: [
    '../../base',           // Base framework
    '../../base/layers/auth',    // Authentication layer
    '../../base/layers/firebase' // Firebase integration
  ],
  // App-specific configuration...
})
```

## Application Architecture Patterns

### App Structure Analysis

Each application follows a consistent structure while extending the base framework:

#### Drawing Participation App (`apps/drawing-participation/`)
```
drawing-participation/
├── app/
│   ├── app.config.ts         # App configuration
│   ├── layouts/default.vue   # App-specific layout
│   └── pages/index.vue       # Main page
├── nuxt.config.ts           # Extends base + layers
└── package.json             # App dependencies
```

#### Open Sensing Frontend (`apps/open-sensing-frontend/`)
```
open-sensing-frontend/
├── components/              # App-specific components
│   ├── Dashboard/           # Dashboard components
│   ├── FilterSidebar/       # Custom filter components  
│   ├── SensorDetail/        # Sensor-specific components
│   └── ...
├── stores/                  # App-specific stores
│   ├── dashboard.js         # Dashboard state
│   ├── sensorData.ts        # Sensor data management
│   └── ...
├── utils/                   # App utilities
│   ├── aqi.ts              # Air quality calculations
│   ├── dataProcessing.ts   # Data transformation
│   └── ...
└── server/api/             # App-specific API routes
```

#### Restart Ukraine App (`apps/restart-ukraine/`)
```
restart-ukraine/
├── app/
│   ├── components/         # Ukraine-specific components
│   ├── stores/             # App state management
│   ├── middleware/         # Route middleware
│   └── pages/              # App pages
└── firestoreSchema.js      # Firebase schema definition
```

### Component Reuse Patterns

#### Generalized Components
Components like `GeneralizedHeader.vue` demonstrate the prop-driven reuse pattern:

```typescript
// GeneralizedHeader.vue - Configurable through props
interface GeneralizedHeaderProps {
  leftItems: Array<{label: string, to?: string, onClick?: Function, variant?: string, color?: string, icon?: string, primary?: boolean}>
  rightItems: Array<{label: string, to?: string, onClick?: Function, variant?: string, color?: string, icon?: string, dropdown?: object}>
  logoSrc?: string
  logoLink?: string  
  logoAlt?: string
  showIcon?: boolean
  shape?: 'rounded' | 'rectangular'
  z?: string | number
}
```

#### App-Specific Extensions
Apps extend base components or create specialized variants:

```typescript
// apps/open-sensing-frontend/components/Dashboard/
├── DashboardHeader.vue       # Specialized header for dashboard
├── DashboardSidebar.vue      # Dashboard-specific sidebar
├── DashboardMain.vue         # Main dashboard layout
├── DashboardMetrics.vue      # Metrics display
├── DashboardChart.vue        # Chart components
└── DashboardTable.vue        # Data table component
```

## Development Workflow Patterns

### Workspace Management
The monorepo uses **Yarn Workspaces** for dependency management:

```json
// Root package.json
{
  "workspaces": [
    "base",
    "base/layers/*", 
    "apps/*"
  ]
}
```

This enables:
- **Shared dependencies** across apps and base framework
- **Consistent versioning** through single `yarn.lock`
- **Cross-workspace imports** between base and apps
- **Unified testing** via `vitest.workspace.ts`

### Testing Architecture
Comprehensive testing setup across the monorepo:

```
Testing Structure:
├── vitest.workspace.ts       # Workspace-level test config
├── base/
│   ├── vitest.config.mjs     # Base framework tests
│   └── app/components/__test__/  # Component unit tests
└── apps/*/
    └── vitest.config.mjs     # App-specific tests
```

### Configuration Inheritance
Apps inherit and extend base configuration:

```typescript
// base/nuxt.config.ts - Base configuration
export default defineNuxtConfig({
  extends: ['@nuxt/ui-pro'],
  modules: ['@nuxt/eslint', '@nuxt/fonts', '@nuxt/ui', '@vueuse/nuxt', '@pinia/nuxt'],
  // Base settings...
})

// apps/restart-ukraine/nuxt.config.ts - App extension  
export default defineNuxtConfig({
  extends: ['../../base', '../../base/layers/auth', '../../base/layers/firebase'],
  // App-specific overrides...
})
```

## Current Architecture Strengths

### 1. **Modular Design**
- **Nuxt Layers** enable feature-specific modularity
- **Component library** promotes consistent UI patterns  
- **Store separation** by domain (data, drawing, features, etc.)

### 2. **Type Safety**
- **TypeScript throughout** with strict typing
- **Pinia stores** with type inference
- **Component props** with interface definitions

### 3. **Developer Experience**
- **Hot reloading** across workspace
- **ESLint integration** with consistent rules
- **Comprehensive testing** with Vitest

### 4. **Scalability Patterns**
- **Workspace isolation** prevents cross-app conflicts
- **Shared component library** ensures consistency
- **Layer system** allows selective feature inclusion

## Architecture Evolution Path

### Current State Assessment
The framework demonstrates solid **foundational architecture** but has opportunities for **component generalization**:

#### Well-Established Patterns ✅
- Monorepo structure with clear separation
- Nuxt layers for modular functionality
- TypeScript type safety throughout
- Comprehensive testing infrastructure
- Pinia state management patterns

#### Areas for Enhancement 🔧  
- **Component Prop Standardization**: Establish consistent prop interfaces across components
- **Data Source Abstraction**: Unify data fetching patterns across apps
- **Configuration-Driven UI**: Move toward more prop-driven component behavior
- **Cross-App Component Reuse**: Increase component sharing between apps
- **API Standardization**: Establish common API patterns and interfaces

## Conclusion

The Drawing Participation Framework provides a **solid architectural foundation** for multi-app development with:

- **Shared component library** in `base/app/components/`
- **Modular layer system** for feature extension
- **Consistent state management** through Pinia stores
- **Type-safe development** with TypeScript throughout
- **Scalable monorepo structure** supporting multiple applications

The current architecture successfully enables **code sharing** and **consistent patterns** across applications while maintaining **flexibility** for app-specific customizations. The next evolution step would be toward **increased component generalization** and **prop-driven configuration** to further reduce code duplication and accelerate development.
