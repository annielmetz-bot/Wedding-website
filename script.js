/* ============================================
   Countdown Timer — Sept 4, 2027 at 4:00 PM
   ============================================ */
function updateCountdown() {
  const weddingDate = new Date('2027-09-04T16:00:00');
  const now = new Date();
  const diff = weddingDate - now;

  if (diff <= 0) {
    document.querySelector('.countdown').innerHTML =
      '<p style="font-family:var(--font-display);font-size:2rem;color:var(--sand-light)">Today\'s the day! ♥</p>';
    return;
  }

  const days    = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours   = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diff % (1000 * 60)) / 1000);

  document.getElementById('days').textContent    = String(days).padStart(3, '0');
  document.getElementById('hours').textContent   = String(hours).padStart(2, '0');
  document.getElementById('minutes').textContent = String(minutes).padStart(2, '0');
  document.getElementById('seconds').textContent = String(seconds).padStart(2, '0');
}

updateCountdown();
setInterval(updateCountdown, 1000);

/* ============================================
   Sticky Header
   ============================================ */
const header = document.querySelector('.site-header');

function handleScroll() {
  header.classList.toggle('scrolled', window.scrollY > 40);
  updateActiveNav();
}

window.addEventListener('scroll', handleScroll, { passive: true });
handleScroll();

/* ============================================
   Active Nav Link on Scroll
   ============================================ */
const sections  = document.querySelectorAll('section[id]');
const navLinks  = document.querySelectorAll('.nav-links a');

function updateActiveNav() {
  const scrollPos = window.scrollY + 100;
  let current = '';

  sections.forEach(section => {
    if (section.offsetTop <= scrollPos) current = section.id;
  });

  navLinks.forEach(link => {
    link.classList.toggle('active', link.getAttribute('href') === `#${current}`);
  });
}

/* ============================================
   Mobile Nav Toggle
   ============================================ */
const navToggle        = document.querySelector('.nav-toggle');
const navLinksContainer = document.querySelector('.nav-links');

navToggle.addEventListener('click', () => {
  navLinksContainer.classList.toggle('open');
});

navLinksContainer.querySelectorAll('a').forEach(link => {
  link.addEventListener('click', () => navLinksContainer.classList.remove('open'));
});

/* ============================================
   Gallery Slideshow
   ============================================ */
const slides   = document.querySelectorAll('.slide');
const dots     = document.querySelectorAll('.dot');
let current    = 0;
let autoplay;

function goToSlide(index) {
  slides[current].classList.remove('active');
  dots[current].classList.remove('active');
  current = (index + slides.length) % slides.length;
  slides[current].classList.add('active');
  dots[current].classList.add('active');
}

function startAutoplay() {
  autoplay = setInterval(() => goToSlide(current + 1), 4500);
}

function stopAutoplay() {
  clearInterval(autoplay);
}

document.querySelector('.prev-btn').addEventListener('click', () => {
  stopAutoplay(); goToSlide(current - 1); startAutoplay();
});

document.querySelector('.next-btn').addEventListener('click', () => {
  stopAutoplay(); goToSlide(current + 1); startAutoplay();
});

dots.forEach((dot, i) => {
  dot.addEventListener('click', () => {
    stopAutoplay(); goToSlide(i); startAutoplay();
  });
});

startAutoplay();

/* ============================================
   RSVP Form
   ============================================ */
const form       = document.getElementById('rsvp-form');
const successMsg = document.getElementById('rsvp-success');

form.addEventListener('submit', e => {
  e.preventDefault();
  // To wire up real submissions, send form data to a service like Formspree:
  // fetch('https://formspree.io/f/YOUR_ID', { method: 'POST', body: new FormData(form) })
  form.hidden = true;
  successMsg.hidden = false;
  successMsg.scrollIntoView({ behavior: 'smooth', block: 'center' });
});
