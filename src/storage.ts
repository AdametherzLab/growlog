import * as path from "path";
import * as fs from "fs";
import type { Plant, Observation, Config, Storage } from "./types";

export class JsonStorage implements Storage {
  private readonly plantsPath: string;
  private readonly observationsPath: string;

  constructor(private config: Config) {
    this.plantsPath = path.join(config.dataDir, "plants.json");
    this.observationsPath = path.join(config.dataDir, "observations.json");
    this.ensureDataDir();
  }

  private ensureDataDir(): void {
    if (!fs.existsSync(this.config.dataDir)) {
      fs.mkdirSync(this.config.dataDir, { recursive: true });
    }
  }

  private readJson<T>(filePath: string): T[] {
    if (!fs.existsSync(filePath)) {
      return [];
    }
    const raw = fs.readFileSync(filePath, "utf-8");
    return JSON.parse(raw) as T[];
  }

  private writeJson<T>(filePath: string, data: T[]): void {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf-8");
  }

  readPlants(): Plant[] {
    return this.readJson<Plant>(this.plantsPath);
  }

  writePlants(plants: Plant[]): void {
    this.writeJson<Plant>(this.plantsPath, plants);
  }

  readObservations(): Observation[] {
    return this.readJson<Observation>(this.observationsPath);
  }

  writeObservations(observations: Observation[]): void {
    this.writeJson<Observation>(this.observationsPath, observations);
  }

  exportToCSV(plantId?: string): string {
    const observations = this.readObservations();
    const filtered = plantId
      ? observations.filter((o) => o.plantId === plantId)
      : observations;

    const headers = [
      "id",
      "plantId",
      "type",
      "value",
      "unit",
      "timestamp",
      "notes",
    ];
    const rows = filtered.map((o) =>
      headers
        .map((h) => {
          const val = o[h as keyof Observation];
          return typeof val === "string" ? `"${val.replace(/"/g, '""')}"` : val;
        })
        .join(",")
    );
    return [headers.join(","), ...rows].join("\n");
  }
}