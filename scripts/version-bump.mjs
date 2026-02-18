#!/usr/bin/env node
import { createInterface } from 'node:readline';
import { execSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = join(__dirname, '..');
const pkg = JSON.parse(readFileSync(join(projectRoot, 'package.json'), 'utf-8'));
const current = pkg.version;
const [major, minor, patch] = current.split('.').map(Number);

const choices = {
  '1': { label: 'patch', next: `${major}.${minor}.${patch + 1}` },
  '2': { label: 'minor', next: `${major}.${minor + 1}.0` },
  '3': { label: 'major', next: `${major + 1}.0.0` },
  '4': { label: 'skip',  next: current },
};

console.log('');
console.log('  ╔══════════════════════════════════════╗');
console.log('  ║        VERSION BUMP                   ║');
console.log('  ╚══════════════════════════════════════╝');
console.log('');
console.log(`  Current version: ${current}`);
console.log('');
console.log(`  1) patch  ->  ${choices['1'].next}`);
console.log(`  2) minor  ->  ${choices['2'].next}`);
console.log(`  3) major  ->  ${choices['3'].next}`);
console.log(`  4) skip   ->  ${current}  (no change)`);
console.log('');

const rl = createInterface({ input: process.stdin, output: process.stdout });

rl.question('  Select version bump [1-4] (default: 1): ', (answer) => {
  rl.close();
  const key = answer.trim() || '1';
  const choice = choices[key];
  if (!choice) {
    console.error('  Invalid selection. Aborting deploy.');
    process.exit(1);
  }
  if (choice.label === 'skip') {
    console.log(`  Keeping version at ${current}\n`);
    return;
  }
  console.log(`  Bumping: ${current}  ->  ${choice.next}\n`);
  execSync(`npm version ${choice.label} --no-git-tag-version`, {
    cwd: projectRoot,
    stdio: 'inherit',
  });
});
