# Touchline Coaching Studio — Release Notes

Release date: 21 November 2026

## Delivered

- **Tactics & Moves:** A dedicated half-pitch, touch/drag-friendly numbered markers using the selected club colours. Each saved move supports a custom name, description and up to 20 named A/B/C/... keyframes. Add, remove, reposition and play moves using smooth position interpolation.
- **Match rotation planning:** Per-fixture selection formats: starting XV (or age-group limit) and bench; two halves; three thirds; four quarters. Independent saved lineup/bench for each period; ability to copy preceding period. Planned minutes calculated from equal-duration periods, with review flags below half-game.
- **Training and match attendance:** No minute fields for training; optional match minute field retained. Dedicated overview with training/match/overall attendance percentages for the full team and individual player click-through. Percentages use recorded Yes/No only, with missing entries separately labelled.
- **Season statistics:** Players used in any saved period count once as selected for that fixture, not zero times and not multiple times.
- **PWA:** New assets included in offline shell cache v3.

## Quality checks

- Syntax: main inline script, tactics extension and service worker compiled in a JavaScript harness.
- Fixture rotations: quarters and halves save distinct lineups; navigating between periods restores selections.
- Statistics: players only selected in a later quarter are included once.
- Tactics: expected number of player markers, saved names, multiple steps, frame navigation and local persistence.
- Attendance: no training minutes field; test with 1 Yes, 1 No across two events produced 50% recorded attendance and 38 unrecorded player-event responses for a 20-player demonstration squad.
- Source files checked by reading back from GitHub after upload.

## Important limitations

- Tactical movement currently animates each player's position between keyframes; ball trajectories, passing and defence are not independently animated.
- Period minutes are a planning estimate, not a record of actual match substitutions or a guarantee of RFU half-game compliance.
- This is still a browser-local demonstration app. Data is **not** shared between parents/coaches or devices, and it must not be used to store real children's personal information until secured.
- No real-device iOS test or public deployed-URL verification was possible from this session; functional tests used an isolated DOM harness.
- Results feeds still need a separately hosted licensed API gateway.

## Where to find it

Open https://hfi2026.github.io/Touchline-Rugby/ after GitHub Pages deploys the latest commit. Installed app users may need to close and reopen once for the refreshed service worker to activate.
