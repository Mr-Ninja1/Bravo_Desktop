// Export utilities stubbed out.
// The export/capture behavior is centralized in renderer/renderer.js.
// To avoid per-form export logic interfering with capture, this module
// intentionally returns neutral values. Do not rely on this helper for
// export-sizing — the renderer will capture the modal as-is.
export const A4_WIDTH = 1000;
export function computeExportWidths(/* colMap = {}, tableWidthOverride */) {
  return { exportWidths: {}, containerStyle: {}, tableWidth: null };
}

export default { A4_WIDTH, computeExportWidths };
