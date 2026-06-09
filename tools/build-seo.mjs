#!/usr/bin/env node
/**
 * build-seo.mjs — Generador de SEO de Zone Digital (sin dependencias).
 *
 * Lee el array `BOOKS` de index.html (única fuente de verdad) y regenera:
 *   1. Datos estructurados JSON-LD en la home (ItemList, FAQPage, BreadcrumbList)
 *   2. Contenido HTML pre-renderizado y rastreable dentro de #root
 *      (React lo reemplaza al cargar; crawlers y usuarios sin JS ven todo).
 *   3. Una página estática por libro en /libros/<slug>/index.html con su
 *      propio <title>, meta description, canonical, Open Graph y JSON-LD
 *      Book + BreadcrumbList. Cada producto rankea por su propio nombre.
 *   4. sitemap.xml con la home + todas las fichas de libro.
 *
 * Se ejecuta en el build de Netlify, así que cada vez que agregas un libro
 * al array BOOKS, todo el SEO se actualiza solo. Uso: `node tools/build-seo.mjs`
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const FILE = path.join(ROOT, 'index.html');
const LIBROS_DIR = path.join(ROOT, 'libros');
const SITE = 'https://www.zone-digital.com';
const TODAY = new Date().toISOString().slice(0, 10);

const CAT = {
  mining:   { es: 'Minería',       en: 'Mining' },
  tech:     { es: 'IA & Tech',     en: 'AI & Tech' },
  business: { es: 'Negocios',      en: 'Business' },
  cert:     { es: 'Certificación', en: 'Certification' },
  startup:  { es: 'Start Ups',     en: 'Start Ups' },
};
const LANG = { es: 'Español', en: 'English' };

const esc = (s) => String(s)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const slugify = (s) => String(s)
  .toLowerCase()
  .normalize('NFD').replace(/[̀-ͯ]/g, '')
  .replace(/&/g, ' y ')
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/^-+|-+$/g, '')
  .slice(0, 70);

const coverUrl = (asin) =>
  `https://images-na.ssl-images-amazon.com/images/P/${asin}.01._SCLZZZZZZZ_.jpg`;

const buyUrl = (b) => b.formats?.[0]?.u || `https://www.amazon.com/dp/${b.asin}`;
const priceLabel = (b) => b.formats?.[0]?.p || 'USD 9.99';
const priceNum = (b) => (priceLabel(b).replace(/[^\d.]/g, '') || '9.99');
const pageUrl = (b) => `${SITE}/libros/${b.slug}/`;

function extractBooks(html) {
  const m = html.match(/const BOOKS = (\[[\s\S]*?\n\]);/);
  if (!m) throw new Error('No se encontró el array BOOKS en index.html');
  const amz = (asin) => `https://www.amazon.com/dp/${asin}`;
  // eslint-disable-next-line no-new-func
  const books = new Function('AMZ', 'return ' + m[1])(amz);
  // slugs únicos
  const seen = new Set();
  for (const b of books) {
    let s = slugify(b.title);
    if (!s) s = b.asin.toLowerCase();
    if (seen.has(s)) s = `${s}-${b.asin.toLowerCase()}`;
    seen.add(s);
    b.slug = s;
  }
  return books;
}

/* ---------- JSON-LD de la home ---------- */
function homeJsonLd(books) {
  const itemList = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'Catálogo Zone Digital',
    description: `Catálogo de ${books.length} libros digitales sobre IA, minería, cloud, negocios y certificaciones.`,
    numberOfItems: books.length,
    itemListElement: books.map((b, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      url: pageUrl(b),
      item: {
        '@type': 'Book',
        '@id': pageUrl(b),
        name: b.title,
        inLanguage: b.lang,
        description: b.sub,
        url: pageUrl(b),
        image: coverUrl(b.asin),
        author: { '@type': 'Organization', name: 'Zone Digital' },
        publisher: { '@type': 'Organization', name: 'Zone Digital' },
        bookFormat: 'https://schema.org/EBook',
        offers: {
          '@type': 'Offer',
          price: priceNum(b),
          priceCurrency: 'USD',
          availability: 'https://schema.org/InStock',
          url: buyUrl(b),
        },
      },
    })),
  };

  const faq = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      ['¿Qué es Zone Digital?',
       `Zone Digital es una editorial digital con ${books.length} libros, cursos y apps sobre inteligencia artificial, minería digital, cloud, negocios y certificaciones, en español e inglés.`],
      ['¿En qué idiomas están disponibles los libros?',
       'Los títulos están disponibles en español e inglés para una audiencia global.'],
      ['¿Dónde puedo comprar los libros de Zone Digital?',
       'Todos los títulos están publicados en Amazon (Kindle) y Gumroad. Cada libro enlaza directamente a su página de compra.'],
      ['¿Cuánto cuestan los libros?',
       'La mayoría de los ebooks tienen un precio de 9.99 USD en formato Kindle.'],
      ['¿Puedo leer un capítulo gratis antes de comprar?',
       'Sí. Puedes descargar un capítulo gratuito desde la web para conocer el contenido antes de comprar.'],
    ].map(([q, a]) => ({
      '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a },
    })),
  };

  const breadcrumb = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Inicio', item: `${SITE}/` },
      { '@type': 'ListItem', position: 2, name: 'Biblioteca', item: `${SITE}/#books` },
    ],
  };

  return [itemList, faq, breadcrumb]
    .map((o) => `  <script type="application/ld+json">\n${JSON.stringify(o, null, 2)}\n  </script>`)
    .join('\n');
}

