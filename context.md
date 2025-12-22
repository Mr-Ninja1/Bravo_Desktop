# Desktop Companion — Context & Goals

Purpose
- Companion Electron app for ChecklistApp mobile that lists saved forms (from Dropbox or local storage), previews them, and creates higher-quality PDFs for desktop printing and archiving.

Primary goals
- Provide an easy way to preview saved forms on Windows/macOS/Linux.
- Produce high-quality, print-ready PDFs (selectable text when possible) using a web renderer (Puppeteer/headless Chromium) or HTML-to-PDF tool.
- Preserve visual parity with the mobile app's presentational components where practical; otherwise, preview the saved HTML/screenshots.

Key behaviors / requirements
- Authenticate with Dropbox (or accept file upload) and list saved form files in the app folder.
- Allow previewing a selected form in a WebView/iframe. If the saved form is an image-based export (screenshot), display it directly.
- Export selected form to PDF using a desktop-quality renderer (Puppeteer recommended) and allow saving to disk.
- Keep the UI visually consistent with mobile splash and saved-forms screens for a cohesive experience.

Where to find mobile references
- Mobile splash screen: `src/screens/SplashScreen.js`
- Saved-form rendering: `src/components/SavedFormRenderer.js` (ensure captureRef attaches to the top-level ScrollView)
- App logo and assets: `src/assets/` (e.g., `src/assets/logo.jpeg`)

Developer notes / implementation suggestions
- Use Electron (main, preload, renderer). The repo already contains a starter in the `Desktop/` folder:
  - `Desktop/main.js` — main process
  - `Desktop/preload.js` — contextBridge helpers
  - `Desktop/renderer/index.html` — basic UI
  - `Desktop/renderer/renderer.js` — UI logic scaffolded
- For Dropbox integration use the official `dropbox` SDK in the Desktop app. To preview files downloaded from Dropbox, prefer `filesDownload` and create an object URL or write the file to a temp directory.
- For high-quality PDF generation, prefer Puppeteer (headless Chromium) from the main process or spawn a Node worker. Alternative: use HTML/CSS templates and `pdf-lib` if you must avoid headless Chromium.
- If you want pixel-perfect parity with mobile presentational components, the safest path is to reuse saved screenshots produced by the mobile app (they are already faithful), but those PDFs will contain images and not selectable text. For selectable text, render the form data via an HTML/CSS template in the desktop app and print via headless Chromium.

Practical next steps (how to continue from here)
1. Ensure `SavedFormRenderer` accepts a forwarded ref and attaches it to the top-level ScrollView so the mobile `ViewDocumentModal` can capture full-form screenshots reliably.
2. Update Desktop renderer UI to visually match `src/screens/SplashScreen.js` (logo, background, CTA) so onboarding matches mobile.
3. Implement Dropbox auth/token flow in the renderer. For initial testing, the scaffold accepts a token via prompt.
4. Implement `filesDownload` + preview and a "Export to PDF" button that calls a main-process IPC endpoint which uses Puppeteer to open the preview HTML and create a PDF.
5. Add tests/manual QA: verify exported PDFs match expected page size (A4/Letter), orientation, and handle wide tables via landscape export when needed.

Dev / run instructions
- From the repo root run:

```bash
cd Desktop
npm install
npm start
```

- To package for Windows (example using `electron-packager`):

```bash
# from Desktop/
npm run pack
```

Security notes
- Do not commit Dropbox access tokens to the repo. Use environment variables or an OAuth flow.
- Limit the Electron `preload.js` API to minimal needed IPC endpoints to reduce attack surface.

Checklist for future chat prompt (use this file to re-seed a new chat):
- Mention: "Goal: build Electron companion to list saved forms from Dropbox, preview, and export high-quality PDFs. Use `src/screens/SplashScreen.js` and `src/components/SavedFormRenderer.js` as visual refs. Start with `Desktop/` scaffold. Ensure `SavedFormRenderer` supports forwarded ref for screenshot capture." 

-- End of context.md
