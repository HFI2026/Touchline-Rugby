# Motion Studio V2 — Rugby tactics animation

Reference: the user-uploaded 15-second screen recording supplied on 21 November 2026. The recording shows two numbered sides moving simultaneously over a horizontal rugby pitch.

## Implemented

- Full-width, horizontal pitch with rugby markings, team-colour attackers, contrasting opposition markers and a movable ball.
- Touch and mouse dragging for both sets of player markers and the ball.
- Named, described moves with up to 24 keyframed steps (A, B, C...).
- Adding a step copies the preceding formation so only the moved players need repositioning.
- Interpolated, simultaneous player and ball movement between keyframes.
- Playback, pause, restart, step selection, scrubbing, 0.5×/1×/1.5×/2× speed and looping.
- Optional travel guides and expanded pitch mode where supported.
- Create, duplicate, select and delete saved plays using existing local device storage.
- Supports configured on-field age-group player counts instead of always displaying 15 per side.
- PWA offline cache includes new JavaScript and stylesheet, version v4.

## Verified

- Source loads from HFI2026/Touchline-Rugby; JavaScript syntax compiled.
- Isolated DOM harness: pitch rendering, both sides, ball, saved steps, editing a move name, duplication, frame changes, restart, move switching and persistence passed.
- Existing repository files verified; service-worker cache manifest updated.
- Uploaded example visually reviewed via contact sheet of the 15.13-second video.
- No real iPhone touch-drag acceptance test was completed from the available tool environment.
- Public GitHub Pages response could not be independently inspected by the web reader.

## Limitations and next upgrades

- Paths move linearly between user-arranged steps. Curved runs, pass arcs, possession changes and collision avoidance are not yet modelled.
- Exporting an MP4/GIF and collaborative editing are not yet available.
- Coaching moves remain local to the user's device unless exported using the app's JSON backup.
- Existing youth-team privacy warning still applies. No protected authentication or shared server database is present.
