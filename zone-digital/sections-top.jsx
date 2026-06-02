// sections-top.jsx — Header (con toggle ES/EN), Hero, Strip, Books
const { useState: useStateT, useEffect: useEffectT } = React;

/* ============ LANGUAGE TOGGLE ============ */
function LangToggle({ lang, setLang }) {
  return (
    <div className="zd-langtoggle" role="group" aria-label="Idioma / Language">
      <button className={lang === 'es' ? 'on' : ''} onClick={() => setLang('es')}>ES</button>
      <button className={lang === 'en' ? 'on' : ''} onClick={() => setLang('en')}>EN</button>
    </div>
  );
}

/* ============ HEADER ============ */
function Header({ onLead, t, lang, setLang }) {
  const [scrolled, setScrolled] = useStateT(false);
  useEffectT(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);
  return (
    <header className={`zd-header ${scrolled ? 'scrolled' : ''}`}>
      <div className="zd-wrap">
        <a href="#top"><Logo height={30} /></a>
        <nav className="zd-nav">
          <a href="#books">{t('Libros', 'Books')}</a>
          <a href="#labs">{t('Cursos & Apps', 'Courses & Apps')}</a>
          <a href="#about">{t('Brian', 'About Brian')}</a>
        </nav>
        <div className="zd-header-cta">
          <LangToggle lang={lang} setLang={setLang} />
          <Button variant="ghost" size="sm" onClick={() => onLead(null)}>{t('Capítulo gratis', 'Free chapter')}</Button>
          <Button variant="lime" size="sm" icon="cart" onClick={() => document.getElementById('books').scrollIntoView({ behavior: 'smooth' })}>{t('Ver libros', 'Browse')}</Button>
        </div>
      </div>
    </header>
  );
}

