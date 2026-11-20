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

  // DGI (discomfort glare index) compliance widget — AS/NZS 1158.3.1 Table 3.9
  // only sets a DGI limit for the PR/PP and LATM/RAB road/pathway categories,
  // not PA/PE/PC area lighting, so this only ever appears for an optic that
  // carries real Table 3.9 figures (d.dgi on a distributions entry).
  var DGI_CATS = [
    { key: "PR6", label: "PR / PP — below 6 m" },
    { key: "PR10", label: "PR / PP — 6–10 m" },
    { key: "LR6", label: "LATM / RAB — below 6 m" },
    { key: "LR10", label: "LATM / RAB — 6–10 m" }
  ];

  function dgiPct(cell) { return Math.round((cell.dgi / cell.limit) * 1000) / 10; }
  function dgiRamp(pct) { return pct > 95 ? "crit" : pct > 85 ? "warn" : "good"; }

  function dgiComplianceBlock(p) {
    var optics = (p.distributions || []).filter(function (d) { return d.dgi; });
    if (!optics.length) return "";
    return (
      '<div class="dgi-block" data-dgi-widget>' +
        '<p class="eyebrow">Glare assessment</p>' +
        '<h2 style="font-size:var(--text-2xl);margin-bottom:var(--space-2)">AS/NZS 1158 Part 3 Part 1 —<br>DGI Compliance</h2>' +
        '<p style="color:var(--text-muted);font-size:var(--text-xs);margin-bottom:var(--space-4);max-width:56ch">How close this optic sits to its Table 3.9 glare-index limit, at the highest wattage that still passes. Road and pathway categories only — Table 3.9 sets no DGI limit for PA/PE/PC area lighting.</p>' +
        '<div class="dgi-controls">' +
          '<select class="dgi-select" data-dgi-optic>' +
            optics.map(function (d) { return '<option value="' + esc(d.code) + '">' + esc(d.code) + ' — ' + esc(d.name) + '</option>'; }).join("") +
          '</select>' +
          '<select class="dgi-select" data-dgi-cat>' +
            DGI_CATS.map(function (c) { return '<option value="' + c.key + '">' + esc(c.label) + '</option>'; }).join("") +
          '</select>' +
        '</div>' +
        '<div class="dgi-readout">' +
          '<div class="dgi-readout__head">' +
            '<div class="dgi-readout__name" data-dgi-name></div>' +
            '<div class="dgi-status-pill" data-dgi-status></div>' +
          '</div>' +
          '<div class="dgi-big-pct" data-dgi-watt></div>' +
          '<div class="dgi-bar-track"><div class="dgi-bar-fill" data-dgi-fill></div></div>' +
          '<div class="dgi-bar-foot">' +
            '<span>DGI used: <b data-dgi-used></b> <span data-dgi-pct></span></span>' +
            '<span>Table 3.9 limit: <b data-dgi-limit></b></span>' +
          '</div>' +
        '</div>' +
      '</div>'
    );
  }

  function initDgiWidget(root, p) {
    var block = root.querySelector("[data-dgi-widget]");
    if (!block) return;
    var optics = p.distributions.filter(function (d) { return d.dgi; });

    var opticSel = block.querySelector("[data-dgi-optic]");
    var catSel = block.querySelector("[data-dgi-cat]");
    var nameEl = block.querySelector("[data-dgi-name]");
    var statusEl = block.querySelector("[data-dgi-status]");
    var wattEl = block.querySelector("[data-dgi-watt]");
    var pctEl = block.querySelector("[data-dgi-pct]");
    var fillEl = block.querySelector("[data-dgi-fill]");
    var usedEl = block.querySelector("[data-dgi-used]");
    var limitEl = block.querySelector("[data-dgi-limit]");

    function render() {
      var optic = optics.find(function (d) { return d.code === opticSel.value; });
      var cell = optic.dgi[catSel.value];
      var pct = dgiPct(cell);
      var kind = dgiRamp(pct);
      var catLabel = DGI_CATS.find(function (c) { return c.key === catSel.value; }).label;

      nameEl.textContent = optic.code + " — " + optic.name + " · " + catLabel;
      statusEl.textContent = cell.status + " · " + cell.w;
      statusEl.className = "dgi-status-pill dgi-status-pill--" + (cell.status === "MAX AVAILABLE" ? "good" : "warn");
      wattEl.innerHTML = esc(cell.w) + '<small> maximum compliant output</small>';
      fillEl.style.width = pct + "%";
      fillEl.className = "dgi-bar-fill dgi-bar-fill--" + kind;
      usedEl.textContent = cell.dgi.toLocaleString("en-AU");
      pctEl.textContent = "(" + pct + "%)";
      limitEl.textContent = cell.limit.toLocaleString("en-AU");
    }

    opticSel.addEventListener("change", render);
    catSel.addEventListener("change", render);
    render();
  }

  function render(p) {
    document.title = p.name + " — " + p.manufacturer + " — Lumen Method";
    var titleEl = document.getElementById("pageTitle");
    if (titleEl) titleEl.textContent = p.name + " — Lumen Method";

    root.innerHTML =
      heroSection(p) +
      overviewSection(p) +
      installVideoSection(p) +
      statBandSection(p) +
      mountingOptionsSection(p) +
      certificationsSection(p) +
      backlightControlSection(p) +
      distributionsSection(p);

    initGallery();
    initDownloadDropdowns(root);
    initDgiWidget(root, p);
    if (window.LumenMethod && window.LumenMethod.initScrollReveal) {
      window.LumenMethod.initScrollReveal(root);
    }
  }

  function heroSection(p) {
    return (
      '<section class="product-hero">' +
        '<div class="product-hero__inner">' +
          '<div>' +
            '<p class="breadcrumb"><a href="../index.html">Home</a> / <a href="../index.html#products">Solutions</a> / ' +
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
            '<p class="manu-note">' + esc(p.manufacturerNote) + ' Full manufacturer listing: <a href="' + esc(p.manufacturerUrl) + '" target="_blank" rel="noopener">' + esc(p.manufacturerUrl.replace(/^https?:\/\//, "")) + ' ↗</a></p>' +
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
            '<text x="120" y="98" text-anchor="middle" font-family="Roboto Mono, monospace" font-size="26" fill="#f2ecde" opacity="0.85">' + esc(p.code) + '</text>' +
          '</svg>' +
          '<p class="product-hero__frame-note">Product imagery pending.</p>' +
        '</div>'
      );
    }
    var sizes = [];
    images.forEach(function (img) {
      if (img.size && sizes.indexOf(img.size) === -1) sizes.push(img.size);
    });
    var defaultSize = sizes[0];
    var useFilter = sizes.length > 1 && !p.disableGalleryFilter;

    var filterBar = useFilter ? (
      '<div class="product-gallery__filter" role="tablist" aria-label="Filter by size">' +
        sizes.map(function (s, i) {
          return '<button type="button" class="gallery-filter-btn' + (i === 0 ? ' is-active' : '') + '" data-filter="' + esc(s) + '">' + esc(s) + '</button>';
        }).join("") +
        '<button type="button" class="gallery-filter-btn" data-filter="all">All (' + images.length + ')</button>' +
      '</div>'
    ) : "";

    return (
      '<div class="product-gallery' + (p.lightGalleryBackground ? ' product-gallery--light' : '') + '" id="productGallery">' +
        '<div class="product-hero__frame product-gallery__main">' +
          '<img id="galleryMainImg" src="../' + esc(images[0].file) + '" alt="' + esc(images[0].alt) + '">' +
          (images[0].size ? '<span class="product-gallery__size-badge" id="galleryMainSize">' + esc(images[0].size) + '</span>' : '<span class="product-gallery__size-badge" id="galleryMainSize" hidden></span>') +
          '<span class="bracket bracket--tl" aria-hidden="true"></span>' +
          '<span class="bracket bracket--tr" aria-hidden="true"></span>' +
          '<span class="bracket bracket--bl" aria-hidden="true"></span>' +
          '<span class="bracket bracket--br" aria-hidden="true"></span>' +
        '</div>' +
        filterBar +
        (images.length > 1 ?
          '<div class="product-gallery__thumbs" role="tablist" aria-label="Product images">' +
            images.map(function (img, i) {
              var hidden = useFilter && img.size && img.size !== defaultSize;
              return (
                '<button type="button" class="product-gallery__thumb' + (i === 0 ? ' is-active' : '') + '" ' +
                  'data-src="../' + esc(img.file) + '" data-alt="' + esc(img.alt) + '" data-size="' + esc(img.size || '') + '" ' +
                  (hidden ? 'style="display:none" ' : '') +
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

  var DOWNLOAD_LABELS = {
    brochure: "Product brochure",
    ies: "IES photometric files",
    bim: "BIM objects",
    installGuide: "Installation instructions"
  };

  function heroDownloads(p) {
    var dl = p.downloads;
    var order = ["brochure", "ies", "bim", "installGuide"];
    return (
      '<div class="hero-downloads">' +
        '<p class="eyebrow">Downloads</p>' +
        '<div class="hero-downloads__grid">' +
          order.map(function (key) {
            var d = dl[key];
            if (!d) return pendingDownloadCard(key);
            return (d.options && d.options.length)
              ? downloadCardWithOptions(d.label, d.meta, d.options)
              : downloadCard(d.label, d.meta, "../" + d.file, true);
          }).join("") +
        '</div>' +
      '</div>'
    );
  }

  // For products with several datasheets (one per mounting style, say) rather
  // than a single brochure file — the card opens a small menu of files
  // instead of linking straight to one.
  function downloadCardWithOptions(label, meta, options) {
    return (
      '<div class="download-card download-card--compact">' +
        '<div>' +
          (meta ? '<span class="download-card__meta">' + esc(meta) + '</span>' : '') +
          '<h4>' + esc(label) + '</h4>' +
        '</div>' +
        '<div class="dl-dropdown">' +
          '<button type="button" class="btn btn-ghost-dark dl-dropdown__toggle" aria-haspopup="true" aria-expanded="false">Download &#9662;</button>' +
          '<div class="dl-dropdown__menu" role="menu" hidden>' +
            options.map(function (o) {
              return '<a role="menuitem" href="../' + esc(o.file) + '" download>' + esc(o.label) + '</a>';
            }).join("") +
          '</div>' +
        '</div>' +
      '</div>'
    );
  }

  function initDownloadDropdowns(root) {
    var toggles = root.querySelectorAll(".dl-dropdown__toggle");
    function closeAll(except) {
      toggles.forEach(function (t) {
        if (t === except) return;
        t.setAttribute("aria-expanded", "false");
        t.nextElementSibling.hidden = true;
      });
    }
    toggles.forEach(function (btn) {
      var menu = btn.nextElementSibling;
      btn.addEventListener("click", function (e) {
        e.stopPropagation();
        var open = btn.getAttribute("aria-expanded") === "true";
        closeAll(open ? null : btn);
        btn.setAttribute("aria-expanded", open ? "false" : "true");
        menu.hidden = open;
      });
    });
    document.addEventListener("click", function () { closeAll(null); });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") closeAll(null);
    });
  }

  function pendingDownloadCard(key) {
    return (
      '<div class="download-card download-card--compact download-card--pending">' +
        '<div>' +
          '<span class="download-card__meta">Coming soon</span>' +
          '<h4>' + esc(DOWNLOAD_LABELS[key] || key) + '</h4>' +
        '</div>' +
      '</div>'
    );
  }

  function initGallery() {
    var gallery = document.getElementById("productGallery");
    if (!gallery) return;
    var isLightGallery = gallery.classList.contains("product-gallery--light");
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

    var filterBtns = gallery.querySelectorAll(".gallery-filter-btn");
    filterBtns.forEach(function (fbtn) {
      fbtn.addEventListener("click", function () {
        filterBtns.forEach(function (b) { b.classList.remove("is-active"); });
        fbtn.classList.add("is-active");
        var val = fbtn.getAttribute("data-filter");
        var firstVisible = null;
        thumbs.forEach(function (t) {
          var size = t.getAttribute("data-size");
          var show = val === "all" || !size || size === val;
          t.style.display = show ? "" : "none";
          if (show && size && !firstVisible) firstVisible = t;
        });
        if (val !== "all" && firstVisible) activate(firstVisible);
      });
    });

    var frame = gallery.querySelector(".product-gallery__main");
    var list = Array.prototype.slice.call(thumbs);
    function visibleThumbs() {
      return list.filter(function (b) { return b.style.display !== "none"; });
    }
    function activeVisibleIndex() {
      return visibleThumbs().findIndex(function (b) { return b.classList.contains("is-active"); });
    }

    frame.classList.add("is-cyclable");
    frame.setAttribute("role", "button");
    frame.setAttribute("tabindex", "0");
    frame.setAttribute("aria-label", "Open larger image");
    var openLightbox = function () {
      var visible = visibleThumbs();
      var items = visible.map(function (b) {
        return { src: b.getAttribute("data-src"), alt: b.getAttribute("data-alt") };
      });
      getLightbox().open(items, activeVisibleIndex(), function (item, index) {
        activate(visible[index]);
      }, { whiteFrame: isLightGallery });
    };
    frame.addEventListener("click", openLightbox);
    frame.addEventListener("keydown", function (e) {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        openLightbox();
      }
    });

    // Mounting-style cards (if present) show the same photos again, larger —
    // clicking the photo itself filters the gallery above to that style and
    // opens it in the lightbox, rather than running a second, separate
    // viewer. The small cross-section icon overlaid on each card is a
    // different image entirely (not part of the main gallery), so it opens
    // its own lightbox run — cycling through just the icon set — instead.
    var mountingZooms = document.querySelectorAll(".mounting-card__photo--zoomable");
    mountingZooms.forEach(function (el) {
      var openForSize = function () {
        var size = el.getAttribute("data-size");
        var fbtn = Array.prototype.find.call(filterBtns, function (b) { return b.getAttribute("data-filter") === size; });
        if (fbtn) fbtn.click();
        openLightbox();
      };
      el.addEventListener("click", openForSize);
      el.addEventListener("keydown", function (e) {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          openForSize();
        }
      });
    });

    var mountingIcons = document.querySelectorAll(".mounting-card__icon");
    var iconItems = Array.prototype.map.call(mountingIcons, function (img) {
      return { src: img.getAttribute("src"), alt: img.getAttribute("alt") || "" };
    });
    mountingIcons.forEach(function (img, index) {
      img.setAttribute("tabindex", "0");
      img.setAttribute("role", "button");
      var openIcon = function (e) {
        e.stopPropagation();
        getLightbox().open(iconItems, index, null, { whiteFrame: true });
      };
      img.addEventListener("click", openIcon);
      img.addEventListener("keydown", function (e) {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          openIcon(e);
        }
      });
    });
  }

  // Shared lightbox used by the main gallery, the mounting-card photos and
  // their cross-section icons — each opens it with its own item list
  // ({src, alt}) and starting index, so it isn't tied to one fixed gallery.
  function getLightbox() {
    var box = document.getElementById("imgLightbox");
    if (box) return box._lightboxApi;

    box = document.createElement("div");
    box.className = "img-lightbox";
    box.id = "imgLightbox";
    box.innerHTML =
      '<button type="button" class="img-lightbox__close" aria-label="Close">&times;</button>' +
      '<button type="button" class="img-lightbox__nav img-lightbox__prev" aria-label="Previous image">&#8249;</button>' +
      '<div class="img-lightbox__frame"><img class="img-lightbox__img" alt=""></div>' +
      '<button type="button" class="img-lightbox__nav img-lightbox__next" aria-label="Next image">&#8250;</button>';
    document.body.appendChild(box);

    var imgEl = box.querySelector(".img-lightbox__img");
    var closeBtn = box.querySelector(".img-lightbox__close");
    var prevBtn = box.querySelector(".img-lightbox__prev");
    var nextBtn = box.querySelector(".img-lightbox__next");
    var state = { items: [], index: 0, onShow: null };

    function close() {
      box.classList.remove("is-open");
      document.body.classList.remove("lightbox-locked");
    }

    function show(index) {
      if (!state.items.length) return;
      index = ((index % state.items.length) + state.items.length) % state.items.length;
      state.index = index;
      var item = state.items[index];
      imgEl.src = item.src;
      imgEl.alt = item.alt || "";
      var multi = state.items.length > 1;
      prevBtn.style.display = multi ? "" : "none";
      nextBtn.style.display = multi ? "" : "none";
      if (state.onShow) state.onShow(item, index);
    }

    function open(items, startIndex, onShow, opts) {
      state.items = items || [];
      state.onShow = onShow || null;
      // Dark, mostly-transparent line-art (the cross-section icons) disappears
      // against the lightbox's near-black backdrop — give those a white card.
      // Regular product photos stay seamless-on-dark as before, except on
      // products that already use a white gallery background throughout.
      box.classList.toggle("img-lightbox--white", !!(opts && opts.whiteFrame));
      show(startIndex || 0);
      box.classList.add("is-open");
      document.body.classList.add("lightbox-locked");
      closeBtn.focus();
    }

    closeBtn.addEventListener("click", close);
    box.addEventListener("click", function (e) {
      if (e.target === box) close();
    });
    prevBtn.addEventListener("click", function () { show(state.index - 1); });
    nextBtn.addEventListener("click", function () { show(state.index + 1); });
    document.addEventListener("keydown", function (e) {
      if (!box.classList.contains("is-open")) return;
      if (e.key === "Escape") close();
      else if (e.key === "ArrowLeft") show(state.index - 1);
      else if (e.key === "ArrowRight") show(state.index + 1);
    });

    var api = { open: open };
    box._lightboxApi = api;
    return api;
  }

  function overviewSection(p) {
    var d = p.dimensions;
    var overviewHeading = esc(p.overviewHeading || "Built for the brief");
    // d.continuousLength opts into a range-based table for products sold as a
    // cut-to-length continuous extrusion (e.g. Survivor) instead of discrete
    // SKU'd sizes — width/height are fixed, length and weight are given as a
    // range rather than one row per stocked length.
    var physicalBlock = (
      '<p class="eyebrow">Physical characteristics</p>' +
      '<table class="spec-table">' +
        (d.continuousLength ? (
          '<tr><th>Length</th><td>' + esc(d.lengthRange) + '</td></tr>' +
          '<tr><th>Width' + (d.depthFootnote ? '*' : '') + '</th><td>' + esc(d.width) + '</td></tr>' +
          '<tr><th>Height' + (d.depthFootnote ? '*' : '') + '</th><td>' + esc(d.height) + '</td></tr>' +
          '<tr><th>Weight</th><td>' + esc(d.weightRange) + '</td></tr>'
        ) : d.variants.map(function (v) {
          return '<tr><th>' + esc(v.label) + '</th><td>' + esc(v.length) + ' L × ' + esc(v.width) + ' W × ' + esc(v.height) + ' H — ' + esc(v.weight) + '</td></tr>';
        }).join("")) +
        (p.hideWindage ? '' : '<tr><th>Windage</th><td>' + esc(d.windage) + '</td></tr>') +
      '</table>' +
      '<p style="color:var(--text-muted);font-size:var(--text-xs);margin-top:var(--space-3)">' + esc(d.note) + '</p>'
    );
    var keySpecBlock = (
      '<p class="eyebrow">Key specification</p>' +
      '<table class="spec-table">' +
        p.keySpecs.map(function (s) {
          return '<tr><th>' + esc(s.label) + '</th><td>' + esc(s.value) + '</td></tr>';
        }).join("") +
      '</table>'
    );
    // Default layout: Physical characteristics pinned to the bottom of the left
    // column, Key specification alone in the right column. PEB opts into a
    // stacked layout (Physical characteristics under Key specification in the
    // right column) via stackPhysicalWithKeySpecs, since the default layout
    // left it flush against the section's bottom edge for that product.
    var leftCol, rightCol;
    if (p.stackPhysicalWithKeySpecs) {
      leftCol = (
        '<div>' +
          '<p class="eyebrow">Overview</p>' +
          '<h2 style="font-size:var(--text-2xl);margin-bottom:var(--space-4)">' + overviewHeading + '</h2>' +
          '<p style="max-width:52ch;color:var(--text-muted);font-size:var(--text-md);line-height:1.7">' + esc(p.summary).replace(/\n/g, "<br>") + '</p>' +
        '</div>'
      );
      rightCol = (
        '<div>' +
          keySpecBlock +
          '<div style="margin-top:var(--space-6)">' + physicalBlock + '</div>' +
        '</div>'
      );
    } else {
      leftCol = (
        '<div style="display:flex;flex-direction:column;height:100%;gap:var(--space-6)">' +
          '<div>' +
            '<p class="eyebrow">Overview</p>' +
            '<h2 style="font-size:var(--text-2xl);margin-bottom:var(--space-4)">' + overviewHeading + '</h2>' +
            '<p style="max-width:52ch;color:var(--text-muted);font-size:var(--text-md);line-height:1.7">' + esc(p.summary).replace(/\n/g, "<br>") + '</p>' +
          '</div>' +
          '<div style="margin-top:auto">' + physicalBlock + '</div>' +
        '</div>'
      );
      rightCol = '<div>' + keySpecBlock + '</div>';
    }
    return (
      '<section class="section section--tight section--surface product-section">' +
        '<div class="section__inner two-col">' +
          leftCol +
          rightCol +
        '</div>' +
      '</section>'
    );
  }

  function photoBlocks(photo) {
    if (!photo) return "";
    var items = Array.isArray(photo) ? photo : [photo];
    return items.map(function (im) {
      return (
        '<div class="backlight-photo">' +
          '<img src="../' + esc(im.file) + '" alt="' + esc(im.alt) + '">' +
          (im.caption ? '<p class="backlight-photo__caption">' + esc(im.caption) + '</p>' : "") +
        '</div>'
      );
    }).join("");
  }

  function backlightControlSection(p) {
    var b = p.backlightControl;
    if (!b) return "";
    var hasOptics = b.optics && b.optics.length;
    var opticsGrid = hasOptics ? (
      '<p class="eyebrow">' + esc(b.opticsLabel || "Cutoff optics") + '</p>' +
      '<div class="dist-grid">' +
        b.optics.map(function (o) {
          return (
            '<div class="dist-card">' +
              '<img class="dist-card__icon" src="../' + esc(o.chart) + '" alt="' + esc(o.name) + ' light distribution plot">' +
              '<code>' + esc(o.code) + '</code>' +
              '<span>' + esc(o.name) + '</span>' +
            '</div>'
          );
        }).join("") +
      '</div>'
    ) : "";
    var introBlock = (
      '<p class="eyebrow">' + esc(b.eyebrow) + '</p>' +
      '<h2 style="font-size:var(--text-2xl);margin-bottom:var(--space-4)">' + esc(b.heading) + '</h2>' +
      '<p style="max-width:56ch;color:var(--text-muted);font-size:var(--text-md);line-height:1.7;margin-bottom:var(--space-5)">' + esc(b.body) + '</p>' +
      (b.points && b.points.length ?
        '<ul style="color:var(--text-muted);font-size:var(--text-sm);line-height:1.8;padding-left:1.2em;margin:0 0 var(--space-5)">' +
          b.points.map(function (pt) { return '<li>' + esc(pt) + '</li>'; }).join("") +
        '</ul>' : ""
      )
    );
    // Default layout: two grid children (left = intro text + hardwarePhoto
    // stacked, right = comparisonPhoto), with any optics/distributions grid
    // as a separate full-width block below. PPS opts into opticsInline,
    // which instead emits 4 direct grid children so hardwarePhoto and the
    // optics grid land in the same implicit grid row — lining the optics
    // cards up with the top of the reflector photo, not just wherever they
    // fall after the comparison photo's variable-height caption.
    var bodyHtml = b.threeCol ? (
      // Opt-in: text, hardwarePhoto and comparisonPhoto as three separate
      // grid columns side by side, instead of stacking an image under the
      // text — keeps the section to one row's height even with two photos.
      '<div class="three-col' + (b.threeColWideRight ? ' three-col--wide-right' : '') + '">' +
        '<div>' + introBlock + '</div>' +
        '<div>' + photoBlocks(b.hardwarePhoto) + '</div>' +
        '<div>' + photoBlocks(b.comparisonPhoto) + '</div>' +
      '</div>'
    ) : b.opticsInline ? (
      '<div class="two-col two-col--wide-left">' +
        '<div>' + introBlock + '</div>' +
        '<div>' + photoBlocks(b.comparisonPhoto) + '</div>' +
        '<div>' + photoBlocks(b.hardwarePhoto) + '</div>' +
        '<div>' + opticsGrid + '</div>' +
      '</div>'
    ) : b.imagesRight ? (
      // Opt-in: keep the left column text-only and stack both photos in
      // the right column, instead of the default where hardwarePhoto sits
      // under the text on the left.
      '<div class="two-col two-col--wide-left" style="margin-bottom:' + (hasOptics ? 'var(--space-6)' : '0') + '">' +
        '<div>' + introBlock + '</div>' +
        '<div>' + photoBlocks(b.hardwarePhoto) + photoBlocks(b.comparisonPhoto) + '</div>' +
      '</div>' +
      (hasOptics ? opticsGrid : "")
    ) : (
      '<div class="two-col two-col--wide-left" style="margin-bottom:' + (hasOptics ? 'var(--space-6)' : '0') + '">' +
        '<div>' + introBlock + photoBlocks(b.hardwarePhoto) + '</div>' +
        '<div>' + photoBlocks(b.comparisonPhoto) + '</div>' +
      '</div>' +
      (hasOptics ? opticsGrid : "")
    );
    return (
      '<section class="section section--surface product-section">' +
        '<div class="section__inner">' + bodyHtml + '</div>' +
      '</section>'
    );
  }

  function distributionsSection(p) {
    var m = p.mountingHeights;
    var hasDist = p.distributions && p.distributions.length && !p.hideDistributionsSection;
    function distCard(d) {
      return (
        '<div class="dist-card">' +
          '<img class="dist-card__icon" src="../' + esc(d.chart) + '" alt="' + esc(d.name) + ' light distribution plot">' +
          '<code>' + esc(d.code) + '</code>' +
          '<span>' + esc(d.name) + '</span>' +
          (d.note ? '<small>' + esc(d.note) + '</small>' : '') +
        '</div>'
      );
    }
    var hasGroups = hasDist && p.distributions.some(function (d) { return d.group; });
    var distGrid;
    if (hasGroups) {
      var groupOrder = [];
      var groupMap = {};
      p.distributions.forEach(function (d) {
        var g = d.group || "";
        if (!groupMap[g]) { groupMap[g] = []; groupOrder.push(g); }
        groupMap[g].push(d);
      });
      distGrid = groupOrder.map(function (g, i) {
        return (
          '<div' + (i > 0 ? ' style="margin-top:var(--space-6)"' : '') + '>' +
            (g ? '<h3 style="font-size:var(--text-lg);margin-bottom:var(--space-3)">' + esc(g) + '</h3>' : "") +
            '<div class="dist-grid">' +
              groupMap[g].map(distCard).join("") +
            '</div>' +
          '</div>'
        );
      }).join("");
    } else if (hasDist) {
      distGrid = '<div class="dist-grid">' + p.distributions.map(distCard).join("") + '</div>';
    }
    var hasDgi = hasDist && p.distributions.some(function (d) { return d.dgi; });
    var distBlock = hasDist ? (
      '<div>' +
        '<p class="eyebrow">Optical distributions</p>' +
        '<h2 style="font-size:var(--text-2xl);margin-bottom:var(--space-5)">Optical Distributions</h2>' +
        distGrid +
        (hasDgi ? "" : dgiComplianceBlock(p)) +
      '</div>'
    ) : "";
    var mountBlock = m ? (
      '<div>' +
        '<p class="eyebrow">Mounting</p>' +
        '<h2 style="font-size:var(--text-2xl);margin-bottom:var(--space-2)">' + esc(m.heading || "Suggested mounting heights").replace(/\n/g, "<br>") + '</h2>' +
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
    var ps = p.pedestrianSpacing;
    var psBlock = ps ? (
      '<div' + (m ? ' style="margin-top:var(--space-7)"' : '') + '>' +
        '<p class="eyebrow">' + esc(ps.standard) + '</p>' +
        '<h2 style="font-size:var(--text-2xl);margin-bottom:var(--space-2)">Pedestrian pathway spacing</h2>' +
        '<p style="color:var(--text-muted);font-size:var(--text-sm);margin-bottom:var(--space-5);max-width:60ch">' + esc(ps.note) + '</p>' +
        '<div class="table-scroll" style="max-width:480px">' +
          '<table class="perf-table" style="min-width:0">' +
            '<thead><tr><th>P category</th>' +
              ps.heights.map(function (h) { return '<th>' + esc(h) + '</th>'; }).join("") +
            '</tr></thead>' +
            '<tbody>' +
              ps.rows.map(function (r) {
                return '<tr><td>' + esc(r.category) + '</td>' +
                  r.spacing.map(function (s) { return '<td>' + esc(s) + '</td>'; }).join("") +
                '</tr>';
              }).join("") +
            '</tbody>' +
          '</table>' +
        '</div>' +
        '<p style="color:var(--text-muted);font-size:var(--text-xs);margin-top:var(--space-3);max-width:60ch">' + esc(ps.config) + '</p>' +
      '</div>'
    ) : "";
    var distPhoto = p.distributionsPhoto;
    var distPhotoBlock = distPhoto ? photoBlocks(distPhoto) : "";
    if (!hasDist && !m && !ps) return "";

    // When an optic carries real glare-assessment data, put distributions,
    // mounting/pedestrian guidance and the glare assessment in a row of
    // their own columns instead of nesting the DGI widget under
    // distributions — three columns when a mounting/pedestrian block
    // exists alongside it, two when it doesn't (e.g. S-Line has neither
    // mountingHeights nor pedestrianSpacing data).
    if (hasDgi) {
      var guideBlock = (m || ps || distPhoto) ? '<div>' + mountBlock + psBlock + distPhotoBlock + '</div>' : "";
      var glareBlock = '<div>' + dgiComplianceBlock(p) + '</div>';
      var cols = [distBlock, guideBlock, glareBlock].filter(Boolean);
      return (
        '<section class="section section--surface product-section">' +
          '<div class="section__inner ' + (cols.length === 3 ? "three-col" : "two-col") + '">' +
            cols.join("") +
          '</div>' +
        '</section>'
      );
    }

    return (
      '<section class="section section--surface product-section">' +
        '<div class="section__inner' + (hasDist && (m || ps || distPhoto) ? ' two-col' : '') + '">' +
          distBlock + '<div>' + mountBlock + psBlock + distPhotoBlock + '</div>' +
        '</div>' +
      '</section>'
    );
  }

  function statBandSection(p) {
    var rows = (p.mountingHeights && p.mountingHeights.rows) || [];
    var range = rows.length ? rows[0].height.replace(/\s+/g, "") + "–" + rows[rows.length - 1].height.replace(/\s+/g, "") : "";
    var ipBadge = (p.badges || []).find(function (b) { return /IP\d/i.test(b.label); });
    var ikBadge = (p.badges || []).find(function (b) { return /IK\d/i.test(b.label) && b !== ipBadge; });
    var ulorBadge = (p.badges || []).find(function (b) { return /ULOR/i.test(b.label); });
    var stats = [
      range ? range + " mounting range" : null,
      p.statBandLabel ? p.statBandLabel : (p.distributions ? (p.statDistributionCount || p.distributions.length) + " optical distributions" : null),
      ipBadge ? ipBadge.label : null,
      ikBadge ? ikBadge.label : null,
      ulorBadge ? ulorBadge.label : null,
      (p.backlightControl && !p.backlightControl.hideFromStatBand) ? p.backlightControl.eyebrow : null
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
            (p.certificationLogo ? '<img class="cert-logo" src="../' + esc(p.certificationLogo.file) + '" alt="' + esc(p.certificationLogo.alt) + '">' : "") +
            '<div class="cert-badge-row">' +
              p.certifications.map(function (c) { return '<span class="cert-badge">' + esc(c) + '</span>'; }).join("") +
            '</div>' +
          '</div>' +
          ((p.accessories && p.accessories.length) ? (
            '<div>' +
              '<p class="eyebrow">' + esc(p.accessoriesEyebrow || "Accessories") + '</p>' +
              '<h2 style="font-size:var(--text-2xl);margin-bottom:var(--space-4)">' + esc(p.accessoriesHeading || "Available accessories") + '</h2>' +
              '<table class="spec-table">' +
                p.accessories.map(function (a) {
                  return '<tr><th>' + esc(a.code) + '</th><td>' + esc(a.desc) + '</td></tr>';
                }).join("") +
              '</table>' +
              p.accessories.filter(function (a) { return a.image || (a.images && a.images.length); }).map(function (a) {
                var photos = a.image ? [{ file: a.image, alt: a.imageAlt || a.desc, caption: a.code + ' — ' + a.desc }] : [];
                photos = photos.concat(a.images || []);
                return photos.map(function (im) {
                  return (
                    '<div class="backlight-photo" style="margin-top:var(--space-4)">' +
                      '<img src="../' + esc(im.file) + '" alt="' + esc(im.alt) + '">' +
                      (im.caption ? '<p class="backlight-photo__caption">' + esc(im.caption) + '</p>' : "") +
                    '</div>'
                  );
                }).join("");
              }).join("") +
            '</div>'
          ) : "<div></div>") +
        '</div>' +
      '</section>'
    );
  }

  // Opt-in short demo video for products whose main selling point is how
  // quick/simple installation is — a photo gallery can't really show that,
  // a short clip can. No controls autoplay; the viewer presses play.
  function installVideoSection(p) {
    var v = p.installVideo;
    if (!v) return "";
    return (
      '<section class="section section--dark product-section">' +
        '<div class="section__inner two-col two-col--wide-left">' +
          '<div>' +
            '<p class="eyebrow">' + esc(v.eyebrow || "Installation") + '</p>' +
            '<h2 style="font-size:var(--text-2xl);margin-bottom:var(--space-4)">' + esc(v.heading) + '</h2>' +
            '<p style="max-width:52ch;color:var(--text-muted-on-dark);font-size:var(--text-md);line-height:1.7">' + esc(v.body) + '</p>' +
          '</div>' +
          '<div>' +
            '<video class="install-video" src="../' + esc(v.file) + '"' +
              (v.poster ? ' poster="../' + esc(v.poster) + '"' : '') +
              ' controls loop playsinline preload="metadata"></video>' +
            (v.caption ? '<p class="backlight-photo__caption" style="border:1px solid var(--border-on-dark);border-top:none;padding:var(--space-2) var(--space-3);font-size:var(--text-xs);color:var(--grey-500)">' + esc(v.caption) + '</p>' : "") +
          '</div>' +
        '</div>' +
      '</section>'
    );
  }

  // Opt-in section for products sold as one continuous extrusion offered in
  // several mounting/installation styles (naked, recessed, surface, etc.)
  // rather than discrete SKUs — the styles share specs/dimensions below,
  // but each has its own photo, cross-section icon and datasheet.
  function mountingOptionsSection(p) {
    var opts = p.mountingOptions;
    if (!opts || !opts.length) return "";
    return (
      '<section class="section section--surface product-section">' +
        '<div class="section__inner">' +
          '<p class="eyebrow">' + esc(p.mountingOptionsEyebrow || "Configuration") + '</p>' +
          '<h2 style="font-size:var(--text-2xl);margin-bottom:var(--space-5)">' + esc(p.mountingOptionsHeading || "Mounting options") + '</h2>' +
          '<div class="mounting-grid">' +
            opts.map(function (m) {
              return (
                '<div class="mounting-card">' +
                  '<div class="mounting-card__photo mounting-card__photo--zoomable" data-size="' + esc(m.label) + '" role="button" tabindex="0" aria-label="View ' + esc(m.label) + ' larger">' +
                    '<img src="../' + esc(m.photo.file) + '" alt="' + esc(m.photo.alt) + '" loading="lazy">' +
                    (m.icon ? '<img class="mounting-card__icon" src="../' + esc(m.icon.file) + '" alt="' + esc(m.label) + ' cross-section" loading="lazy">' : "") +
                  '</div>' +
                  '<h3>' + esc(m.label) + '</h3>' +
                  '<p>' + esc(m.description) + '</p>' +
                '</div>'
              );
            }).join("") +
          '</div>' +
        '</div>' +
      '</section>'
    );
  }

  function downloadCard(label, meta, file, compact) {
    return (
      '<div class="download-card' + (compact ? ' download-card--compact' : '') + '">' +
        '<div>' +
          (meta ? '<span class="download-card__meta">' + esc(meta) + '</span>' : '') +
          '<h4>' + esc(label) + '</h4>' +
        '</div>' +
        '<a class="btn btn-ghost-dark" href="' + esc(file) + '" download aria-label="Download ' + esc(label) + '">Download</a>' +
      '</div>'
    );
  }
})();
