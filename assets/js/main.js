/* ============================================================
   PSICOANDINO · SHARED BEHAVIOR
   ============================================================ */

document.addEventListener('DOMContentLoaded', () => {

  const sections    = document.querySelectorAll('section[id]');
  // --- Mobile Dot Nav ---
  const dotNav = document.createElement('div');
  dotNav.className = 'pa-dot-nav';
  const sectionArray = Array.from(sections);
  sectionArray.forEach(section => {
    const dot = document.createElement('div');
    dot.className = 'pa-dot-nav-dot';
    dot.addEventListener('click', () => section.scrollIntoView({ behavior: 'smooth' }));
    dotNav.appendChild(dot);
  });
  document.body.appendChild(dotNav);
  const dots = dotNav.querySelectorAll('.pa-dot-nav-dot');

  const navLinks    = document.querySelectorAll('.pa-sidenav .pa-side-link');
  const toggleBtn   = document.querySelector('.pa-menu-toggle');
  const sidenav     = document.querySelector('.pa-sidenav');
  const mainContent = document.querySelector('.pa-main');

  /* --- Scroll spy + fade-in --- */

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;

      const id = entry.target.getAttribute('id');

      navLinks.forEach(link => {
        const href = link.getAttribute('href');
        if (href === `#${id}`) {
          link.classList.add('active');
        } else if (href.startsWith('#')) {
          link.classList.remove('active');
        }
      });

      dots.forEach((d, i) => d.classList.toggle('active', sectionArray[i] === entry.target));

      entry.target.querySelectorAll('.fade-in').forEach(el => {
        el.classList.add('visible');
      });
    });
  }, {
    root: null,
    rootMargin: '-20% 0px -60% 0px',
    threshold: 0
  });

  sections.forEach(section => observer.observe(section));

/* --- Sidenav Core Expansion Trigger via Logo Matrix (Desktop) --- */
  const logoBtn = document.querySelector('.pa-logo');

  if (logoBtn && sidenav) {
    logoBtn.addEventListener('click', (e) => {
      if (window.innerWidth > 768) {
        e.preventDefault();
        
        const isExpanded = sidenav.classList.toggle('expanded');
        
        // Sincronización de accesibilidad ARIA
        logoBtn.setAttribute('aria-expanded', isExpanded ? 'true' : 'false');
        
        // MUTACIÓN DINÁMICA DE TOOLTIP: Cambia el texto según el estado real del panel
        logoBtn.setAttribute('data-tooltip', isExpanded ? 'cerrar barra lateral' : 'abrir barra lateral');
      }
    });

    const sideLinks = sidenav.querySelectorAll('.pa-side-link');
    const collapseBtn = sidenav.querySelector('.pa-collapse-btn');
    if (collapseBtn) {
      collapseBtn.addEventListener('click', () => {
        sidenav.classList.remove('expanded');
        logoBtn.setAttribute('data-tooltip', 'abrir barra lateral');
      });
    }
  }
  
  /* --- Mobile menu (Global Pages) --- */
  const headerNav = document.querySelector('.pa-nav-links');

  if (toggleBtn && headerNav) {
    toggleBtn.addEventListener('click', () => {
      // Toggle the open class on the global page links instead of the sidebar
      const isOpen = headerNav.classList.toggle('open');
      toggleBtn.textContent = isOpen ? 'CLOSE' : 'MENU';
    });

    // Close the menu if a link is clicked
    const globalLinks = headerNav.querySelectorAll('.pa-nav-link');
    globalLinks.forEach(link => {
      link.addEventListener('click', () => {
        headerNav.classList.remove('open');
        toggleBtn.textContent = 'MENU';
      });
    });
  }
});
