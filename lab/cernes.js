/* =========================================
   Lab Cernes — Canvas anneaux + Scroll (étape 4)
   Simplex noise écrit dans le code, sans dépendance externe
   GSAP + ScrollTrigger pour la transformation au scroll
   Variables de réglage en haut du fichier
   Respecte prefers-reduced-motion et pause onglet caché
   ========================================= */

(function () {
  // === Variables de réglage (facile à modifier) ===
  const CONFIG = {
    NB_ANNEAUX: 14,              // nombre d'anneaux concentriques
    POINTS_PAR_ANNEAU: 72,       // points par anneau (performance)
    VITESSE_RESPIRATION: 0.6,    // vitesse de l'effet respirant
    AMPLITUDE_IRREGULARITE: 10,  // variation douce du rayon (px)
    EPAISSEUR_LIGNE: 1.5,        // épaisseur du trait (px)
    COULEUR_ANNEAU: '#FFE8CD',   // crème des anneaux
    OPACITE_MAX: 0.45,           // opacité maximale des anneaux
    RATIO_PIXEL_MAX: 1.5,        // limite devicePixelRatio (performance mobile)
    RATIO_PIXEL_MIN: 1,          // ratio minimal

    // Scroll / GSAP
    SCROLL_DURATION: '100%',     // longueur du déclencheur (100% de la viewport)
    POINT_COULEUR_SOLEIL: '#F9CD85', // couleur du soleil au scroll
    POINT_HALO_SOLEIL: '#70411A',    // couleur du halo du soleil
  };

  const canvas = document.getElementById('canvas-anneaux');
  const ctx = canvas.getContext('2d', { alpha: false });
  const point = document.getElementById('point');
  const svgDunes = document.getElementById('svg-dunes');
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  let largeur = 0;
  let hauteur = 0;
  let ratio = 1;
  let temps = 0;
  let animId = null;
  let enPause = false;
  let canvasActif = true;   // false pendant le scroll (économie de batterie)
  let scrollTimeline = null;

  // =========================================
  // Simplex noise 2D (implémentation inline,
  // inspiré de Stefan Gustavson, domaine public)
  // =========================================
  const simplex = (() => {
    const grad3 = [
      [1, 1, 0], [-1, 1, 0], [1, -1, 0], [-1, -1, 0],
      [1, 0, 1], [-1, 0, 1], [1, 0, -1], [-1, 0, -1],
      [0, 1, 1], [0, -1, 1], [0, 1, -1], [0, -1, -1]
    ];

    const p = [
      151, 160, 137, 91, 90, 15, 131, 13, 201, 95, 96, 53, 194, 233, 7, 225,
      140, 36, 103, 30, 69, 142, 8, 99, 37, 240, 21, 10, 23, 190, 6, 148,
      247, 120, 234, 75, 0, 26, 197, 62, 94, 252, 219, 203, 117, 35, 11, 32,
      57, 177, 33, 88, 237, 149, 56, 87, 174, 20, 125, 136, 171, 168, 68, 175,
      74, 165, 71, 134, 139, 48, 27, 166, 77, 146, 158, 231, 83, 111, 229, 122,
      60, 211, 133, 230, 220, 105, 92, 41, 55, 46, 245, 40, 244, 102, 143, 54,
      65, 25, 63, 161, 1, 216, 80, 73, 209, 76, 132, 187, 208, 89, 18, 169,
      200, 196, 135, 130, 116, 188, 159, 86, 164, 100, 109, 198, 173, 186, 3, 64,
      52, 217, 226, 250, 124, 123, 5, 202, 38, 147, 118, 126, 255, 82, 85, 212,
      207, 206, 59, 227, 47, 16, 58, 17, 182, 189, 28, 42, 223, 183, 170, 213,
      119, 248, 152, 2, 44, 154, 163, 70, 221, 153, 101, 155, 167, 43, 172, 9,
      129, 22, 39, 253, 19, 98, 108, 110, 79, 113, 224, 232, 178, 185, 112, 104,
      218, 246, 97, 228, 251, 34, 242, 193, 238, 210, 144, 12, 191, 179, 162, 241,
      81, 51, 145, 235, 249, 14, 239, 107, 49, 192, 214, 31, 181, 199, 106, 157,
      184, 84, 204, 176, 115, 121, 50, 45, 127, 4, 150, 254, 138, 236, 205, 93,
      222, 114, 67, 29, 24, 72, 243, 141, 128, 195, 78, 66, 215, 61, 156, 180
    ];

    const perm = new Uint8Array(512);
    const gradP = new Float32Array(512 * 3);

    for (let i = 0; i < 512; i++) {
      perm[i] = p[i & 255];
      const g = grad3[perm[i] % 12];
      gradP[i * 3] = g[0];
      gradP[i * 3 + 1] = g[1];
      gradP[i * 3 + 2] = g[2];
    }

    function dot2(g, x, y) {
      return g[0] * x + g[1] * y;
    }

    return {
      noise2D: function (xin, yin) {
        const F2 = 0.5 * (Math.sqrt(3.0) - 1.0);
        const G2 = (3.0 - Math.sqrt(3.0)) / 6.0;

        let s = (xin + yin) * F2;
        let i = Math.floor(xin + s);
        let j = Math.floor(yin + s);
        let t = (i + j) * G2;
        let X0 = i - t;
        let Y0 = j - t;
        let x0 = xin - X0;
        let y0 = yin - Y0;

        let i1, j1;
        if (x0 > y0) { i1 = 1; j1 = 0; } else { i1 = 0; j1 = 1; }

        let x1 = x0 - i1 + G2;
        let y1 = y0 - j1 + G2;
        let x2 = x0 - 1.0 + 2.0 * G2;
        let y2 = y0 - 1.0 + 2.0 * G2;

        let ii = i & 255;
        let jj = j & 255;

        let gi0 = perm[ii + perm[jj]] * 3;
        let gi1 = perm[ii + i1 + perm[jj + j1]] * 3;
        let gi2 = perm[ii + 1 + perm[jj + 1]] * 3;

        let t0 = 0.5 - x0 * x0 - y0 * y0;
        if (t0 < 0) t0 = 0;
        else {
          t0 *= t0;
          t0 *= t0;
        }

        let t1 = 0.5 - x1 * x1 - y1 * y1;
        if (t1 < 0) t1 = 0;
        else {
          t1 *= t1;
          t1 *= t1;
        }

        let t2 = 0.5 - x2 * x2 - y2 * y2;
        if (t2 < 0) t2 = 0;
        else {
          t2 *= t2;
          t2 *= t2;
        }

        let n0 = t0 * t0 * dot2(
          [gradP[gi0], gradP[gi0 + 1]], x0, y0
        );
        let n1 = t1 * t1 * dot2(
          [gradP[gi1], gradP[gi1 + 1]], x1, y1
        );
        let n2 = t2 * t2 * dot2(
          [gradP[gi2], gradP[gi2 + 1]], x2, y2
        );

        return 40.0 * (n0 + n1 + n2);
      }
    };
  })();

  // =========================================
  // Redimensionnement du canvas
  // =========================================
  function redimensionner() {
    const dpr = Math.min(
      Math.max(window.devicePixelRatio || 1, CONFIG.RATIO_PIXEL_MIN),
      CONFIG.RATIO_PIXEL_MAX
    );
    ratio = dpr;

    largeur = window.innerWidth;
    hauteur = window.innerHeight;

    canvas.width = Math.round(largeur * ratio);
    canvas.height = Math.round(hauteur * ratio);

    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    ctx.lineWidth = CONFIG.EPAISSEUR_LIGNE;
    ctx.strokeStyle = CONFIG.COULEUR_ANNEAU;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
  }

  window.addEventListener('resize', redimensionner, { passive: true });
  redimensionner();

  // =========================================
  // Dessin d'un seul anneau (irrégulier + respiration)
  // =========================================
  function dessinerAnneau(index, cx, cy, rayonBase, t) {
    const respiration = Math.sin(t * 0.8 + index * 0.5) * 6;
    const rayon = rayonBase + respiration;

    const bruitOffset = index * 137.0;
    const echelleBruit = 0.008;

    ctx.beginPath();
    ctx.globalAlpha =
      CONFIG.OPACITE_MAX * (0.5 + 0.5 * Math.sin(t * 0.5 + index));

    for (let p = 0; p <= CONFIG.POINTS_PAR_ANNEAU; p++) {
      const angle = (p / CONFIG.POINTS_PAR_ANNEAU) * Math.PI * 2;
      const nx = Math.cos(angle) + bruitOffset;
      const ny = Math.sin(angle) + bruitOffset;

      const bruit = simplex.noise2D(nx * echelleBruit, ny * echelleBruit + t * 0.1);
      const r = rayon + bruit * CONFIG.AMPLITUDE_IRREGULARITE;

      const x = cx + Math.cos(angle) * r;
      const y = cy + Math.sin(angle) * r;

      if (p === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }

    ctx.closePath();
    ctx.stroke();
  }

  // =========================================
  // Boucle d'animation principale (canvas)
  // =========================================
  function animer() {
    if (!canvasActif || enPause || reduceMotion.matches) {
      if (reduceMotion.matches && canvasActif) {
        ctx.clearRect(0, 0, largeur, hauteur);
        const cx = largeur / 2;
        const cy = hauteur / 2;
        const maxRadius = Math.min(largeur, hauteur) * 0.4;
        const espacement = maxRadius / CONFIG.NB_ANNEAUX;
        for (let i = 0; i < CONFIG.NB_ANNEAUX; i++) {
          dessinerAnneauStatique(i, cx, cy, espacement);
        }
      }
      animId = requestAnimationFrame(animer);
      return;
    }

    temps += 0.012 * CONFIG.VITESSE_RESPIRATION;

    ctx.clearRect(0, 0, largeur, hauteur);

    const cx = largeur / 2;
    const cy = hauteur / 2;
    const maxRadius = Math.min(largeur, hauteur) * 0.42;
    const espacement = maxRadius / CONFIG.NB_ANNEAUX;

    const cycleDuration = CONFIG.NB_ANNEAUX * 2;
    const cycle = (temps * 0.4) % cycleDuration;
    let nbVisible = Math.floor(cycle);

    if (nbVisible > CONFIG.NB_ANNEAUX) {
      nbVisible = cycleDuration - nbVisible;
    }

    for (let i = 0; i < nbVisible; i++) {
      dessinerAnneau(i, cx, cy, espacement, temps);
    }

    animId = requestAnimationFrame(animer);
  }

  function dessinerAnneauStatique(index, cx, cy, rayonBase) {
    ctx.beginPath();
    ctx.globalAlpha = CONFIG.OPACITE_MAX * 0.6;
    const rayon = rayonBase * (index + 1) * 0.85;

    for (let p = 0; p <= CONFIG.POINTS_PAR_ANNEAU; p++) {
      const angle = (p / CONFIG.POINTS_PAR_ANNEAU) * Math.PI * 2;
      const x = cx + Math.cos(angle) * rayon;
      const y = cy + Math.sin(angle) * rayon;
      if (p === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.stroke();
  }

  // =========================================
  // ScrollTrigger : point → soleil, anneaux → dunes
  // =========================================
  function initScroll() {
    if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') {
      console.warn('GSAP ou ScrollTrigger non chargé — animation scroll désactivée.');
      return;
    }

    gsap.registerPlugin(ScrollTrigger);

    // Si mouvement réduit, on fige tout et on sort
    if (reduceMotion.matches) {
      canvas.style.opacity = '1';
      svgDunes.style.opacity = '0';
      point.style.transition = 'none';
      return;
    }

    // Timeline liée au scroll (scrub)
    scrollTimeline = gsap.timeline({
      scrollTrigger: {
        trigger: '#scene',
        start: 'top top',
        end: 'bottom bottom',
        scrub: true,
        invalidateOnResize: true,
        // Économie de batterie : pause le canvas pendant le scroll
        onEnter: () => { canvasActif = false; },
        onLeaveBack: () => { canvasActif = true; animer(); },
      },
    });

    // 1. Le point grossit et devient soleil (couleur + halo)
    scrollTimeline.to(point, {
      width: 120,
      height: 120,
      backgroundColor: CONFIG.POINT_COULEUR_SOLEIL,
      boxShadow: `0 0 80px ${CONFIG.POINT_HALO_SOLEIL}, 0 0 160px ${CONFIG.POINT_HALO_SOLEIL}`,
      borderRadius: '50%',
      duration: 1,
      ease: 'none',
    }, 0);

    // 2. Les anneaux (canvas) s'estompent
    scrollTimeline.to(canvas, {
      opacity: 0,
      duration: 1,
      ease: 'none',
    }, 0);

    // 3. Les dunes (SVG) apparaissent
    scrollTimeline.to(svgDunes, {
      opacity: 1,
      duration: 1,
      ease: 'none',
    }, 0);

    // 4. Boucle : retour aux anneaux en fin de scroll (inverse du scrub)
    // Le scrub gère naturellement le retour quand on remonte.
  }

  // =========================================
  // Pause quand l'onglet n'est pas visible
  // =========================================
  function gestionVisibilite() {
    enPause = document.visibilityState === 'hidden';

    if (scrollTimeline) {
      if (enPause) {
        scrollTimeline.pause();
      } else if (!reduceMotion.matches) {
        scrollTimeline.resume();
        if (canvasActif) animer();
      }
    } else if (!enPause && !reduceMotion.matches && canvasActif) {
      animer();
    }
  }

  document.addEventListener('visibilitychange', gestionVisibilite);

  // =========================================
  // Démarrage
  // =========================================
  function demarrer() {
    // Animation canvas (si pas de mouvement réduit)
    if (!reduceMotion.matches) {
      animer();
    } else {
      animer(); // image fixe
    }

    // ScrollTrigger (si GSAP chargé et pas de mouvement réduit)
    if (!reduceMotion.matches) {
      initScroll();
    }
  }

  // Attendre que GSAP soit prêt si chargé via CDN
  if (typeof gsap !== 'undefined') {
    demarrer();
  } else {
    window.addEventListener('load', () => {
      if (typeof gsap !== 'undefined') {
        demarrer();
      } else {
        // GSAP n'est pas chargé : animation canvas seule, sans scroll
        if (!reduceMotion.matches) animer();
      }
    });
  }
})();
