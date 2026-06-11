const fs = require('fs');
const path = require('path');

const basePath = path.join(__dirname, 'frontend', 'src');
const pagesPath = path.join(basePath, 'pages', 'superuser');
const compPath = path.join(basePath, 'components', 'superuser');

if (!fs.existsSync(pagesPath)) fs.mkdirSync(pagesPath, { recursive: true });
if (!fs.existsSync(compPath)) fs.mkdirSync(compPath, { recursive: true });

const pages = ['Dashboard.jsx', 'Usuarios.jsx', 'Fichas.jsx', 'Materias.jsx', 'Database.jsx', 'Excusas.jsx', 'Backup.jsx', 'Logs.jsx', 'Estadisticas.jsx'];
const comps = ['ConfirmationModal.jsx', 'UserDetailModal.jsx', 'EditUserModal.jsx', 'DatabaseTableViewer.jsx', 'LogDetailModal.jsx'];

pages.forEach(p => {
  const name = p.replace('.jsx', '');
  fs.writeFileSync(path.join(pagesPath, p), `import React from 'react';\n\nexport default function ${name}() {\n  return (\n    <div className="p-6">\n      <h1 className="text-2xl font-bold mb-4">${name}</h1>\n      <p>Vista en construcción...</p>\n    </div>\n  );\n}\n`);
});

comps.forEach(c => {
  const name = c.replace('.jsx', '');
  fs.writeFileSync(path.join(compPath, c), `import React from 'react';\n\nexport default function ${name}() {\n  return <div>${name}</div>;\n}\n`);
});
console.log('Scaffolding complete');
