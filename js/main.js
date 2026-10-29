/* =========================================
   Maison Kora — Scripts d'animation (étape 3)
   - Apparition douce des titres au chargement (CSS)
   - Révélation des sections au scroll (IntersectionObserver)
   - Léger parallax sur les images
   - Respecte prefers-reduced-motion
   Durée : 0,4 à 0,9 s
   ========================================= */

(function () {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  // Révélation des sections au scroll
  function initRevelationScroll() {
    const observerOptions = {
      root: null,
      rootMargin: '0px 0px -12% 0px',
      threshold: 0.1,
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    }, observerOptions);

    document.querySelectorAll('.reveal').forEach((section) => {
      observer.observe(section);
    });
  }

  // Léger parallax sur les images (guider l'oeil, pas de distraction)
  function initParallax() {
    if (reduceMotion.matches) return;

    const images = document.querySelectorAll('.parallax');

    function updateParallax() {
      const scrollY = window.scrollY;
      const vitesse = 0.15; // léger effet, reste subtil

      images.forEach((image) => {
        const yPos = -(scrollY * vitesse);
        image.style.transform = `translateY(${yPos}px)`;
      });
    }

    window.addEventListener('scroll', updateParallax, { passive: true });
  }

  // Initialisation quand le DOM est prêt
  document.addEventListener('DOMContentLoaded', () => {
    initRevelationScroll();
    initParallax();
  });
})();
