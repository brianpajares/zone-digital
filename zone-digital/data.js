// Zone Digital — catálogo real (Google Sheet, 27 títulos en Amazon)
// Portadas: CDN de imágenes de Amazon por ASIN, con respaldo tipográfico.

const CATEGORIES = [
  { id: 'all',     label: 'Todos' },
  { id: 'mining',  label: 'Minería' },
  { id: 'tech',    label: 'IA & Tech' },
  { id: 'business',label: 'Negocios' },
  { id: 'cert',    label: 'Certificación' },
  { id: 'startup', label: 'Start Ups' },
];

const LANGS = [
  { id: 'all', label: 'Idioma' },
  { id: 'es',  label: 'Español' },
  { id: 'en',  label: 'English' },
];

// Paletas de portada — todas dentro de los tokens del sistema
const COVERS = {
  mining:   { bg: 'linear-gradient(155deg,#11141C 0%,#0B0E14 60%,#1A1D24 100%)', fg: '#F4F1EA', accent: '#D8FF3D' },
  tech:     { bg: 'linear-gradient(155deg,#1830B0 0%,#2547F0 55%,#0B1A78 100%)', fg: '#FFFFFF', accent: '#D8FF3D' },
  business: { bg: 'linear-gradient(155deg,#2A2E37 0%,#11141C 70%)',             fg: '#F4F1EA', accent: '#D8FF3D' },
  cert:     { bg: 'linear-gradient(155deg,#0B0E14 0%,#11141C 100%)',           fg: '#F4F1EA', accent: '#2547F0' },
  startup:  { bg: 'linear-gradient(155deg,#1A1D24 0%,#0B0E14 70%)',            fg: '#F4F1EA', accent: '#D8FF3D' },
};

const CAT_LABEL = { mining: 'Minería', tech: 'IA & Tech', business: 'Negocios', cert: 'Certificación', startup: 'Start Ups' };

// helper de URL Amazon por ASIN
const AMZ = (asin) => `https://www.amazon.com/dp/${asin}`;

