(function () {
  "use strict";

  var root = document.getElementById("productRoot");
  if (!root) return;

  var params = new URLSearchParams(window.location.search);
  var code = params.get("code") || "DPL";

  Promise.all([
    fetch("../data/products.json").then(function (r) { return r.json(); }),
    fetch("../data/ies-manifest.json").then(function (r) { return r.json(); }).catch(function () { return []; })
  ]).then(function (results) {
    var products = results[0].products || [];
    var iesManifest = results[1] || [];
    var product = products.find(function (p) { return p.code === code; }) || products[0];
    if (!product) {
      root.innerHTML = '<p class="container" style="padding-block:var(--space-8)">Product not found.</p>';
      return;
    }
    render(product, iesManifest);
  }).catch(function (err) {
    root.innerHTML = '<p class="container" style="padding-block:var(--space-8)">Could not load product data (' + err.message + ').</p>';
  });

  function esc(s) {
    return String(s).replace(/[&<>"]/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c];
    });
  }

  function render(p, iesManifest) {
    document.title = p.name + " — " + p.manufacturer + " — Lumen Method";
    var titleEl = document.getElementById("pageTitle");
    if (titleEl) titleEl.textContent = p.name + " — Lumen Method";

    root.innerHTML =
      heroSection(p) +
      overviewSection(p) +
      distributionsSection(p) +
      performanceSection(p) +
      dimensionsSection(p) +
      orderingSection(p) +
      mountingSection(p) +
      downloadsSection(p);

    initGallery();
    initIesFinder(p, iesManifest);
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
        '</div>' +
        (images.length > 1 ?
          '<div class="product-gallery__thumbs" role="tablist" aria-label="Product images">' +
            images.map(function (img, i) {
              return (
                '<button type="button" class="product-gallery__thumb' + (i === 0 ? ' is-active' : '') + '" ' +
                  'data-src="../' + esc(img.file) + '" data-alt="' + esc(img.alt) + '" ' +
                  'role="tab" aria-selected="' + (i === 0 ? 'true' : 'false') + '" aria-label="' + esc(img.alt) + '">' +
                  '<img src="../' + esc(img.file) + '" alt="" loading="lazy">' +
                '</button>'
              );
            }).join("") +
          '</div>' : ""
        ) +
      '</div>'
    );
  }

  function initGallery() {
    var gallery = document.getElementById("productGallery");
    if (!gallery) return;
    var mainImg = document.getElementById("galleryMainImg");
    gallery.querySelectorAll(".product-gallery__thumb").forEach(function (btn) {
      btn.addEventListener("click", function () {
        mainImg.src = btn.getAttribute("data-src");
        mainImg.alt = btn.getAttribute("data-alt");
        gallery.querySelectorAll(".product-gallery__thumb").forEach(function (b) {
          b.classList.remove("is-active");
          b.setAttribute("aria-selected", "false");
        });
        btn.classList.add("is-active");
        btn.setAttribute("aria-selected", "true");
      });
    });
  }

  function overviewSection(p) {
    return (
      '<section class="section section--surface product-section">' +
        '<div class="section__inner two-col">' +
          '<div>' +
            '<p class="eyebrow">Overview</p>' +
            '<h2 style="font-size:var(--text-2xl);margin-bottom:var(--space-4)">Built for the brief</h2>' +
            '<p style="max-width:52ch;color:var(--text-muted);font-size:var(--text-md);line-height:1.7">' + esc(p.summary) + '</p>' +
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
    return (
      '<section class="section section--surface product-section">' +
        '<div class="section__inner">' +
          '<p class="eyebrow">Optical distributions</p>' +
          '<h2 style="font-size:var(--text-2xl);margin-bottom:var(--space-5)">' + p.distributions.length + ' distributions available</h2>' +
          '<div class="dist-grid">' +
            p.distributions.map(function (d, i) {
              return (
                '<div class="dist-card">' +
                  distGlyph(i) +
                  '<code>' + esc(d.code) + '</code>' +
                  '<span>' + esc(d.name) + '</span>' +
                '</div>'
              );
            }).join("") +
          '</div>' +
        '</div>' +
      '</section>'
    );
  }

  function distGlyph(i) {
    var rotations = [0, -18, 8, -30, 30, -12, 12, 0];
    var scales = [1, 0.85, 1.15, 0.7, 0.7, 0.9, 0.9, 1.05];
    var r = rotations[i % rotations.length];
    var sc = scales[i % scales.length];
    return (
      '<svg class="dist-card__icon" viewBox="0 0 100 60" aria-hidden="true">' +
        '<line x1="0" y1="50" x2="100" y2="50" stroke="var(--grey-200)" stroke-width="1"/>' +
        '<g transform="translate(50,50) rotate(' + r + ') scale(' + sc + ')">' +
          '<ellipse cx="0" cy="-14" rx="34" ry="14" fill="var(--glow)" opacity="0.22"/>' +
          '<ellipse cx="0" cy="-8" rx="18" ry="8" fill="var(--glow)" opacity="0.4"/>' +
        '</g>' +
      '</svg>'
    );
  }

  function performanceSection(p) {
    var cols = ["Ordering code", "Delivered lumens", "Module", "Circuit power", "Driver current", "Efficacy"];
    return (
      '<section class="section section--surface product-section">' +
        '<div class="section__inner">' +
          '<p class="eyebrow">Performance</p>' +
          '<h2 style="font-size:var(--text-2xl);margin-bottom:var(--space-2)">Typical luminaire performance</h2>' +
          '<p style="color:var(--text-muted);font-size:var(--text-sm);margin-bottom:var(--space-5);max-width:70ch">' + esc(p.performance.note) + '</p>' +
          '<div class="table-scroll">' +
            '<table class="perf-table">' +
              '<thead><tr>' + cols.map(function (c) { return '<th>' + c + '</th>'; }).join("") + '</tr></thead>' +
              '<tbody>' +
                p.performance.rows.map(function (r) {
                  return '<tr><td>' + esc(r.code) + '</td><td>' + esc(r.lumens) + ' lm</td><td>' + esc(r.module) + '</td><td>' + esc(r.power) + '</td><td>' + esc(r.current) + '</td><td>' + esc(r.efficacy) + '</td></tr>';
                }).join("") +
              '</tbody>' +
            '</table>' +
          '</div>' +
        '</div>' +
      '</section>'
    );
  }

  function dimensionsSection(p) {
    var d = p.dimensions;
    return (
      '<section class="section section--surface product-section">' +
        '<div class="section__inner two-col">' +
          '<div>' +
            '<p class="eyebrow">Dimensions &amp; weight</p>' +
            '<h2 style="font-size:var(--text-2xl);margin-bottom:var(--space-4)">Physical data</h2>' +
            '<table class="spec-table">' +
              d.variants.map(function (v) {
                return '<tr><th>' + esc(v.label) + '</th><td>' + esc(v.length) + ' L × ' + esc(v.width) + ' W × ' + esc(v.height) + ' H — ' + esc(v.weight) + '</td></tr>';
              }).join("") +
              '<tr><th>Windage</th><td>' + esc(d.windage) + '</td></tr>' +
            '</table>' +
            '<p style="color:var(--text-muted);font-size:var(--text-xs);margin-top:var(--space-3)">' + esc(d.note) + '</p>' +
          '</div>' +
          '<div>' +
            '<p class="eyebrow">Certifications</p>' +
            '<div class="product-card__chips">' +
              p.certifications.map(function (c) { return '<span class="chip">' + esc(c) + '</span>'; }).join("") +
            '</div>' +
            '<p class="eyebrow" style="margin-top:var(--space-5)">Accessories</p>' +
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

  function orderingSection(p) {
    var oc = p.orderingCode;
    return (
      '<section class="section section--dark product-section">' +
        '<div class="section__inner">' +
          '<p class="eyebrow">Ordering details</p>' +
          '<h2 style="font-size:var(--text-2xl);margin-bottom:var(--space-2)">Build the code</h2>' +
          '<p class="code-example" style="margin-bottom:var(--space-5)">' + esc(oc.example) + '</p>' +
          '<div class="table-scroll" style="border-color:var(--border-on-dark)">' +
            '<table class="order-table" style="min-width:520px">' +
              '<thead><tr><th style="background:var(--near-black);color:var(--grey-400)">Field</th><th style="background:var(--near-black);color:var(--grey-400)">Code</th><th style="background:var(--near-black);color:var(--grey-400)">Description</th></tr></thead>' +
              '<tbody>' +
                oc.groups.map(function (g) {
                  return g.options.map(function (o, i) {
                    return (
                      '<tr style="border-bottom-color:var(--border-on-dark)">' +
                        (i === 0 ? '<td rowspan="' + g.options.length + '" style="font-family:var(--font-mono);font-size:var(--text-xs);text-transform:uppercase;letter-spacing:.04em;color:' + (g.required ? 'var(--glow-soft)' : 'var(--grey-500)') + '">' + esc(g.title) + (g.required ? ' *' : '') + '</td>' : '') +
                        '<td style="font-family:var(--font-mono);color:var(--cream)">' + esc(o.code) + '</td>' +
                        '<td style="color:var(--grey-400)">' + esc(o.desc) + '</td>' +
                      '</tr>'
                    );
                  }).join("") + (g.footnote ? '<tr style="border-bottom-color:var(--border-on-dark)"><td></td><td colspan="2" style="color:var(--grey-500);font-size:var(--text-xs)">' + esc(g.footnote) + '</td></tr>' : "");
                }).join("") +
              '</tbody>' +
            '</table>' +
          '</div>' +
          '<p style="color:var(--grey-500);font-size:var(--text-xs);margin-top:var(--space-3)">* Required field. All other fields are optional / accessory codes.</p>' +
        '</div>' +
      '</section>'
    );
  }

  function mountingSection(p) {
    var m = p.mountingHeights;
    return (
      '<section class="section section--surface product-section">' +
        '<div class="section__inner">' +
          '<p class="eyebrow">Mounting</p>' +
          '<h2 style="font-size:var(--text-2xl);margin-bottom:var(--space-2)">Suggested mounting heights</h2>' +
          '<p style="color:var(--text-muted);font-size:var(--text-sm);margin-bottom:var(--space-5);max-width:70ch">' + esc(m.note) + '</p>' +
          '<div class="table-scroll" style="max-width:420px">' +
            '<table class="perf-table" style="min-width:0">' +
              '<thead><tr><th>Mounting height</th><th>Typical spacing</th></tr></thead>' +
              '<tbody>' +
                m.rows.map(function (r) { return '<tr><td>' + esc(r.height) + '</td><td>' + esc(r.range) + '</td></tr>'; }).join("") +
              '</tbody>' +
            '</table>' +
          '</div>' +
        '</div>' +
      '</section>'
    );
  }

  function downloadsSection(p) {
    var dl = p.downloads;
    return (
      '<section class="section section--dark product-section" id="downloads">' +
        '<div class="section__inner">' +
          '<p class="eyebrow">Downloads</p>' +
          '<h2 style="font-size:var(--text-2xl);margin-bottom:var(--space-5)">Documentation &amp; files</h2>' +

          '<div class="downloads-grid" style="margin-bottom:var(--space-6)">' +
            downloadCard(dl.brochure.label, dl.brochure.meta, "../" + dl.brochure.file) +
            downloadCard(dl.installGuide.label, dl.installGuide.meta, "../" + dl.installGuide.file) +
          '</div>' +

          '<p class="eyebrow">BIM objects</p>' +
          '<div class="downloads-grid" style="margin-bottom:var(--space-6)">' +
            dl.bim.map(function (b) { return downloadCard(b.label, b.meta, "../" + b.file); }).join("") +
          '</div>' +

          '<p class="eyebrow">IES photometric file finder</p>' +
          '<div class="ies-finder" id="iesFinder">' +
            '<div class="ies-finder__controls">' +
              '<div class="field"><label for="iesLumen">Lumen package</label><select id="iesLumen"></select></div>' +
              '<div class="field"><label for="iesCct">Colour temperature</label><select id="iesCct"></select></div>' +
              '<div class="field"><label for="iesDist">Distribution</label><select id="iesDist"></select></div>' +
            '</div>' +
            '<div class="ies-finder__result" id="iesResult"></div>' +
          '</div>' +
        '</div>' +
      '</section>'
    );
  }

  function downloadCard(label, meta, file) {
    return (
      '<a class="download-card" href="' + esc(file) + '" download>' +
        '<div>' +
          '<span class="download-card__meta">' + esc(meta) + '</span>' +
          '<h4>' + esc(label) + '</h4>' +
        '</div>' +
        '<span class="btn btn-ghost-dark" style="pointer-events:none">Download</span>' +
      '</a>'
    );
  }

  function initIesFinder(p, manifest) {
    var lumenSel = document.getElementById("iesLumen");
    var cctSel = document.getElementById("iesCct");
    var distSel = document.getElementById("iesDist");
    var result = document.getElementById("iesResult");
    if (!lumenSel || !manifest.length) {
      if (result) result.innerHTML = '<span class="ies-finder__empty">IES files not available for this product yet.</span>';
      return;
    }

    var lumenPackages = unique(manifest.map(function (m) { return m.lumenPackage; })).sort();
    var ccts = unique(manifest.map(function (m) { return m.cctCode; })).sort();
    var dists = unique(manifest.map(function (m) { return m.distributionCode; })).sort();

    var perfByCode = {};
    p.performance.rows.forEach(function (r) {
      perfByCode[r.code.replace("DPL.", "").replace("X", "")] = r;
    });

    var cctLabels = { "2": "2700K", "3": "3000K", "4": "4000K", "A": "PC Amber" };
    var distLabels = {};
    manifest.forEach(function (m) { distLabels[m.distributionCode] = m.distribution; });

    lumenSel.innerHTML = lumenPackages.map(function (lp) {
      var row = perfByCode[lp];
      var label = row ? lp + " — " + row.lumens + " lm" : lp;
      return '<option value="' + lp + '">' + label + '</option>';
    }).join("");

    cctSel.innerHTML = ccts.map(function (c) {
      return '<option value="' + c + '">' + (cctLabels[c] || c) + '</option>';
    }).join("");

    distSel.innerHTML = dists.map(function (d) {
      return '<option value="' + d + '">' + (distLabels[d] || d) + '</option>';
    }).join("");

    function update() {
      var lp = lumenSel.value, c = cctSel.value, d = distSel.value;
      var match = manifest.find(function (m) {
        return m.lumenPackage === lp && m.cctCode === c && m.distributionCode === d;
      });
      if (match) {
        result.innerHTML =
          '<div>' +
            '<div class="ies-finder__filename">' + esc(match.file) + '</div>' +
            '<div class="ies-finder__meta">' + esc(match.lampCode) + ' · ' + esc(match.distribution) + ' · ' + esc(match.wattageCode.replace("W", "")) + 'W circuit power</div>' +
          '</div>' +
          '<a class="btn btn-primary" href="../' + p.downloads.iesBasePath + esc(match.file) + '" download>Download .IES</a>';
      } else {
        result.innerHTML = '<span class="ies-finder__empty">No file for that combination — try a different distribution.</span>';
      }
    }

    [lumenSel, cctSel, distSel].forEach(function (el) { el.addEventListener("change", update); });
    update();

    function unique(arr) {
      return arr.filter(function (v, i) { return arr.indexOf(v) === i; });
    }
  }
})();
