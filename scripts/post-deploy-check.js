#!/usr/bin/env node
/*
 * Hits every URL scripts/generate-seo-pages.js expects to exist (written
 * to link-check-manifest.json in the same CI run) against the actual
 * live, deployed site, and fails the build if any of them are still
 * broken after allowing time for CDN edge-cache propagation.
 *
 * Why a separate pass from the build-time link validation: that one
 * checks the files that got built are internally consistent with each
 * other. It can't see what GitHub Pages' CDN is actually serving right
 * now — a deploy can be 100% correct and still 404 for several minutes
 * on some edges while the new content propagates. This step is what
 * catches that, and tells you precisely which URL(s) are still broken
 * rather than leaving it as "re-run the deploy and see".
 *
 * This is detection, not remediation: a failure here does NOT roll back
 * or retry the deployment itself — the affected page(s) stay however
 * they are (likely still 404) until Fastly's cache clears on its own or
 * someone re-deploys, same as before this script existed. What changes
 * is that it's no longer silent: the job goes red with the exact URLs
 * and status codes, instead of a visitor finding a dead link first.
 *
 * Usage: node scripts/post-deploy-check.js [manifest-path]
 * Env:   DEPLOY_URL - override the manifest's own baseUrl, e.g. with
 *        ${{ steps.deployment.outputs.page_url }} from the workflow, in
 *        case it ever differs (trailing slash, etc).
 */

"use strict";

const fs = require("fs");
const path = require("path");

const manifestPath = path.resolve(process.argv[2] || "link-check-manifest.json");
if (!fs.existsSync(manifestPath)) {
  console.error("No manifest at " + manifestPath + " — run scripts/generate-seo-pages.js first.");
  process.exit(1);
}
const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));

var baseUrl = (process.env.DEPLOY_URL || manifest.baseUrl || "").replace(/\/+$/, "");
var manifestBase = String(manifest.baseUrl || "").replace(/\/+$/, "");
var urls = manifest.urls.map(function (u) {
  return baseUrl && manifestBase && baseUrl !== manifestBase ? baseUrl + u.slice(manifestBase.length) : u;
});

// Allows for CDN edge propagation: an immediate pass, then more passes
// over only the URLs still failing, with growing delays between them.
// The delays are sized against an observed real case (2026-11-25), not
// a guess: a path 404'd persistently for 8+ minutes straight after a
// successful deploy, consistent with the site's own `cache-control:
// max-age=600` — a negatively-cached 404 on a given Fastly edge can
// take up to roughly that long to clear on its own (Fastly's exact
// caching behaviour here isn't conclusively confirmed, so 15 minutes
// is a deliberate margin above both the observed outage and the
// max-age, not a tight fit to either). A fresh deploy's own purge is
// what normally clears it immediately; this step exists for the window
// before anyone notices and re-deploys. Total worst-case extra wait:
// 30+60+90+120+180+180+180+60 = 900s (15 min), on top of request time —
// paid only when something is actually still stale; a healthy deploy
// passes on round 1 with no added time.
const RETRY_DELAYS_MS = [30000, 60000, 90000, 120000, 180000, 180000, 180000, 60000];
const REQUEST_TIMEOUT_MS = 15000;

function checkOne(url) {
  var controller = new AbortController();
  var timer = setTimeout(function () { controller.abort(); }, REQUEST_TIMEOUT_MS);
  return fetch(url, { method: "GET", redirect: "follow", signal: controller.signal })
    .then(function (res) {
      return { url: url, ok: res.status >= 200 && res.status < 300, status: res.status };
    })
    .catch(function (err) {
      return { url: url, ok: false, status: null, error: err && err.message ? err.message : String(err) };
    })
    .finally(function () { clearTimeout(timer); });
}

function checkAll(urlList) {
  return Promise.all(urlList.map(checkOne));
}

function sleep(ms) {
  return new Promise(function (resolve) { setTimeout(resolve, ms); });
}

function formatResult(r) {
  return (r.status != null ? r.status : "ERR") + "  " + r.url + (r.error ? "  (" + r.error + ")" : "");
}

async function main() {
  var start = Date.now();
  console.log("Post-deploy check: " + urls.length + " URL(s) against " + (baseUrl || "(no base URL)"));

  var pending = urls.slice();
  var lastResultByUrl = {};
  var round = 0;

  while (pending.length) {
    if (round > 0) {
      var delay = RETRY_DELAYS_MS[Math.min(round - 1, RETRY_DELAYS_MS.length - 1)];
      if (round > RETRY_DELAYS_MS.length) break; // out of retries
      console.log("Waiting " + (delay / 1000) + "s for CDN propagation before retrying " + pending.length + " URL(s)...");
      await sleep(delay);
    }
    round++;
    var results = await checkAll(pending);
    results.forEach(function (r) { lastResultByUrl[r.url] = r; });
    var failing = results.filter(function (r) { return !r.ok; });
    console.log("Round " + round + ": " + (results.length - failing.length) + "/" + results.length + " OK" + (failing.length ? ", " + failing.length + " failing" : ""));
    pending = failing.map(function (r) { return r.url; });
    if (!pending.length) break;
  }

  var elapsed = Math.round((Date.now() - start) / 1000);
  var persistent = Object.keys(lastResultByUrl)
    .map(function (u) { return lastResultByUrl[u]; })
    .filter(function (r) { return !r.ok; });

  if (persistent.length) {
    console.error("\nPERSISTENT FAILURES after " + round + " round(s) / " + elapsed + "s (not a transient propagation delay):");
    persistent.forEach(function (r) { console.error("  " + formatResult(r)); });
    console.error("\n" + persistent.length + " of " + urls.length + " URL(s) still broken.");
    process.exit(1);
  }

  console.log("\nAll " + urls.length + " URL(s) OK after " + round + " round(s) / " + elapsed + "s.");
}

main();
