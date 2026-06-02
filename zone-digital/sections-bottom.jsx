// sections-bottom.jsx — Labs, About, Newsletter CTA, Footer (i18n)
const { useState: useStateB } = React;

/* ============ COURSES & APPS ============ */
function Labs({ t }) {
  return (
    <section className="zd-section" id="labs">
      <div className="zd-wrap">
        <Reveal>
          <div className="zd-sec-head">
            <span className="zd-overline">{t('Lo que viene', 'What’s next')}</span>
            <h2 className="zd-h2">{t('Cursos y apps en construcción.', 'Courses and apps in the works.')}</h2>
            <p>{t('Próximos lanzamientos con lista de espera, preventa y acceso anticipado para la comunidad.', 'Upcoming launches with waitlists, pre-sales and early access for the community.')}</p>
          </div>
        </Reveal>
        <div className="zd-cards">
          <Reveal>
            <Soon t={t} tag={t('Curso · Próximamente', 'Course · Coming soon')} icon="play"
              title={t('IA aplicada para profesionales', 'Applied AI for professionals')}
              desc={t('De cero a flujos reales con IA en tu trabajo. Plantillas, prompts y casos prácticos por industria.', 'From zero to real AI workflows in your job. Templates, prompts and practical cases by industry.')} />
          </Reveal>
          <Reveal delay={90}>
            <Soon t={t} tag={t('App · Acceso anticipado', 'App · Early access')} icon="layers"
              title={t('Zone Mining Intelligence', 'Zone Mining Intelligence')}
              desc={t('Herramienta de inteligencia minera: gemelos digitales y datos de faena en un solo panel.', 'A mining intelligence tool: digital twins and operational data in a single dashboard.')} />
          </Reveal>
        </div>
      </div>
    </section>
  );
}

function Soon({ tag, title, desc, icon, t }) {
  const [sent, setSent] = useStateB(false);
  const [email, setEmail] = useStateB('');
  return (
    <div className="zd-soon">
      <span className="zd-soon-tag">{tag}</span>
      <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
        <span className="zd-ai-seal" style={{ background: 'rgba(244,241,234,0.06)', color: 'var(--zd-lime)' }}><Icon name={icon} size={16} /></span>
        <h3 className="zd-h3">{title}</h3>
      </div>
      <p>{desc}</p>
      {sent ? (
        <div className="zd-ai-chip" style={{ color: 'var(--zd-lime)', marginTop: 4 }}><Icon name="checkCircle" size={18} /> {t('Estás en la lista. Te avisamos primero.', 'You’re on the list. We’ll tell you first.')}</div>
      ) : (
        <form className="zd-waitlist" onSubmit={(e) => { e.preventDefault(); if (email.includes('@')) setSent(true); }}>
          <input className="zd-input" type="email" placeholder={t('tu@email.com', 'you@email.com')} value={email} onChange={e => setEmail(e.target.value)} required />
          <Button variant="cobalt" type="submit" iconRight="arrow">{t('Unirme', 'Join')}</Button>
        </form>
      )}
    </div>
  );
}

/* ============ ABOUT BRIAN ============ */
const BRIAN_PHOTO = 'https://drive.google.com/thumbnail?id=1u-fDIX8-TpEInAfCWTuX6advF7rH5GFm&sz=w1400';

