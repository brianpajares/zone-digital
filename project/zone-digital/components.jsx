// components.jsx — átomos compartidos de Zone Digital
const { useState, useEffect, useRef } = React;

/* ---------- Iconos (Lucide-style, stroke 1.75) ---------- */
function Icon({ name, size = 18, style }) {
  const p = { width: size, height: size, viewBox: '0 0 24 24', fill: 'none',
    stroke: 'currentColor', strokeWidth: 1.75, strokeLinecap: 'round', strokeLinejoin: 'round', style };
  const paths = {
    arrow:        <><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></>,
    download:     <><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="M7 10l5 5 5-5"/><path d="M12 15V3"/></>,
    cart:         <><circle cx="8" cy="21" r="1"/><circle cx="19" cy="21" r="1"/><path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"/></>,
    check:        <><path d="M20 6 9 17l-5-5"/></>,
    checkCircle:  <><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><path d="m22 4-10 10.01-3-3"/></>,
    x:            <><path d="M18 6 6 18"/><path d="M6 6l12 12"/></>,
    send:         <><path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/></>,
    trending:     <><path d="M22 7 13.5 15.5l-5-5L2 17"/><path d="M16 7h6v6"/></>,
    target:       <><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></>,
    layers:       <><path d="m12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83Z"/><path d="m22 12.91-9.17 4.16a2 2 0 0 1-1.66 0L2 12.91"/><path d="m22 17.91-9.17 4.16a2 2 0 0 1-1.66 0L2 17.91"/></>,
    globe:        <><circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/><path d="M2 12h20"/></>,
    book:         <><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"/></>,
    mail:         <><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></>,
    sparkles:     <><path d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3Z"/></>,
    gauge:        <><path d="m12 14 4-4"/><path d="M3.34 19a10 10 0 1 1 17.32 0"/></>,
    play:         <><polygon points="6 3 20 12 6 21 6 3"/></>,
  };
  return <svg {...p}>{paths[name] || null}</svg>;
}

/* ---------- ✦ sello de IA ---------- */
function AISeal({ size = 28 }) {
  return <span className="zd-ai-seal" style={{ width: size, height: size, fontSize: size * 0.5 }}>✦</span>;
}

/* ---------- Marca Zone Digital (en el ADN del DS) ---------- */
function Logo({ height = 30, light = true }) {
  const ink = '#F4F1EA';
  return (
    <div className="zd-brand">
      <svg width={height} height={height} viewBox="0 0 44 44" aria-label="Zone Digital">
        <circle cx="22" cy="22" r="20" fill="none" stroke={light ? 'rgba(244,241,234,0.35)' : '#0B0E14'} strokeWidth="2.5"/>
        <circle cx="22" cy="22" r="8" fill="#2547F0"/>
        <path d="M22 11 a11 11 0 0 1 11 11" fill="none" stroke="#D8FF3D" strokeWidth="3" strokeLinecap="round"/>
        <circle cx="33" cy="22" r="2.6" fill="#D8FF3D"/>
      </svg>
      <span className="zd-brand-name" style={{ color: light ? ink : '#0B0E14' }}>
        Zone<span className="dim"> Digital</span>
      </span>
    </div>
  );
}

/* ---------- Botón ---------- */
function Button({ variant = 'cobalt', size, icon, iconRight, children, onClick, type = 'button', style }) {
  const cls = ['zd-btn', `zd-btn-${variant}`, size && `zd-btn-${size}`].filter(Boolean).join(' ');
  return (
    <button type={type} className={cls} onClick={onClick} style={style}>
      {icon && <Icon name={icon} size={size === 'lg' ? 19 : 17} />}
      {children}
      {iconRight && <Icon name={iconRight} size={size === 'lg' ? 19 : 17} />}
    </button>
  );
}

/* ---------- Portada tipográfica (respaldo) ---------- */
function TypoCover({ book }) {
  const c = COVERS[book.cat];
  return (
    <div className="zd-typo-book" style={{ background: c.bg, color: c.fg }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <span className="c-kicker" style={{ color: c.accent }}>{CAT_LABEL[book.cat]}</span>
        <svg className="c-mark" viewBox="0 0 44 44">
          <circle cx="22" cy="22" r="19" fill="none" stroke={c.fg} strokeWidth="2" opacity="0.4"/>
          <circle cx="22" cy="22" r="7" fill={c.accent}/>
        </svg>
      </div>
      <div className="c-title" style={{ color: c.fg }}>{book.short || book.title}</div>
      <div className="c-foot" style={{ color: c.fg }}>
        <span>{book.lang.toUpperCase()}</span>
        <span>Zone Digital</span>
      </div>
    </div>
  );
}

// Portada real desde el CDN de imágenes de Amazon (por ASIN), encuadrada con object-fit: contain
function BookCover({ book }) {
  const [failed, setFailed] = useState(false);
  const src = `https://images-na.ssl-images-amazon.com/images/P/${book.asin}.01._SCLZZZZZZZ_.jpg`;
  return (
    <div className="zd-cover-stage">
      {(failed || !book.asin) ? (
        <TypoCover book={book} />
      ) : (
        <img
          className="zd-cover-img"
          src={src}
          alt={book.title}
          loading="lazy"
          onError={() => setFailed(true)}
          onLoad={(e) => { if (e.target.naturalWidth < 30) setFailed(true); }}
        />
      )}
    </div>
  );
}

/* ---------- Reveal on scroll ---------- */
function Reveal({ children, delay = 0, as = 'div', className = '', style }) {
  const ref = useRef(null);
  const [seen, setSeen] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { setSeen(true); io.disconnect(); }
    }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  const Tag = as;
  return (
    <Tag ref={ref} className={`zd-reveal ${seen ? 'in' : ''} ${className}`}
         style={{ transitionDelay: `${delay}ms`, ...style }}>
      {children}
    </Tag>
  );
}

Object.assign(window, { Icon, AISeal, Logo, Button, BookCover, TypoCover, Reveal });
