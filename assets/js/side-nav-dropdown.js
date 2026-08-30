/**
 * Wires up .side-nav-col.has-dropdown: on mobile this collapses the
 * category row down to the current page + a trigger button that reveals
 * the rest in a dropdown. No-ops if the markup isn't on the page.
 */
(function () {
  function init() {
    var cols = document.querySelectorAll('.side-nav-col.has-dropdown');
    for (var i = 0; i < cols.length; i++) {
      wire(cols[i]);
    }
  }

  function wire(col) {
    var trigger = col.querySelector('.side-nav-trigger');
    if (!trigger) return;

    function close() {
      col.classList.remove('open');
      trigger.setAttribute('aria-expanded', 'false');
    }
    function open() {
      col.classList.add('open');
      trigger.setAttribute('aria-expanded', 'true');
    }

    trigger.addEventListener('click', function (e) {
      e.stopPropagation();
      if (col.classList.contains('open')) close(); else open();
    });
    document.addEventListener('click', function (e) {
      if (col.classList.contains('open') && !col.contains(e.target)) close();
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') close();
    });
    var links = col.querySelectorAll('.side-nav a');
    for (var j = 0; j < links.length; j++) {
      links[j].addEventListener('click', close);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
