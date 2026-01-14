RAJAB CULTURE DIGITAL SOLUTIONS — Purchase landing page

This is a small static purchase/marketing page intended to be hosted on GitHub Pages.

Files:
- index.html — the landing page
- styles.css — styles used by the page

Quick deploy (Git + GitHub):
1. Create a new GitHub repo (e.g. `rc-digital-purchase`).
2. Copy these files into the repo root (or this `purchase/` folder) and commit.

Commands:
```bash
git init
git add .
git commit -m "Add purchase landing page"
git remote add origin https://github.com/<your-org>/<repo>.git
git push -u origin main
```

3. Enable GitHub Pages in the repository settings (use `main` branch / `/ (root)` or `gh-pages` branch).
4. Update the buy link in `index.html` (`#buyBtn` href) to your real purchase URL or payment provider.

Optionally: add `?from=app` to the link in your app to capture where purchases originated.

Replace contact/email placeholders before publishing.

Contact:
- Email: sikalumbit30@gmail.com
- Phone: 0970105334

Form handling:
- The order form in `index.html` posts to Formspree by default. Replace the `action` attribute on the form (`https://formspree.io/f/your-form-id`) with your Formspree form ID or another submission endpoint before going live.

Analytics:
- The page contains a lightweight local analytics tracker that logs events to localStorage under `_rc_analytics_events` and will call `window.electronAPI.sendAnalytics(...)` if your app exposes that bridge. Use these if you want to collect conversion events back in the app.
