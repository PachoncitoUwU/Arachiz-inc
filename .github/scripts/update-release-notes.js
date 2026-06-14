/**
 * Script llamado por el workflow de GitHub Actions.
 * Lee los commits del push y los inserta como nueva entrada
 * en frontend/src/config/version.js
 *
 * Uso: node .github/scripts/update-release-notes.js <version> <commits_json>
 *   version      → ej: "1.4.300"
 *   commits_json → JSON array de strings, ej: '["feat: nuevo login","fix: bug X"]'
 */

const fs = require('fs');
const path = require('path');

const [,, version, commitsJson] = process.argv;

if (!version || !commitsJson) {
  console.error('Uso: node update-release-notes.js <version> <commits_json>');
  process.exit(1);
}

let commits;
try {
  commits = JSON.parse(commitsJson);
} catch {
  console.error('commits_json no es un JSON válido:', commitsJson);
  process.exit(1);
}

// Filtrar commits de bot y vacíos
const changes = commits
  .filter(c => c && !c.startsWith('chore: bump version') && c.trim() !== '')
  .slice(0, 12); // máximo 12 cambios

if (changes.length === 0) {
  changes.push('Mejoras y correcciones generales');
}

// Fecha actual en formato YYYY-MM-DD
const date = new Date().toISOString().slice(0, 10);

// Construir la nueva entrada
const newEntry = {
  version,
  date,
  title: `Actualización ${version}`,
  changes,
};

// Leer el archivo actual
const versionFilePath = path.join(__dirname, '../../frontend/src/config/version.js');
let content = fs.readFileSync(versionFilePath, 'utf8');

// 1. Actualizar VERSION
content = content.replace(
  /export const VERSION = '[^']+';/,
  `export const VERSION = '${version}';`
);

// 2. Insertar nueva entrada al inicio del array RELEASE_NOTES
const entryStr = `  {
    version: '${newEntry.version}',
    date: '${newEntry.date}',
    title: '${newEntry.title}',
    changes: [
${newEntry.changes.map(c => `      '${c.replace(/'/g, "\\'")}'`).join(',\n')}
    ]
  },`;

content = content.replace(
  /export const RELEASE_NOTES = \[/,
  `export const RELEASE_NOTES = [\n${entryStr}`
);

fs.writeFileSync(versionFilePath, content, 'utf8');
console.log(`✅ version.js actualizado → ${version} con ${changes.length} cambios`);
