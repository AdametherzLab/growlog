import * as path from "path";

export interface Plant {
  readonly id: string;
  name: string;
  species: string;
  plantedAt: string;
  notes?: string;
}

export interface Observation {
  readonly id: string;
  plantId: string;
  type: ObservationType;
  value: number | string;
  unit?: string;
  timestamp: string;
  notes?: string;
}

export type ObservationType =
  | "watering"
  | "fertilizer"
  | "light"
  | "temperature"
  | "humidity"
  | "pruning"
  | "repotting"
  | "harvest"
  | "other";

export interface Config {
  readonly dataDir: string;
  readonly maxEntries?: number;
}

export interface Logger {
  addPlant(plant: Omit<Plant, "id">): Plant;
  logObservation(observation: Omit<Observation, "id" | "timestamp">): Observation;
  getPlants(): Plant[];
  getObservations(plantId?: string): Observation[];
  getPlantHistory(plantId: string): Observation[];
}

export interface Storage {
  readPlants(): Plant[];
  writePlants(plants: Plant[]): void;
  readObservations(): Observation[];
  writeObservations(observations: Observation[]): void;
  exportToCSV(plantId?: string): string;
}

export interface CLIArgs {
  command: "add" | "log" | "history" | "export" | "list";
  plantId?: string;
  name?: string;
  species?: string;
  type?: ObservationType;
  value?: string;
  unit?: string;
  notes?: string;
  output?: string;
}

export interface QueryOptions {
  plantId?: string;
  limit?: number;
  type?: ObservationType;
}