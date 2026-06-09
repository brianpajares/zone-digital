#!/usr/bin/env node
/**
 * build-seo.mjs — Generador de SEO de Zone Digital (sin dependencias).
 *
 * Lee el array `BOOKS` de index.html (única fuente de verdad) y regenera:
 *   1. Datos estructurados JSON-LD (ItemList de libros, FAQPage, BreadcrumbList)
 *   2. Contenido HTML pre-renderizado y rastreable dentro de #root
 *      (React lo reemplaza al cargar; crawlers y usuarios sin JS ven todo).
 *
 * Se ejecuta en el build de Netlify, así que cada vez que agregas un libro
 * al array BOOKS, el SEO se actualiza solo. Uso: `node tools/build-seo.mjs`
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const FILE = path.join(ROOT, 'index.html');
const SITE = 'https://www.zone-digital.com';

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

function extractBooks(html) {
  const m = html.match(/const BOOKS = (\[[\s\S]*?\n\]);/);
  if (!m) throw new Error('No se encontró el array BOOKS en index.html');
  const AMZ = (asin) => `${SITE.replace('www.zone-digital.com', 'www.amazon.com')}/dp/${asin}`
    .replace('https://www.amazon.com.com', 'https://www.amazon.com'); // robustez
  const amz = (asin) => `https://www.amazon.com/dp/${asin}`;
  // eslint-disable-next-line no-new-func
  return new Function('AMZ', 'return ' + m[1])(amz);
}

function jsonLd(books) {
  const itemList = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'Catálogo Zone Digital',
    description: `Catálogo de ${books.length} libros digitales sobre IA, minería, cloud, negocios y certificaciones.`,
    numberOfItems: books.length,
    itemListElement: books.map((b, i) => {
      const url = b.formats?.[0]?.u || `https://www.amazon.com/dp/${b.asin}`;
      const price = (b.formats?.[0]?.p || 'USD 9.99').replace(/[^\d.]/g, '') || '9.99';
      return {
        '@type': 'ListItem',
        position: i + 1,
        item: {
          '@type': 'Book',
          name: b.title,
          inLanguage: b.lang,
          description: b.sub,
          url,
          author: { '@type': 'Organization', name: 'Zone Digital' },
          publisher: { '@type': 'Organization', name: 'Zone Digital' },
          bookFormat: 'https://schema.org/EBook',
          offers: {
            '@type': 'Offer',
            price,
            priceCurrency: 'USD',
            availability: 'https://schema.org/InStock',
            url,
          },
        },
      };
    }),
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
      '@type': 'Question',
      name: q,
      acceptedAnswer: { '@type': 'Answer', text: a },
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

  const block = [itemList, faq, breadcrumb]
    .map((o) => `  <script type="application/ld+json">\n${JSON.stringify(o, null, 2)}\n  </script>`)
    .join('\n');
  return block;
}

function fallbackHtml(books) {
  const cards = books.map((b) => {
    const url = b.formats?.[0]?.u || `https://www.amazon.com/dp/${b.asin}`;
    const cat = CAT[b.cat]?.es || b.cat;
    const lang = LANG[b.lang] || b.lang;
    return `        <article>
          <h3>${esc(b.title)}</h3>
          <p>${esc(b.sub)}</p>
          <p><small>${esc(cat)} · ${esc(lang)}</small></p>
          <a href="${esc(url)}" rel="noopener">Ver en Amazon</a>
        </article>`;
  }).join('\n');

  return `    <div style="max-width:1100px;margin:0 auto;padding:48px 24px;font-family:system-ui,Segoe UI,Roboto,sans-serif;color:#0B0E14">
      <header>
        <p><strong>Zone Digital</strong> — Libros, apps y cursos para el profesional potenciado por IA</p>
      </header>
      <main>
        <h1>Convierte conocimiento técnico en una ventaja competitiva</h1>
        <p>Zone Digital publica ${books.length} libros, cursos y herramientas sobre inteligencia artificial, minería, cloud, negocios y certificaciones (AWS, Azure, Google Cloud). En español e inglés. Empieza con un capítulo gratis y avanza a tu ritmo.</p>
        <p>
          <a href="#books">Explorar la biblioteca</a> ·
          <a href="https://www.amazon.com/stores/Zone-Digital/author" rel="noopener">Ver en Amazon</a>
        </p>
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

function replaceBetween(html, startMark, endMark, content) {
  const start = html.indexOf(startMark);
  const end = html.indexOf(endMark);
  if (start === -1 || end === -1) throw new Error(`Marcadores no encontrados: ${startMark}`);
  const before = html.slice(0, start + startMark.length);
  const after = html.slice(end);
  return `${before}\n${content}\n  ${after}`;
}

// ---- run ----
let html = fs.readFileSync(FILE, 'utf8');
const books = extractBooks(html);

html = replaceBetween(
  html,
  '<!-- SEO-JSONLD:START (auto-generado por tools/build-seo.mjs — no editar a mano) -->',
  '<!-- SEO-JSONLD:END -->',
  jsonLd(books),
);
html = replaceBetween(
  html,
  '<!-- SEO-FALLBACK:START (auto-generado por tools/build-seo.mjs — React lo reemplaza al cargar) -->',
  '<!-- SEO-FALLBACK:END -->',
  fallbackHtml(books),
);

fs.writeFileSync(FILE, html);
console.log(`✓ SEO regenerado: ${books.length} libros → JSON-LD (Book/FAQ/Breadcrumb) + HTML rastreable`);
