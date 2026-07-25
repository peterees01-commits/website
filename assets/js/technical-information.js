(function () {
  "use strict";

  var root = document.getElementById("presentationsList");
  if (!root) return;

  fetch("data/presentations.json")
    .then(function (r) { return r.json(); })
    .then(function (data) {
      render(data.presentations || []);
    }).catch(function (err) {
      root.innerHTML = '<p style="color:var(--text-muted-on-dark)">Could not load the presentation list (' + esc(err.message) + ').</p>';
    });

  function esc(s) {
    return String(s).replace(/[&<>"]/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c];
    });
  }

  function render(presentations) {
    var categories = [];
    var byCategory = {};
    presentations.forEach(function (p) {
      if (!byCategory[p.category]) {
        byCategory[p.category] = [];
        categories.push(p.category);
      }
      byCategory[p.category].push(p);
    });

    root.innerHTML = categories.map(function (category) {
      var items = byCategory[category];
      var hasCodes = items.some(function (p) { return p.code; });
      return (
        '<div class="presentation-category">' +
          '<h3>' + esc(category) + '</h3>' +
          '<div class="table-scroll" style="border:none">' +
            '<table class="presentation-table">' +
              '<thead><tr>' +
                (hasCodes ? '<th>Reference</th>' : '') +
                '<th>Presentation</th>' +
                '<th style="text-align:right">Duration</th>' +
              '</tr></thead>' +
              '<tbody>' +
                items.map(function (p) {
                  return (
                    '<tr>' +
                      (hasCodes ? '<td class="presentation-table__code">' + esc(p.code || '—') + '</td>' : '') +
                      '<td><a href="presentations/presentation.html?id=' + encodeURIComponent(p.id) + '">' + esc(p.title) +
                        (p.note ? '<span class="presentation-table__note">' + esc(p.note) + '</span>' : '') +
                      '</a></td>' +
                      '<td class="presentation-table__duration">' + esc(p.duration || 'TBC') + '</td>' +
                    '</tr>'
                  );
                }).join("") +
              '</tbody>' +
            '</table>' +
          '</div>' +
        '</div>'
      );
    }).join("");

    if (window.LumenMethod && window.LumenMethod.initScrollReveal) {
      window.LumenMethod.initScrollReveal(document);
    }
  }
})();
