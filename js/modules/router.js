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

    // 0. Update Navbar Theme (swap to 'blorbo' doodle styling on blorbo-themed pages in /misc)
    this.updateNavbarTheme(section, subParam);

    // 1. Update Navigation Bar Active State
    const labSections = ['systems', 'graphics', 'motion', 'servers', 'ai'];
    const isLabActive = labSections.includes(section);
    const isMiscActive = section === 'misc';

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

    const miscDropdownBtn = document.getElementById('btn-misc-dropdown');
    if (miscDropdownBtn) {
      miscDropdownBtn.classList.toggle('active', isMiscActive);
    }

    document.querySelectorAll('.dropdown-item').forEach((item) => {
      const href = item.getAttribute('href')?.replace('#', '');
      const fullRoute = subParam ? `${section}/${subParam}` : section;
      const isDefaultBlorbo = section === 'misc' && !subParam && href === 'misc/blorbo';
      const isMatch = href === fullRoute || (!subParam && href === section) || isDefaultBlorbo;
      item.classList.toggle('active', Boolean(isMatch));
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

  updateNavbarTheme(section, subParam) {
    const isMisc = section === 'misc';
    const activeTool = (subParam || 'blorbo').toLowerCase();
    // 'lancer' uses the dark cyberpunk portal aesthetic.
    // The rest of /misc (blorbo, petpet, qrcode, heartlocket, caption) use the 'blorbo' doodle theme.
    const isBlorboTheme = isMisc && activeTool !== 'lancer';

    document.body.classList.toggle('theme-blorbo', isBlorboTheme);
    const navbar = document.querySelector('.global-navbar');
    if (navbar) {
      navbar.classList.toggle('theme-blorbo', isBlorboTheme);
    }
    const themeColorMeta = document.querySelector('meta[name="theme-color"]');
    if (themeColorMeta) {
      themeColorMeta.setAttribute('content', isBlorboTheme ? '#f5f0e8' : '#07060b');
    }
  }
}

