#!/usr/bin/env node
// Builds client concept sites from template.html + one JSON file per client.
//
//   node _template/build.js                         build every _template/clients/*.json into ./<slug>/
//   node _template/build.js _template/clients/x.json  build one client into ./<slug>/
//   node _template/build.js some.json out/dir        build one client into a custom folder
//
// No dependencies; needs Node 16+.
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const TEMPLATE = fs.readFileSync(path.join(__dirname, 'template.html'), 'utf8');
const ICONS = ['syringe', 'drop', 'wave', 'sun', 'sparkle', 'leaf', 'body', 'iv', 'lips', 'heart'];
const DAYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
const HEX = /^#[0-9a-f]{6}$/i;
const HOURS_RE = /^([01]\d|2[0-3]):([0-5]\d)-([01]\d|2[0-3]):([0-5]\d)$/;

const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const get = (o, p) => p.split('.').reduce((v, k) => (v == null ? undefined : v[k]), o);

// WCAG contrast ratio between two #rrggbb colours
function contrast(a, b) {
  const lum = hex => {
    const [r, g, bl] = [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16) / 255)
      .map(c => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
    return 0.2126 * r + 0.7152 * g + 0.0722 * bl;
  };
  const [l1, l2] = [lum(a), lum(b)].sort((x, y) => y - x);
  return (l1 + 0.05) / (l2 + 0.05);
}

