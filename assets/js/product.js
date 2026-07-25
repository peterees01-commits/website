(function () {
  "use strict";

  var root = document.getElementById("productRoot");
  if (!root) return;

  var params = new URLSearchParams(window.location.search);
  var code = params.get("code") || "DPL";

  fetch("../data/products.json")
    .then(function (r) { return r.json(); })
    .then(function (data) {
      var products = data.products || [];
      var product = products.find(function (p) { return p.code === code; }) || products[0];
      if (!product) {
        root.innerHTML = '<p class="container" style="padding-block:var(--space-8)">Product not found.</p>';
        return;
      }
      render(product);
    }).catch(function (err) {
      root.innerHTML = '<p class="container" style="padding-block:var(--space-8)">Could not load product data (' + err.message + ').</p>';
    });

  function esc(s) {
    return String(s).replace(/[&<>"]/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c];
    });
  }

  function render(p) {
    document.title = p.name + " — " + p.manufacturer + " — Lumen Method";
    var titleEl = document.getElementById("pageTitle");
    if (titleEl) titleEl.textContent = p.name + " — Lumen Method";

    root.innerHTML =
      heroSection(p) +
      overviewSection(p) +
      statBandSection(p) +
      certificationsSection(p) +
      distributionsSection(p);

    initGallery();
    if (window.LumenMethod && window.LumenMethod.initScrollReveal) {
      window.LumenMethod.initScrollReveal(root);
    }
  }

  function heroSection(p) {
    return (
      '<section class="product-hero">' +
        '<div class="product-hero__inner">' +
          '<div>' +
            '<p class="breadcrumb"><a href="../index.html">Home</a> / <a href="../index.html#products">Products</a> / ' +
              (p.manufacturerSlug ? '<a href="../manufacturers/manufacturer.html?slug=' + esc(p.manufacturerSlug) + '">' + esc(p.manufacturer) + '</a>' : esc(p.manufacturer)) +
              ' / ' + esc(p.name) + '</p>' +
            '<span class="product-hero__manu">Manufactured by ' + esc(p.manufacturer) + '</span>' +
            '<h1>' + esc(p.name) + '</h1>' +
            '<p class="product-hero__tagline">' + esc(p.tagline) + '</p>' +
            '<div class="badge-row">' +
              p.badges.map(function (b) {
                return '<div class="badge"><b>' + esc(b.label) + '</b><span>' + esc(b.detail) + '</span></div>';
              }).join("") +
            '</div>' +
            '<div class="product-card__chips">' +
              p.applications.map(function (a) { return '<span class="chip" style="color:var(--grey-400);border-color:var(--border-on-dark)">' + esc(a) + '</span>'; }).join("") +
            '</div>' +
            heroDownloads(p) +
          '</div>' +
          '<div>' +
            productGallery(p) +
            '<p class="manu-note">' + esc(p.manufacturerNote) + ' Full manufacturer listing: <a href="' + esc(p.manufacturerUrl) + '" target="_blank" rel="noopener">holophane.co.uk ↗</a></p>' +
          '</div>' +
        '</div>' +
      '</section>'
    );
  }

  function productGallery(p) {
    var images = p.images || [];
    if (!images.length) {
      return (
        '<div class="product-hero__frame">' +
          '<svg viewBox="0 0 240 180" width="70%" aria-hidden="true">' +
            '<polygon points="70,10 170,10 210,170 30,170" fill="#e2a33f" opacity="0.10"/>' +
            '<text x="120" y="98" text-anchor="middle" font-family="IBM Plex Mono, monospace" font-size="26" fill="#f2ecde" opacity="0.85">' + esc(p.code) + '</text>' +
          '</svg>' +
          '<p class="product-hero__frame-note">Product imagery pending.</p>' +
        '</div>'
      );
    }
    return (
      '<div class="product-gallery" id="productGallery">' +
        '<div class="product-hero__frame product-gallery__main">' +
          '<img id="galleryMainImg" src="../' + esc(images[0].file) + '" alt="' + esc(images[0].alt) + '">' +
          (images[0].size ? '<span class="product-gallery__size-badge" id="galleryMainSize">' + esc(images[0].size) + '</span>' : '<span class="product-gallery__size-badge" id="galleryMainSize" hidden></span>') +
          '<span class="bracket bracket--tl" aria-hidden="true"></span>' +
          '<span class="bracket bracket--tr" aria-hidden="true"></span>' +
          '<span class="bracket bracket--bl" aria-hidden="true"></span>' +
          '<span class="bracket bracket--br" aria-hidden="true"></span>' +
        '</div>' +
        (images.length > 1 ?
          '<div class="product-gallery__thumbs" role="tablist" aria-label="Product images">' +
            images.map(function (img, i) {
              return (
                '<button type="button" class="product-gallery__thumb' + (i === 0 ? ' is-active' : '') + '" ' +
                  'data-src="../' + esc(img.file) + '" data-alt="' + esc(img.alt) + '" data-size="' + esc(img.size || '') + '" ' +
                  'role="tab" aria-selected="' + (i === 0 ? 'true' : 'false') + '" aria-label="' + esc(img.alt) + '">' +
                  '<img src="../' + esc(img.file) + '" alt="" loading="lazy">' +
                  (img.size ? '<span class="product-gallery__thumb-label">' + esc(img.size) + '</span>' : '') +
                '</button>'
              );
            }).join("") +
          '</div>' : ""
        ) +
      '</div>'
    );
  }

  function heroDownloads(p) {
    var dl = p.downloads;
    return (
      '<div class="hero-downloads">' +
        '<p class="eyebrow">Downloads</p>' +
        '<div class="hero-downloads__grid">' +
          downloadCard(dl.brochure.label, dl.brochure.meta, "../" + dl.brochure.file, true) +
          downloadCard(dl.ies.label, dl.ies.meta, "../" + dl.ies.file, true) +
          downloadCard(dl.bim.label, dl.bim.meta, "../" + dl.bim.file, true) +
          downloadCard(dl.installGuide.label, dl.installGuide.meta, "../" + dl.installGuide.file, true) +
        '</div>' +
      '</div>'
    );
  }

  function initGallery() {
    var gallery = document.getElementById("productGallery");
    if (!gallery) return;
    var mainImg = document.getElementById("galleryMainImg");
    var mainSize = document.getElementById("galleryMainSize");
    var thumbs = gallery.querySelectorAll(".product-gallery__thumb");

    function activate(btn) {
      if (!btn || btn.classList.contains("is-active")) return;
      mainImg.classList.add("is-fading");
      window.setTimeout(function () {
        mainImg.src = btn.getAttribute("data-src");
        mainImg.alt = btn.getAttribute("data-alt");
        mainImg.classList.remove("is-fading");
        if (mainSize) {
          var size = btn.getAttribute("data-size");
          mainSize.textContent = size || "";
          mainSize.hidden = !size;
        }
      }, 140);
      thumbs.forEach(function (b) {
        b.classList.remove("is-active");
        b.setAttribute("aria-selected", "false");
      });
      btn.classList.add("is-active");
      btn.setAttribute("aria-selected", "true");
    }

    thumbs.forEach(function (btn) {
      btn.addEventListener("click", function () { activate(btn); });
    });

    if (thumbs.length > 1) {
      var frame = gallery.querySelector(".product-gallery__main");
      var list = Array.prototype.slice.call(thumbs);
      var advance = function () {
        var activeIndex = list.findIndex(function (b) { return b.classList.contains("is-active"); });
        activate(list[(activeIndex + 1) % list.length]);
      };
      frame.classList.add("is-cyclable");
      frame.setAttribute("role", "button");
      frame.setAttribute("tabindex", "0");
      frame.setAttribute("aria-label", "Show next product image");
      frame.addEventListener("click", advance);
      frame.addEventListener("keydown", function (e) {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          advance();
        }
      });
    }
  }

  function overviewSection(p) {
    var d = p.dimensions;
    return (
      '<section class="section section--tight section--surface product-section">' +
        '<div class="section__inner two-col">' +
          '<div style="display:flex;flex-direction:column;height:100%">' +
            '<div>' +
              '<p class="eyebrow">Overview</p>' +
              '<h2 style="font-size:var(--text-2xl);margin-bottom:var(--space-4)">Built for the brief</h2>' +
              '<p style="max-width:52ch;color:var(--text-muted);font-size:var(--text-md);line-height:1.7">' + esc(p.summary) + '</p>' +
            '</div>' +
            '<div style="margin-top:auto">' +
              '<p class="eyebrow">Physical characteristics</p>' +
              '<table class="spec-table">' +
                d.variants.map(function (v) {
                  return '<tr><th>' + esc(v.label) + '</th><td>' + esc(v.length) + ' L × ' + esc(v.width) + ' W × ' + esc(v.height) + ' H — ' + esc(v.weight) + '</td></tr>';
                }).join("") +
                '<tr><th>Windage</th><td>' + esc(d.windage) + '</td></tr>' +
              '</table>' +
              '<p style="color:var(--text-muted);font-size:var(--text-xs);margin-top:var(--space-3)">' + esc(d.note) + '</p>' +
            '</div>' +
          '</div>' +
          '<div>' +
            '<p class="eyebrow">Key specification</p>' +
            '<table class="spec-table">' +
              p.keySpecs.map(function (s) {
                return '<tr><th>' + esc(s.label) + '</th><td>' + esc(s.value) + '</td></tr>';
              }).join("") +
            '</table>' +
          '</div>' +
        '</div>' +
      '</section>'
    );
  }

  function distributionsSection(p) {
    var m = p.mountingHeights;
    var distBlock = (
      '<div>' +
        '<p class="eyebrow">Optical distributions</p>' +
        '<h2 style="font-size:var(--text-2xl);margin-bottom:var(--space-5)">Optical Distributions</h2>' +
        '<div class="dist-grid">' +
          p.distributions.map(function (d) {
            return (
              '<div class="dist-card">' +
                '<img class="dist-card__icon" src="../' + esc(d.chart) + '" alt="' + esc(d.name) + ' light distribution plot">' +
                '<code>' + esc(d.code) + '</code>' +
                '<span>' + esc(d.name) + '</span>' +
                (d.note ? '<small>' + esc(d.note) + '</small>' : '') +
              '</div>'
            );
          }).join("") +
        '</div>' +
      '</div>'
    );
    var mountBlock = m ? (
      '<div>' +
        '<p class="eyebrow">Mounting</p>' +
        '<h2 style="font-size:var(--text-2xl);margin-bottom:var(--space-2)">Suggested mounting heights</h2>' +
        '<p style="color:var(--text-muted);font-size:var(--text-sm);margin-bottom:var(--space-5);max-width:60ch">' + esc(m.note) + '</p>' +
        '<div class="table-scroll" style="max-width:420px">' +
          '<table class="perf-table" style="min-width:0">' +
            '<thead><tr><th>Mounting height</th><th>Typical spacing</th></tr></thead>' +
            '<tbody>' +
              m.rows.map(function (r) { return '<tr><td>' + esc(r.height) + '</td><td>' + esc(r.range) + '</td></tr>'; }).join("") +
            '</tbody>' +
          '</table>' +
        '</div>' +
      '</div>'
    ) : "";
    return (
      '<section class="section section--surface product-section">' +
        '<div class="section__inner' + (m ? ' two-col' : '') + '">' +
          distBlock + mountBlock +
        '</div>' +
      '</section>'
    );
  }

  function statBandSection(p) {
    var rows = (p.mountingHeights && p.mountingHeights.rows) || [];
    var range = rows.length ? rows[0].height.replace(/\s+/g, "") + "–" + rows[rows.length - 1].height.replace(/\s+/g, "") : "";
    var ipBadge = (p.badges || []).find(function (b) { return /IP\d/i.test(b.label); });
    var ulorBadge = (p.badges || []).find(function (b) { return /ULOR/i.test(b.label); });
    var stats = [
      range ? range + " mounting range" : null,
      p.distributions ? p.distributions.length + " optical distributions" : null,
      ipBadge ? ipBadge.label : null,
      ulorBadge ? ulorBadge.label : null
    ].filter(Boolean);

    return (
      '<section class="section section--tight stat-band">' +
        '<div class="section__inner">' +
          '<p class="stat-band__line">' +
            stats.map(function (s) { return '<span class="stat-band__value">' + esc(s) + '</span>'; }).join('<span class="stat-band__sep" aria-hidden="true">&middot;</span>') +
          '</p>' +
        '</div>' +
      '</section>'
    );
  }

  function certificationsSection(p) {
    return (
      '<section class="section section--dark product-section">' +
        '<div class="section__inner two-col two-col--wide-left">' +
          '<div>' +
            '<p class="eyebrow">Certifications</p>' +
            '<h2 style="font-size:var(--text-2xl);margin-bottom:var(--space-4)">Certifications &amp; approvals</h2>' +
            '<div class="cert-badge-row">' +
              p.certifications.map(function (c) { return '<span class="cert-badge">' + esc(c) + '</span>'; }).join("") +
            '</div>' +
          '</div>' +
          '<div>' +
            '<p class="eyebrow">Accessories</p>' +
            '<h2 style="font-size:var(--text-2xl);margin-bottom:var(--space-4)">Available accessories</h2>' +
            '<table class="spec-table">' +
              p.accessories.map(function (a) {
                return '<tr><th>' + esc(a.code) + '</th><td>' + esc(a.desc) + '</td></tr>';
              }).join("") +
            '</table>' +
          '</div>' +
        '</div>' +
      '</section>'
    );
  }

  function downloadCard(label, meta, file, compact) {
    return (
      '<div class="download-card' + (compact ? ' download-card--compact' : '') + '">' +
        '<div>' +
          '<span class="download-card__meta">' + esc(meta) + '</span>' +
          '<h4>' + esc(label) + '</h4>' +
        '</div>' +
        '<a class="btn btn-ghost-dark" href="' + esc(file) + '" download aria-label="Download ' + esc(label) + '">Download</a>' +
      '</div>'
    );
  }
})();
