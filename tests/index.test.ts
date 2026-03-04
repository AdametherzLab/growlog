import { describe, it, expect, beforeEach, afterEach } from "bun:test";
import * as path from "path";
import * as fs from "fs";
import { createLogger, JsonStorage, parseArgs, formatPlant, formatObservation, formatHistory } from "../src/index";
import type { Plant, Observation, Config } from "../src/index";

const TEST_DIR = path.join(__dirname, "..", ".test-data");

function cleanupTestDir() {
  if (fs.existsSync(TEST_DIR)) {
    fs.rmSync(TEST_DIR, { recursive: true, force: true });
  }
}

describe("GrowLogger Core Functionality", () => {
  let config: Config;
  let logger: ReturnType<typeof createLogger>;
  let storage: JsonStorage;

  beforeEach(() => {
    cleanupTestDir();
    config = { dataDir: TEST_DIR };
    storage = new JsonStorage(config);
    logger = createLogger(config);
  });

  afterEach(() => {
    cleanupTestDir();
  });

  it("should add a plant and retrieve it", () => {
    const plant = logger.addPlant({
      name: "Rosemary",
      species: "Rosmarinus officinalis",
      plantedAt: new Date().toISOString(),
    });

    expect(plant).toBeObject();
    expect(plant.id).toBeString();
    expect(plant.name).toBe("Rosemary");

    const plants = logger.getPlants();
    expect(plants.length).toBe(1);
    expect(plants[0].name).toBe("Rosemary");
  });

  it("should log an observation and retrieve it", () => {
    const plant = logger.addPlant({
      name: "Basil",
      species: "Ocimum basilicum",
      plantedAt: new Date().toISOString(),
    });

    const obs = logger.logObservation({
      plantId: plant.id,
      type: "watering",
      value: 200,
      unit: "ml",
      notes: "First watering",
    });

    expect(obs).toBeObject();
    expect(obs.id).toBeString();
    expect(obs.timestamp).toBeString();
    expect(obs.type).toBe("watering");

    const observations = logger.getObservations(plant.id);
    expect(observations.length).toBe(1);
    expect(observations[0].value).toBe(200);
  });

  it("should return plant history sorted by timestamp (newest first)", () => {
    const plant = logger.addPlant({
      name: "Mint",
      species: "Mentha",
      plantedAt: new Date().toISOString(),
    });

    const obs1 = logger.logObservation({
      plantId: plant.id,
      type: "watering",
      value: 100,
      unit: "ml",
    });

    const obs2 = logger.logObservation({
      plantId: plant.id,
      type: "light",
      value: 12,
      unit: "hours",
    });

    const history = logger.getPlantHistory(plant.id);
    expect(history.length).toBe(2);
    expect(history[0].id).toBe(obs2.id); // Newest first
    expect(history[1].id).toBe(obs1.id);
  });

  it("should export observations to CSV format", () => {
    const plant = logger.addPlant({
      name: "Thyme",
      species: "Thymus vulgaris",
      plantedAt: new Date().toISOString(),
    });

    logger.logObservation({
      plantId: plant.id,
      type: "temperature",
      value: 22,
      unit: "°C",
    });

    const csv = storage.exportToCSV(plant.id);
    expect(csv).toBeString();
    expect(csv.split("\n").length).toBeGreaterThan(1);
    expect(csv).toContain("temperature");
    expect(csv).toContain("22");
  });

  it("should parse CLI arguments correctly", () => {
    const args = ["log", "--plant-id", "123", "--type", "watering", "--value", "200", "--unit", "ml"];
    const parsed = parseArgs(args);

    expect(parsed.command).toBe("log");
    expect(parsed.plantId).toBe("123");
    expect(parsed.type).toBe("watering");
    expect(parsed.value).toBe("200");
    expect(parsed.unit).toBe("ml");
  });

  it("should format plant and observation for display", () => {
    const plant: Plant = {
      id: "test-123",
      name: "Lavender",
      species: "Lavandula",
      plantedAt: "2023-01-01T00:00:00.000Z",
      notes: "Sunny spot",
    };

    const formatted = formatPlant(plant);
    expect(formatted).toContain("Lavender");
    expect(formatted).toContain("Lavandula");
    expect(formatted).toContain("Sunny spot");

    const obs: Observation = {
      id: "obs-456",
      plantId: "test-123",
      type: "humidity",
      value: 60,
      unit: "%",
      timestamp: "2023-01-02T12:00:00.000Z",
      notes: "Afternoon reading",
    };

    const formattedObs = formatObservation(obs);
    expect(formattedObs).toContain("humidity");
    expect(formattedObs).toContain("60 %");
    expect(formattedObs).toContain("Afternoon reading");

    const formattedHistory = formatHistory(plant, [obs]);
    expect(formattedHistory).toContain("Lavender");
    expect(formattedHistory).toContain("humidity");
  });
});