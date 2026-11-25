#!/usr/bin/env node
/*
 * Generates one real, crawlable static HTML file per product / case study /
 * manufacturer / presentation, plus sitemap.xml and robots.txt.
 *
 * Why: products/product.html (and the equivalent case-study/manufacturer/
 * presentation templates) are empty shells that only get a title, meta
 * description, and content once client-side JS runs. Search engines that
 * don't execute JS, and every chat/social link-preview scraper (Slack,
 * WhatsApp, LinkedIn, Teams, email clients), never see real per-item
 * content — every shared link previews identically.
 *
 * This script does NOT duplicate the rendering logic. Each generated file
 * is a byte-for-byte copy of the existing template, with only the <head>
 * (title/description/canonical/OG/Twitter tags) and a data-* attribute on
 * the root div touched. The same product.js/case-study.js/manufacturer.js/
 * presentation.js still does the actual rendering client-side, reading the
 * item from that data-* attribute instead of a query string. The old
 * ?code=/?id=/?slug= query-string URLs keep working unchanged.
 *
 * Run via `node scripts/generate-seo-pages.js` from the repo root. Intended
 * to run as a CI step before deploy, not to have its output committed.
 */

"use strict";

const fs = require("fs");
const path = require("path");
const slugify = require("../assets/js/slugify.js");

// ROOT is an explicit staging directory, e.g. _site — a disposable COPY of
// the site, never the real repo checkout. This script mutates files in
// place (patching heads, adding generated pages), so it must never run
// against the actual source tree. Required positional arg, no default.
var rootArg = process.argv[2];
if (!rootArg) {
  console.error("Usage: node generate-seo-pages.js <staging-dir>");
  console.error("Refusing to default to the repo root — this script mutates files in place.");
  process.exit(1);
}
const ROOT = path.resolve(rootArg);
if (!fs.existsSync(path.join(ROOT, "products", "product.html"))) {
  console.error("'" + ROOT + "' doesn't look like a staged copy of the site (missing products/product.html). Aborting.");
  process.exit(1);
}

const BASE_URL = "https://peterees01-commits.github.io/website";
const SITE_NAME = "Lumen Method";

// The site is public (anyone with the link can view it) but not yet
// announced — flip this to true once it's ready to be found by search
// engines. While false, robots.txt blocks crawling and no sitemap is
// published, so an unlinked, unfinished page doesn't get indexed.
const SITE_IS_LIVE = false;

function readJson(relPath) {
  return JSON.parse(fs.readFileSync(path.join(ROOT, relPath), "utf8"));
}

function esc(s) {
  return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) {
    return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c];
  });
}

function truncate(s, max) {
  s = String(s || "").replace(/\s+/g, " ").trim();
  if (s.length <= max) return s;
  var cut = s.slice(0, max - 1);
  var lastSpace = cut.lastIndexOf(" ");
  if (lastSpace > max * 0.6) cut = cut.slice(0, lastSpace);
  return cut.replace(/[,.;:\-–—]+$/, "") + "…";
}

function absoluteUrl(relPath) {
  return BASE_URL + "/" + String(relPath).replace(/^\/+/, "");
}

/**
 * Builds the generated page's content by patching the shared template.
 */
function buildPage(templateHtml, opts) {
  var html = templateHtml;

  // <title id="pageTitle">...</title>
  html = html.replace(
    /<title id="pageTitle">[^<]*<\/title>/,
    '<title id="pageTitle">' + esc(opts.title) + "</title>"
  );

  // <meta name="description" content="...">
  var metaBlockLines = [
    '<meta name="description" content="' + esc(opts.description) + '">'
  ];
  if (!SITE_IS_LIVE) {
    metaBlockLines.push('<meta name="robots" content="noindex, nofollow">');
  }
  metaBlockLines.push(
    '<link rel="canonical" href="' + esc(opts.url) + '">',
    '<meta property="og:type" content="' + esc(opts.ogType) + '">',
    '<meta property="og:site_name" content="' + esc(SITE_NAME) + '">',
    '<meta property="og:title" content="' + esc(opts.title) + '">',
    '<meta property="og:description" content="' + esc(opts.description) + '">',
    '<meta property="og:url" content="' + esc(opts.url) + '">'
  );
  if (opts.image) {
    metaBlockLines.push('<meta property="og:image" content="' + esc(absoluteUrl(opts.image)) + '">');
  }
  metaBlockLines.push(
    '<meta name="twitter:card" content="' + (opts.image ? "summary_large_image" : "summary") + '">',
    '<meta name="twitter:title" content="' + esc(opts.title) + '">',
    '<meta name="twitter:description" content="' + esc(opts.description) + '">'
  );
  if (opts.image) {
    metaBlockLines.push('<meta name="twitter:image" content="' + esc(absoluteUrl(opts.image)) + '">');
  }

  var metaDescRe = /<meta name="description" content="[^"]*">/;
  if (!metaDescRe.test(html)) {
    throw new Error("Template missing <meta name=\"description\"> line — cannot patch head");
  }
  html = html.replace(metaDescRe, metaBlockLines.join("\n"));

  // Root div data-* selector attribute, e.g. <div id="productRoot"> -> <div id="productRoot" data-code="DPL">
  var rootDivRe = new RegExp('<div id="' + opts.rootId + '">');
  if (!rootDivRe.test(html)) {
    throw new Error('Template missing <div id="' + opts.rootId + '"> — cannot set data attribute');
  }
  html = html.replace(rootDivRe, '<div id="' + opts.rootId + '" ' + opts.dataAttr + '="' + esc(opts.dataAttrValue) + '">');

  return html;
}

var sitemapUrls = [];

function addSitemapUrl(urlPath) {
  sitemapUrls.push(absoluteUrl(urlPath));
}

