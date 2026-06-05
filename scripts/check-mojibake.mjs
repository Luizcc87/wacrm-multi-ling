import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const ROOTS = ['messages'];
const SUSPECT_PATTERNS = [
  /\u00c2[\u0080-\u00bf\u00ae\u00b7]/u,
  /\u00c3[\u0080-\u00bf]/u,
  /\u00e2[\u0080-\u20ff]/u,
];

function walk(dir) {
  const entries = readdirSync(dir);
  const files = [];
  for (const entry of entries) {
    const path = join(dir, entry);
    const stat = statSync(path);
    if (stat.isDirectory()) {
      files.push(...walk(path));
    } else if (/\.(json|ts|tsx|md)$/.test(entry)) {
      files.push(path);
    }
  }
  return files;
}

const failures = [];

for (const root of ROOTS) {
  for (const file of walk(root)) {
    const text = readFileSync(file, 'utf8');
    const lines = text.split(/\r?\n/);
    lines.forEach((line, index) => {
      if (SUSPECT_PATTERNS.some((pattern) => pattern.test(line))) {
        failures.push(`${file}:${index + 1}: ${line.trim()}`);
      }
    });
  }
}

if (failures.length) {
  console.error('Possible mojibake found:');
  console.error(failures.join('\n'));
  process.exit(1);
}
