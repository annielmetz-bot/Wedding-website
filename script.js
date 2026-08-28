/* ============================================
   ¡Qué Momento! — Wedding Website JS
   ============================================ */

// ===== Mobile Nav Toggle =====
(function () {
  const toggle  = document.querySelector('.nav-toggle');
  const navList = document.getElementById('navLinks');
  if (!toggle || !navList) return;

  toggle.addEventListener('click', () => {
    const open = navList.classList.toggle('open');
    toggle.classList.toggle('open', open);
    toggle.setAttribute('aria-expanded', String(open));
  });

  // Close menu when a link is clicked
  navList.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
      navList.classList.remove('open');
      toggle.classList.remove('open');
      toggle.setAttribute('aria-expanded', 'false');
    });
  });

  // Close on outside click
  document.addEventListener('click', (e) => {
    if (!toggle.contains(e.target) && !navList.contains(e.target)) {
      navList.classList.remove('open');
      toggle.classList.remove('open');
      toggle.setAttribute('aria-expanded', 'false');
    }
  });
})();

// ===== Active Nav Link =====
(function () {
  const page = location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-links a').forEach(link => {
    const href = link.getAttribute('href');
    if (href === page || (page === '' && href === 'index.html')) {
      link.classList.add('active');
    } else {
      link.classList.remove('active');
    }
  });
})();

// ===== Gallery Lightbox =====
(function () {
  const lightbox  = document.getElementById('lightbox');
  const lbImg     = document.getElementById('lightboxImg');
  const lbClose   = document.getElementById('lightboxClose');
  if (!lightbox) return;

  // Delegated so that clones added by the auto-scroll loop stay clickable.
  // (cloneNode does not copy event listeners, so per-item binding missed half
  // the strip once the seamless-loop duplicates were appended.)
  document.addEventListener('click', (e) => {
    const item = e.target.closest('.gallery-strip-item');
    if (!item) return;
    const src = item.dataset.src || item.querySelector('img')?.src;
    const alt = item.querySelector('img')?.alt || '';
    if (!src) return;
    lbImg.src = src;
    lbImg.alt = alt;
    lightbox.classList.add('open');
    document.body.style.overflow = 'hidden';
    lbClose.focus();
  });

  function closeLightbox() {
    lightbox.classList.remove('open');
    document.body.style.overflow = '';
    lbImg.src = '';
  }

  lbClose.addEventListener('click', closeLightbox);

  lightbox.addEventListener('click', (e) => {
    if (e.target === lightbox) closeLightbox();
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && lightbox.classList.contains('open')) {
      closeLightbox();
    }
  });
})();

// ===== Gallery Drag-to-Scroll =====
(function () {
  const strip = document.getElementById('gallery');
  if (!strip) return;

  let isDown = false, startX, scrollLeft;

  strip.addEventListener('mousedown', (e) => {
    isDown = true;
    strip.classList.add('dragging');
    startX    = e.pageX - strip.offsetLeft;
    scrollLeft = strip.scrollLeft;
    e.preventDefault();
  });
  strip.addEventListener('mouseleave', () => { isDown = false; strip.classList.remove('dragging'); });
  strip.addEventListener('mouseup',    () => { isDown = false; strip.classList.remove('dragging'); });
  strip.addEventListener('mousemove',  (e) => {
    if (!isDown) return;
    e.preventDefault();
    const x    = e.pageX - strip.offsetLeft;
    const walk = (x - startX) * 1.5;
    strip.scrollLeft = scrollLeft - walk;
  });
})();

// ===== Gallery Auto-Scroll =====
(function () {
  const strip = document.getElementById('gallery');
  if (!strip) return;

  // Duplicate items for seamless infinite loop
  [...strip.children].forEach(item => strip.appendChild(item.cloneNode(true)));

  const speed = 0.6; // px per frame (~36 px/s at 60 fps)
  let paused = false;

  strip.addEventListener('mouseenter',  () => { paused = true; });
  strip.addEventListener('mouseleave',  () => { paused = false; });
  strip.addEventListener('touchstart',  () => { paused = true; }, { passive: true });
  strip.addEventListener('touchend',    () => { setTimeout(() => { paused = false; }, 1500); });

  (function tick() {
    if (!paused && !strip.classList.contains('dragging')) {
      strip.scrollLeft += speed;
      // seamless reset at the halfway mark
      if (strip.scrollLeft >= strip.scrollWidth / 2) {
        strip.scrollLeft = 0;
      }
    }
    requestAnimationFrame(tick);
  })();
})();

// ===== FAQ Accordion =====
(function () {
  const faqItems = document.querySelectorAll('.faq-item');
  if (!faqItems.length) return;

  faqItems.forEach(item => {
    const btn    = item.querySelector('.faq-question');
    const answer = item.querySelector('.faq-answer');
    if (!btn || !answer) return;

    btn.addEventListener('click', () => {
      const isOpen = item.classList.contains('open');

      // Close all
      faqItems.forEach(i => {
        i.classList.remove('open');
        i.querySelector('.faq-question')?.setAttribute('aria-expanded', 'false');
        const a = i.querySelector('.faq-answer');
        if (a) a.style.maxHeight = null;
      });

      // Open clicked (if it was closed)
      if (!isOpen) {
        item.classList.add('open');
        btn.setAttribute('aria-expanded', 'true');
        answer.style.maxHeight = answer.scrollHeight + 'px';
      }
    });
  });
})();

// ===== Ticker Wave Animation =====
(function () {
  const track = document.getElementById('tickerTrack');
  if (!track) return;

  function splitGraphemes(str) {
    if (typeof Intl !== 'undefined' && Intl.Segmenter) {
      return [...new Intl.Segmenter().segment(str)].map(s => s.segment);
    }
    return [...str];
  }

  const spans = track.querySelectorAll(':scope > span');
  const totalChars = splitGraphemes(spans[0]?.textContent || '').length;
  const delay = 1.6 / totalChars; // one full wave cycle spread across phrase

  spans.forEach(span => {
    const chars = splitGraphemes(span.textContent);
    span.textContent = '';
    chars.forEach((ch, i) => {
      const el = document.createElement('span');
      const isSpace = ch === ' ' || ch === '\u00a0';
      el.className = isSpace ? 'wave-char wave-space' : 'wave-char';
      el.style.animationDelay = (i * delay).toFixed(3) + 's';
      el.textContent = ch;
      span.appendChild(el);
    });
  });
})();

// ===== Smooth scroll for in-page anchor links =====
(function () {
  document.querySelectorAll('a[href^="#"]').forEach(link => {
    link.addEventListener('click', (e) => {
      const target = document.querySelector(link.getAttribute('href'));
      if (!target) return;
      e.preventDefault();
      const navH = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--nav-h')) || 70;
      const top  = target.getBoundingClientRect().top + window.scrollY - navH - 16;
      window.scrollTo({ top, behavior: 'smooth' });
    });
  });
})();