function generateType(config) {
  var data = readJson(config.dataFile);
  var items = data[config.listKey] || [];
  var templatePath = path.join(ROOT, config.template);
  var templateHtml = fs.readFileSync(templatePath, "utf8");
  var outDir = path.join(ROOT, config.outDir);

  var count = 0;
  items.forEach(function (item) {
    var slug = config.slug(item);
    if (!slug) return;
    var outPath = path.join(outDir, slug + ".html");
    var urlPath = config.outDir + "/" + slug + ".html";

    var page = buildPage(templateHtml, {
      title: config.title(item),
      description: truncate(config.description(item), 160),
      url: absoluteUrl(urlPath),
      image: config.image(item),
      ogType: config.ogType,
      rootId: config.rootId,
      dataAttr: config.dataAttr,
      dataAttrValue: config.dataAttrValue(item)
    });

    fs.writeFileSync(outPath, page, "utf8");
    addSitemapUrl(urlPath);
    count++;
  });
  return count;
}

var TYPES = [
  {
    name: "products",
    dataFile: "data/products.json",
    listKey: "products",
    template: "products/product.html",
    outDir: "products",
    rootId: "productRoot",
    dataAttr: "data-code",
    slug: function (p) { return slugify(p.code); },
    dataAttrValue: function (p) { return p.code; },
    title: function (p) { return p.name + " — " + p.manufacturer + " — Lumen Method"; },
    description: function (p) { return p.tagline || p.summary || ""; },
    image: function (p) { return p.images && p.images[0] && p.images[0].file; },
    ogType: "product"
  },
  {
    name: "case-studies",
    dataFile: "data/case-studies.json",
    listKey: "caseStudies",
    template: "case-studies/case-study.html",
    outDir: "case-studies",
    rootId: "caseStudyRoot",
    dataAttr: "data-id",
    slug: function (cs) { return slugify(cs.id); },
    dataAttrValue: function (cs) { return cs.id; },
    title: function (cs) { return cs.title + " — Lumen Method"; },
    description: function (cs) { return (cs.story && cs.story[0]) || ""; },
    image: function (cs) { return cs.detailHero && cs.detailHero.image; },
    ogType: "article"
  },
  {
    name: "manufacturers",
    dataFile: "data/manufacturers.json",
    listKey: "manufacturers",
    template: "manufacturers/manufacturer.html",
    outDir: "manufacturers",
    rootId: "manufacturerRoot",
    dataAttr: "data-slug",
    slug: function (m) { return slugify(m.slug); },
    dataAttrValue: function (m) { return m.slug; },
    title: function (m) { return m.name + " — Lumen Method"; },
    description: function (m) { return m.bioShort || m.bio || ""; },
    image: function (m) { return m.logo; },
    ogType: "website"
  },
  {
    name: "presentations",
    dataFile: "data/presentations.json",
    listKey: "presentations",
    template: "presentations/presentation.html",
    outDir: "presentations",
    rootId: "presentationRoot",
    dataAttr: "data-id",
    slug: function (p) { return slugify(p.id); },
    dataAttrValue: function (p) { return p.id; },
    title: function (p) { return p.title + " — Lumen Method"; },
    description: function (p) {
      var bits = [];
      if (p.category) bits.push(p.category);
      if (p.note) bits.push(p.note);
      if (p.duration) bits.push(p.duration + " technical presentation, available on request");
      return bits.join(" — ") || "Technical presentation details, available on request.";
    },
    image: function () { return null; },
    ogType: "website"
  }
];

var STATIC_PAGES = [
  "index.html",
  "contact.html",
  "technical-information.html",
  "terms.html",
  "warranty.html",
  "case-studies/index.html"
];

function main() {
  var total = 0;
  TYPES.forEach(function (config) {
    var n = generateType(config);
    console.log("Generated " + n + " " + config.name + " page(s)");
    total += n;
  });

  STATIC_PAGES.forEach(function (p) { addSitemapUrl(p); });

  if (!SITE_IS_LIVE) {
    var noindexRe = /<meta name="description" content="[^"]*">/;
    STATIC_PAGES.forEach(function (relPath) {
      var abs = path.join(ROOT, relPath);
      var html = fs.readFileSync(abs, "utf8");
      if (html.indexOf('name="robots"') !== -1) return;
      html = html.replace(noindexRe, function (m) { return m + "\n" + '<meta name="robots" content="noindex, nofollow">'; });
      fs.writeFileSync(abs, html, "utf8");
    });
    console.log("Added noindex to " + STATIC_PAGES.length + " static page(s)");
  }

  var robots;
  if (SITE_IS_LIVE) {
    var sitemap =
      '<?xml version="1.0" encoding="UTF-8"?>\n' +
      '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
      sitemapUrls.map(function (u) { return "  <url><loc>" + esc(u) + "</loc></url>"; }).join("\n") + "\n" +
      "</urlset>\n";
    fs.writeFileSync(path.join(ROOT, "sitemap.xml"), sitemap, "utf8");
    robots = "User-agent: *\nAllow: /\nSitemap: " + BASE_URL + "/sitemap.xml\n";
    console.log("Generated sitemap.xml with " + sitemapUrls.length + " URLs");
  } else {
    // SITE_IS_LIVE is false: no sitemap, and robots.txt blocks all crawling —
    // the site is public by link but not ready to be indexed yet.
    robots = "User-agent: *\nDisallow: /\n";
    console.log("SITE_IS_LIVE is false — skipped sitemap.xml, robots.txt disallows all crawling");
  }
  fs.writeFileSync(path.join(ROOT, "robots.txt"), robots, "utf8");

  console.log("Total generated item pages: " + total);
}

main();
