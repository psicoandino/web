// PSICOANDINO — header compartido: eclipse del punto amatista.
// La sombra oled barre siempre en la misma dirección con la que salió
// (elegida al azar en cada hover) — nunca rebota de vuelta.
(function () {
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var EASE = 'transform .65s cubic-bezier(.65,0,.35,1)';

  document.querySelectorAll('.ph-motif').forEach(function (motif) {
    var shadow = motif.querySelector('.ph-dot-shadow');
    var dir = 1;

    function sweepTo(pct) {
      shadow.style.transition = reduced ? 'none' : EASE;
      shadow.style.transform = 'translateX(' + pct + '%)';
    }

    function enter() {
      dir = Math.random() < 0.5 ? 1 : -1;
      sweepTo(dir * 105);
    }

    function leave() {
      if (reduced) { sweepTo(0); return; }
      shadow.style.transition = 'none';
      shadow.style.transform = 'translateX(' + (-dir * 105) + '%)';
      shadow.getBoundingClientRect(); // force reflow
      sweepTo(0);
    }

    motif.addEventListener('mouseenter', enter);
    motif.addEventListener('focus', enter);
    motif.addEventListener('mouseleave', leave);
    motif.addEventListener('blur', leave);
  });
})();
