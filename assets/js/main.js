(function () {
  "use strict";

  var toggle = document.getElementById("navToggle");
  var nav = document.getElementById("primary-nav");
  if (toggle && nav) {
    toggle.addEventListener("click", function () {
      var open = nav.classList.toggle("is-open");
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
    });
    nav.querySelectorAll("a").forEach(function (link) {
      link.addEventListener("click", function () {
        nav.classList.remove("is-open");
        toggle.setAttribute("aria-expanded", "false");
      });
    });
  }

  var grid = document.getElementById("manufacturersGrid");
  if (grid) {
    Promise.all([
      fetch("data/manufacturers.json").then(function (r) { return r.json(); }),
      fetch("data/products.json").then(function (r) { return r.json(); })
    ]).then(function (results) {
      renderManufacturerCards(grid, results[0].manufacturers || [], results[1].products || []);
    }).catch(function (err) {
      grid.innerHTML = '<p style="color:var(--text-muted)">Could not load manufacturer data (' + err.message + ').</p>';
    });
  }

  function esc(s) {
    return String(s).replace(/[&<>"]/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c];
    });
  }

  function renderManufacturerCards(container, manufacturers, products) {
    if (!manufacturers.length) {
      container.innerHTML = '<p style="color:var(--text-muted)">No manufacturers published yet.</p>';
      return;
    }
    container.innerHTML = manufacturers.map(function (m) {
      var count = products.filter(function (p) { return p.manufacturerSlug === m.slug; }).length;
      return (
        '<a class="product-card manu-card" href="manufacturers/manufacturer.html?slug=' + encodeURIComponent(m.slug) + '">' +
          '<div class="product-card__frame manu-card__badge">' +
            manuBadgeContent(m) +
            '<span class="bracket bracket--tl" aria-hidden="true"></span>' +
            '<span class="bracket bracket--tr" aria-hidden="true"></span>' +
            '<span class="bracket bracket--bl" aria-hidden="true"></span>' +
            '<span class="bracket bracket--br" aria-hidden="true"></span>' +
          '</div>' +
          '<div class="product-card__body">' +
            '<p class="product-card__cat">' + esc(m.hq || "") + ' · Est. ' + esc(m.founded || "") + '</p>' +
            '<h3 class="product-card__name">' + esc(m.name) + '</h3>' +
            '<p class="manu-card__bio">' + esc(m.bioShort) + '</p>' +
            '<span class="product-card__link">' + count + (count === 1 ? ' range available ' : ' ranges available ') + '<span class="arrow">→</span></span>' +
          '</div>' +
        '</a>'
      );
    }).join("") + moreManufacturersCard();
  }

  function manuBadgeContent(m, basePath) {
    basePath = basePath || "";
    if (m.logo) {
      return '<img class="manu-badge-img" src="' + basePath + esc(m.logo) + '" alt="' + esc(m.name) + (m.parent ? ' — ' + esc(m.parent) : "") + '" loading="lazy">';
    }
    return (
      '<div class="manu-wordmark">' +
        '<span class="manu-wordmark__name">' + esc(m.name) + '</span>' +
        (m.parent ? '<span class="manu-wordmark__parent">' + esc(m.parent) + '</span>' : "") +
      '</div>'
    );
  }

  function moreManufacturersCard() {
    return (
      '<div class="product-card" style="border-style:dashed;cursor:default">' +
        '<div class="product-card__frame" style="display:flex;align-items:center;justify-content:center;background:var(--cream-soft)">' +
          '<span class="placeholder-tag" style="color:var(--text-muted);border-color:var(--grey-300)">More manufacturers pending</span>' +
        '</div>' +
        '<div class="product-card__body">' +
          '<p class="product-card__cat">Coming soon</p>' +
          '<h3 class="product-card__name" style="color:var(--text-muted)">Additional manufacturers</h3>' +
          '<p style="font-size:var(--text-sm);color:var(--text-muted)">Added here as each new agency agreement is confirmed.</p>' +
        '</div>' +
      '</div>'
    );
  }

  function renderProductCards(container, products, opts) {
    opts = opts || {};
    if (!products.length) {
      container.innerHTML = '<p style="color:var(--text-muted)">No products published yet.</p>';
      return;
    }
    var base = opts.basePath || "";
    container.innerHTML = products.map(function (p) {
      var lumens = p.keySpecs.find(function (s) { return s.label === "Delivered lumens"; });
      var ip = p.keySpecs.find(function (s) { return s.label === "Ingress protection"; });
      var cct = p.keySpecs.find(function (s) { return s.label === "Colour temperature"; });
      var chips = [];
      if (lumens) chips.push(lumens.value);
      if (cct) chips.push(cct.value.split("(")[0].trim());
      if (ip) chips.push(ip.value.split(",")[0].trim());
      return (
        '<a class="product-card" href="' + base + 'products/product.html?code=' + encodeURIComponent(p.code) + '">' +
          '<div class="product-card__frame">' +
            (p.images && p.images.length
              ? '<img src="' + base + esc(p.images[0].file) + '" alt="' + esc(p.images[0].alt) + '" loading="lazy">'
              : productGlyph(p.code)) +
            '<span class="product-card__manu">' + esc(p.manufacturer) + '</span>' +
            '<span class="bracket bracket--tl" aria-hidden="true"></span>' +
            '<span class="bracket bracket--tr" aria-hidden="true"></span>' +
            '<span class="bracket bracket--bl" aria-hidden="true"></span>' +
            '<span class="bracket bracket--br" aria-hidden="true"></span>' +
          '</div>' +
          '<div class="product-card__body">' +
            '<p class="product-card__cat">' + esc(p.category) + '</p>' +
            '<h3 class="product-card__name">' + esc(p.name) + '</h3>' +
            '<div class="product-card__chips">' + chips.map(function (c) { return '<span class="chip">' + esc(c) + '</span>'; }).join("") + '</div>' +
            '<span class="product-card__link">View technical data <span class="arrow">→</span></span>' +
          '</div>' +
        '</a>'
      );
    }).join("");
  }

  function productGlyph(code) {
    return (
      '<svg viewBox="0 0 200 150" preserveAspectRatio="xMidYMid slice" aria-hidden="true">' +
        '<rect width="200" height="150" fill="#16150f"/>' +
        '<polygon points="60,10 140,10 175,140 25,140" fill="#e2a33f" opacity="0.12"/>' +
        '<text x="100" y="82" text-anchor="middle" font-family="IBM Plex Mono, monospace" font-size="22" fill="#f2ecde" opacity="0.85">' + code + '</text>' +
      '</svg>'
    );
  }

  window.LumenMethod = {
    renderProductCards: renderProductCards,
    productGlyph: productGlyph,
    manuBadgeContent: manuBadgeContent,
    esc: esc
  };
})();
