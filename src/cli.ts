import * as path from "path";
import * as fs from "fs";
import type { Logger, Storage, Plant, Observation, ObservationType, Config, CLIArgs } from "./types";

export function parseArgs(args: string[]): CLIArgs {
  const [command, ...rest] = args;
  const parsed: Partial<CLIArgs> = { command: command as CLIArgs["command"] };

  for (let i = 0; i < rest.length; i += 2) {
    const key = rest[i].replace(/^--?/, "");
    const value = rest[i + 1];
    if (value === undefined) continue;

    switch (key) {
      case "plant-id":
        parsed.plantId = value;
        break;
      case "name":
        parsed.name = value;
        break;
      case "species":
        parsed.species = value;
        break;
      case "type":
        parsed.type = value as ObservationType;
        break;
      case "value":
        parsed.value = value;
        break;
      case "unit":
        parsed.unit = value;
        break;
      case "notes":
        parsed.notes = value;
        break;
      case "output":
        parsed.output = value;
        break;
    }
  }

  return parsed as CLIArgs;
}

export function formatPlant(plant: Plant): string {
  return `ID: ${plant.id}\nName: ${plant.name}\nSpecies: ${plant.species}\nPlanted: ${plant.plantedAt}\nNotes: ${plant.notes || "-"}`;
}

export function formatObservation(obs: Observation): string {
  return `${obs.timestamp} [${obs.type}] ${obs.value}${obs.unit ? ` ${obs.unit}` : ""}\nNotes: ${obs.notes || "-"}`;
}

export function formatHistory(plant: Plant, observations: Observation[]): string {
  return `${formatPlant(plant)}\n\nObservations (${observations.length}):\n${observations.map(formatObservation).join("\n\n")}`;
}

export function runCLI(args: string[], logger: Logger, storage: Storage, config: Config): void {
  const parsed = parseArgs(args);
  try {
    switch (parsed.command) {
      case "add":
        if (!parsed.name || !parsed.species) {
          console.error("Error: --name and --species are required for 'add'");
          process.exit(1);
        }
        const newPlant = logger.addPlant({
          name: parsed.name,
          species: parsed.species,
          plantedAt: new Date().toISOString(),
          notes: parsed.notes
        });
        console.log(`Added plant: ${newPlant.name} (${newPlant.id})`);
        break;

      case "log":
        if (!parsed.plantId || !parsed.type || !parsed.value) {
          console.error("Error: --plant-id, --type, and --value are required for 'log'");
          process.exit(1);
        }
        const obs = logger.logObservation({
          plantId: parsed.plantId,
          type: parsed.type,
          value: isNaN(Number(parsed.value)) ? parsed.value : Number(parsed.value),
          unit: parsed.unit,
          notes: parsed.notes,
        });
        console.log(`Logged observation: ${obs.type} = ${obs.value}${obs.unit ? ` ${obs.unit}` : ""}`);
        break;

      case "history":
        if (!parsed.plantId) {
          console.error("Error: --plant-id is required for 'history'");
          process.exit(1);
        }
        const plant = logger.getPlants().find(p => p.id === parsed.plantId);
        if (!plant) {
          console.error(`Error: Plant with ID ${parsed.plantId} not found`);
          process.exit(1);
        }
        const history = logger.getPlantHistory(parsed.plantId);
        console.log(formatHistory(plant, history));
        break;

      case "export":
        const csv = storage.exportToCSV(parsed.plantId);
        const outputPath = parsed.output || path.join(config.dataDir, `export-${parsed.plantId || "all"}.csv`);
        fs.writeFileSync(outputPath, csv);
        console.log(`Exported data to ${outputPath}`);
        break;

      case "list":
        const plants = logger.getPlants();
        if (plants.length === 0) {
          console.log("No plants found.");
        } else {
          console.log(`Plants (${plants.length}):`);
          plants.forEach(p => console.log(`- ${p.name} (${p.id})`));
        }
        break;

      default:
        console.error(`Unknown command: ${parsed.command}`);
        process.exit(1);
    }
  } catch (err) {
    console.error(`Error: ${err instanceof Error ? err.message : String(err)}`);
    process.exit(1);
  }
}