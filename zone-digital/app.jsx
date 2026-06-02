// app.jsx — LeadModal, ExitIntent, App (i18n)
const { useState: useStateA, useEffect: useEffectA, useRef: useRefA } = React;

/* ============ LEAD MODAL ============ */
function LeadModal({ book, onClose, t, lang }) {
  const interests = t(
    ['Minería', 'IA & Tecnología', 'Negocios', 'Certificaciones', 'Start Ups'],
    ['Mining', 'AI & Technology', 'Business', 'Certifications', 'Start Ups']
  );
  const countries = t(COUNTRIES, ['Mexico', 'Colombia', 'Peru', 'Chile', 'Spain', 'Argentina', 'United States', 'Other']);
  const CAT_TO_IDX = { mining: 0, tech: 1, business: 2, cert: 3, startup: 4 };
  const initInterest = book ? interests[CAT_TO_IDX[book.cat]] : interests[0];
  const [form, setForm] = useStateA({ name: '', email: '', interest: initInterest, country: countries[0], consent: false });
  const [done, setDone] = useStateA(false);
  const [err, setErr] = useStateA('');
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  useEffectA(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => { document.removeEventListener('keydown', onKey); document.body.style.overflow = ''; };
  }, []);

  const submit = (e) => {
    e.preventDefault();
    if (!form.name.trim()) return setErr(t(‘Escribe tu nombre.’, ‘Enter your name.’));
    if (!form.email.includes(‘@’)) return setErr(t(‘El email no es válido. Revísalo e intenta de nuevo.’, ‘That email isn\’t valid. Check it and try again.’));
    if (!form.consent) return setErr(t(‘Marca el consentimiento para recibir el capítulo.’, ‘Tick the consent box to receive the chapter.’));
    setErr(‘’);
    fetch(‘/’, {
      method: ‘POST’,
      headers: { ‘Content-Type’: ‘application/x-www-form-urlencoded’ },
      body: new URLSearchParams({
        ‘form-name’: ‘lead-capture’,
        name: form.name,
        email: form.email,
        interest: form.interest,
        country: form.country,
        book: book ? book.title : ‘’,
      }).toString()
    }).catch(() => {});
    setDone(true);
  };

  return (
    <div className="zd-modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="zd-modal">
        <aside className="zd-modal-aside">
          <div className="glow"></div>
          <div style={{ position: 'relative', zIndex: 2 }}>
            <div className="zd-ai-chip"><span className="star">✦</span> {t('Capítulo gratis', 'Free chapter')}</div>
            {book ? (
              <div style={{ marginTop: 24, borderRadius: 'var(--radius-md)', overflow: 'hidden', aspectRatio: '4/5', maxWidth: 190, position: 'relative' }}>
                <BookCover book={book} />
              </div>
            ) : null}
          </div>
          <div style={{ position: 'relative', zIndex: 2 }}>
            <h3 className="zd-h3" style={{ color: 'var(--bone)' }}>{book ? book.title : t('Elige por dónde empezar', 'Choose where to start')}</h3>
            <p style={{ color: 'var(--zd-text-2)', fontSize: 'var(--text-sm)', marginTop: 10, lineHeight: 1.5 }}>
              {book
                ? t('Te enviamos un capítulo gratis de este libro. Solo necesitamos a dónde mandarlo.', 'We’ll send you a free chapter of this book. We just need where to send it.')
                : t('Te enviamos un capítulo gratis según el área que más te interese.', 'We’ll send you a free chapter based on the area you care about most.')}
            </p>
          </div>
        </aside>

        <div className="zd-modal-body">
          <button className="zd-modal-close" onClick={onClose} aria-label="Cerrar"><Icon name="x" size={18} /></button>
          {done ? (
            <div className="zd-success">
              <div className="ring"><Icon name="check" /></div>
              <h3 className="zd-h3" style={{ color: 'var(--ink)' }}>{t('Revisa tu correo.', 'Check your inbox.')}</h3>
              <p style={{ color: 'var(--stone-600)', marginTop: 10 }}>
                {t('Enviamos tu capítulo a ', 'We sent your chapter to ')}<strong style={{ color: 'var(--ink)' }}>{form.email}</strong>{t('. Si no llega en unos minutos, mira en spam.', '. If it doesn’t arrive in a few minutes, check spam.')}
              </p>
              <div style={{ marginTop: 26 }}>
                <Button variant="ink" onClick={onClose} style={{ width: '100%', justifyContent: 'center' }}>{t('Seguir explorando', 'Keep exploring')}</Button>
              </div>
            </div>
          ) : (
            <form onSubmit={submit}>
              <div style={{ marginBottom: 20 }}>
                <span className="zd-overline" style={{ color: 'var(--stone-500)' }}>{t('Descarga gratis', 'Free download')}</span>
                <h3 className="zd-h3" style={{ color: 'var(--ink)', marginTop: 10 }}>{t('Te lo enviamos al correo.', 'We’ll email it to you.')}</h3>
              </div>
              <div className="zd-field">
                <label>{t('Nombre', 'Name')}</label>
                <input className="zd-input on-light" value={form.name} onChange={e => set('name', e.target.value)} placeholder={t('Tu nombre', 'Your name')} />
              </div>
              <div className="zd-field">
                <label>Email</label>
                <input className="zd-input on-light" type="email" value={form.email} onChange={e => set('email', e.target.value)} placeholder={t('tu@email.com', 'you@email.com')} />
              </div>
              <div className="zd-row2">
                <div className="zd-field">
                  <label>{t('Interés', 'Interest')}</label>
                  <select className="zd-input on-light" value={form.interest} onChange={e => set('interest', e.target.value)}>
                    {interests.map(i => <option key={i}>{i}</option>)}
                  </select>
                </div>
                <div className="zd-field">
                  <label>{t('País', 'Country')}</label>
                  <select className="zd-input on-light" value={form.country} onChange={e => set('country', e.target.value)}>
                    {countries.map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
              </div>
              <label className="zd-check" style={{ marginTop: 4, marginBottom: 18 }}>
                <input type="checkbox" checked={form.consent} onChange={e => set('consent', e.target.checked)} />
                <span>{t('Acepto recibir el capítulo y emails de Zone Digital. Me doy de baja cuando quiera.', 'I agree to receive the chapter and emails from Zone Digital. I can unsubscribe anytime.')}</span>
              </label>
              {err && <div style={{ color: 'var(--danger)', fontSize: 'var(--text-sm)', marginBottom: 14 }}>{err}</div>}
              <Button variant="cobalt" size="lg" type="submit" icon="download" style={{ width: '100%', justifyContent: 'center' }}>
                {t('Enviarme el capítulo', 'Send me the chapter')}
              </Button>
              <p className="zd-mono" style={{ fontSize: 11, color: 'var(--stone-500)', marginTop: 14, textAlign: 'center' }}>
                {t('Sin spam · consentimiento explícito', 'No spam · explicit consent')}
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

/* ============ EXIT INTENT ============ */
function ExitIntent({ onLead, t }) {
  const [show, setShow] = useStateA(false);
  const fired = useRefA(false);
  useEffectA(() => {
    const onLeave = (e) => {
      if (fired.current) return;
      if (e.clientY <= 0) { fired.current = true; setShow(true); }
    };
    const tm = setTimeout(() => document.addEventListener('mouseout', onLeave), 6000);
    return () => { clearTimeout(tm); document.removeEventListener('mouseout', onLeave); };
  }, []);
  if (!show) return null;
  return (
    <div className="zd-exit">
      <button className="zd-exit-close" onClick={() => setShow(false)}><Icon name="x" size={16} /></button>
      <div className="zd-ai-chip"><span className="star">✦</span> {t('Antes de irte', 'Before you go')}</div>
      <h4 style={{ margin: '10px 0 6px', font: '600 var(--text-lg) var(--font-display)', letterSpacing: '-0.01em' }}>{t('Llévate un capítulo gratis.', 'Take a free chapter with you.')}</h4>
      <p style={{ margin: 0, color: 'var(--zd-text-2)', fontSize: 'var(--text-sm)', lineHeight: 1.5 }}>{t('Elige tu área de interés y te lo enviamos al correo.', 'Pick your area of interest and we’ll email it to you.')}</p>
      <div style={{ marginTop: 14 }}>
        <Button variant="lime" size="sm" icon="download" onClick={() => { setShow(false); onLead(null); }}>{t('Quiero el capítulo', 'I want the chapter')}</Button>
      </div>
    </div>
  );
}

/* ============ APP ============ */
function App() {
  const [lang, setLangState] = useStateA(() => {
    try { return localStorage.getItem('zd-lang') || 'es'; } catch (e) { return 'es'; }
  });
  const setLang = (l) => { setLangState(l); try { localStorage.setItem('zd-lang', l); } catch (e) {} };
  const t = (es, en) => (lang === 'en' ? en : es);

  useEffectA(() => { document.documentElement.lang = lang; }, [lang]);

  const [lead, setLead] = useStateA({ open: false, book: null });
  const openLead = (book) => setLead({ open: true, book });
  const closeLead = () => setLead({ open: false, book: null });

  return (
    <>
      <Header onLead={openLead} t={t} lang={lang} setLang={setLang} />
      <main>
        <Hero onLead={openLead} t={t} />
        <Strip t={t} />
        <Books onLead={openLead} t={t} lang={lang} />
        <Labs t={t} />
        <About t={t} />
        <NewsletterCTA t={t} />
      </main>
      <Footer t={t} />
      {lead.open && <LeadModal book={lead.book} onClose={closeLead} t={t} lang={lang} />}
      <ExitIntent onLead={openLead} t={t} />
    </>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
