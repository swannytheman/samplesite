# Med spa concept sites

Sales demo sites for med spa prospects, built by Chicago AI Group. See README.md for the full guide.

- Every site is generated: `_template/template.html` + `_template/clients/<slug>.json` → `node _template/build.js` → `<slug>/index.html`. Never hand-edit a generated `<slug>/index.html`; change the JSON or the template, then rebuild.
- A new prospect means copying `_template/starter.json` to `_template/clients/<slug>.json`. Research the spa's real name, address, phone, hours, services, Google rating and review count, plus themes from their real reviews (such as staff names that come up). Check facts across sources and tell the user about any conflicts.
- Sample reviews are placeholders in the spa's style, and the footer says so. Never present them as real quotes.
- Match the theme colors to the spa's brand. The build enforces 4.5:1 contrast and prints a fix list when a config is invalid.
- After building, open the page in Playwright at 1280px and 375px wide. Click through booking, leaving a review and chat, and check for console errors and horizontal overflow.
