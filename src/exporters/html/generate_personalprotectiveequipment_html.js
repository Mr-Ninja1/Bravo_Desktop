// Wrapper to support alternate formType/title matching for PPE exporter
module.exports = function generate(payloadWrapper) {
  try {
    const gen = require('./generate_ppe_log_html');
    return gen(payloadWrapper);
  } catch (e) {
    return `<!doctype html><html><body><pre>Missing PPE exporter: ${String(e)}</pre></body></html>`;
  }
};