/* ---------- Fallback rastreable de la home ---------- */
function homeFallback(books) {
  const cards = books.map((b) => {
    const cat = CAT[b.cat]?.es || b.cat;
    const lang = LANG[b.lang] || b.lang;
    return `        <article>
          <h3><a href="/libros/${b.slug}/">${esc(b.title)}</a></h3>
          <p>${esc(b.sub)}</p>
          <p><small>${esc(cat)} · ${esc(lang)} · ${esc(priceLabel(b))}</small></p>
        </article>`;
  }).join('\n');

  return `    <div style="max-width:1100px;margin:0 auto;padding:48px 24px;font-family:system-ui,Segoe UI,Roboto,sans-serif;color:#0B0E14">
      <header>
        <p><strong>Zone Digital</strong> — Libros, apps y cursos para el profesional potenciado por IA</p>
      </header>
      <main>
        <h1>Convierte conocimiento técnico en una ventaja competitiva</h1>
        <p>Zone Digital publica ${books.length} libros, cursos y herramientas sobre inteligencia artificial, minería, cloud, negocios y certificaciones (AWS, Azure, Google Cloud). En español e inglés. Empieza con un capítulo gratis y avanza a tu ritmo.</p>
        <p><a href="#books">Explorar la biblioteca</a></p>
        <section id="books">
          <h2>La biblioteca · ${books.length} libros</h2>
${cards}
        </section>
      </main>
      <footer>
        <p>© Zone Digital · IA · Minería · Cloud · Negocios · Certificaciones</p>
      </footer>
    </div>`;
}

/* ---------- Plantilla de página por libro ---------- */
const PAGE_CSS = `
  :root{--bg:#000918;--panel:#0B0E14;--ink:#F4F1EA;--dim:#9aa3b2;--gold:#D9A93C;--blue:#2547F0;--lime:#D8FF3D;--line:rgba(244,241,234,.12)}
  *{box-sizing:border-box}
  body{margin:0;background:var(--bg);color:var(--ink);font-family:system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;line-height:1.6}
  a{color:inherit}
  .wrap{max-width:1040px;margin:0 auto;padding:0 24px}
  header.site{border-bottom:1px solid var(--line);padding:18px 0}
  header.site .wrap{display:flex;align-items:center;justify-content:space-between;gap:16px}
  .brand{display:flex;align-items:center;gap:12px;text-decoration:none;font-weight:700;letter-spacing:.3px}
  .brand img{display:block;width:40px;height:40px;object-fit:contain}
  .brand .dim{color:var(--dim);font-weight:500}
  .nav a{color:var(--dim);text-decoration:none;font-size:14px}
  .nav a:hover{color:var(--ink)}
  nav.crumb{font-size:13px;color:var(--dim);padding:22px 0 0}
  nav.crumb a{color:var(--dim);text-decoration:none}
  nav.crumb a:hover{color:var(--ink)}
  .hero{display:grid;grid-template-columns:300px 1fr;gap:42px;align-items:start;padding:30px 0 14px}
  @media(max-width:760px){.hero{grid-template-columns:1fr;gap:26px}}
  .cover{background:linear-gradient(155deg,#11141C,#0B0E14);border:1px solid var(--line);border-radius:14px;padding:18px;display:flex;align-items:center;justify-content:center}
  .cover img{width:100%;height:auto;border-radius:8px;box-shadow:0 18px 50px rgba(0,0,0,.5)}
  .badges{display:flex;gap:8px;flex-wrap:wrap;margin-bottom:14px}
  .badge{font-size:12px;font-weight:600;letter-spacing:.4px;text-transform:uppercase;padding:5px 11px;border-radius:999px;border:1px solid var(--line);color:var(--dim)}
  .badge.cat{color:#06210a;background:var(--lime);border-color:var(--lime)}
  h1{font-size:34px;line-height:1.18;margin:0 0 14px;font-weight:800}
  .sub{font-size:18px;color:#c9cfda;margin:0 0 22px}
  .price{font-size:20px;font-weight:700;color:var(--gold);margin:0 0 20px}
  .cta{display:flex;gap:12px;flex-wrap:wrap}
  .btn{display:inline-flex;align-items:center;gap:8px;text-decoration:none;font-weight:700;padding:14px 22px;border-radius:10px;font-size:15px}
  .btn.primary{background:var(--gold);color:#1a1206}
  .btn.primary:hover{filter:brightness(1.06)}
  .btn.ghost{border:1px solid var(--line);color:var(--ink)}
  .btn.ghost:hover{border-color:var(--ink)}
  section.more{border-top:1px solid var(--line);margin-top:46px;padding:34px 0 10px}
  section.more h2{font-size:20px;margin:0 0 18px}
  .grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:16px}
  .card{display:block;text-decoration:none;border:1px solid var(--line);border-radius:12px;padding:16px;background:var(--panel);transition:border-color .2s,transform .2s}
  .card:hover{border-color:var(--gold);transform:translateY(-2px)}
  .card h3{font-size:15px;margin:0 0 6px;color:var(--ink)}
  .card p{font-size:13px;color:var(--dim);margin:0}
  footer.site{border-top:1px solid var(--line);margin-top:40px;padding:26px 0;color:var(--dim);font-size:13px}
`;

