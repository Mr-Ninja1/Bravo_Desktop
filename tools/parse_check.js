const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, '..', 'renderer', 'renderer.js');
try {
  const src = fs.readFileSync(file, 'utf8');
  new Function(src);
  console.log('PARSE_OK');
} catch (e) {
  console.error('PARSE_ERROR');
  console.error(e && e.stack ? e.stack : e);
  process.exit(1);
}
