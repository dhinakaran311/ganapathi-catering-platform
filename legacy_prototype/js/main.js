/**
 * Sri Ganapathi Mess — Main JavaScript
 * Mobile-first interactions, navigation, scroll behaviors
 */

/* ============================================================
   CONSTANTS — PLACEHOLDER: Replace with actual business data
   ============================================================ */
const WHATSAPP_NUMBER = '919942351280'; // [PLACEHOLDER] — confirm WhatsApp business number
const PHONE_NUMBER = '+919942351280';   // [PLACEHOLDER] — confirm primary phone

const WHATSAPP_MESSAGES = {
  home:       'வணக்கம்! நான் கேட்டரிங் சேவை பற்றி விசாரிக்க விரும்புகிறேன்.',
  marriage:   'வணக்கம்! திருமண கேட்டரிங் சேவை விவரங்கள் வேண்டும்.',
  corporate:  'வணக்கம்! கார்ப்பரேட் கேட்டரிங் விவரங்கள் வேண்டும்.',
  bulk:       'வணக்கம்! தொகுதி உணவு ஆர்டர் பற்றி பேச விரும்புகிறேன்.',
  quote:      'வணக்கம்! விலை மேற்கோள் வேண்டும்.',
};

function getWhatsAppUrl(context = 'home') {
  const message = WHATSAPP_MESSAGES[context] || WHATSAPP_MESSAGES.home;
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
}

/* ============================================================
   DOM READY
   ============================================================ */
document.addEventListener('DOMContentLoaded', () => {
  initNavigation();
  initScrollBehaviors();
  initScrollReveal();
  initMenuTabs();
  initWhatsAppLinks();
  initEnquiryForm();
  initPhoneLinks();
  updateYear();
});

/* ============================================================
   NAVIGATION — Sticky header + mobile drawer
   ============================================================ */
function initNavigation() {
  const header = document.getElementById('site-header');
  const hamburger = document.getElementById('nav-hamburger');
  const drawer = document.getElementById('mobile-drawer');
  const drawerOverlay = document.getElementById('drawer-overlay');
  const drawerClose = document.getElementById('drawer-close');
  const drawerLinks = document.querySelectorAll('.drawer-nav-link');

  // Scroll: add shadow class to header when scrolled
  let lastScroll = 0;

  window.addEventListener('scroll', () => {
    const currentScroll = window.scrollY;
    if (currentScroll > 20) {
      header?.classList.add('scrolled');
    } else {
      header?.classList.remove('scrolled');
    }
    lastScroll = currentScroll;
  }, { passive: true });

  // Open drawer
  function openDrawer() {
    drawer?.classList.add('is-open');
    drawerOverlay?.classList.add('is-visible');
    hamburger?.classList.add('is-open');
    hamburger?.setAttribute('aria-expanded', 'true');
    document.body.style.overflow = 'hidden';
    drawerClose?.focus();
  }

  // Close drawer
  function closeDrawer() {
    drawer?.classList.remove('is-open');
    drawerOverlay?.classList.remove('is-visible');
    hamburger?.classList.remove('is-open');
    hamburger?.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
    hamburger?.focus();
  }

  hamburger?.addEventListener('click', () => {
    const isOpen = drawer?.classList.contains('is-open');
    if (isOpen) {
      closeDrawer();
    } else {
      openDrawer();
    }
  });

  drawerClose?.addEventListener('click', closeDrawer);
  drawerOverlay?.addEventListener('click', closeDrawer);

  // Close on link tap
  drawerLinks.forEach(link => {
    link.addEventListener('click', closeDrawer);
  });

  // Close on Escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && drawer?.classList.contains('is-open')) {
      closeDrawer();
    }
  });

  // Active state for bottom nav
  const bottomNavItems = document.querySelectorAll('.bottom-nav-item[data-section]');
  const sections = document.querySelectorAll('section[id]');

  const observerOptions = {
    rootMargin: '-40% 0px -55% 0px',
    threshold: 0,
  };

  const sectionObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const sectionId = entry.target.id;
        bottomNavItems.forEach(item => {
          if (item.dataset.section === sectionId) {
            item.classList.add('active');
          } else {
            item.classList.remove('active');
          }
        });
      }
    });
  }, observerOptions);

  sections.forEach(section => sectionObserver.observe(section));
}

/* ============================================================
   SCROLL BEHAVIORS — smooth anchor scrolling, offset for sticky nav
   ============================================================ */
function initScrollBehaviors() {
  const navHeight = document.getElementById('site-header')?.offsetHeight || 64;

  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', (e) => {
      const href = anchor.getAttribute('href');
      if (!href || href === '#') return;

      const target = document.querySelector(href);
      if (!target) return;

      e.preventDefault();
      const top = target.getBoundingClientRect().top + window.scrollY - navHeight - 8;

      window.scrollTo({
        top,
        behavior: 'smooth',
      });
    });
  });
}

/* ============================================================
   SCROLL REVEAL — entrance animations for sections
   ============================================================ */