function validate(c) {
  const errors = [], warnings = [];
  const need = p => { const v = get(c, p); if (v === undefined || v === null || v === '') errors.push(`"${p}" is required`); return v; };

  if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(c.slug || '')) errors.push('"slug" must be lowercase letters, numbers and dashes (it becomes the URL), e.g. "glow-medspa"');
  ['business.name', 'business.shortName', 'business.logoTagline',
    'contact.phone', 'contact.street', 'contact.cityStateZip',
    'rating.stars', 'rating.count', 'rating.source',
    'hero.eyebrow', 'hero.headline', 'hero.headlineAccent', 'hero.subhead',
    'services.headline', 'services.intro',
    'about.headline', 'about.body',
    'pitch.replyPromise', 'pitch.avgReplyTime', 'builtBy'].forEach(need);

  if (c.contact && c.contact.phone && c.contact.phone.replace(/\D/g, '').length < 10) errors.push('"contact.phone" needs at least 10 digits');
  if (c.rating && (typeof c.rating.stars !== 'number' || c.rating.stars < 1 || c.rating.stars > 5)) errors.push('"rating.stars" must be a number from 1 to 5, e.g. 4.8');

  if (!c.hours || typeof c.hours !== 'object') errors.push('"hours" is required');
  else {
    DAYS.forEach(d => {
      const h = c.hours[d];
      if (h === undefined) return errors.push(`"hours.${d}" is missing (use null for closed)`);
      if (h === null) return;
      const m = HOURS_RE.exec(h);
      if (!m) return errors.push(`"hours.${d}" must look like "10:00-17:00" (24-hour clock) or null, got "${h}"`);
      if (+m[1] * 60 + +m[2] >= +m[3] * 60 + +m[4]) errors.push(`"hours.${d}" closes before it opens`);
    });
    if (DAYS.every(d => c.hours[d] === null)) errors.push('"hours" has no open days');
  }

  const list = get(c, 'services.list');
  if (!Array.isArray(list) || !list.length) errors.push('"services.list" needs at least one service');
  else list.forEach((s, i) => {
    const at = `services.list[${i}]`;
    if (!s.name) errors.push(`${at}.name is required`);
    if (!s.description) errors.push(`${at}.description is required`);
    if (!ICONS.includes(s.icon)) errors.push(`${at}.icon must be one of: ${ICONS.join(', ')}`);
    if (!Number.isInteger(s.minutes) || s.minutes < 10 || s.minutes > 240) errors.push(`${at}.minutes must be a whole number of minutes (10–240)`);
  });
  if (Array.isArray(list) && list.length > 12) warnings.push(`${list.length} services is a lot; 6–9 reads best`);
  if (Array.isArray(list) && c.hours && list.some(s => DAYS.every(d => {
    const m = c.hours[d] && HOURS_RE.exec(c.hours[d]);
    return !m || (+m[3] * 60 + +m[4]) - (+m[1] * 60 + +m[2]) < s.minutes;
  }))) errors.push('a service is longer than every open day, so it could never be booked');

  if (!Array.isArray(c.reviews) || !c.reviews.length) errors.push('"reviews" needs at least one review');
  else c.reviews.forEach((r, i) => {
    const at = `reviews[${i}]`;
    ['name', 'when', 'text', 'reply', 'replyTime'].forEach(k => { if (!r[k]) errors.push(`${at}.${k} is required`); });
    if (!Number.isInteger(r.stars) || r.stars < 1 || r.stars > 5) errors.push(`${at}.stars must be a whole number 1–5`);
  });
  if (Array.isArray(c.reviews) && c.reviews.length % 3) warnings.push(`${c.reviews.length} reviews leaves a gap in the 3-across grid; 3 or 6 looks best`);

  const pillars = get(c, 'about.pillars');
  if (!Array.isArray(pillars) || pillars.length !== 4) errors.push('"about.pillars" needs exactly 4 items ({ "title", "text" })');

  const t = c.theme || {};
  ['ink', 'background', 'sand', 'accent', 'accentDark'].forEach(k => { if (!HEX.test(t[k] || '')) errors.push(`"theme.${k}" must be a colour like "#b0876a"`); });
  if (!errors.some(e => e.startsWith('"theme'))) {
    if (contrast(t.ink, t.background) < 7) warnings.push('theme.ink on theme.background is low-contrast; body text may be hard to read');
    ['background', 'sand'].forEach(k => {
      const r = contrast(t.accentDark, t[k]);
      if (r < 4.5) errors.push(`theme.accentDark on theme.${k} is only ${r.toFixed(2)}:1 contrast (needs 4.5+). Use a darker accentDark.`);
    });
    if (contrast('#ffffff', t.ink) < 4.5) errors.push('theme.ink is too light for the white text on buttons; use a darker ink');
  }
  ['hero.image', 'about.image'].forEach(p => {
    const v = get(c, p);
    if (v && !/^(https:\/\/|\.\.?\/|[\w-]+\/|[\w-]+\.(jpe?g|png|webp|avif)$)/i.test(v)) errors.push(`"${p}" must be an https:// URL or a path next to the site, e.g. "images/hero.jpg"`);
  });
  return { errors, warnings };
}

