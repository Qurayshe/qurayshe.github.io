/**
 * Client-Side SPA Hash Router
 * Orchestrates seamless switching between Home, Systems Lab, Server Lab, 3D Motion Lab, and About.
 */

export class Router {
  constructor(routes = {}) {
    this.routes = routes;
    this.currentView = null;

    window.addEventListener('hashchange', () => this.handleRoute());
  }

  init() {
    this.handleRoute();
  }

  handleRoute() {
    const hash = window.location.hash.replace('#', '') || 'home';
    let [section, subParam] = hash.split('/');

    // 1. Update Navigation Bar Active State
    const labSections = ['systems', 'servers', 'ai', 'motion'];
    const isLabActive = labSections.includes(section);

    document.querySelectorAll('.nav-link').forEach((link) => {
      const href = link.getAttribute('href');
      if (href) {
        const targetHash = href.replace('#', '');
        const isMatch = targetHash === section || (section === 'home' && targetHash === '');
        link.classList.toggle('active', isMatch);
      }
    });

    const labsDropdownBtn = document.getElementById('btn-labs-dropdown');
    if (labsDropdownBtn) {
      labsDropdownBtn.classList.toggle('active', isLabActive);
    }

    document.querySelectorAll('.dropdown-item').forEach((item) => {
      const href = item.getAttribute('href')?.replace('#', '');
      item.classList.toggle('active', href === section);
    });

    // 2. Switch Visible Section Container
    const targetSectionId = `section-${section}`;
    const allSections = document.querySelectorAll('.app-section');
    let foundTarget = false;

    allSections.forEach((sec) => {
      if (sec.id === targetSectionId) {
        sec.style.display = 'block';
        sec.classList.add('active');
        foundTarget = true;
      } else {
        sec.style.display = 'none';
        sec.classList.remove('active');
      }
    });

    // Fallback to Home if unknown route
    if (!foundTarget) {
      const homeSec = document.getElementById('section-home');
      if (homeSec) {
        homeSec.style.display = 'block';
        homeSec.classList.add('active');
      }
      section = 'home';
    }

    // Scroll to top of viewport
    window.scrollTo({ top: 0, behavior: 'smooth' });

    // 3. Trigger Route Handler Callback
    if (this.routes[section]) {
      this.routes[section](subParam);
    }
  }

  navigate(hash) {
    window.location.hash = hash;
  }
}

