(function () {
  "use strict";

  var root = document.getElementById("presentationRoot");
  if (!root) return;

  var params = new URLSearchParams(window.location.search);
  var id = params.get("id");

  fetch("../data/presentations.json")
    .then(function (r) { return r.json(); })
    .then(function (data) {
      var list = data.presentations || [];
      var item = list.find(function (p) { return p.id === id; }) || list[0];
      if (!item) {
        root.innerHTML = '<p class="container" style="padding-block:var(--space-8)">Presentation not found.</p>';
        return;
      }
      render(item);
    }).catch(function (err) {
      root.innerHTML = '<p class="container" style="padding-block:var(--space-8)">Could not load presentation data (' + err.message + ').</p>';
    });

  function esc(s) {
    return String(s).replace(/[&<>"]/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c];
    });
  }

  function render(p) {
    document.title = p.title + " — Lumen Method";
    var titleEl = document.getElementById("pageTitle");
    if (titleEl) titleEl.textContent = p.title + " — Lumen Method";

    root.innerHTML = coverSection(p) + accessSection();

    if (window.LumenMethod && window.LumenMethod.initScrollReveal) {
      window.LumenMethod.initScrollReveal(root);
    }
  }

  function coverSection(p) {
    return (
      '<section class="section section--dark">' +
        '<div class="section__inner">' +
          '<p class="breadcrumb"><a href="../technical-information.html">Technical</a> / ' + esc(p.category) + ' / ' + esc(p.title) + '</p>' +
          '<div class="presentation-cover__frame">' +
            '<span class="bracket bracket--tl" aria-hidden="true"></span>' +
            '<span class="bracket bracket--tr" aria-hidden="true"></span>' +
            '<span class="bracket bracket--bl" aria-hidden="true"></span>' +
            '<span class="bracket bracket--br" aria-hidden="true"></span>' +
            '<p class="eyebrow" style="justify-content:center">' + esc(p.category) + '</p>' +
            (p.code ? '<p class="presentation-cover__code">' + esc(p.code) + '</p>' : '') +
            '<h1 class="presentation-cover__title">' + esc(p.title) + '</h1>' +
            (p.note ? '<p class="presentation-cover__note">' + esc(p.note) + '</p>' : '') +
            (p.duration ? '<span class="presentation-cover__duration">' + esc(p.duration) + '</span>' : '') +
          '</div>' +
        '</div>' +
      '</section>'
    );
  }

  function accessSection() {
    return (
      '<section class="section section--surface product-section">' +
        '<div class="section__inner">' +
          '<p class="eyebrow">Access</p>' +
          '<h2 style="font-size:var(--text-2xl);margin-bottom:var(--space-4)">Registration required</h2>' +
          '<p style="max-width:60ch;color:var(--text-muted);font-size:var(--text-md);line-height:1.7;margin-bottom:var(--space-5)">This presentation is available to approved registrants. Register your interest below and our team will follow up with full access once your request is reviewed.</p>' +
          '<a class="btn btn-primary" href="../technical-information.html#register">Register your interest →</a>' +
        '</div>' +
      '</section>'
    );
  }
})();