/* ============ HERO ============ */
function Hero({ onLead, t }) {
  return (
    <section className="zd-section zd-hero" id="top">
      <div className="zd-hero-glow"></div>
      <div className="zd-hero-grid"></div>
      <div className="zd-wrap zd-hero-inner">
        <div className="zd-hero-badge">
          <span className="pill">{t('27 títulos', '27 titles')}</span>
          <span>{t('Libros, cursos y apps para el profesional potenciado por IA', 'Books, apps & courses for the AI-powered professional')}</span>
        </div>
        <h1 className="zd-h1">
          {t('Convierte conocimiento técnico', 'Turn deep technical know-how')}<br/>
          {t('en ', 'into a real ')}<span className="zd-serif zd-lime-text">{t('ventaja', 'competitive')}</span> <span className="accent">{t('competitiva.', 'edge.')}</span>
        </h1>
        <p className="zd-hero-sub">
          {t(
            'Zone Digital publica libros, cursos y herramientas sobre inteligencia artificial, minería, negocios y certificaciones. Empieza con un capítulo gratis y avanza a tu ritmo.',
            'Zone Digital publishes books, courses and tools on artificial intelligence, mining, business and certifications. Start with a free chapter and move at your own pace.'
          )}
        </p>
        <div className="zd-hero-actions">
          <Button variant="lime" size="lg" icon="book" onClick={() => document.getElementById('books').scrollIntoView({ behavior: 'smooth' })}>
            {t('Explorar la biblioteca', 'Explore the library')}
          </Button>
          <Button variant="ghost" size="lg" icon="download" onClick={() => onLead(null)}>
            {t('Descargar capítulo gratis', 'Get a free chapter')}
          </Button>
        </div>

        <div className="zd-hero-metrics">
          <div className="zd-metric">
            <div className="num">27</div>
            <div className="lbl">{t('libros publicados en Amazon y Gumroad', 'books published on Amazon and Gumroad')}</div>
          </div>
          <div className="zd-metric">
            <div className="num">5</div>
            <div className="lbl">{t('áreas: minería, IA, negocios, certificación y start ups', 'areas: mining, AI, business, certification and start ups')}</div>
          </div>
          <div className="zd-metric">
            <div className="num cobalt">2</div>
            <div className="lbl">{t('idiomas para una audiencia global', 'languages for a global audience')}</div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ============ STRIP ============ */
function Strip({ t }) {
  const items = t(
    ['Inteligencia Artificial', 'Minería Digital', 'Robótica', 'Certificación PMP', 'IoT Industrial', 'Liderazgo Ejecutivo', 'IA Generativa', 'Transformación Digital'],
    ['Artificial Intelligence', 'Digital Mining', 'Robotics', 'PMP Certification', 'Industrial IoT', 'Executive Leadership', 'Generative AI', 'Digital Transformation']
  );
  const row = [...items, ...items];
  return (
    <div className="zd-strip">
      <div className="zd-strip-track">
        {row.map((it, i) => (
          <span className="zd-strip-item" key={i}><span className="dot"></span>{it}</span>
        ))}
      </div>
    </div>
  );
}

/* ============ BOOKS ============ */
function Books({ onLead, t, lang }) {
  const [cat, setCat] = useStateT('all');
  const [blang, setBlang] = useStateT('all');
  const catLabels = {
    all: t('Todos', 'All'), mining: t('Minería', 'Mining'), tech: t('IA & Tech', 'AI & Tech'),
    business: t('Negocios', 'Business'), cert: t('Certificación', 'Certification'), startup: t('Start Ups', 'Start Ups'),
  };
  const langLabels = { all: t('Idioma', 'Language'), es: 'Español', en: 'English' };
  const list = BOOKS.filter(b => (cat === 'all' || b.cat === cat) && (blang === 'all' || b.lang === blang));
  return (
    <section className="zd-section" id="books">
      <div className="zd-wrap">
        <Reveal>
          <div className="zd-sec-top">
            <div className="zd-sec-head">
              <span className="zd-overline">{t('La biblioteca', 'The library')}</span>
              <h2 className="zd-h2">
                {t('Cada libro, dos caminos: ', 'Every book, two ways: ')}
                <span className="zd-serif zd-lime-text">{t('cómpralo', 'buy it')}</span>
                {t(' o léelo gratis.', ' or read it free.')}
              </h2>
            </div>
          </div>
        </Reveal>

        <Reveal delay={80}>
          <div className="zd-filters" style={{ marginTop: 32 }}>
            {CATEGORIES.map(c => (
              <button key={c.id} className={`zd-chip ${cat === c.id ? 'active' : ''}`} onClick={() => setCat(c.id)}>{catLabels[c.id]}</button>
            ))}
            <span className="zd-chip-sep"></span>
            {LANGS.map(l => (
              <button key={l.id} className={`zd-chip ${blang === l.id ? 'active' : ''}`} onClick={() => setBlang(l.id)}>{langLabels[l.id]}</button>
            ))}
          </div>
        </Reveal>

        <div className="zd-book-grid">
          {list.map((b, i) => (
            <Reveal key={b.id} delay={(i % 4) * 60}>
              <article className="zd-book">
                <div className="zd-book-cover">
                  <span className="lang">{b.lang.toUpperCase()}</span>
                  <BookCover book={b} />
                </div>
                <div className="zd-book-body">
                  <span className="zd-book-cat">{catLabels[b.cat]}</span>
                  <h3 className="zd-book-title">{b.title}</h3>
                  <p className="zd-book-desc">{b.sub}</p>
                  <div className="zd-book-formats">
                    {b.formats.map((f) => (
                      <a key={f.k} className="zd-fmt" href={f.u} target="_blank" rel="noopener">
                        {f.k} · <span className="zd-mono">{f.p}</span>
                      </a>
                    ))}
                  </div>
                  <div className="zd-book-actions">
                    <Button variant="light" size="sm" icon="cart" style={{ width: '100%', justifyContent: 'center' }}
                      onClick={() => window.open(b.formats[0].u, '_blank')}>{t('Comprar en Amazon', 'Buy on Amazon')}</Button>
                    <Button variant="ghost" size="sm" icon="download" style={{ width: '100%', justifyContent: 'center' }}
                      onClick={() => onLead(b)}>{t('Capítulo gratis', 'Free chapter')}</Button>
                  </div>
                </div>
              </article>
            </Reveal>
          ))}
        </div>
        <Reveal>
          <p className="zd-mono" style={{ marginTop: 28, color: 'var(--zd-text-3)', fontSize: 12 }}>
            {list.length} {t('títulos · Kindle, tapa blanda, tapa dura y PDF · disponibles en Amazon y Gumroad', 'titles · Kindle, paperback, hardcover and PDF · available on Amazon and Gumroad')}
          </p>
        </Reveal>
      </div>
    </section>
  );
}

Object.assign(window, { Header, Hero, Strip, Books, LangToggle });