function compute(c) {
  const digits = c.contact.phone.replace(/\D/g, '');
  const address = `${c.contact.street}, ${c.contact.cityStateZip}`;
  const mapsUrl = 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(`${c.business.name} ${address}`);
  const bg = img => (img ? `background-image: linear-gradient(rgba(0,0,0,.08), rgba(0,0,0,.08)), url("${img.replace(/"/g, '%22')}")` : '');
  const full = Math.round(c.rating.stars);
  const booking = c.hero.recentBooking || {};
  const initial = c.business.shortName.trim()[0].toUpperCase();
  const favicon = 'data:image/svg+xml,' + encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="14" fill="${c.theme.ink}"/><text x="32" y="44" font-family="Georgia,serif" font-size="36" text-anchor="middle" fill="${c.theme.background}">${esc(initial)}</text></svg>`);
  const site = {
    shortName: c.business.shortName,
    street: c.contact.street,
    address,
    mapsUrl,
    hours: c.hours,
    services: c.services.list,
    reviews: c.reviews,
    reviewSource: c.rating.source
  };
  const showBanner = !c.pitch || c.pitch.showConceptBanner !== false;
  return {
    title: `${c.business.name} | ${c.business.neighborhood || c.contact.cityStateZip.split(',')[0]}`,
    description: c.meta && c.meta.description
      ? c.meta.description
      : `${c.business.name}: ${c.services.list.slice(0, 3).map(s => s.name).join(', ')} and more. Book online in under a minute.`,
    favicon,
    phoneHref: 'tel:+' + (digits.length === 10 ? '1' + digits : digits),
    address,
    mapsUrl,
    ratingStars: '★'.repeat(full) + '☆'.repeat(5 - full),
    heroStyle: bg(c.hero.image),
    heroAlt: c.hero.imageAlt || `${c.business.name} treatment room`,
    aboutStyle: bg(c.about.image),
    aboutWatermark: c.about.image ? '' : c.business.shortName.toUpperCase(),
    heroBooking: {
      name: booking.name || 'Jordan',
      service: booking.service || c.services.list[0].name,
      when: booking.when || 'Thursday · 4:30 PM'
    },
    conceptBanner: showBanner
      ? `<aside class="concept" aria-label="About this concept">✨ <strong>Website concept</strong> for ${esc(c.business.name)}, built by ${esc(c.builtBy)}. Booking, reviews, and chat are working demos.</aside>`
      : '',
    footerNote: `<div style="max-width:420px">Website concept built by ${esc(c.builtBy)}. Testimonials shown are placeholders for demonstration and would be replaced with ${esc(c.business.shortName)}'s live ${esc(c.rating.source)} reviews.</div>`,
    emailHtml: c.contact.email ? `<p><a href="mailto:${esc(c.contact.email)}">${esc(c.contact.email)}</a></p>` : '',
    pillarsHtml: c.about.pillars.map(p => `<div><b>${esc(p.title)}</b><span>${esc(p.text)}</span></div>`).join(''),
    // JSON inside <script>: escape "<" so a "</script>" in any text can't break out
    siteJson: JSON.stringify(site).replace(/</g, '\\u003c')
  };
}

function render(c) {
  const ctx = { ...c, computed: compute(c) };
  const missing = new Set();
  const fill = (raw) => (_, p) => {
    const v = get(ctx, p);
    if (v === undefined || v === null || typeof v === 'object') { missing.add(p); return ''; }
    return raw ? String(v) : esc(v);
  };
  const html = TEMPLATE
    .replace(/\{\{\{\s*([\w.]+)\s*\}\}\}/g, fill(true))
    .replace(/\{\{\s*([\w.]+)\s*\}\}/g, fill(false));
  if (missing.size) throw new Error(`template uses fields the config doesn't have: ${[...missing].join(', ')}`);
  return html;
}

function buildOne(file, outDir) {
  const rel = path.relative(process.cwd(), file);
  let c;
  try { c = JSON.parse(fs.readFileSync(file, 'utf8')); }
  catch (e) { console.error(`✗ ${rel}: not valid JSON (${e.message})`); return false; }
  const { errors, warnings } = validate(c);
  warnings.forEach(w => console.warn(`  ! ${rel}: ${w}`));
  if (errors.length) { console.error(`✗ ${rel}:\n    - ${errors.join('\n    - ')}`); return false; }
  const dir = outDir ? path.resolve(outDir) : path.join(ROOT, c.slug);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'index.html'), render(c));
  console.log(`✓ ${c.business.name} → ${path.relative(process.cwd(), path.join(dir, 'index.html'))}`);
  return true;
}

const [target, outDir] = process.argv.slice(2);
const files = target
  ? [path.resolve(target)]
  : fs.readdirSync(path.join(__dirname, 'clients')).filter(f => f.endsWith('.json')).sort().map(f => path.join(__dirname, 'clients', f));
if (!files.length) { console.error('No client configs found in _template/clients/'); process.exit(1); }
const ok = files.map(f => buildOne(f, outDir)).every(Boolean);
process.exit(ok ? 0 : 1);
