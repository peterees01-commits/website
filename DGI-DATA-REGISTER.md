# DGI / Table 3.8 Data Register

Running log of data-quality questions and gaps surfaced while building the
AS/NZS 1158.3.1 Table 3.9 (DGI) / Table 3.8 (candela) glare-assessment
widgets across the product pages. Internal tracking only — not published
to the site. Add to this file as new issues come up; mark resolved items
rather than deleting them, so there's a record of what was checked.

Status key: 🔴 Open — needs manufacturer confirmation · 🟡 Pending — waiting
on a specific deliverable (e.g. photometry) · 🟢 Resolved.

## Open — need Holophane confirmation

### Wallpack (WAP) — `.FW` and `.HA`, level LA06
🔴 **Open.** The only photometry on file for this level (`WAP.1.LA063/064.*.50W.ies`,
tested 15 Jan 2020) measures 50W, consistently tagged 50W in both the
filename and the file's own internal nominal field — no internal
inconsistency. But the current WAP brochure (`HOL-BRO-WAP-UK-02/25`,
printed Feb 2025) lists this same lumen package (`WAP.LA064`, c.6,000 lm)
at **45W**. The brochure is five years newer than the photometry, so it's
more likely the real driver/wattage changed since 2020 than the reverse.
Flagged live on site with a caution badge on the two affected DGI cells
(`.FW` PR/PP <6m, `.HA` PA/PE/PC).
**Ask Holophane:** is WAP.LA06 currently shipped at 45W or 50W? If 45W,
request updated IES photometry at that wattage.

### Denver iD Wall (DWL) — level LA02
🔴 **Open.** The supplied IES files for this level are internally tagged
`W011` (11W nominal) but measure 10.3W actual (filename/measured
mismatch, flagged automatically in the audit). Separately, the current
DWL brochure (`HOL-BRO-DWL-UK-08/25`, printed Aug 2025) lists this lumen
package (`DWL.LA02X`, c.1,500 lm) at **12W** — again newer than the Nov
2020 photometry. This level isn't currently the *selected* (displayed)
wattage for any DGI category on the site, so no caution badge was needed
there, but the same wattage-vs-brochure question applies.
**Ask Holophane:** confirm current wattage for DWL.LA02 (12W per brochure
vs 10.3–11W per 2020 photometry) and whether updated IES is available.

### Factor (FTS) — `.FW` and `.SY` optics
🟡 **Pending.** FTS.4 (the body we actually sell) has only ever had `.AY`
and `.NR` screened — `.FW`/`.SY` have no photometry at all yet. `.AY`/`.NR`
confirmed final by the user (2026-11-23). Waiting on final photometry for
the other two optics.

### V-Max II (VMXII)
🟡 **Pending.** No DGI/Table 3.8 data at all — needs a full glare matrix
once photometry is finalised (same "waiting on final photometry" status
as Factor's remaining optics, per the user).

### S-Line (SLI) — `.5R` optic
🔴 **Open.** Not covered by any S-Line glare matrix supplied so far (no
IES file in our package either). Shows "IES file not available" in the
widget. Ask Holophane whether `.5R` photometry exists / is plannned.

### S-Line `.HE` spec — `.R2`, Glass cover
🔴 **Open.** `.R2`'s `.HE` variant has no Glass-lens IES file in our
package (No Glass only). Shows "IES file not available". Ask Holophane
if a Glass-lens `.R2.HE` file exists.

### PR/PP and LATM/RAB categories — missing Table 3.8 check on R-Line, S-Line, Factor `.AY`
🟡 **Pending — backfillable from data already on file.** Checked every PR6/PR10/LR6/LR10
cell sitewide for whether it carries a recorded Table 3.8 `candela` check alongside its
Table 3.9 DGI limit (confirming the methodology note that these categories' pass/fail
combines both tables). Confirmed present for every such cell on DPL, DSX, DWL, WAP, PEB
and SIG. Three exceptions, all predating the Table 3.8 feature and never backfilled:
- **R-Line (RLI)** — 88 cells (every optic/variant's PR6/PR10/LR6/LR10) have a DGI limit
  but no candela check. RLI's own PA cells *do* have candela, so this is specific to the
  road/pathway categories.
- **S-Line (SLI)** — 72 cells, same pattern.
- **Factor (FTS)** `.AY` optic only — 4 cells (`.NR` is unaffected).
Confirmed the underlying Table 3.8 intensity values (i80/i90 vs limit80/limit90) for these
exact products/levels already exist in `Audit_Data/R-Line_file_audit.csv` etc. from the
23 Nov 2026 reviewed dataset — this is a transcription backfill, not something that needs
new manufacturer photometry.

## Resolved

### Denver iD (DPL) — "External shield (.BLS1)"
🟢 **Resolved 2026-11-23.** `.BLS1` is a confirmed real, orderable
accessory, but there are zero `.BLS1`/`EBLS` IES files anywhere in our
own DPL photometry package — the figures an external audit dataset had
produced for it came from a separate archive we don't host. Rule applied
going forward: **the DGI/Table 3.8 widget only reflects photometry we
actually have on file**; an accessory without photometry on file stays
an accessory listing, not a widget option. Removed from the widget;
`DPL.BLS1` remains listed as an accessory on the page.

### Denver iD (DPL) — `.SYBL` (Symmetric + internal backlight shield)
🟢 **Resolved 2026-11-23.** Briefly removed on a mistaken belief it
wasn't in our IES package (a grep that missed it); re-checked and
confirmed 44 real `.SYBL` files exist in `DPL-IES-files.zip`, same as
`.FWBL`/`.HNBL`. Restored.

### DSX — "EGS shield" config
🟢 **Resolved 2026-11-23.** Not in DSX's own brochure or installation
guide, which raised the same "is this real" question as `.SYBL`. User
confirmed EGS IES files are genuinely in the DSX photometry pack — kept
in the widget.

### Signature — mount/shield configs (VB1/SE × BLS/no-BLS)
🟢 **Resolved 2026-11-23.** All 4 configs confirmed against the brochure's
own ordering codes (`.VB1`, `.SE`) and `SIG.BLS` accessory, and all 12
optic/config combinations backed by real files in `SIG-IES-files.zip`.

### Area basis / methodology
🟢 **Settled as a standing rule** (user, 2026-11-23 and earlier): the
provisional IES-declared luminous-opening area is an acceptable basis for
DGI calculations sitewide — "as long as based on the luminous opening of
the IES file I am happy as a rule." No need to re-ask this per product
going forward.
