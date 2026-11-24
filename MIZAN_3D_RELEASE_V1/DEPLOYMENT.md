# MIZAN 3D V1.0 — Deployment

Static release. No build, npm install, API keys or server-side code are required.

1. Copy the contents of this folder (including .nojekyll, src and vendor) to the root of a GitHub repository. Keep index.html at the root.
2. In repository Settings → Pages, select Deploy from a branch, select the branch and / (root), then Save. This step publishes the app; it has not been performed for this delivery.
3. Open https://YOUR-NAME.github.io/YOUR-REPOSITORY/. Keep relative paths unchanged; do not move vendor or src independently.

For local inspection, serve this folder with an HTTP static server. Opening index.html with file:// does not support the application ES modules. WebGL2 and a modern browser supporting ES modules and import maps are required.

All 16 asset records and financial assumptions are fictional. This is an experimental decision-support prototype, not a validated operational digital twin. No live data connection, authentication, multi-user storage, Maintenance, Procurement or Budget workflows. Scenario saving uses this browser's local storage; exports are downloaded locally. Offline/PWA installation is not part of this frozen V1.0 release.

The full Three.js MIT licence is in vendor/THREE-LICENSE.txt; see THIRD_PARTY.md. No public deployment was performed.

Official GitHub guidance: [Configure a publishing source](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site) and [Create a GitHub Pages site](https://docs.github.com/en/pages/getting-started-with-github-pages/creating-a-github-pages-site).
