# Release & OTA (electron-updater) — Bravo_Desktop

This document describes how releases and OTA updates work for this Electron app (using `electron-updater` + `electron-builder`) and how to publish new versions.

Summary
- Runtime: the app calls `autoUpdater.checkForUpdatesAndNotify()` to detect updates published to GitHub Releases.
- Build tooling: `electron-builder` produces installers/artifacts and `latest.yml` metadata consumed by `electron-updater`.

Local publish (manual)
1. Bump version in `package.json` (semver), e.g. `0.1.0` → `0.1.1`.
2. Commit your changes: `git add package.json && git commit -m "chore(release): v0.1.1"`.
3. Tag the commit: `git tag v0.1.1`.
4. Push the tag: `git push origin v0.1.1`.
5. Run the dist script with a token in env (uploads release assets to GitHub):
```powershell
$env:GITHUB_TOKEN = '<YOUR_PAT_OR_USE_SECRETS_IN_CI>'
npm run dist -- --publish=always
```

CI (recommended)
- The repository includes a GitHub Actions workflow in `.github/workflows/release.yml` which triggers on tag pushes `v*`.
- The workflow runs `npm ci` and then `npm run dist -- --publish=always`, using `GITHUB_TOKEN` (provided by Actions) to upload release assets.

Notes & tips
- Always bump `version` in `package.json` before creating a tag — `electron-updater` uses the app `version` to compare updates.
- For Windows installers we recommend NSIS (configured in `package.json.build.nsis`).
- For code signing (recommended) add certificates to your CI or signing service.
- Use `secrets.GITHUB_TOKEN` (available in Actions) or a PAT with `repo` scope for manual local publishing.
- If you want delta/differential updates, ensure electron-builder's blockmap files are produced (default for NSIS).

Renderer integration
- The renderer already listens for `update-available` and `update-downloaded` events via `preload.js` under `window.electronAPI.updates`.
- Show UI prompts on these events and call `window.electronAPI.updates.applyUpdate()` to install.

Troubleshooting
- If updates are not detected, verify that the release `latest.yml` is present in the published assets and that `package.json` `version` is higher than the running app.
- Check Actions logs for build/publish errors.
