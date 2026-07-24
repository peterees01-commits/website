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

  var grid = document.getElementById("productsGrid");
  if (grid) {
    fetch("data/products.json")
      .then(function (res) { return res.json(); })
      .then(function (data) {
        renderProductCards(grid, data.products || []);
      })
      .catch(function (err) {
        grid.innerHTML = '<p style="color:var(--text-muted)">Could not load product data (' + err.message + ').</p>';
      });
  }

  function renderProductCards(container, products) {
    if (!products.length) {
      container.innerHTML = '<p style="color:var(--text-muted)">No products published yet.</p>';
      return;
    }
    container.innerHTML = products.map(function (p) {
      var lumens = p.keySpecs.find(function (s) { return s.label === "Delivered lumens"; });
      var ip = p.keySpecs.find(function (s) { return s.label === "Ingress protection"; });
      var cct = p.keySpecs.find(function (s) { return s.label === "Colour temperature"; });
      var chips = [];
      if (lumens) chips.push(lumens.value);
      if (cct) chips.push(cct.value.split("(")[0].trim());
      if (ip) chips.push(ip.value.split(",")[0].trim());
      return (
        '<a class="product-card" href="products/product.html?code=' + encodeURIComponent(p.code) + '">' +
          '<div class="product-card__frame">' +
            productGlyph(p.code) +
            '<span class="product-card__manu">' + p.manufacturer + '</span>' +
            '<span class="bracket bracket--tl" aria-hidden="true"></span>' +
            '<span class="bracket bracket--tr" aria-hidden="true"></span>' +
            '<span class="bracket bracket--bl" aria-hidden="true"></span>' +
            '<span class="bracket bracket--br" aria-hidden="true"></span>' +
          '</div>' +
          '<div class="product-card__body">' +
            '<p class="product-card__cat">' + p.category + '</p>' +
            '<h3 class="product-card__name">' + p.name + '</h3>' +
            '<div class="product-card__chips">' + chips.map(function (c) { return '<span class="chip">' + c + '</span>'; }).join("") + '</div>' +
            '<span class="product-card__link">View technical data <span class="arrow">→</span></span>' +
          '</div>' +
        '</a>'
      );
    }).join("") + moreRangesCard();
  }

  function moreRangesCard() {
    return (
      '<div class="product-card" style="border-style:dashed;cursor:default">' +
        '<div class="product-card__frame" style="display:flex;align-items:center;justify-content:center;background:var(--cream-soft)">' +
          '<span class="placeholder-tag" style="color:var(--text-muted);border-color:var(--grey-300)">More ranges pending</span>' +
        '</div>' +
        '<div class="product-card__body">' +
          '<p class="product-card__cat">Coming soon</p>' +
          '<h3 class="product-card__name" style="color:var(--text-muted)">Additional manufacturer ranges</h3>' +
          '<p style="font-size:var(--text-sm);color:var(--text-muted)">Added here as each range is specified.</p>' +
        '</div>' +
      '</div>'
    );
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
})();