function About({ t }) {
  const creds = t(
    ['IA & Negocios', 'Minería Digital', 'PMP · Certificaciones', 'Autor publicado', 'Speaker', 'Consultor'],
    ['AI & Business', 'Digital Mining', 'PMP · Certifications', 'Published author', 'Speaker', 'Consultant']
  );
  return (
    <section className="zd-section" id="about" style={{ paddingTop: 0 }}>
      <div className="zd-wrap">
        <div className="zd-about">
          <Reveal>
            <div className="zd-portrait">
              <img
                src={BRIAN_PHOTO}
                alt="Brian Pajares"
                style={{ position: ‘absolute’, inset: 0, width: ‘100%’, height: ‘100%’, objectFit: ‘cover’, objectPosition: ‘center top’ }}
              />
            </div>
          </Reveal>
          <Reveal delay={100}>
            <div>
              <span className="zd-overline">{t('El autor', 'The author')}</span>
              <h2 className="zd-h2" style={{ marginTop: 18 }}>
                {t('Brian Pajares convierte tecnología compleja en ', 'Brian Pajares turns complex technology into ')}
                <span className="zd-serif zd-lime-text">{t('decisiones claras.', 'clear decisions.')}</span>
              </h2>
              <p className="zd-lead" style={{ marginTop: 22 }}>
                {t(
                  'Una marca global creada para que profesionales de habla hispana e inglesa dominen la inteligencia artificial, la minería y los negocios — y los traduzcan en ingresos, autoridad y ventaja competitiva real.',
                  'A global brand built so Spanish- and English-speaking professionals can master artificial intelligence, mining and business — and turn them into income, authority and a real competitive edge.'
                )}
              </p>
              <div className="zd-cred">
                {creds.map(c => <span key={c} className="zd-mono">{c}</span>)}
              </div>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

/* ============ NEWSLETTER CTA ============ */
function NewsletterCTA({ t }) {
  const [sent, setSent] = useStateB(false);
  const [email, setEmail] = useStateB('');
  return (
    <section className="zd-section" style={{ paddingTop: 0 }}>
      <div className="zd-wrap">
        <Reveal>
          <div className="zd-cta-band">
            <div className="glow"></div>
            <div className="zd-cta-inner">
              <span className="zd-overline no-rule" style={{ color: 'rgba(255,255,255,0.7)' }}>{t('Newsletter Zone Digital', 'Zone Digital newsletter')}</span>
              <h2 className="zd-h2" style={{ marginTop: 16 }}>{t('Un email útil por semana. Cero relleno.', 'One useful email a week. Zero filler.')}</h2>
              <p style={{ marginTop: 14, fontSize: 'var(--text-lg)' }}>
                {t('Ideas sobre IA, minería y negocios, más avisos de capítulos y lanzamientos antes que nadie.', 'Ideas on AI, mining and business, plus chapter drops and launches before anyone else.')}
              </p>
              {sent ? (
                <div style={{ marginTop: 26, display: 'flex', alignItems: 'center', gap: 10, color: '#fff', fontWeight: 600 }}>
                  <Icon name="checkCircle" size={22} /> {t('Listo. Revisa tu correo para confirmar.', 'Done. Check your inbox to confirm.')}
                </div>
              ) : (
                <form className="zd-cta-form" onSubmit={(e) => { e.preventDefault(); if (email.includes('@')) setSent(true); }}>
                  <input className="zd-input" type="email" placeholder={t('tu@email.com', 'you@email.com')} value={email} onChange={e => setEmail(e.target.value)} required />
                  <Button variant="lime" type="submit" iconRight="send">{t('Suscribirme', 'Subscribe')}</Button>
                </form>
              )}
              <p className="zd-cta-note">{t('Sin spam. Te das de baja con un clic. Enviado con autenticación SPF, DKIM y DMARC.', 'No spam. One-click unsubscribe. Sent with SPF, DKIM and DMARC authentication.')}</p>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/* ============ FOOTER ============ */
function Footer({ t }) {
  const cols = [
    { h: t('Catálogo', 'Catalog'), items: [t('Libros', 'Books'), t('Recursos gratis', 'Free resources'), t('Cursos', 'Courses'), 'Apps'] },
    { h: t('Compañía', 'Company'), items: [t('Sobre Brian', 'About Brian'), t('Contacto', 'Contact'), t('Alianzas', 'Partnerships'), t('Prensa', 'Press')] },
    { h: 'Legal', items: [t('Privacidad', 'Privacy Policy'), t('Términos de uso', 'Terms of Use'), t('Aviso de afiliados', 'Affiliate Disclosure'), t('Cookies', 'Cookie Notice')] },
  ];
  return (
    <footer className="zd-footer">
      <div className="zd-wrap">
        <div className="zd-footer-grid">
          <div>
            <Logo height={30} />
            <p style={{ marginTop: 18, maxWidth: 300, color: 'var(--zd-text-2)', fontSize: 'var(--text-sm)', lineHeight: 1.6 }}>
              {t('Libros, apps y cursos para el profesional potenciado por IA. Una marca global de Brian Pajares.', 'Books, apps & courses for the AI-powered professional. A global brand by Brian Pajares.')}
            </p>
            <div className="zd-mono" style={{ marginTop: 18, fontSize: 12, color: 'var(--zd-text-3)' }}>brian@zone-digital.com</div>
          </div>
          {cols.map(c => (
            <div key={c.h}>
              <h5>{c.h}</h5>
              <ul>{c.items.map(it => <li key={it}><a href="#">{it}</a></li>)}</ul>
            </div>
          ))}
        </div>
        <div className="zd-footer-foot">
          <span className="zd-mono">© 2026 Zone Digital · www.zone-digital.com</span>
          <span className="zd-mono">{t('Hecho para una audiencia global · ES / EN', 'Built for a global audience · ES / EN')}</span>
        </div>
      </div>
    </footer>
  );
}

Object.assign(window, { Labs, About, NewsletterCTA, Footer });