function initScrollReveal() {
  const reveals = document.querySelectorAll('.reveal');

  if (!reveals.length) return;

  // Respect reduced motion
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReduced) {
    reveals.forEach(el => el.classList.add('revealed'));
    return;
  }

  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('revealed');
        revealObserver.unobserve(entry.target);
      }
    });
  }, {
    rootMargin: '0px 0px -80px 0px',
    threshold: 0.05,
  });

  reveals.forEach(el => revealObserver.observe(el));
}

/* ============================================================
   MENU TABS — toggle food category display
   ============================================================ */
function initMenuTabs() {
  const tabs = document.querySelectorAll('.menu-tab');
  const panels = document.querySelectorAll('.menu-panel');

  if (!tabs.length) return;

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const target = tab.dataset.tab;

      tabs.forEach(t => {
        t.classList.remove('active');
        t.setAttribute('aria-selected', 'false');
      });

      panels.forEach(p => {
        if (p.dataset.panel === target) {
          p.style.display = '';
          p.removeAttribute('hidden');
        } else {
          p.style.display = 'none';
          p.setAttribute('hidden', '');
        }
      });

      tab.classList.add('active');
      tab.setAttribute('aria-selected', 'true');
    });
  });
}

/* ============================================================
   WHATSAPP LINKS — dynamic pre-filled messages
   ============================================================ */
function initWhatsAppLinks() {
  // Update all WhatsApp links with appropriate context-aware messages
  document.querySelectorAll('[data-wa-context]').forEach(el => {
    const ctx = el.dataset.waContext || 'home';
    const url = getWhatsAppUrl(ctx);
    el.href = url;
  });

  // Floating FAB
  const fab = document.getElementById('whatsapp-fab');
  if (fab) {
    fab.href = getWhatsAppUrl('home');
  }
}

/* ============================================================
   PHONE LINKS
   ============================================================ */
function initPhoneLinks() {
  document.querySelectorAll('[data-phone-link]').forEach(el => {
    el.href = `tel:${PHONE_NUMBER}`;
  });
}

/* ============================================================
   ENQUIRY FORM — basic validation and WhatsApp submission
   ============================================================ */
function initEnquiryForm() {
  const form = document.getElementById('enquiry-form');
  if (!form) return;

  form.addEventListener('submit', (e) => {
    e.preventDefault();

    const name = form.querySelector('#field-name')?.value?.trim();
    const phone = form.querySelector('#field-phone')?.value?.trim();
    const event_type = form.querySelector('#field-event')?.value;
    const guests = form.querySelector('#field-guests')?.value;
    const message = form.querySelector('#field-message')?.value?.trim();

    // Basic validation
    if (!name || !phone) {
      showFormError(form, 'பெயர் மற்றும் தொலைபேசி எண் தேவை.');
      return;
    }

    if (!/^[6-9]\d{9}$/.test(phone.replace(/\D/g, '').replace(/^91/, ''))) {
      showFormError(form, 'சரியான தொலைபேசி எண் உள்ளிடவும்.');
      return;
    }

    // Build pre-filled WhatsApp message
    const waMessage = [
      `வணக்கம்! நான் ${name} பேசுகிறேன்.`,
      event_type ? `நிகழ்ச்சி: ${event_type}` : '',
      guests ? `விருந்தினர்கள்: ${guests} நபர்கள்` : '',
      message ? `குறிப்பு: ${message}` : '',
      `தொலைபேசி: ${phone}`,
    ].filter(Boolean).join('\n');

    const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(waMessage)}`;
    window.open(url, '_blank', 'noopener,noreferrer');

    showFormSuccess(form);
  });
}

function showFormError(form, message) {
  removeFormMessages(form);
  const el = document.createElement('div');
  el.className = 'form-message form-message--error';
  el.setAttribute('role', 'alert');
  el.style.cssText = 'background:#fee2e2;color:#991b1b;border-radius:8px;padding:12px 16px;font-size:14px;margin-top:12px;font-family:var(--font-tamil)';
  el.textContent = message;
  form.appendChild(el);
  setTimeout(() => el.remove(), 5000);
}

function showFormSuccess(form) {
  removeFormMessages(form);
  const el = document.createElement('div');
  el.className = 'form-message form-message--success';
  el.setAttribute('role', 'status');
  el.style.cssText = 'background:#dcfce7;color:#166534;border-radius:8px;padding:12px 16px;font-size:14px;margin-top:12px;font-family:var(--font-tamil)';
  el.textContent = '✅ WhatsApp திறக்கப்படுகிறது. உங்கள் விசாரிப்பை அனுப்பவும்!';
  form.appendChild(el);
  form.reset();
}

function removeFormMessages(form) {
  form.querySelectorAll('.form-message').forEach(el => el.remove());
}

/* ============================================================
   UPDATE YEAR in footer copyright
   ============================================================ */
function updateYear() {
  const yearEl = document.getElementById('current-year');
  if (yearEl) {
    yearEl.textContent = new Date().getFullYear();
  }
}
