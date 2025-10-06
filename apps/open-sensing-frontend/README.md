# Open Sensing Frontend

A comprehensive real-time environmental sensor monitoring dashboard built with Nuxt 3, featuring interactive maps, data visualization, and sensor management capabilities.

## Features

- **Real-time Sensor Monitoring**: Track environmental data from multiple sensors across campus locations
- **Interactive Map Dashboard**: Visualize sensor locations with Mapbox GL and OpenLayers integration
- **Data Visualization**: Dynamic charts and graphs using D3.js and ECharts
- **Smart Clustering**: DBSCAN algorithm for intelligent sensor grouping
- **Advanced Filtering**: Filter data by location, date range, and sensor types
- **Data Export**: Download sensor data in CSV or JSON formats
- **Responsive Design**: Mobile-friendly interface with dark mode support
- **Real-time Updates**: Live sensor data updates and status monitoring

## Architecture

### Frontend Stack
- **Framework**: Nuxt 3 (Vue.js)
- **Language**: TypeScript
- **State Management**: Pinia
- **Styling**: Tailwind CSS + Nuxt UI
- **Maps**: OpenLayers + Mapbox GL
- **Charts**: D3.js, ECharts
- **Testing**: Vitest + Vue Test Utils

### Backend & Database
- **Database**: PostgreSQL
- **ORM**: Knex.js
- **API**: Nuxt server routes
- **Real-time**: Server-sent events

## Sensor Data Types

The system monitors various environmental parameters:

- **Air Quality**: Temperature, Humidity, VOC, NOx
- **Particulate Matter**: PM1, PM25, PM4, PM10
- **Environmental**: BME280 (temperature, humidity, pressure)
- **Air Composition**: SCD41 (CO2, temperature, humidity)
- **Location**: GPS coordinates
- **System**: Battery level, signal strength

## Getting Started

### Prerequisites

- Node.js 20+ 
- PostgreSQL database
- Yarn or npm
- Mapbox access token

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/scalable-design-participation-lab/open-sensing-frontend.git
   cd open-sensing-frontend
   ```

2. **Install dependencies**
   ```bash
   yarn install
   # or
   npm install
   ```

3. **Environment Setup**
   ```bash
   cp .env.example .env
   ```

4. **Configure environment variables**
   ```env
   # Database Configuration
   DB_HOST=your_postgres_host
   DB_PORT=5432
   DB_NAME=neu_modules
   DB_USER=postgres
   DB_PASSWORD=your_password

   # Mapbox Access Token
   MAPBOX_ACCESS_TOKEN=your_mapbox_token

   # Nuxt UI Pro License (optional)
   NUXT_UI_PRO_LICENSE=your_license_key
   ```

5. **Database Setup**
   
   Create the required database tables:
   ```sql
   -- Core tables for sensor data
   CREATE TABLE modules (
     moduleid VARCHAR PRIMARY KEY,
     ecohub_location VARCHAR,
     lat DECIMAL,
     lon DECIMAL
   );

   CREATE TABLE sen55 (
     moduleid VARCHAR,
     temperature DECIMAL,
     relative_humidity DECIMAL,
     voc INTEGER,
     nox INTEGER,
     pm1 DECIMAL,
     pm25 DECIMAL,
     pm4 DECIMAL,
     pm10 DECIMAL,
     timestamp TIMESTAMP
   );
   
   CREATE TABLE bme280 (
     moduleid VARCHAR,
     temperature DECIMAL,
     humidity DECIMAL,
     pressure DECIMAL,
     timestamp TIMESTAMP
   );

    CREATE TABLE scd41 (
      moduleid VARCHAR,
      co2 DECIMAL,
      temperature DECIMAL,
      humidity DECIMAL,
      timestamp TIMESTAMP
    );

   ```

6. **Start Development Server**
   ```bash
   yarn dev
   # or
   npm run dev
   ```

   Visit http://localhost:3000

## Project Structure

```
open-sensing-frontend/
├── components/           # Vue components
│   ├── Dashboard/       # Dashboard components
│   ├── FilterSidebar/   # Filtering components
│   ├── MapDashboard/    # Map-related components
│   ├── SensorDetail/    # Sensor detail views
│   └── Toolbar/         # Toolbar components
├── stores/              # Pinia state stores
├── server/              # API routes
│   └── api/            # Server endpoints
├── utils/               # Utility functions
├── constants/           # Application constants
├── composables/         # Vue composables
└── static/             # Static assets
```

## Key Components

### Map Dashboard
The main interface displaying sensor locations on an interactive map with clustering and real-time updates.

### Sensor Detail View
Comprehensive sensor information including:
- Historical data charts
- Current readings
- Location information
- Status and maintenance data

### Data Filtering & Export
Advanced filtering capabilities:
- Date range selection
- Location-based filtering
- Sensor type selection
- Export to CSV/JSON

## Configuration

### Database Configuration
Update `knexfile.js` with your database credentials:

```javascript
export default {
  client: 'pg',
  connection: {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT,
  }
}
```

### Sensor Metrics
Customize monitored metrics in `constants/metrics.ts`:

```typescript
export const SENSOR_METRICS = {
  Temperature: { name: 'temperature', label: 'Temperature (°C)' },
  'Relative Humidity': { name: 'relative_humidity', label: 'Relative Humidity (%)' },
}
```

## Testing

Run the test suite:

```bash
# Run all tests
yarn test

# Run tests in watch mode
yarn test:watch

# Run tests with coverage
yarn test:coverage
```

## Building for Production

```bash
# Build the application
yarn build

# Preview the production build
yarn preview

# Generate static files
yarn generate
```

## Deployment

### Vercel (Recommended)
1. Connect your GitHub repository to Vercel
2. Add environment variables in Vercel dashboard
3. Deploy automatically on push to main branch

### Manual Deployment
```bash
yarn build
yarn start
```

## API Endpoints

### Sensor Data
- `GET /api/sensor-data` - Retrieve sensor data
- `POST /api/insert` - Insert new sensor readings
- `POST /api/download-sensor-data` - Export filtered data

### Database
- `GET /api/test-db` - Test database connection

## UI Components

The project uses Nuxt UI for consistent design:

- **Cards**: Sensor information displays
- **Buttons**: Interactive controls
- **Modals**: Detail views and dialogs
- **Forms**: Data input and filtering
- **Charts**: Data visualization

## State Management

Pinia stores handle application state:

- `sensorDetailStore`: Sensor selection and details
- `dashboardStore`: Dashboard state and data
- `filterStore`: Filtering options
- `mapStore`: Map configuration
- `datasetStore`: Dataset management

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Commit changes: `git commit -am 'Add feature'`
4. Push to branch: `git push origin feature-name`
5. Submit a pull request

## License

This project is licensed under the BSD 2-Clause License - see the [LICENSE](LICENSE) file for details.

## Organizations

**Scalable Design Participation Lab**
- Website: https://scalabledesignparticipation.org
- GitHub: https://github.com/scalable-design-participation-lab

**Northeastern University**
- Arboretum: https://pref.northeastern.edu/arboretum/

## Related Projects

- **Open Sensing Backend**: Sensor data collection and processing
- **Drawing Participation**: Interactive mapping participation tools
- **Restart Ukraine**: Mapping tools for neighborhood restoration

---

**Built with ❤️ by the Scalable Design Participation Lab**