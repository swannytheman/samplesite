# Med Spa Concept Sites

Personalized demo websites for med spa prospects, built by Chicago AI Group. Every site comes from one shared template. Each prospect gets one small settings file (JSON) with their name, address, hours, services, reviews and brand colors.

Each site shows the two things we sell:

- **24/7 online booking:** a working 3-step booking demo that follows the spa's real hours
- **Fast review replies:** sample reviews with "Replied in 2 hrs" badges, plus a live demo where the prospect leaves a review and gets a reply within seconds

Each site also includes a chat concierge, a hidden-from-Google setting, link previews for texts and emails, and accessibility checks.

## Current sites

| Prospect | Settings file | Live link (once GitHub Pages is on) |
|---|---|---|
| SOLUX Med Spa | `_template/clients/solux-medspa.json` | https://swannytheman.github.io/samplesite/solux-medspa/ |

## Make a site for a new prospect

**The easy way:** ask Claude:
> Make a concept site for **[spa name]**, website **[their URL]**.

Claude will research the spa, fill in the settings file, build the site, and push it.

**By hand:**

1. Copy `_template/starter.json` to `_template/clients/<their-slug>.json`, for example `glow-aesthetics.json`.
2. Edit the details (see the field guide below).
3. Run `node _template/build.js`.
4. Open `<their-slug>/index.html` in your browser to check it.
5. Commit and push. The link will be `https://swannytheman.github.io/samplesite/<their-slug>/`

If something in the settings file is wrong, the build tells you exactly what to fix, for example "hours.tue must look like 10:00-17:00".

## Field guide

| Field | What it is | Example |
|---|---|---|
| `slug` | The web address for the site. Lowercase letters and dashes only. | `"glow-aesthetics"` |
| `builtBy` | Shown in the top banner and the footer | `"Chicago AI Group"` |
| `business.name` / `shortName` | Full name, and the short name used in the logo | `"Glow Aesthetics"` / `"GLOW"` |
| `business.logoTagline` | Small text under the logo | `"AESTHETICS · LINCOLN PARK"` |
| `contact` | Phone, street, city/state/ZIP, and an optional email | |
| `hours` | Opening hours for each day on a 24-hour clock. Use `null` for closed days. | `"tue": "10:00-17:00"`, `"sun": null` |
| `rating` | Their real star rating, review count and review site | `4.6`, `128`, `"Google"` |
| `pitch.replyPromise` / `avgReplyTime` | The review-reply speed the site promises | `"< 24h"`, `"3 hrs"` |
| `pitch.showConceptBanner` | Set to `false` to hide the "Website concept" banner at the top | `true` |
| `theme` | 5 brand colors. The build rejects colors that would be hard to read. | see `starter.json` |
| `hero` | Main headline (two lines), the small label above it, and the paragraph below it | |
| `hero.image` / `about.image` | Optional photo: a full `https://` link, or a file saved next to the site | `"images/hero.jpg"` |
| `hero.recentBooking` | Optional "Jordan just booked…" popup | |
| `services.list` | 6–9 treatments. Each has a `name`, `icon`, `minutes`, `description` and optional `price`. | |
| `reviews` | 3 sample reviews, each with a reply. Use 3 or 6 so the grid fills evenly. | |
| `about` | Headline, short paragraph and exactly 4 "pillars" | |

**Icons:** `syringe`, `drop`, `wave`, `sun`, `sparkle`, `leaf`, `body`, `iv`, `lips`, `heart`

## Before you send a site

- Check the address, phone and hours against the spa's own website. Directory listings are often out of date.
- The reviews are **placeholders** written in the style of the spa's real reviews, and the site says so in its footer. Don't present them as real.
- Adding the spa's logo and real photos (`hero.image`, `about.image`) makes the biggest difference.
- Every site tells search engines not to list it, so it won't show up when someone searches for the spa's name.

## Files

```
_template/
  template.html      the shared design (edit this to change every site)
  build.js           turns a settings file into a finished site
  starter.json       starting point for a new prospect (not published)
  clients/*.json     one settings file per prospect
<slug>/index.html    finished sites (generated: don't edit by hand)
```

GitHub Pages only publishes the finished sites. The `_template` folder and this README stay private to the repo.
