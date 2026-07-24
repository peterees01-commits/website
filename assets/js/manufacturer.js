(function () {
  "use strict";

  var root = document.getElementById("manufacturerRoot");
  if (!root) return;

  var params = new URLSearchParams(window.location.search);
  var slug = params.get("slug") || "holophane";

  function esc(s) {
    return String(s).replace(/[&<>"]/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c];
    });
  }

  Promise.all([
    fetch("../data/manufacturers.json").then(function (r) { return r.json(); }),
    fetch("../data/products.json").then(function (r) { return r.json(); })
  ]).then(function (results) {
    var manufacturers = results[0].manufacturers || [];
    var products = results[1].products || [];
    var m = manufacturers.find(function (x) { return x.slug === slug; }) || manufacturers[0];
    if (!m) {
      root.innerHTML = '<p class="container" style="padding-block:var(--space-8)">Manufacturer not found.</p>';
      return;
    }
    render(m, products.filter(function (p) { return p.manufacturerSlug === m.slug; }));
  }).catch(function (err) {
    root.innerHTML = '<p class="container" style="padding-block:var(--space-8)">Could not load manufacturer data (' + err.message + ').</p>';
  });

  function render(m, products) {
    document.title = m.name + " — Lumen Method";
    var titleEl = document.getElementById("pageTitle");
    if (titleEl) titleEl.textContent = m.name + " — Lumen Method";

    root.innerHTML =
      '<section class="manu-hero">' +
        '<div class="manu-hero__inner">' +
          '<div>' +
            '<div class="manu-hero__badge">' +
              '<div class="manu-wordmark">' +
                '<span class="manu-wordmark__name">' + esc(m.name) + '</span>' +
                (m.parent ? '<span class="manu-wordmark__parent">' + esc(m.parent) + '</span>' : "") +
              '</div>' +
            '</div>' +
            '<div class="manu-hero__meta">' +
              '<table>' +
                '<tr><th>Founded</th><td>' + esc(m.founded || "—") + '</td></tr>' +
                '<tr><th>Headquarters</th><td>' + esc(m.hq || "—") + '</td></tr>' +
                '<tr><th>Website</th><td><a href="' + esc(m.website) + '" target="_blank" rel="noopener">' + esc(m.website.replace(/^https?:\/\//, "")) + ' ↗</a></td></tr>' +
                '<tr><th>Ranges represented</th><td>' + products.length + '</td></tr>' +
              '</table>' +
            '</div>' +
            (m.agentNote ? '<p class="manu-hero__agent-note">' + esc(m.agentNote) + '</p>' : "") +
          '</div>' +
          '<div>' +
            '<p class="breadcrumb"><a href="../index.html">Home</a> / <a href="../index.html#products">Products</a> / ' + esc(m.name) + '</p>' +
            '<h1>' + esc(m.name) + '</h1>' +
            '<p class="manu-hero__bio">' + esc(m.bio) + '</p>' +
          '</div>' +
        '</div>' +
      '</section>' +

      '<section class="section section--surface product-section">' +
        '<div class="section__inner">' +
          '<p class="eyebrow">Ranges</p>' +
          '<h2 style="font-size:var(--text-2xl);margin-bottom:var(--space-5)">Available from ' + esc(m.name) + '</h2>' +
          '<div class="products-grid" id="manuProductsGrid"></div>' +
        '</div>' +
      '</section>';

    var grid = document.getElementById("manuProductsGrid");
    if (window.LumenMethod) {
      window.LumenMethod.renderProductCards(grid, products, { basePath: "../" });
    }
  }
})();
