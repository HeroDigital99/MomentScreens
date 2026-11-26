/* Showroom: turns the photo grid into a vertical slider (auto-play + manual control).
   gallery.js fills #showroom-gallery asynchronously and re-fills it on language change; this file reacts to that. */
(() => {
  const track = document.getElementById('showroom-gallery');
  if (!track) return;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const TXT = {prev:['الصورة السابقة','Previous image'],next:['الصورة التالية','Next image'],play:['تشغيل تلقائي','Start autoplay'],pause:['إيقاف التشغيل التلقائي','Pause autoplay'],region:['معرض أعمالنا','Our work gallery']};
  const t = k => TXT[k][document.documentElement.lang === 'en' ? 1 : 0];
  const ic = {
    up:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 15l6-6 6 6"/></svg>',
    down:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 9l6 6 6-6"/></svg>',
    play:'<svg viewBox="0 0 24 24" aria-hidden="true" fill="currentColor" stroke="none"><path d="M8 5.5v13l11-6.5z"/></svg>',
    pause:'<svg viewBox="0 0 24 24" aria-hidden="true" fill="currentColor" stroke="none"><rect x="6.5" y="5" width="4" height="14" rx="1"/><rect x="13.5" y="5" width="4" height="14" rx="1"/></svg>'
  };
  const mk = (tag, cls, html) => { const e = document.createElement(tag); if (cls) e.className = cls; if (html) e.innerHTML = html; return e; };

  const vs = mk('div', 'vs'), stage = mk('div', 'vs-stage'), view = mk('div', 'vs-view'), rail = mk('div', 'vs-rail');
  const up = mk('button', 'vs-btn', ic.up), down = mk('button', 'vs-btn', ic.down), play = mk('button', 'vs-btn vs-play');
  const count = mk('span', 'vs-count'), line = mk('span', 'vs-line', '<i></i>');
  [up, down, play].forEach(b => b.type = 'button');
  rail.append(up, count, line, down, play);
  track.parentNode.insertBefore(vs, track);
  vs.append(stage); stage.append(view, rail); view.append(track);
  track.classList.add('vs-track');
  stage.tabIndex = 0; stage.setAttribute('role', 'region'); stage.setAttribute('aria-roledescription', 'carousel');

  let slides = [], idx = -1, playing = !reduce, holdUntil = 0, visible = true, raf = 0;
  const hover = matchMedia('(hover:hover)');
  const pos = i => { const s = slides[i]; return s.offsetTop - (track.clientHeight - s.offsetHeight) / 2; };

  function labels() {
    up.setAttribute('aria-label', t('prev')); down.setAttribute('aria-label', t('next'));
    stage.setAttribute('aria-label', t('region'));
    play.innerHTML = playing ? ic.pause : ic.play;
    play.setAttribute('aria-label', t(playing ? 'pause' : 'play')); play.setAttribute('aria-pressed', String(playing));
  }
  function setActive(i) {
    const n = slides.length; if (!n || i === idx) return;
    if (slides[idx]) slides[idx].classList.remove('is-active');
    idx = i; slides[i].classList.add('is-active');
    count.textContent = String(i + 1).padStart(2, '0') + ' / ' + String(n).padStart(2, '0');
    line.firstChild.style.height = ((i + 1) / n * 100) + '%';
    [i + 1, i + 2, i - 1].forEach(j => { const im = slides[(j + n) % n].querySelector('img'); if (im) im.loading = 'eager'; });
  }
  function goTo(i) {
    const n = slides.length; if (!n) return;
    const wrap = i < 0 || i >= n; i = (i + n) % n;
    const far = Math.abs(i - idx) > 1;
    track.scrollTo({top: pos(i), behavior: (reduce || wrap || far) ? 'auto' : 'smooth'});
    setActive(i);
  }
  const nearest = () => {
    const n = slides.length; if (n < 2) return 0;
    const step = slides[1].offsetTop - slides[0].offsetTop;
    return Math.max(0, Math.min(n - 1, Math.round((track.scrollTop - pos(0)) / step)));
  };
  function refresh() {
    slides = [...track.querySelectorAll('.photo-tile')];
    vs.hidden = !slides.length; idx = -1;
    if (slides.length) { track.scrollTop = 0; setActive(0); }
    labels();
  }
  const hold = () => { holdUntil = Date.now() + 6000; };

  track.addEventListener('scroll', () => { cancelAnimationFrame(raf); raf = requestAnimationFrame(() => { if (slides.length) setActive(nearest()); }); }, {passive: true});
  track.addEventListener('click', e => {           /* first tap on a peeking slide centres it; tap on the centred one opens the lightbox */
    const tile = e.target.closest('.photo-tile');
    if (tile && !tile.classList.contains('is-active')) { e.preventDefault(); e.stopPropagation(); hold(); goTo(slides.indexOf(tile)); }
  }, true);
  ['pointerdown', 'wheel', 'touchstart', 'touchend', 'keydown'].forEach(ev => stage.addEventListener(ev, hold, {passive: true}));
  up.onclick = () => { hold(); goTo(idx - 1); };
  down.onclick = () => { hold(); goTo(idx + 1); };
  play.onclick = () => { playing = !playing; if (playing) hold(); labels(); };
  stage.addEventListener('keydown', e => {
    const k = e.key, map = {ArrowDown: () => goTo(idx + 1), ArrowUp: () => goTo(idx - 1), PageDown: () => goTo(idx + 1), PageUp: () => goTo(idx - 1), Home: () => goTo(0), End: () => goTo(slides.length - 1)};
    if (map[k] && e.target === stage) { e.preventDefault(); map[k](); }
  });
  if ('IntersectionObserver' in window) new IntersectionObserver(es => { visible = es[0].isIntersecting; }, {threshold: .25}).observe(stage);
  setInterval(() => {
    if (!playing || !visible || document.hidden || slides.length < 2 || Date.now() < holdUntil) return;
    if (hover.matches && stage.matches(':hover')) return;
    goTo(idx + 1);
  }, 4200);
  let rs; addEventListener('resize', () => { clearTimeout(rs); rs = setTimeout(() => { if (slides[idx]) track.scrollTo({top: pos(idx), behavior: 'auto'}); }, 150); });
  new MutationObserver(() => { cancelAnimationFrame(refresh.f); refresh.f = requestAnimationFrame(refresh); }).observe(track, {childList: true});
  document.documentElement.addEventListener('langchange', labels);
  refresh();
})();
