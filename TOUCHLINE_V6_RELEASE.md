# Touchline V6 — Design, Club Badge and Team Image Release

Release: 21 November 2026

## Club overview and primary navigation

- Large club crest with prominent outlined frame, replacing the tiny badge presentation.
- Club crest crop editor in Settings: choose an uploaded PNG/JPEG/WebP file, automatically trim white/transparent margins, drag to reframe, zoom, and apply.
- Cropped badge is saved locally as a compact image in Touchline's existing browser data. No new server receives the badge.
- Top-navigation selected tabs now have centred labels, even padding and **no drop shadow or active underline**.
- The overview's 12 main section buttons have larger vector icons, larger text and centrally aligned compositions rather than asymmetric cards.
- Touchline's own deep green/gold wordmark remains unchanged by the club colour settings; club colours still apply to team-specific UI.

## Responsive team selection

- Team pitch now fits the available selection-card width with no fixed 690px page-widening minimum in normal view.
- Updated default pitch layout gives a compact vertical formation with balanced spacing for every age-grade position.
- Expand team sheet remains available for larger editing. Zoom buttons in the expanded view let the coach enlarge the pitch up to 240% and zoom out without stretching the rest of the app.
- The selected match period's lineup and bench remain editable; the rules for U12/U13 position numbering remain intact.
- Updated on-screen instructions reflect fit-to-panel and expand rather than asking users to scroll horizontally.

## Save team as a PNG

New controls on the Team Selection screen:

1. **Numbers, positions and names** (default)
2. **Numbers and names**
3. **Numbers and positions**
4. **Numbers only**

- Generates a designed, portrait-format 1440 × 1920 pixel PNG with coloured heading, rugby pitch, number markers, club/team identity, match/date and substitutes.
- The saved image includes the selected match half, third or quarter when match rotations are enabled, with a matching suffix in its filename.
- Preview opens without taking a screenshot of the surrounding app.
- Save PNG to the device, or use the OS Share action when available. For iPhone photos, users can also open the preview and use the image's save/share controls.
- No external image-rendering service is involved.

## Quality assurance

- GitHub source syntax checks passed for the new module and existing integrated JavaScript.
- Full app isolated harness passed: 12 overview cards, U13 positions 1–5 and 8–15, team-sheet pitch, icon assets, team PNG creation and crop-save persistence.
- Badge crop mock test confirmed the crop tool generates a local data URL, updates the Settings badge field and saves browser state.
- Selection and export buttons exist in the new module; existing stopwatch and rules routing remain intact.
- Home Screen service-worker cache advanced to `touchline-shell-v12` with V6 JS/CSS assets.

## Limitations / remaining acceptance tests

- Actual Safari/iPhone testing of crop gestures, accessibility and photo-saving UX is still required.
- The public GitHub Pages URL could not be retrieved by the website reader, but the GitHub source and commits have been verified.
- A remotely hosted badge may block canvas cropping or image inclusion owing to its CORS policy; upload the image file to use the crop tool.
- Team-sheet PNG exports rely on native browser canvas and share/download functionality. Photos saving behaviour can differ between Safari and an installed PWA.
- Touchline remains a browser-local prototype without secure multi-user accounts. Don't store real children's personal details until the backend security work is complete.
