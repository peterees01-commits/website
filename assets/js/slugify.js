/* Single source of truth for turning a product code / manufacturer slug /
 * case-study or presentation id into a URL path segment. Loaded as a plain
 * global in the browser (via <script>, before main.js) and required as a
 * CommonJS module by scripts/generate-seo-pages.js, so the generated
 * per-item filenames and the links the client-side JS builds to them can
 * never drift apart. */
(function (root, factory) {
  if (typeof module === "object" && module.exports) {
    module.exports = factory();
  } else {
    root.slugify = factory();
  }
})(typeof self !== "undefined" ? self : this, function () {
  return function slugify(s) {
    return String(s)
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "");
  };
});