const BOOKS = [
  { id:'L25', cat:'mining', lang:'en', short:'The Digital Twin Mine',
    title:'The Digital Twin Mine', featured:true,
    sub:'How AI, real-time data and operational intelligence redefine productivity and safety in mining.',
    asin:'B0H381YN82',
    formats:[ {k:'Kindle', p:'USD 9.99', u:AMZ('B0H381YN82')} ] },

  { id:'L24', cat:'mining', lang:'en', short:'Designing Robots for Mining',
    title:'Designing Robots for Mining', featured:true,
    sub:'The engineering handbook for autonomous drilling, hauling, inspection and underground robotics.',
    asin:'B0H3891219',
    formats:[ {k:'Kindle', p:'USD 9.99', u:AMZ('B0H3891219')} ] },

  { id:'L27', cat:'mining', lang:'en', short:'Open-Pit IoT Revolution',
    title:'Open-Pit IoT Revolution',
    sub:'How satellites, drones, 5G and edge AI are rewiring the world’s largest open-pit mines.',
    asin:'B0H3CS4K38',
    formats:[ {k:'Kindle', p:'USD 9.99', u:AMZ('B0H3CS4K38')} ] },

  { id:'L26', cat:'mining', lang:'en', short:'Battery-Electric Underground Mining',
    title:'Battery-Electric Underground Mining',
    sub:'Engineering the diesel-free mine: powertrains, charging infrastructure and the new economics.',
    asin:'B0H3CDGH5F',
    formats:[ {k:'Kindle', p:'USD 9.99', u:AMZ('B0H3CDGH5F')} ] },

  { id:'L23', cat:'tech', lang:'en', short:'The AI Growth Operating System',
    title:'The AI Growth Operating System', featured:true,
    sub:'How leaders build agentic workflows, data foundations and new revenue engines.',
    asin:'B0H2KJ15ZX',
    formats:[ {k:'Kindle', p:'USD 9.99', u:AMZ('B0H2KJ15ZX')}, {k:'Tapa blanda', p:'USD 29.99', u:AMZ('B0H2PWP6HX')} ] },

  { id:'L22', cat:'tech', lang:'es', short:'Chief AI Officer',
    title:'Chief AI Officer', featured:true,
    sub:'El nuevo líder de la empresa inteligente. Gobernanza, estrategia y adopción real de IA.',
    asin:'B0GYZYK1G7',
    formats:[ {k:'Kindle', p:'USD 9.99', u:AMZ('B0GYZYK1G7')}, {k:'Tapa blanda', p:'USD 29.99', u:AMZ('B0GZ3BRP2K')} ] },

  { id:'L21', cat:'business', lang:'es', short:'CEO Aumentado',
    title:'CEO Aumentado', featured:true,
    sub:'Cómo líderes y profesionales convierten la IA en estrategia, productividad y ventaja competitiva.',
    asin:'B0GYTJ466Y',
    formats:[ {k:'Kindle', p:'USD 9.99', u:AMZ('B0GYTJ466Y')}, {k:'Tapa blanda', p:'USD 29.99', u:AMZ('B0GZ316BHH')} ] },

  { id:'L06', cat:'business', lang:'es', short:'Domina la IA Generativa',
    title:'Domina la Era de la IA Generativa',
    sub:'La guía definitiva para data scientists del futuro. De la curiosidad al dominio.',
    asin:'B0F5NV8NY5',
    formats:[ {k:'Kindle', p:'USD 9.99', u:'https://www.amazon.com/-/es/Brian-Pajares-ebook/dp/B0F5NV8NY5'}, {k:'Tapa blanda', p:'USD 24.99', u:AMZ('B0F7FRTVQ7')}, {k:'Tapa dura', p:'USD 49.99', u:AMZ('B0F7QXNR4S')}, {k:'PDF', p:'USD 7.99', u:'https://zonedigital0.gumroad.com/l/ebookia'} ] },

  { id:'L08', cat:'mining', lang:'es', short:'Tecnología Minera en Acción',
    title:'Tecnología Minera en Acción',
    sub:'Instalar, automatizar y sostener soluciones con data e inteligencia artificial.',
    asin:'B0F59MNMN2',
    formats:[ {k:'Kindle', p:'USD 9.99', u:AMZ('B0F59MNMN2')}, {k:'Tapa blanda', p:'USD 24.99', u:AMZ('B0F7GCBL2Q')}, {k:'Tapa dura', p:'USD 49.99', u:AMZ('B0F7GHVB7Q')}, {k:'PDF', p:'USD 7.99', u:'https://zonedigital0.gumroad.com/l/ebooktecnologiaminera'} ] },

  { id:'L01', cat:'cert', lang:'es', short:'La Ruta Maestra hacia el PMP',
    title:'La Ruta Maestra hacia la Certificación PMP', featured:true,
    sub:'Guía práctica para profesionales exitosos. El plan que aprueba el PMP a la primera.',
    asin:'B0DWPB9MML',
    formats:[ {k:'Kindle', p:'USD 9.99', u:AMZ('B0DWPB9MML')}, {k:'PDF', p:'USD 7.99', u:'https://zonedigital0.gumroad.com/l/ebookpmp'} ] },

  { id:'L02', cat:'cert', lang:'es', short:'CFA: El Camino al Éxito Financiero',
    title:'CFA: El Camino Certificado al Éxito Financiero Global',
    sub:'La guía definitiva para aprobar y triunfar en el examen más prestigioso del mundo.',
    asin:'B0DWT17LCJ',
    formats:[ {k:'Kindle', p:'USD 9.99', u:AMZ('B0DWT17LCJ')}, {k:'PDF', p:'USD 7.99', u:'https://zonedigital0.gumroad.com/l/ebookcfa'} ] },

  { id:'L03', cat:'cert', lang:'es', short:'AWS Solutions Architect Associate',
    title:'AWS Solutions Architect Associate',
    sub:'Certifícate y transforma tu carrera en la nube.',
    asin:'B0DWT8XXXD',
    formats:[ {k:'Kindle', p:'USD 9.99', u:AMZ('B0DWT8XXXD')}, {k:'Tapa blanda', p:'USD 24.99', u:AMZ('B0F79WNWYM')}, {k:'Tapa dura', p:'USD 49.99', u:AMZ('B0F7LD9ZQM')}, {k:'PDF', p:'USD 7.99', u:'https://zonedigital0.gumroad.com/l/ebookaws'} ] },

  { id:'L04', cat:'business', lang:'es', short:'MBA Rediseñado',
    title:'MBA Rediseñado',
    sub:'Aprende, lidera y triunfa con las estrategias que funcionan hoy.',
    asin:'B0F5QR9FNZ',
    formats:[ {k:'Kindle', p:'USD 9.99', u:AMZ('B0F5QR9FNZ')}, {k:'Tapa blanda', p:'USD 24.99', u:AMZ('B0F7FG4QZT')}, {k:'Tapa dura', p:'USD 49.99', u:AMZ('B0F7QX5PV1')}, {k:'PDF', p:'USD 7.99', u:'https://zonedigital0.gumroad.com/l/ebookmba'} ] },

  { id:'L05', cat:'business', lang:'es', short:'Arquitectura de Soluciones',
    title:'Arquitectura de Soluciones para Líderes Tecnológicos',
    sub:'Diseña, escala y transforma. El manual del líder técnico moderno.',
    asin:'B0F5NWGYNY',
    formats:[ {k:'Kindle', p:'USD 9.99', u:AMZ('B0F5NWGYNY')}, {k:'Tapa blanda', p:'USD 24.99', u:AMZ('B0F6YJ1235')}, {k:'Tapa dura', p:'USD 49.99', u:AMZ('B0F7GGJVGP')}, {k:'PDF', p:'USD 7.99', u:'https://zonedigital0.gumroad.com/l/ebookarquitectura'} ] },

  { id:'L07', cat:'mining', lang:'es', short:'El ABC de la Innovación Minera',
    title:'El ABC de la Innovación Minera',
    sub:'Los fundamentos de la transformación tecnológica en minería, explicados con claridad.',
    asin:'B08W8G9J9J',
    formats:[ {k:'Kindle', p:'USD 9.99', u:AMZ('B08W8G9J9J')}, {k:'Tapa blanda', p:'USD 24.99', u:AMZ('B08W6QDCX3')}, {k:'PDF', p:'USD 7.99', u:'https://zonedigital0.gumroad.com/l/ebookABC'} ] },

  { id:'L09', cat:'mining', lang:'es', short:'Transformación Digital y Minería 4.0',
    title:'La Transformación Digital y la Minería 4.0',
    sub:'La guía de todo profesional del futuro para entender la minería conectada.',
    asin:'B08XGDJWF6',
    formats:[ {k:'Kindle', p:'USD 9.99', u:AMZ('B08XGDJWF6')}, {k:'Tapa blanda', p:'USD 20.00', u:AMZ('B08XNDNPDT')}, {k:'PDF', p:'USD 7.99', u:'https://zonedigital0.gumroad.com/l/ebookmineria'} ] },

  { id:'L10', cat:'startup', lang:'es', short:'Liderando Start Ups del Futuro',
    title:'Liderando Start Ups del Futuro',
    sub:'La guía para ser un emprendedor exitoso, del primer cliente al crecimiento.',
    asin:'B08XHDW2P5',
    formats:[ {k:'Kindle', p:'USD 9.99', u:AMZ('B08XHDW2P5')}, {k:'Tapa blanda', p:'USD 16.00', u:AMZ('B08XL7ZG3H')} ] },

  { id:'L11', cat:'mining', lang:'en', short:'ABC of Mining Innovation',
    title:'ABC of the Mining Innovation',
    sub:'The fundamentals of technological transformation in mining, clearly explained.',
    asin:'B08XLMDF6S',
    formats:[ {k:'Kindle', p:'USD 9.99', u:AMZ('B08XLMDF6S')}, {k:'Tapa blanda', p:'USD 25.00', u:AMZ('B08XGSTPCQ')} ] },

  { id:'L12', cat:'mining', lang:'en', short:'Digital Transformation & Mining 4.0',
    title:'All About Digital Transformation and Mining 4.0',
    sub:'The guide every future professional needs to understand connected mining.',
    asin:'B08XLMLDQW',
    formats:[ {k:'Kindle', p:'USD 9.99', u:AMZ('B08XLMLDQW')}, {k:'Tapa blanda', p:'USD 25.00', u:AMZ('B08XLLDZ8Y')} ] },

  { id:'L13', cat:'startup', lang:'en', short:'Leading Start Ups of the Future',
    title:'Leading Start Ups of the Future',
    sub:'The guide to being a successful entrepreneur, from first client to growth.',
    asin:'B08XJV1222',
    formats:[ {k:'Kindle', p:'USD 9.99', u:AMZ('B08XJV1222')}, {k:'Tapa blanda', p:'USD 25.00', u:AMZ('B08XL7ZFCP')} ] },

  { id:'L14', cat:'cert', lang:'en', short:'The Master Path to PMP',
    title:'The Master Path to PMP Certification',
    sub:'A practical guide for successful professionals.',
    asin:'B0DWM13M4P',
    formats:[ {k:'Kindle', p:'USD 9.99', u:AMZ('B0DWM13M4P')} ] },

  { id:'L15', cat:'cert', lang:'en', short:'CFA: The Certified Path',
    title:'CFA: The Certified Path to Global Financial Success',
    sub:'The ultimate guide to passing the world’s most prestigious exam.',
    asin:'B0DWQM4B7Z',
    formats:[ {k:'Kindle', p:'USD 9.99', u:AMZ('B0DWQM4B7Z')} ] },

  { id:'L16', cat:'mining', lang:'en', short:'Mining Technology in Action',
    title:'Mining Technology in Action',
    sub:'A complete guide to installing, automating and sustaining solutions with data and AI.',
    asin:'B0F3VB8K2N',
    formats:[ {k:'Kindle', p:'USD 9.99', u:AMZ('B0F3VB8K2N')} ] },

  { id:'L17', cat:'tech', lang:'en', short:'Master the Age of Generative AI',
    title:'Master the Age of Generative AI',
    sub:'The ultimate guide for data scientists of the future.',
    asin:'B0F5NTJ55Q',
    formats:[ {k:'Kindle', p:'USD 9.99', u:AMZ('B0F5NTJ55Q')} ] },

  { id:'L18', cat:'business', lang:'en', short:'Solutions Architecture for Leaders',
    title:'Solutions Architecture for Technology Leaders',
    sub:'Design, scale and transform.',
    asin:'B0F5QKYCJV',
    formats:[ {k:'Kindle', p:'USD 9.99', u:AMZ('B0F5QKYCJV')} ] },

  { id:'L19', cat:'business', lang:'en', short:'MBA Redesigned',
    title:'MBA Redesigned',
    sub:'Learn, lead and succeed with strategies that work today.',
    asin:'B0F4ZMBB8W',
    formats:[ {k:'Kindle', p:'USD 9.99', u:AMZ('B0F4ZMBB8W')} ] },

  { id:'L20', cat:'cert', lang:'en', short:'AWS Solutions Architect Associate',
    title:'AWS Solutions Architect Associate',
    sub:'Get certified and transform your career in the cloud.',
    asin:'B0DWTB2V3R',
    formats:[ {k:'Kindle', p:'USD 9.99', u:AMZ('B0DWTB2V3R')} ] },
];

const INTERESTS = ['Minería', 'IA & Tecnología', 'Negocios', 'Certificaciones', 'Start Ups'];
const COUNTRIES = ['México', 'Colombia', 'Perú', 'Chile', 'España', 'Argentina', 'Estados Unidos', 'Otro'];

Object.assign(window, { CATEGORIES, LANGS, COVERS, CAT_LABEL, BOOKS, INTERESTS, COUNTRIES, AMZ });