function bookPage(b, related) {
  const cat = CAT[b.cat] || { es: b.cat, en: b.cat };
  const url = pageUrl(b);
  const cover = coverUrl(b.asin);
  const locale = b.lang === 'en' ? 'en_US' : 'es_ES';
  const buyTxt = b.lang === 'en' ? 'Buy on Amazon (Kindle)' : 'Comprar en Amazon (Kindle)';
  const backTxt = b.lang === 'en' ? 'Back to the library' : 'Volver a la biblioteca';
  const moreTxt = b.lang === 'en' ? 'You may also like' : 'También te puede interesar';
  const title = `${b.title} | Zone Digital`;
  const desc = b.sub;

  const ld = {
    '@context': 'https://schema.org',
    '@type': 'Book',
    '@id': url,
    name: b.title,
    inLanguage: b.lang,
    description: desc,
    url,
    image: cover,
    author: { '@type': 'Organization', name: 'Zone Digital' },
    publisher: { '@type': 'Organization', name: 'Zone Digital' },
    bookFormat: 'https://schema.org/EBook',
    genre: cat.en,
    offers: {
      '@type': 'Offer',
      price: priceNum(b),
      priceCurrency: 'USD',
      availability: 'https://schema.org/InStock',
      url: buyUrl(b),
    },
  };
  const crumb = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Inicio', item: `${SITE}/` },
      { '@type': 'ListItem', position: 2, name: 'Biblioteca', item: `${SITE}/#books` },
      { '@type': 'ListItem', position: 3, name: b.title, item: url },
    ],
  };

  const relCards = related.map((r) => `        <a class="card" href="/libros/${r.slug}/">
          <h3>${esc(r.title)}</h3>
          <p>${esc((CAT[r.cat]?.es || r.cat))} · ${esc(LANG[r.lang] || r.lang)}</p>
        </a>`).join('\n');

  return `<!doctype html>
<html lang="${b.lang}">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${esc(title)}</title>
  <meta name="description" content="${esc(desc)}" />
  <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1" />
  <link rel="canonical" href="${url}" />
  <link rel="alternate" hreflang="${b.lang}" href="${url}" />
  <link rel="alternate" hreflang="x-default" href="${url}" />

  <meta property="og:site_name" content="Zone Digital" />
  <meta property="og:type" content="book" />
  <meta property="og:title" content="${esc(b.title)}" />
  <meta property="og:description" content="${esc(desc)}" />
  <meta property="og:url" content="${url}" />
  <meta property="og:image" content="${cover}" />
  <meta property="og:locale" content="${locale}" />
  <meta property="book:author" content="Zone Digital" />

  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${esc(b.title)}" />
  <meta name="twitter:description" content="${esc(desc)}" />
  <meta name="twitter:image" content="${cover}" />

  <meta name="theme-color" content="#000918" />
  <link rel="icon" type="image/webp" href="/logo.webp" />
  <link rel="apple-touch-icon" href="/logo.webp" />
  <link rel="preconnect" href="https://images-na.ssl-images-amazon.com" crossorigin />

  <script type="application/ld+json">
${JSON.stringify(ld, null, 2)}
  </script>
  <script type="application/ld+json">
${JSON.stringify(crumb, null, 2)}
  </script>
  <style>${PAGE_CSS}</style>
</head>
<body>
  <header class="site">
    <div class="wrap">
      <a class="brand" href="/">
        <img src="/logo.webp" alt="Zone Digital" width="40" height="40" />
        <span>Zone<span class="dim"> Digital</span></span>
      </a>
      <nav class="nav"><a href="/#books">← ${esc(backTxt)}</a></nav>
    </div>
  </header>

  <div class="wrap">
    <nav class="crumb" aria-label="breadcrumb">
      <a href="/">Inicio</a> › <a href="/#books">Biblioteca</a> › <span>${esc(b.title)}</span>
    </nav>

    <article class="hero">
      <div class="cover">
        <img src="${cover}" alt="Portada de ${esc(b.title)}" loading="eager"
             onerror="this.style.display='none'" />
      </div>
      <div>
        <div class="badges">
          <span class="badge cat">${esc(cat.es)}</span>
          <span class="badge">${esc(LANG[b.lang] || b.lang)}</span>
          <span class="badge">eBook · Kindle</span>
        </div>
        <h1>${esc(b.title)}</h1>
        <p class="sub">${esc(desc)}</p>
        <p class="price">${esc(priceLabel(b))}</p>
        <div class="cta">
          <a class="btn primary" href="${buyUrl(b)}" rel="noopener" target="_blank">${esc(buyTxt)}</a>
          <a class="btn ghost" href="/#books">${esc(backTxt)}</a>
        </div>
      </div>
    </article>
${related.length ? `
    <section class="more">
      <h2>${esc(moreTxt)}</h2>
      <div class="grid">
