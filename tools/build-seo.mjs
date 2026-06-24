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

// Potencial de venta mundial (mayor = se muestra primero).
// IMPORTANTE: mantener idéntico al ZD_SCORE de index.html.
const CAT_DEMAND = { tech: 50, cert: 42, business: 30, startup: 24, mining: 20 };
const HOT = /(\bIA\b|\bAI\b|GenAI|generativ|\bLLM\b|agent|MLOps|machine learning|cloud|AWS|Azure|Google Cloud|kubernetes|wealth|growth|chief|officer|PMP|CFA)/i;
const salesScore = (b) => {
  let s = CAT_DEMAND[b.cat] || 0;
  s += b.lang === 'en' ? 18 : 10;
  if (HOT.test(`${b.title} ${b.sub}`)) s += 12;
  if (b.featured) s += 8;
  return s;
};

const buyUrl = (b) => b.formats?.[0]?.u || `https://www.amazon.com/dp/${b.asin}`;
const priceLabel = (b) => b.formats?.[0]?.p || 'USD 9.99';
const priceNum = (b) => (priceLabel(b).replace(/[^\d.]/g, '') || '9.99');
const pageUrl = (b) => `${SITE}/libros/${b.slug}/`;

const LANDING_PAGES = [
  { path: '/tiktok/', title: 'Landing TikTok', priority: '0.95' },
  { path: '/rutas/aws-cloud/', title: 'Ruta AWS & Cloud', priority: '0.9' },
  { path: '/rutas/ia/', title: 'Ruta IA Aplicada', priority: '0.9' },
  { path: '/rutas/mineria-4-0/', title: 'Ruta Mineria 4.0', priority: '0.9' },
  { path: '/gratis/', title: 'Recursos gratis', priority: '0.85' },
  { path: '/gracias/', title: 'Gracias', priority: '0.4' },
];

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
  // ordenar por potencial de venta mundial (estable para empates)
  books.sort((a, b) => salesScore(b) - salesScore(a));
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
  .nav{display:flex;gap:14px;align-items:center;flex-wrap:wrap}
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
  .sales-grid{display:grid;grid-template-columns:1fr 1fr;gap:18px;margin:34px 0}
  @media(max-width:760px){.sales-grid{grid-template-columns:1fr}}
  .panel{border:1px solid var(--line);border-radius:12px;background:var(--panel);padding:22px}
  .panel h2{margin:0 0 12px;font-size:20px}
  .panel p,.panel li{color:#c9cfda}
  .chapters{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:10px}
  .chapters span{display:block;border:1px solid var(--line);border-radius:10px;padding:12px;color:#c9cfda;background:rgba(255,255,255,.03)}
  .faq{display:grid;gap:10px}
  .faq details{border:1px solid var(--line);border-radius:10px;padding:14px;background:var(--panel)}
  .faq summary{cursor:pointer;font-weight:700}
  .lead-box{display:grid;gap:12px}
  .lead-box label{display:grid;gap:6px;color:var(--dim);font-size:14px}
  .lead-box input,.lead-box select{width:100%;border:1px solid var(--line);border-radius:10px;background:#050812;color:var(--ink);padding:13px 14px;font:inherit}
  .lead-box button{border:0;cursor:pointer;justify-content:center}
  .final-cta{border:1px solid var(--line);border-radius:14px;background:linear-gradient(135deg,rgba(217,169,60,.12),rgba(37,71,240,.10));padding:28px;margin-top:42px}
  .final-cta h2{margin:0 0 18px;font-size:24px}
  footer.site{border-top:1px solid var(--line);margin-top:40px;padding:26px 0;color:var(--dim);font-size:13px}
`;

function bookPage(b, related) {
  const cat = CAT[b.cat] || { es: b.cat, en: b.cat };
  const url = pageUrl(b);
  const cover = coverUrl(b.asin);
  const locale = b.lang === 'en' ? 'en_US' : 'es_ES';
  const buyTxt = b.lang === 'en' ? 'Buy Kindle on Amazon' : 'Comprar Kindle en Amazon';
  const leadTxt = b.lang === 'en' ? 'Get free chapter' : 'Descargar capitulo gratis';
  const backTxt = b.lang === 'en' ? 'Back to the library' : 'Volver a la biblioteca';
  const moreTxt = b.lang === 'en' ? 'You may also like' : 'Tambien te puede interesar';
  const title = `${b.title} | Zone Digital`;
  const desc = b.sub;

  const outcomes = bookOutcomes(b);
  const chapters = bookChapters(b);
  const faqs = bookFaqs(b);

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
    offers: b.formats.map((f) => ({
      '@type': 'Offer',
      price: (f.p || '').replace(/[^\d.]/g, '') || '9.99',
      priceCurrency: 'USD',
      availability: 'https://schema.org/InStock',
      url: f.u,
    })),
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

  const fmtButtons = b.formats.map((f) => `<a class="btn primary" href="${f.u}" rel="noopener" target="_blank" data-amazon data-format="${esc(f.k)}" data-url="${esc(f.u)}">${esc(f.k)} · ${esc(f.p)}</a>`).join('\n          ');
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
  <meta property="og:site_name" content="Zone Digital" />
  <meta property="og:type" content="book" />
  <meta property="og:title" content="${esc(b.title)}" />
  <meta property="og:description" content="${esc(desc)}" />
  <meta property="og:url" content="${url}" />
  <meta property="og:image" content="${cover}" />
  <meta property="og:locale" content="${locale}" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${esc(b.title)}" />
  <meta name="twitter:description" content="${esc(desc)}" />
  <meta name="twitter:image" content="${cover}" />
  <meta name="theme-color" content="#000918" />
  <link rel="icon" type="image/webp" href="/logo.webp" />
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
      <a class="brand" href="/"><img src="/logo.webp" alt="Zone Digital" width="40" height="40" /><span>Zone<span class="dim"> Digital</span></span></a>
      <nav class="nav"><a href="/#routes">Rutas</a><a href="/gratis/">Gratis</a><a href="/#books">${esc(backTxt)}</a></nav>
    </div>
  </header>

  <div class="wrap">
    <nav class="crumb" aria-label="breadcrumb"><a href="/">Inicio</a> › <a href="/#books">Biblioteca</a> › <span>${esc(b.title)}</span></nav>

    <article class="hero">
      <div class="cover"><img src="${cover}" alt="Portada de ${esc(b.title)}" loading="eager" onerror="this.style.display='none'" /></div>
      <div>
        <div class="badges"><span class="badge cat">${esc(cat.es)}</span><span class="badge">${esc(LANG[b.lang] || b.lang)}</span><span class="badge">Kindle / Paperback</span></div>
        <h1>${esc(b.title)}</h1>
        <p class="sub">${esc(desc)}</p>
        <p class="price">${esc(priceLabel(b))}</p>
        <div class="cta">
          ${fmtButtons}
          <a class="btn ghost" href="/gratis/?book=${encodeURIComponent(b.id)}">${esc(leadTxt)}</a>
        </div>
      </div>
    </article>

    <section class="sales-grid">
      <div class="panel">
        <h2>Este libro es para ti si...</h2>
        <ul>${outcomes.forYou.map(x => `<li>${esc(x)}</li>`).join('')}</ul>
      </div>
      <div class="panel">
        <h2>Que lograras</h2>
        <ul>${outcomes.results.map(x => `<li>${esc(x)}</li>`).join('')}</ul>
      </div>
    </section>

    <section class="more">
      <h2>Tabla de contenidos</h2>
      <div class="chapters">${chapters.map((x, i) => `<span>${String(i + 1).padStart(2, '0')} · ${esc(x)}</span>`).join('')}</div>
    </section>

    <section class="sales-grid">
      <div class="panel">
        <h2>Por que es diferente</h2>
        <p>Esta guia esta pensada para aplicacion profesional: menos teoria suelta, mas criterio, casos, rutas de aprendizaje y decisiones que puedes llevar a tu trabajo o preparacion.</p>
      </div>
      <div class="panel">
        <h2>Rutas relacionadas</h2>
        <p><a href="/rutas/aws-cloud/">AWS & Cloud</a> · <a href="/rutas/ia/">IA Aplicada</a> · <a href="/rutas/mineria-4-0/">Mineria 4.0</a> · <a href="/gratis/">Recursos gratis</a></p>
      </div>
    </section>

    <section class="more">
      <h2>FAQ</h2>
      <div class="faq">${faqs.map(([q, a]) => `<details><summary>${esc(q)}</summary><p>${esc(a)}</p></details>`).join('')}</div>
    </section>
${related.length ? `
    <section class="more">
      <h2>${esc(moreTxt)}</h2>
      <div class="grid">
${relCards}
      </div>
    </section>` : ''}

    <section class="final-cta">
      <h2>Empieza por este libro y convierte la lectura en accion.</h2>
      <div class="cta">${fmtButtons}<a class="btn ghost" href="/gratis/?book=${encodeURIComponent(b.id)}">${esc(leadTxt)}</a></div>
    </section>
  </div>

  <footer class="site"><div class="wrap">© ${new Date().getFullYear()} Zone Digital · <a href="/">zone-digital.com</a></div></footer>
  <script>
    window.dataLayer = window.dataLayer || [];
    function zdSource(){ try { return new URLSearchParams(location.search).get('utm_source') || localStorage.getItem('zd_utm_source') || 'direct'; } catch(e) { return 'direct'; } }
    function zdTrack(eventName, params){ var payload = Object.assign({source_page: location.pathname, traffic_source: zdSource()}, params || {}); window.dataLayer.push(Object.assign({event:eventName}, payload)); if (typeof gtag === 'function') gtag('event', eventName, payload); if (window.ttq && window.ttq.track) { var m={view_item:'ViewContent',click_amazon:'ClickButton',generate_lead:'SubmitForm'}; if(m[eventName]) ttq.track(m[eventName], payload); } }
    zdTrack('view_item', { item_id: '${b.id}', item_name: '${esc(b.title)}', item_category: '${esc(cat.es)}', language: '${b.lang}', price: ${priceNum(b)}, currency: 'USD', format: 'kindle' });
    document.querySelectorAll('[data-amazon]').forEach(function(a){ a.addEventListener('click', function(){ zdTrack('click_amazon', { item_id: '${b.id}', item_name: '${esc(b.title)}', amazon_marketplace:'amazon.com', format: a.dataset.format || 'Kindle', outbound_url: a.dataset.url }); }); });
  </script>
</body>
</html>
`;
}

function bookOutcomes(b) {
  const cat = b.cat;
  const common = {
    forYou: ['Quieres una guia practica, no solo conceptos.', 'Buscas crecer profesionalmente con una ruta clara.', 'Necesitas lenguaje simple para decisiones tecnicas.', 'Quieres aplicar lo aprendido en proyectos reales.', 'Prefieres avanzar con ejemplos y estructura.'],
    results: ['Entender el mapa completo del tema.', 'Tomar mejores decisiones profesionales.', 'Priorizar que estudiar y que aplicar primero.', 'Conectar tecnologia con negocio y ejecucion.', 'Salir con una ruta de accion de 30 dias.'],
  };
  if (cat === 'cert') return { forYou: ['Estas preparando una certificacion.', 'Necesitas ordenar temas y prioridades.', 'Quieres estudiar con enfoque de examen.', 'Buscas ganar confianza antes de pagar o rendir.', 'Quieres una guia que combine teoria y practica.'], results: ['Crear un plan de estudio realista.', 'Identificar dominios clave del examen.', 'Practicar con mentalidad de aprobacion.', 'Evitar dispersion con recursos sueltos.', 'Conectar la certificacion con crecimiento laboral.'] };
  if (cat === 'mining') return { forYou: ['Trabajas o estudias mineria y quieres entender tecnologia aplicada.', 'Te interesan IoT, IA, automatizacion u operacion remota.', 'Buscas casos claros para productividad y seguridad.', 'Necesitas explicar mineria 4.0 a equipos o lideres.', 'Quieres pasar de buzzwords a decisiones operativas.'], results: ['Mapear casos de uso de mineria inteligente.', 'Entender datos, sensores, flota y operacion remota.', 'Priorizar iniciativas con impacto operacional.', 'Comunicar tecnologia en lenguaje de negocio minero.', 'Diseñar una ruta de adopcion realista.'] };
  if (cat === 'tech') return { forYou: ['Quieres construir ventaja profesional con IA.', 'Necesitas entender GenAI, agentes, RAG o MLOps.', 'Buscas aplicaciones reales para trabajo o negocio.', 'Quieres liderar conversaciones de IA con criterio.', 'Necesitas una ruta para pasar de usuario a creador.'], results: ['Entender los bloques de una solucion IA.', 'Diseñar flujos aplicables al trabajo.', 'Evaluar riesgos, datos y automatizacion.', 'Construir lenguaje tecnico y ejecutivo.', 'Definir proximos pasos para implementar.'] };
  return common;
}

function bookChapters(b) {
  const base = ['Mapa del problema', 'Fundamentos esenciales', 'Herramientas y conceptos clave', 'Casos de uso profesionales', 'Arquitectura o modelo de trabajo', 'Errores comunes', 'Plan de 30 dias', 'Aplicacion en proyectos reales', 'Checklist de decision', 'Siguientes pasos'];
  if (b.cat === 'mining') return ['Mineria 4.0 y productividad', 'Datos operacionales', 'IoT industrial', 'IA y vision computacional', 'Mantenimiento predictivo', 'Seguridad y personas', 'Operacion remota', 'Gemelos digitales', 'Roadmap de adopcion', 'Caso aplicado'];
  if (b.cat === 'cert') return ['Estrategia de certificacion', 'Dominios clave', 'Plan de estudio', 'Conceptos principales', 'Practica guiada', 'Errores de examen', 'Simulacion mental', 'Revision final', 'Dia del examen', 'Uso profesional de la certificacion'];
  if (b.cat === 'tech') return ['Panorama de IA', 'Modelos y datos', 'Prompts y flujos', 'RAG y conocimiento', 'Agentes y automatizacion', 'MLOps y produccion', 'Seguridad y gobernanza', 'Casos de negocio', 'Roadmap de implementacion', 'Portafolio profesional'];
  return base;
}

function bookFaqs(b) {
  return [
    ['Esta en Kindle?', 'Si. Cada ficha enlaza al formato Kindle disponible en Amazon cuando existe.'],
    ['Esta disponible en tapa blanda?', b.formats.some(f => /tapa blanda|paper/i.test(f.k)) ? 'Si. Este libro incluye enlace a tapa blanda.' : 'Algunos titulos tienen tapa blanda; revisa los formatos disponibles arriba.'],
    ['Es para principiantes?', 'Esta escrito para avanzar desde fundamentos hasta aplicacion profesional.'],
    ['Sirve para certificacion?', b.cat === 'cert' ? 'Si, esta orientado a preparacion y estrategia de certificacion.' : 'Puede apoyar tu criterio profesional, aunque no todos los titulos son guias de examen.'],
    ['Puedo leerlo con Kindle Unlimited?', 'Depende de la disponibilidad actual en Amazon para tu pais y cuenta.'],
    ['Cuanto tiempo toma aplicarlo?', 'Puedes obtener valor en una semana y convertirlo en plan de 30 dias con los ejercicios sugeridos.'],
  ];
}

/* ---------- sitemap ---------- */
function buildSitemap(books) {
  const entries = [
    `  <url>
    <loc>${SITE}/</loc>
    <lastmod>${TODAY}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
    <image:image>
      <image:loc>${SITE}/logo.webp</image:loc>
      <image:title>Zone Digital - Libros, apps y cursos de IA, mineria y negocios</image:title>
    </image:image>
  </url>`,
    ...LANDING_PAGES.map((p) => `  <url>
    <loc>${SITE}${p.path}</loc>
    <lastmod>${TODAY}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>${p.priority}</priority>
  </url>`),
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
// mapa ASIN -> slug que consume la app React para enlazar "Ver ficha"
const slugMap = books.map((b) => `    '${b.asin}': '${b.slug}',`).join('\n');
html = replaceBetween(html, '/* SEO-SLUGS:START */', '/* SEO-SLUGS:END */', slugMap);
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

// 3) paginas de embudo para TikTok, rutas y captacion
buildFunnelPages(books);

// 4) sitemap
fs.writeFileSync(path.join(ROOT, 'sitemap.xml'), buildSitemap(books));

console.log(`✓ SEO regenerado:`);
console.log(`  · home: JSON-LD (ItemList/FAQ/Breadcrumb) + ${books.length} libros rastreables`);
console.log(`  · ${books.length} fichas estáticas en /libros/<slug>/`);
console.log(`  · ${LANDING_PAGES.length} paginas de embudo generadas`);
console.log(`  · sitemap.xml con ${books.length + LANDING_PAGES.length + 1} URLs`);


function ensureDirForPage(pagePath) {
  const dir = path.join(ROOT, pagePath.replace(/^\//, ''));
  fs.mkdirSync(dir, { recursive: true });
  return path.join(dir, 'index.html');
}

function byId(books, ids) {
  return ids.map(id => books.find(b => b.id === id)).filter(Boolean);
}

function pageShell({ title, description, path: pagePath, body, scripts = '' }) {
  const url = `${SITE}${pagePath}`;
  return `<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${esc(title)} | Zone Digital</title>
  <meta name="description" content="${esc(description)}" />
  <meta name="robots" content="index, follow, max-image-preview:large" />
  <link rel="canonical" href="${url}" />
  <meta property="og:site_name" content="Zone Digital" />
  <meta property="og:title" content="${esc(title)}" />
  <meta property="og:description" content="${esc(description)}" />
  <meta property="og:url" content="${url}" />
  <meta property="og:image" content="${SITE}/og-image.png" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="theme-color" content="#000918" />
  <link rel="icon" type="image/webp" href="/logo.webp" />
  <link rel="stylesheet" href="/zone-digital/styles.css" />
  <style>${PAGE_CSS}</style>
</head>
<body>
  ${body}
  <script>
    window.dataLayer = window.dataLayer || [];
    function zdSource(){ try { var q = new URLSearchParams(location.search); ['utm_source','utm_medium','utm_campaign','utm_content','utm_term'].forEach(function(k){ if(q.get(k)) localStorage.setItem('zd_'+k,q.get(k)); }); return q.get('utm_source') || localStorage.getItem('zd_utm_source') || 'direct'; } catch(e){ return 'direct'; } }
    function zdTrack(eventName, params){ var payload = Object.assign({source_page: location.pathname, traffic_source: zdSource()}, params || {}); window.dataLayer.push(Object.assign({event:eventName}, payload)); if (typeof gtag === 'function') gtag('event', eventName, payload); if(window.ttq && window.ttq.track){ var m={click_amazon:'ClickButton',generate_lead:'SubmitForm',sign_up:'CompleteRegistration',select_item:'ViewContent'}; if(m[eventName]) ttq.track(m[eventName], payload); } }
    document.querySelectorAll('[data-track-route]').forEach(function(a){ a.addEventListener('click', function(){ zdTrack('select_route', { route_id:a.dataset.trackRoute, route_name:a.textContent.trim() }); }); });
    document.querySelectorAll('[data-amazon]').forEach(function(a){ a.addEventListener('click', function(){ zdTrack('click_amazon', { item_id:a.dataset.itemId, item_name:a.dataset.itemName, amazon_marketplace:'amazon.com', format:a.dataset.format || 'kindle', outbound_url:a.href }); }); });
    document.querySelectorAll('form[data-lead-form]').forEach(function(form){ form.addEventListener('submit', function(){ zdTrack('generate_lead', { lead_type:form.dataset.leadType || 'free_resource', interest:(form.querySelector('[name=interest]')||{}).value || '', book_id:(form.querySelector('[name=book]')||{}).value || '' }); zdTrack('sign_up', { method:'email', interest:(form.querySelector('[name=interest]')||{}).value || '' }); }); });
    ${scripts}
  </script>
</body>
</html>`;
}

function bookCards(books, listName) {
  return books.map(b => `<article class="card">
    <h3>${esc(b.title)}</h3>
    <p>${esc(b.sub)}</p>
    <p><small>${esc(CAT[b.cat]?.es || b.cat)} · ${esc(LANG[b.lang] || b.lang)} · ${esc(priceLabel(b))}</small></p>
    <p><a class="btn ghost" href="/libros/${b.slug}/" data-track-route="${listName}">Ver ficha</a> <a class="btn primary" href="${buyUrl(b)}" target="_blank" rel="noopener" data-amazon data-item-id="${b.id}" data-item-name="${esc(b.title)}" data-format="kindle">Amazon</a></p>
  </article>`).join('');
}

function leadForm(interest, book = '') {
  return `<form class="lead-box" method="POST" action="/gracias/" data-netlify="true" name="lead-capture" data-lead-form data-lead-type="free_guide">
    <input type="hidden" name="form-name" value="lead-capture" />
    <input type="hidden" name="book" value="${esc(book)}" />
    <label>Nombre<input name="name" required placeholder="Tu nombre" /></label>
    <label>Email<input type="email" name="email" required placeholder="tu@email.com" /></label>
    <label>Interes principal<select name="interest"><option>${esc(interest)}</option><option>IA Aplicada</option><option>AWS & Cloud</option><option>Mineria 4.0</option><option>Certificaciones</option><option>Liderazgo tecnologico</option></select></label>
    <button class="btn primary" type="submit">Enviar guia gratis</button>
  </form>`;
}

function landingBody({ eyebrow, title, description, primary, secondary, cards, formInterest }) {
  return `<header class="site"><div class="wrap"><a class="brand" href="/"><img src="/logo.webp" alt="Zone Digital" /><span>Zone<span class="dim"> Digital</span></span></a><nav class="nav"><a href="/tiktok/">TikTok</a><a href="/gratis/">Gratis</a><a href="/#books">Biblioteca</a></nav></div></header>
  <main class="wrap">
    <section class="hero">
      <div>
        <div class="badges"><span class="badge cat">${esc(eyebrow)}</span><span class="badge">Mobile first</span><span class="badge">Amazon Kindle</span></div>
        <h1>${esc(title)}</h1>
        <p class="sub">${esc(description)}</p>
        <div class="cta"><a class="btn primary" href="#lead">${esc(primary)}</a><a class="btn ghost" href="${secondary.href}">${esc(secondary.label)}</a></div>
      </div>
      <div class="panel"><h2>Embudo Zone Digital</h2><ol><li>Elige ruta</li><li>Descarga recurso gratis</li><li>Lee la ficha del libro</li><li>Compra en Amazon</li></ol></div>
    </section>
    <section class="more"><h2>Rutas recomendadas</h2><div class="grid">${cards}</div></section>
    <section class="sales-grid" id="lead"><div class="panel"><h2>Descarga gratis la Ruta de 30 dias</h2><p>Recibe una guia practica para decidir que estudiar primero y que libro usar segun tu objetivo.</p></div><div class="panel">${leadForm(formInterest)}</div></section>
  </main>
  <footer class="site"><div class="wrap">© Zone Digital · IA · Cloud · Mineria · Amazon KDP</div></footer>`;
}

function buildFunnelPages(books) {
  const routes = [
    { path: '/rutas/aws-cloud/', title: 'Ruta AWS & Cloud', desc: 'Roadmap de 30 dias para certificar, pensar como arquitecto cloud y crecer como lider tecnico.', interest: 'AWS & Cloud', ids: ['L20','L03','L29','L05','L18'] },
    { path: '/rutas/ia/', title: 'Ruta IA Aplicada', desc: 'Aprende GenAI, agentes, RAG, automatizacion y estrategia para convertir IA en ventaja profesional.', interest: 'IA Aplicada', ids: ['L30','L22','L21','L35','L23'] },
    { path: '/rutas/mineria-4-0/', title: 'Ruta Mineria 4.0', desc: 'Libros para aplicar datos, IoT, IA, seguridad, productividad y operacion remota en mineria.', interest: 'Mineria 4.0', ids: ['L09','L12','L07','L16','L31','L08'] },
  ];

  const tiktokCards = routes.map(r => `<article class="card"><h3>${r.title}</h3><p>${r.desc}</p><p><a class="btn primary" href="${r.path}" data-track-route="${r.interest}">Ver ruta</a></p></article>`).join('');
  fs.writeFileSync(ensureDirForPage('/tiktok/'), pageShell({
    path: '/tiktok/',
    title: 'Elige tu ruta para crecer con IA, Cloud y Tecnologia',
    description: 'Landing optimizada para trafico de TikTok hacia rutas profesionales, lead magnet y libros de Amazon Kindle.',
    body: landingBody({ eyebrow: 'TikTok funnel', title: 'Elige tu ruta para crecer con IA, Cloud y Tecnologia', description: 'Libros practicos para profesionales que quieren certificar, liderar proyectos, aplicar IA y construir una carrera de alto valor.', primary: 'Descargar guia gratis', secondary: { href: '/#featured', label: 'Ver libros recomendados' }, cards: tiktokCards, formInterest: 'IA Aplicada' }),
  }));

  for (const r of routes) {
    const selected = byId(books, r.ids);
    fs.writeFileSync(ensureDirForPage(r.path), pageShell({
      path: r.path,
      title: r.title,
      description: r.desc,
      body: `<header class="site"><div class="wrap"><a class="brand" href="/"><img src="/logo.webp" alt="Zone Digital" /><span>Zone<span class="dim"> Digital</span></span></a><nav class="nav"><a href="/tiktok/">TikTok</a><a href="/gratis/">Gratis</a><a href="/#books">Biblioteca</a></nav></div></header>
      <main class="wrap"><section class="hero"><div><div class="badges"><span class="badge cat">Ruta profesional</span><span class="badge">30 dias</span></div><h1>${esc(r.title)}</h1><p class="sub">${esc(r.desc)}</p><div class="cta"><a class="btn primary" href="#books">Ver libros recomendados</a><a class="btn ghost" href="#lead">Capitulo gratis</a></div></div><div class="panel"><h2>Roadmap de 30 dias</h2><ol><li>Fundamentos y lenguaje</li><li>Casos aplicados</li><li>Libro principal</li><li>Practica y checklist</li><li>Compra/lectura guiada</li></ol></div></section><section class="more" id="books"><h2>Libros recomendados</h2><div class="grid">${bookCards(selected, r.interest)}</div></section><section class="sales-grid" id="lead"><div class="panel"><h2>Descarga el recurso de esta ruta</h2><p>Te ayuda a decidir por donde empezar y que libro comprar primero.</p></div><div class="panel">${leadForm(r.interest)}</div></section></main><footer class="site"><div class="wrap">© Zone Digital</div></footer>`,
    }));
  }

  fs.writeFileSync(ensureDirForPage('/gratis/'), pageShell({
    path: '/gratis/',
    title: 'Recursos gratuitos para IA, Cloud y Mineria 4.0',
    description: 'Descarga capitulos, checklists y roadmaps gratuitos de Zone Digital.',
    body: `<header class="site"><div class="wrap"><a class="brand" href="/"><img src="/logo.webp" alt="Zone Digital" /><span>Zone<span class="dim"> Digital</span></span></a><nav class="nav"><a href="/tiktok/">TikTok</a><a href="/#books">Biblioteca</a></nav></div></header><main class="wrap"><section class="hero"><div><div class="badges"><span class="badge cat">Recursos gratis</span><span class="badge">Lead magnet</span></div><h1>Descarga recursos para crecer en IA, Cloud y Tecnologia</h1><p class="sub">Capitulos gratis, checklist de arquitecto cloud y roadmap de 30 dias para elegir tu siguiente paso profesional.</p></div><div class="panel">${leadForm('IA Aplicada')}</div></section><section class="more"><h2>Recursos disponibles</h2><div class="grid"><article class="card"><h3>Capitulo gratis AWS</h3><p>Para empezar una ruta cloud con foco profesional.</p></article><article class="card"><h3>Capitulo gratis IA</h3><p>Para pasar de curiosidad a aplicacion real.</p></article><article class="card"><h3>Capitulo gratis Mineria 4.0</h3><p>Para entender tecnologia minera conectada.</p></article><article class="card"><h3>Roadmap 30 dias IA + Cloud</h3><p>Una ruta simple para priorizar aprendizaje y compra.</p></article></div></section></main><footer class="site"><div class="wrap">© Zone Digital</div></footer>`,
  }));

  fs.writeFileSync(ensureDirForPage('/gracias/'), pageShell({
    path: '/gracias/',
    title: 'Gracias por registrarte',
    description: 'Confirmacion de registro en Zone Digital con libros recomendados.',
    body: `<header class="site"><div class="wrap"><a class="brand" href="/"><img src="/logo.webp" alt="Zone Digital" /><span>Zone<span class="dim"> Digital</span></span></a></div></header><main class="wrap"><section class="hero"><div><div class="badges"><span class="badge cat">Registro recibido</span></div><h1>Listo. Revisa tu correo y sigue con una ruta recomendada.</h1><p class="sub">Mientras llega el recurso, puedes explorar los libros con mayor intencion de compra.</p><div class="cta"><a class="btn primary" href="/rutas/ia/">Ruta IA</a><a class="btn ghost" href="/rutas/aws-cloud/">Ruta AWS</a></div></div><div class="panel"><h2>Siguiente mejor accion</h2><p>Abre una ficha, revisa si el libro encaja contigo y compra en Amazon cuando estes listo.</p></div></section></main><footer class="site"><div class="wrap">© Zone Digital</div></footer>`,
    scripts: `zdTrack('sign_up', { method:'email', interest:'free_resource' });`
  }));
}
