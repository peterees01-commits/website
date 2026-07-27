(function () {
  "use strict";

  var root = document.getElementById("caseStudyRoot");
  if (!root) return;

  var params = new URLSearchParams(window.location.search);
  var id = params.get("id");

  fetch("../data/case-studies.json")
    .then(function (r) { return r.json(); })
    .then(function (data) {
      var list = data.caseStudies || [];
      var item = list.find(function (c) { return c.id === id; }) || list[0];
      if (!item) {
        root.innerHTML = '<p class="container" style="padding-block:var(--space-8)">Project not found.</p>';
        return;
      }
      render(item);
    }).catch(function (err) {
      root.innerHTML = '<p class="container" style="padding-block:var(--space-8)">Could not load project data (' + err.message + ').</p>';
    });

  function esc(s) {
    return String(s).replace(/[&<>"]/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c];
    });
  }

  function render(cs) {
    document.title = cs.title + " — Lumen Method";
    var titleEl = document.getElementById("pageTitle");
    if (titleEl) titleEl.textContent = cs.title + " — Lumen Method";

    root.innerHTML =
      heroSection(cs) +
      briefAndProductSection(cs) +
      perspectiveSection(cs);

    if (window.LumenMethod && window.LumenMethod.initScrollReveal) {
      window.LumenMethod.initScrollReveal(root);
    }
    initLightbox(root);
  }

  function heroSection(cs) {
    return (
      '<section class="case-hero">' +
        '<div class="case-hero__inner">' +
          '<div>' +
            '<p class="breadcrumb"><a href="../index.html">Home</a> / <a href="../index.html#case-studies">Project Applications</a> / ' + esc(cs.title) + '</p>' +
            '<span class="case-study-tag">' + esc(cs.tag) + '</span>' +
            '<h1>' + esc(cs.title) + '</h1>' +
            '<p class="case-hero__meta-line">' + esc(cs.sector) + ' &middot; ' + esc(cs.location) + '</p>' +
          '</div>' +
          '<figure class="case-photo case-photo--main">' +
            '<button type="button" class="case-photo__frame case-photo__zoom" data-full="../' + esc(cs.detailHero.image) + '" data-alt="' + esc(cs.detailHero.caption) + '" aria-label="Enlarge photo">' +
              '<img src="../' + esc(cs.detailHero.image) + '" alt="' + esc(cs.detailHero.caption) + '" loading="lazy">' +
            '</button>' +
            '<figcaption>' + esc(cs.detailHero.caption) + '</figcaption>' +
          '</figure>' +
        '</div>' +
      '</section>'
    );
  }

  function briefAndProductSection(cs) {
    return (
      '<section class="section section--surface">' +
        '<div class="section__inner">' +
          '<div class="two-col two-col--wide-left">' +
            '<div>' +
              '<p class="eyebrow">The project</p>' +
              '<h2 style="margin-bottom:var(--space-5)">The brief</h2>' +
              '<div class="case-story">' +
                cs.story.map(function (p) { return '<p>' + esc(p) + '</p>'; }).join("") +
              '</div>' +
            '</div>' +
            '<div>' +
              '<p class="eyebrow">Product used</p>' +
              '<h2 style="margin-bottom:var(--space-4)">' + esc(cs.product) + '</h2>' +
              '<table class="spec-table" style="margin-bottom:var(--space-5)">' +
                cs.performance.map(function (r) {
                  return '<tr><th>' + esc(r.label) + '</th><td>' + esc(r.value) + '</td></tr>';
                }).join("") +
              '</table>' +
              '<div class="case-product-shot">' +
                '<img src="../' + esc(cs.productPhoto.image) + '" alt="' + esc(cs.productPhoto.alt) + '" loading="lazy">' +
              '</div>' +
            '</div>' +
          '</div>' +
        '</div>' +
      '</section>'
    );
  }

  function perspectiveSection(cs) {
    var hasBody = cs.perspective && cs.perspective.body;
    return (
      '<section class="section section--dark">' +
        '<div class="section__inner">' +
          '<p class="eyebrow">Lumen Method</p>' +
          '<h2 style="margin-bottom:var(--space-5)">' + esc(cs.perspective.heading || "Lumen Method Perspective") + '</h2>' +
          '<div class="case-perspective' + (hasBody ? "" : " case-perspective--pending") + '">' +
            (hasBody
              ? esc(cs.perspective.body).split("\n").map(function (p) { return '<p>' + p + '</p>'; }).join("")
              : '<p>Our take on this project is coming soon.</p>') +
          '</div>' +
          '<p style="margin-top:var(--space-6)"><a class="case-back-link" href="../index.html#case-studies">&larr; Back to Solution Examples</a></p>' +
        '</div>' +
      '</section>'
    );
  }

  function initLightbox(scope) {
    var trigger = scope.querySelector(".case-photo__zoom");
    if (!trigger) return;

    var overlay = document.getElementById("caseLightbox");
    if (!overlay) {
      overlay = document.createElement("div");
      overlay.className = "case-lightbox";
      overlay.id = "caseLightbox";
      overlay.innerHTML =
        '<div class="case-lightbox__backdrop"></div>' +
        '<button type="button" class="case-lightbox__close" aria-label="Close enlarged photo">&times;</button>' +
        '<img class="case-lightbox__img" alt="">';
      document.body.appendChild(overlay);

      overlay.addEventListener("click", function (e) {
        if (e.target === overlay || e.target.classList.contains("case-lightbox__backdrop") || e.target.classList.contains("case-lightbox__close")) {
          closeLightbox(overlay);
        }
      });
      document.addEventListener("keydown", function (e) {
        if (e.key === "Escape") closeLightbox(overlay);
      });
    }

    trigger.addEventListener("click", function () {
      openLightbox(overlay, trigger.getAttribute("data-full"), trigger.getAttribute("data-alt"));
    });
  }

  function openLightbox(overlay, src, alt) {
    var img = overlay.querySelector(".case-lightbox__img");
    img.onload = function () {
      var vw = window.innerWidth * 0.92;
      var vh = window.innerHeight * 0.92;
      var cap = Math.min(img.naturalWidth, vw);
      img.style.maxWidth = cap + "px";
      var vhCapPx = vh;
      img.style.maxHeight = vhCapPx + "px";
    };
    img.src = src;
    img.alt = alt || "";
    overlay.classList.add("is-open");
    document.body.style.overflow = "hidden";
  }

  function closeLightbox(overlay) {
    overlay.classList.remove("is-open");
    document.body.style.overflow = "";
  }
})();
