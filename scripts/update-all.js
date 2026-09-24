import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
export const OUTPUTS = ["countries.json", "countries-core.json", "countries-detail.json", "og-data.json", "wb-latest.json", "wb-history.json", "sdg-latest.json"];

// Restore the previous snapshot if any stage fails, including validation.
export function withRollback(directory, run) {
  const snapshot = OUTPUTS.map(name => {
    const file = path.join(directory, name);
    return [file, fs.existsSync(file) ? fs.readFileSync(file) : null];
  });
  try {
    run();
  } catch (error) {
    for (const [file, contents] of snapshot) {
      if (contents === null) fs.rmSync(file, { force: true });
      else fs.writeFileSync(file, contents);
    }
    throw error;
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  try {
    withRollback(path.join(ROOT, "public"), () => {
      for (const script of ["build-countries", "fetch-world-bank-data", "fetch-un-sdg-data", "split-countries", "validate-schema", "verify-generated-data", "check-updates"]) {
        execFileSync(process.execPath, [path.join(ROOT, "scripts", `${script}.js`)], { stdio: "inherit" });
      }
    });
  } catch (error) {
    console.error(`Update failed; restored previous data snapshot. ${error.message}`);
    process.exitCode = 1;
  }
}
