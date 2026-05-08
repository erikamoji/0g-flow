import fs from 'fs';
import path from 'path';
import { executeManifest } from '../lib/executor';
import { Manifest } from '../lib/manifestCompiler';

async function main() {
  const manifestPath = process.argv[2];

  if (!manifestPath) {
    console.error('Usage: ts-node scripts/execute-manifest.ts <manifest-file.json>');
    console.error('Example: ts-node scripts/execute-manifest.ts ./manifest-wf_1234567890.json');
    process.exit(1);
  }

  const resolvedPath = path.resolve(manifestPath);

  if (!fs.existsSync(resolvedPath)) {
    console.error(`❌ Manifest file not found: ${resolvedPath}`);
    process.exit(1);
  }

  try {
    console.log(`\n📂 Loading manifest from: ${resolvedPath}\n`);
    const manifestContent = fs.readFileSync(resolvedPath, 'utf-8');
    const manifest: Manifest = JSON.parse(manifestContent);

    const result = await executeManifest(manifest);

    if (result.success) {
      console.log('📋 Execution Results:');
      console.log(JSON.stringify(result.results, null, 2));

      // Save results to file
      const resultsFile = `results-${manifest.workflow_id}.json`;
      fs.writeFileSync(resultsFile, JSON.stringify(result, null, 2));
      console.log(`\n💾 Results saved to: ${resultsFile}`);
    } else {
      console.error(`\n❌ Execution failed: ${result.error}`);
      process.exit(1);
    }
  } catch (error: any) {
    console.error(`❌ Error: ${error.message}`);
    process.exit(1);
  }
}

main();