${relCards}
      </div>
    </section>` : ''}
  </div>

  <footer class="site">
    <div class="wrap">© ${new Date().getFullYear()} Zone Digital · IA · Minería · Cloud · Negocios · Certificaciones · <a href="/">zone-digital.com</a></div>
  </footer>
</body>
</html>
`;
}

/* ---------- sitemap ---------- */
function buildSitemap(books) {
  const entries = [
    `  <url>
    <loc>${SITE}/</loc>
    <lastmod>${TODAY}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
    <xhtml:link rel="alternate" hreflang="es" href="${SITE}/" />
    <xhtml:link rel="alternate" hreflang="en" href="${SITE}/" />
    <xhtml:link rel="alternate" hreflang="x-default" href="${SITE}/" />
    <image:image>
      <image:loc>${SITE}/logo.webp</image:loc>
      <image:title>Zone Digital — Libros, apps y cursos de IA, minería y negocios</image:title>
    </image:image>
  </url>`,
    ...books.map((b) => `  <url>
    <loc>${pageUrl(b)}</loc>
    <lastmod>${TODAY}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
    <image:image>
      <image:loc>${coverUrl(b.asin)}</image:loc>
      <image:title>${esc(b.title)}</image:title>
    </image:image>
  </url>`),
  ];
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
${entries.join('\n')}
</urlset>
`;
}

function replaceBetween(html, startMark, endMark, content) {
  const start = html.indexOf(startMark);
  const end = html.indexOf(endMark);
  if (start === -1 || end === -1) throw new Error(`Marcadores no encontrados: ${startMark}`);
  return `${html.slice(0, start + startMark.length)}\n${content}\n  ${html.slice(end)}`;
}

// ---------------- run ----------------
let html = fs.readFileSync(FILE, 'utf8');
const books = extractBooks(html);

// 1) home: JSON-LD + fallback rastreable
html = replaceBetween(
  html,
  '<!-- SEO-JSONLD:START (auto-generado por tools/build-seo.mjs — no editar a mano) -->',
  '<!-- SEO-JSONLD:END -->',
  homeJsonLd(books),
);
html = replaceBetween(
  html,
  '<!-- SEO-FALLBACK:START (auto-generado por tools/build-seo.mjs — React lo reemplaza al cargar) -->',
  '<!-- SEO-FALLBACK:END -->',
  homeFallback(books),
);
fs.writeFileSync(FILE, html);

// 2) páginas por libro (regenera desde cero para no dejar fichas obsoletas)
fs.rmSync(LIBROS_DIR, { recursive: true, force: true });
fs.mkdirSync(LIBROS_DIR, { recursive: true });
for (const b of books) {
  const related = books
    .filter((r) => r.cat === b.cat && r.slug !== b.slug)
    .slice(0, 4);
  const dir = path.join(LIBROS_DIR, b.slug);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'index.html'), bookPage(b, related));
}

// 3) sitemap
fs.writeFileSync(path.join(ROOT, 'sitemap.xml'), buildSitemap(books));

console.log(`✓ SEO regenerado:`);
console.log(`  · home: JSON-LD (ItemList/FAQ/Breadcrumb) + ${books.length} libros rastreables`);
console.log(`  · ${books.length} fichas estáticas en /libros/<slug>/`);
console.log(`  · sitemap.xml con ${books.length + 1} URLs`);
