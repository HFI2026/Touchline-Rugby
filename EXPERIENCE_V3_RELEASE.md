# Touchline Experience V3 — Club Home & Full-screen Coaching Studio

Release: 21 November 2026

## Included in this release

- Premium club landing page, branded **Touchline**, with club crest, team identity, next event and ten large navigational tiles.
- Navigation repositioned as a sticky horizontal top menu on all app sections, including mobile.
- Full-screen editor based on a fixed immersive workspace; coaches can continue dragging players, editing the move name and notes, adding/removing steps, and controlling playback while expanded.
- Landscape/portrait pitch rotation with correct coordinate translation for markers, paths, mouse/touch dragging, and animated playback.
- Starting formation presets: open-play attacking shape, 1–3–3–1, 2–4–2, defensive line with backfield cover, attacking and defending scrums on left/centre/right, and attacking and defending line-outs on left/right.
- Rugby-union jersey roles applied to 15-player templates: 1–3 front row; 4–5 locks; 6–7 flanks; 8 behind the scrum; 9 receiver/scrum-half; 10–15 backs. Line-out diagrams place hooker 2 as thrower and 9 in receiver position.
- Team-colour numbered players, opposition markers and the ball all remain independently draggable and playable.
- Saved moves, fixture team selections, period rotations and attendance records are preserved in the existing browser-local data model.
- Offline service-worker cache updated to v7 to include new assets.

## Reference sources and interpretation

These are rugby coaching illustrations, **not** unique official prescribed field coordinates:
- World Rugby, players and positions: https://www.world.rugby/the-game/beginners-guide/positions
- World Rugby, law 18 line-out: https://passport.world.rugby/laws-of-the-game/laws-by-number/18-touch-quick-throw-and-lineout/
- World Rugby, line-out coaching: https://passport.world.rugby/injury-prevention-and-risk-management/rugby-ready/the-lineout/
- World Rugby, functional roles in set pieces: https://passport.world.rugby/coaching/functional-role-analysis/functional-roles-in-open-play/functional-roles-in-set-piece/
- Rugby Coach Weekly, 1–3–3–1 attacking framework: https://www.rugbycoachweekly.net/tactics/attack-tactics/the-1-3-3-1-attacking-framework
- Rugby Coach Weekly, typical 1–3–3–1 and 2–4–2 attacking shapes: https://www.rugbycoachweekly.net/rugby-coaching/leadership/game-plan-attack-priorities-to-blunt-defences

The preset positions are schematics. Coaching staff must adjust them for player abilities, opposition, field location, the laws in force, and age-group scrum and line-out limits. Forward pod jersey allocations and the precise defensive line are tactical choices, not mandatory rugby law.

## Quality checks

- JavaScript syntax and source linkage were verified by reading all files back from the GitHub repository.
- Isolated application harness: 10 home tiles, branded wordmark and tactics editor render.
- Full-screen open/close and body overlay state passed.
- Rotation updated the pitch coordinates and rotated display without altering saved movements.
- Representative scrum and line-out presets, 1–3–3–1 and 2–4–2 shape selection passed.
- Applying a preset to one step did not change the prior step.
- Fixture period selection remained independently saved for thirds.
- The attendance summary and app navigation continued working.
- Service-worker shell includes the stylesheet and JavaScript for this release.

## Remaining limits

- Real iPhone and desktop browser visual/touch regression testing was not available in this environment; checks used isolated JavaScript and simulated DOM interactions.
- The public GitHub Pages deployment could not be independently retrieved from the available web reader; GitHub source commits and files were verified.
- Full-screen is an in-app immersive overlay, which works around inconsistent iPhone support for the browser Fullscreen API. It does not force physical device orientation.
- The app is a local single-device demo: private child records, real shared parent votes, push reminders and live leagues require secure production backend deployment.
