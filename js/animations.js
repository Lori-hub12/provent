/* ============================================
   ProVend — animations.js
   Scroll reveal · Counters · Micro-interactions
   ============================================ */

// ---- Scroll Reveal with Intersection Observer ----
function initScrollReveal() {
  const elements = document.querySelectorAll('.fade-in, .fade-in-left, .fade-in-right, .scale-in');
  
  if (!elements.length) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, {
    threshold: 0.1,
    rootMargin: '0px 0px -40px 0px'
  });

  elements.forEach((el) => observer.observe(el));
}

// ---- Animated Counters ----
function initCounters() {
  const counters = document.querySelectorAll('[data-count]');
  if (!counters.length) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        animateCounter(entry.target);
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.5 });

  counters.forEach((counter) => observer.observe(counter));
}

function animateCounter(el) {
  const target = parseInt(el.dataset.count, 10);
  const suffix = el.dataset.suffix || '';
  const prefix = el.dataset.prefix || '';
  const duration = 2000;
  const startTime = performance.now();

  function update(currentTime) {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);
    
    // Ease out cubic
    const eased = 1 - Math.pow(1 - progress, 3);
    const current = Math.floor(eased * target);
    
    el.textContent = prefix + current.toLocaleString() + suffix;
    
    if (progress < 1) {
      requestAnimationFrame(update);
    } else {
      el.textContent = prefix + target.toLocaleString() + suffix;
    }
  }

  requestAnimationFrame(update);
}

// ---- Navbar Scroll Effect ----
function initNavbarScroll() {
  const navbar = document.querySelector('.navbar');
  if (!navbar) return;

  let lastScroll = 0;

  window.addEventListener('scroll', () => {
    const currentScroll = window.scrollY;
    
    if (currentScroll > 10) {
      navbar.classList.add('scrolled');
    } else {
      navbar.classList.remove('scrolled');
    }
    
    lastScroll = currentScroll;
  }, { passive: true });
}

// ---- Testimonials Carousel ----
function initTestimonialsCarousel() {
  const track = document.querySelector('.testimonials-track');
  const dots = document.querySelectorAll('.testimonials-dot');
  
  if (!track || !dots.length) return;

  let currentSlide = 0;
  let slidesPerView = 3;
  const cards = track.querySelectorAll('.testimonial-card');
  
  function updateSlidesPerView() {
    if (window.innerWidth < 769) {
      slidesPerView = 1;
    } else if (window.innerWidth < 1025) {
      slidesPerView = 2;
    } else {
      slidesPerView = 3;
    }
  }

  function goToSlide(index) {
    updateSlidesPerView();
    const maxSlide = Math.max(0, cards.length - slidesPerView);
    currentSlide = Math.min(index, maxSlide);
    
    const offset = currentSlide * (100 / slidesPerView);
    track.style.transform = `translateX(-${offset}%)`;
    
    dots.forEach((dot, i) => {
      dot.classList.toggle('active', i === currentSlide);
    });
  }

  dots.forEach((dot, i) => {
    dot.addEventListener('click', () => goToSlide(i));
  });

  // Auto-play
  let autoplay = setInterval(() => {
    updateSlidesPerView();
    const maxSlide = Math.max(0, cards.length - slidesPerView);
    currentSlide = currentSlide >= maxSlide ? 0 : currentSlide + 1;
    goToSlide(currentSlide);
  }, 5000);

  // Pause on hover
  const carousel = document.querySelector('.testimonials-carousel');
  if (carousel) {
    carousel.addEventListener('mouseenter', () => clearInterval(autoplay));
    carousel.addEventListener('mouseleave', () => {
      autoplay = setInterval(() => {
        updateSlidesPerView();
        const maxSlide = Math.max(0, cards.length - slidesPerView);
        currentSlide = currentSlide >= maxSlide ? 0 : currentSlide + 1;
        goToSlide(currentSlide);
      }, 5000);
    });
  }

  window.addEventListener('resize', () => goToSlide(currentSlide));
  goToSlide(0);
}

// ---- Smooth Scroll for Anchors ----
function initSmoothScroll() {
  document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener('click', (e) => {
      const target = document.querySelector(anchor.getAttribute('href'));
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });
}

// ---- Top Bar Close ----
function initTopBar() {
  const closeBtn = document.querySelector('.top-bar-close');
  if (closeBtn) {
    closeBtn.addEventListener('click', () => {
      const topBar = document.querySelector('.top-bar');
      if (topBar) {
        topBar.style.display = 'none';
      }
    });
  }
}

// ---- Initialize All Animations ----
function initAnimations() {
  initScrollReveal();
  initCounters();
  initNavbarScroll();
  initTestimonialsCarousel();
  initSmoothScroll();
  initTopBar();
}

document.addEventListener('DOMContentLoaded', initAnimations);
