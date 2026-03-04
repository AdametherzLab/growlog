# 🌱 growlog — Your Plant's Personal Diary

Track every sip, every sunbeam, and every growth spurt with **growlog** — the CLI tool that turns you into a plant whisperer. Log watering, fertilizer, light, temp, and humidity so you never forget when your fiddle-leaf fig is thirsty again.

---

## 🚀 Quick Start

```bash
# Install globally
bun add -g growlog
# or
npm install -g growlog

# Add your first plant
growlog add --name "Monstera Deliciosa" --species "Monstera deliciosa" --location "Living room"

# Log a watering
growlog log --plant "Monstera Deliciosa" --type water --amount 250 --unit ml

# See history
growlog show --plant "Monstera Deliciosa"
```

---

## 📦 Installation

### Global (recommended for CLI use)

```bash
bun add -g growlog
# or
npm install -g growlog
```

### Local (for programmatic use)

```bash
bun add growlog
# or
npm install growlog
```

---

## 📖 API

### Core Types

```typescript
interface Plant {
  id: string;
  name: string;
  species?: string;
  location?: string;
  plantedAt?: string; // ISO date
}

type ObservationType = 'water' | 'fertilizer' | 'light' | 'temp' | 'humidity';

interface Observation {
  id: string;
  plantId: string;
  type: ObservationType;
  value: number;       // amount in unit
  unit: string;       // e.g., "ml", "lux", "°C", "%"
  notes?: string;
  timestamp: string;  // ISO datetime
}
```

### Logger & Storage

```typescript
import { createLogger, JSONStorage } from 'growlog';

const storage = new JSONStorage({ dataDir: '~/.growlog' });
const logger = createLogger({ storage });

// Add a plant
const plant = await logger.addPlant({
  name: 'Aloe Vera',
  species: 'Aloe barbadensis miller',
  location: 'Kitchen windowsill'
});

// Log an observation
await logger.addObservation({
  plantId: plant.id,
  type: 'water',
  value: 100,
  unit: 'ml',
  notes: 'Bottom watering'
});

// Query history
const history = await logger.getObservations({ plantId: plant.id });
```

---

## 🧪 Examples

### Track Light Exposure

```typescript
await logger.addObservation({
  plantId: plant.id,
  type: 'light',
  value: 12,
  unit: 'hours',
  notes: 'Moved to brighter spot'
});
```

### Export to CSV

```typescript
import { exportToCSV } from 'growlog';

const csv = await exportToCSV(logger, { plantId: plant.id });
fs.writeFileSync('monstera-history.csv', csv);
```

---

## 🤝 Contributing

Found a bug? Want a new feature? Open an issue or PR! We love plant nerds and code nerds alike.

1. Fork it
2. `bun install`
3. Hack away
4. Test it: `bun test`
5. Open a PR

---

## 📄 License

MIT © AdametherzLab

---

**Happy growing!** 🌿💧☀️