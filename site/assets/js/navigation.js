(function () {
  "use strict";

  window.Showcase = window.Showcase || {};

  window.Showcase.initNavigation = function () {
    var toggle = document.querySelector("[data-menu-toggle]");
    var nav = document.querySelector("[data-main-nav]");
    var links = Array.from(document.querySelectorAll("[data-main-nav] a[href^='#']"));

    if (!toggle || !nav) return;

    function closeMenu() {
      nav.classList.remove("is-open");
      toggle.setAttribute("aria-expanded", "false");
    }

    toggle.addEventListener("click", function () {
      var opening = !nav.classList.contains("is-open");
      nav.classList.toggle("is-open", opening);
      toggle.setAttribute("aria-expanded", String(opening));
    });

    links.forEach(function (link) {
      link.addEventListener("click", closeMenu);
    });

    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape" && nav.classList.contains("is-open")) {
        closeMenu();
        toggle.focus();
      }
    });

    window.addEventListener("resize", function () {
      if (window.innerWidth > 900) closeMenu();
    });

    if ("IntersectionObserver" in window) {
      var sections = links
        .map(function (link) {
          return document.querySelector(link.getAttribute("href"));
        })
        .filter(Boolean);

      var observer = new IntersectionObserver(
        function (entries) {
          entries.forEach(function (entry) {
            if (!entry.isIntersecting) return;
            links.forEach(function (link) {
              link.removeAttribute("aria-current");
              if (link.getAttribute("href") === "#" + entry.target.id) {
                link.setAttribute("aria-current", "true");
              }
            });
          });
        },
        { rootMargin: "-25% 0px -65%", threshold: 0 }
      );

      sections.forEach(function (section) {
        observer.observe(section);
      });
    }
  };
})();
