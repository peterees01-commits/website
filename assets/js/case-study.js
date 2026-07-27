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
      storySection(cs) +
      productSection(cs) +
      gallerySection(cs) +
      perspectiveSection(cs);

    if (window.LumenMethod && window.LumenMethod.initScrollReveal) {
      window.LumenMethod.initScrollReveal(root);
    }
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
          '<figure class="case-photo">' +
            '<img src="../' + esc(cs.detailHero.image) + '" alt="' + esc(cs.detailHero.caption) + '" loading="lazy">' +
            '<figcaption>' + esc(cs.detailHero.caption) + '</figcaption>' +
          '</figure>' +
        '</div>' +
      '</section>'
    );
  }

  function storySection(cs) {
    return (
      '<section class="section section--surface">' +
        '<div class="section__inner">' +
          '<p class="eyebrow">The project</p>' +
          '<h2 style="margin-bottom:var(--space-5)">The brief</h2>' +
          '<div class="case-story">' +
            cs.story.map(function (p) { return '<p>' + esc(p) + '</p>'; }).join("") +
          '</div>' +
        '</div>' +
      '</section>'
    );
  }

  function productSection(cs) {
    return (
      '<section class="section section--dark">' +
        '<div class="section__inner">' +
          '<p class="eyebrow">Product used</p>' +
          '<h2 style="margin-bottom:var(--space-5)">' + esc(cs.product) + '</h2>' +
          '<div class="two-col two-col--wide-left">' +
            '<div>' +
              '<table class="spec-table">' +
                cs.performance.map(function (r) {
                  return '<tr><th>' + esc(r.label) + '</th><td>' + esc(r.value) + '</td></tr>';
                }).join("") +
              '</table>' +
            '</div>' +
            '<div class="case-product-shot">' +
              '<img src="../' + esc(cs.productPhoto.image) + '" alt="' + esc(cs.productPhoto.alt) + '" loading="lazy">' +
            '</div>' +
          '</div>' +
        '</div>' +
      '</section>'
    );
  }

  function gallerySection(cs) {
    if (!cs.gallery || !cs.gallery.length) return "";
    return (
      '<section class="section section--surface">' +
        '<div class="section__inner">' +
          '<p class="eyebrow">More from the project</p>' +
          '<h2 style="margin-bottom:var(--space-5)">Gallery</h2>' +
          '<div class="case-gallery-grid">' +
            cs.gallery.map(function (g) {
              return (
                '<figure class="case-photo">' +
                  '<img src="../' + esc(g.image) + '" alt="' + esc(g.caption) + '" loading="lazy">' +
                  '<figcaption>' + esc(g.caption) + '</figcaption>' +
                '</figure>'
              );
            }).join("") +
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
})();
