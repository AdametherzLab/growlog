import * as path from "path";
import * as fs from "fs";
import type { Plant, Observation, ObservationType, Logger, Storage, Config } from "./types";

function generateUUIDv4(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.floor(Math.random() * 16);
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export class JSONStorage implements Storage {
  private readonly plantsPath: string;
  private readonly observationsPath: string;

  constructor(private readonly config: Config) {
    this.plantsPath = path.join(config.dataDir, "plants.json");
    this.observationsPath = path.join(config.dataDir, "observations.json");
    this.ensureDataDir();
  }

  private ensureDataDir(): void {
    if (!fs.existsSync(this.config.dataDir)) {
      fs.mkdirSync(this.config.dataDir, { recursive: true });
    }
  }

  readPlants(): Plant[] {
    try {
      const raw = fs.readFileSync(this.plantsPath, "utf-8");
      return JSON.parse(raw) as Plant[];
    } catch (e) {
      return [];
    }
  }

  writePlants(plants: Plant[]): void {
    fs.writeFileSync(this.plantsPath, JSON.stringify(plants, null, 2), "utf-8");
  }

  readObservations(): Observation[] {
    try {
      const raw = fs.readFileSync(this.observationsPath, "utf-8");
      return JSON.parse(raw) as Observation[];
    } catch (e) {
      return [];
    }
  }

  writeObservations(observations: Observation[]): void {
    fs.writeFileSync(this.observationsPath, JSON.stringify(observations, null, 2), "utf-8");
  }

  exportToCSV(plantId?: string): string {
    const observations = this.readObservations();
    const filtered = plantId ? observations.filter(o => o.plantId === plantId) : observations;
    const headers = "id,plantId,type,value,unit,timestamp,notes";
    const rows = filtered.map(o =>
      `"${o.id}","${o.plantId}","${o.type}","${o.value}","${o.unit || ""}","${o.timestamp}","${o.notes || ""}"`
    );
    return [headers, ...rows].join("\n");
  }
}

export class GrowLogger implements Logger {
  private plants: Plant[] = [];
  private observations: Observation[] = [];

  constructor(private readonly storage: Storage) {
    this.plants = storage.readPlants();
    this.observations = storage.readObservations();
  }

  addPlant(plant: Omit<Plant, "id">): Plant {
    const newPlant: Plant = { ...plant, id: generateUUIDv4() };
    this.plants.push(newPlant);
    this.storage.writePlants(this.plants);
    return newPlant;
  }

  logObservation(observation: Omit<Observation, "id" | "timestamp">): Observation {
    const newObservation: Observation = {
      ...observation,
      id: generateUUIDv4(),
      timestamp: new Date().toISOString()
    };
    this.observations.push(newObservation);
    this.storage.writeObservations(this.observations);
    return newObservation;
  }

  getPlants(): Plant[] {
    return [...this.plants];
  }

  getObservations(plantId?: string): Observation[] {
    return plantId
      ? this.observations.filter(o => o.plantId === plantId)
      : [...this.observations];
  }

  getPlantHistory(plantId: string): Observation[] {
    return this.observations
      .filter(o => o.plantId === plantId)
      .sort((a, b) => { const diff = new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(); return diff !== 0 ? diff : -1; });
  }
}

export function createLogger(config: Config): Logger {
  const storage = new JSONStorage(config);
  return new GrowLogger(storage);
}