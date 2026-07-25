(function () {
  "use strict";

  function esc(s) {
    return String(s).replace(/[&<>"]/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c];
    });
  }

  var form = document.getElementById("technicalInfoForm");
  var modal = document.getElementById("confirmModal");
  if (form && modal) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      if (!form.checkValidity()) {
        form.reportValidity();
        return;
      }
      modal.hidden = false;
      form.reset();
    });
    modal.querySelectorAll("[data-close]").forEach(function (el) {
      el.addEventListener("click", function () { modal.hidden = true; });
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && !modal.hidden) modal.hidden = true;
    });
  }

  var root = document.getElementById("presentationsList");
  var interestGroup = document.getElementById("ti-interest-group");

  fetch("data/presentations.json")
    .then(function (r) { return r.json(); })
    .then(function (data) {
      var presentations = data.presentations || [];
      if (root) render(presentations);
      if (interestGroup) renderInterestOptions(presentations);
    }).catch(function (err) {
      if (root) root.innerHTML = '<p style="color:var(--text-muted-on-dark)">Could not load the presentation list (' + esc(err.message) + ').</p>';
      if (interestGroup) interestGroup.innerHTML = '<p style="color:var(--text-muted-on-dark)">Could not load options (' + esc(err.message) + ').</p>';
    });

  function renderInterestOptions(presentations) {
    var categories = [];
    var byCategory = {};
    presentations.forEach(function (p) {
      if (!byCategory[p.category]) {
        byCategory[p.category] = [];
        categories.push(p.category);
      }
      byCategory[p.category].push(p);
    });

    interestGroup.innerHTML = categories.map(function (category) {
      return (
        '<div>' +
          '<p class="checkbox-group__category">' + esc(category) + '</p>' +
          '<div class="checkbox-group__options">' +
            byCategory[category].map(function (p) {
              var id = "interest-" + p.id;
              return (
                '<label class="checkbox-option" for="' + id + '">' +
                  '<input type="checkbox" id="' + id + '" name="interest" value="' + esc(p.title) + '">' +
                  '<span>' + esc(p.title) + '</span>' +
                '</label>'
              );
            }).join("") +
          '</div>' +
        '</div>'
      );
    }).join("");
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
