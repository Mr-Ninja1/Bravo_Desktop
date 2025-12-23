#!/usr/bin/env node
/*
  scaffold_exporters.js
  Scans the forms presentational components and creates exporter stubs under src/exporters/html
  Usage: node src/exporters/scaffold_exporters.js
*/
const fs = require('fs');
const path = require('path');

const ROOT = process.cwd();
const componentsDir = path.join(ROOT, 'src', 'forms', 'components');
const outDir = path.join(ROOT, 'src', 'exporters', 'html');

function slugFor(name) {
  return name.replace(/Presentational$/i, '')
    .replace(/[^a-zA-Z0-9]+/g, '_')
    .replace(/__+/g, '_')
    .replace(/^_|_$/g, '')
    .toLowerCase();
}

function titleFor(name) {
  return name.replace(/Presentational$/i, '')
    .replace(/[_\-]+/g, ' ')
    .replace(/\b(\w)/g, s => s.toUpperCase())
    .trim();
}

if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

if (!fs.existsSync(componentsDir)) {
  console.error('Components directory not found:', componentsDir);
  process.exit(1);
}

const files = fs.readdirSync(componentsDir).filter(f => f.endsWith('Presentational.js'));
if (!files.length) {
  console.log('No Presentational components found in', componentsDir);
  process.exit(0);
}

files.forEach(f => {
  const base = path.basename(f, '.js');
  const slug = slugFor(base);
  const title = titleFor(base);
  const outName = `generate_${slug}_html.js`;
  const outPath = path.join(outDir, outName);
  if (fs.existsSync(outPath)) {
    console.log('Skipping existing exporter:', outName);
    return;
  }

  // Basic stub that imports the template and exports a simple wrapper
  const stub = `const template = require('../template_exporter');\n\nmodule.exports = function generate(payload) {\n  // Customize this file to match the presentational component: ${base}\n  const html = template(payload, { title: ${JSON.stringify(title)} });\n  return html.replace('<!-- EXPORTER_BODY_MARKER -->', `\n    <div style="padding:8px;color:#374151">Stub for ${title}. Replace with custom table HTML.</div>\n  `);\n};\n`;

  fs.writeFileSync(outPath, stub, 'utf8');
  console.log('Created exporter stub:', outName);
});

console.log('\nDone. Review stubs in', outDir);
