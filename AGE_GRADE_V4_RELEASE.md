# Touchline V4 — Age-grade rugby, team selection and club themes

Release date: 21 November 2026

## Delivered

- All app accent and club-theme elements now use the primary/accent colours configured in **Club settings**, with instant preview when the picker changes, high-contrast labels and persistence on this device.
- Simplified club overview hero: displays the club and team name but no longer repeats the selected age group or number of on-pitch players.
- New **RFU Rules** screen in the top bar and the 11-tile overview. The rules screen offers a one-click key-rules / detailed-guide switch, age picker (U7–U18, Senior), summary facts and official links.
- Rugby selection layout replaced by a portrait rugby pitch with numbered, labelled positions and allocated player names; draggable/clickable squad and bench.
- Age-grade player IDs: U12 uses positions 1, 2, 3, 4, 5, 9, 10, 11, 12, 13, 14, 15; U13 uses 1, 2, 3, 4, 5, 8, 9, 10, 11, 12, 13, 14, 15. For younger mini-rugby formats, generic player numbers are used rather than invented senior specialisms.
- Age-grade selection mapping is used in exported team sheets and the animation designer; no phantom flankers appear in U13's 13-player scene.
- Animation starts with age-appropriate non-overlapping attacking and defensive markers; scrum and open-play templates also use the actual age-grade positions. Formed line-outs are disabled for formats that do not use them.
- Marker dragging on the animator prevents placing one player directly over another. Ball positioning remains independent.
- Safe lineup migration: an old U13 lineup's positions 6 and 7 are not silently reallocated to new positions. Players in removed slots move to the bench for coach review, with saved lineups and match-period rotations preserved.
- PWA service-worker cache v9 includes all updated resources and prefers fresh scripts/styles online, with cached offline fallback.

## Age-grade data provenance

Main source is **RFU Regulation 15, 2026/27 age-grade appendices**, including:

- [RFU Rules of Play for each age group](https://help.rfu.com/support/solutions/articles/103000094877-what-are-the-rules-of-play-for-my-childs-age-group-)
- [RFU Regulation 15](https://www.englandrugby.com/run/rules-governance/rfu-rules-and-regulations/regulation-15-age-grade-rugby)
- [RFU U13 Rules (Appendix 7)](https://www.englandrugby.com/run/rules-governance/rfu-rules-and-regulations/regulation-15-age-grade-rugby/regulation-15-appendix-7-u13-rules-of-play)
- [2026/27 U12 referee rules summary](https://rugbyreferee.net/wp-content/uploads/2026/09/2026-27-u12s-RRNet-RFU-Regulations.pdf)
- [2026/27 U13 referee rules summary](https://rugbyreferee.net/wp-content/uploads/2026/09/2026-27-u13s-RRNet-RFU-Regulations.pdf)

The app's rules content is **original editorial summaries**, not a reproduction of the full legal text. The detailed view provides coaching guidance and links to the full official regulations. These default position and rules templates principally reflect the RFU **boys' 2026/27 age-grade pathway**. Girls' age banding and format regulations, other rugby unions, rugby league and competition-specific variations require their own verified templates.

## Completed checks

- All app/module JavaScript parsed successfully, and GitHub sources were read back.
- Integration harness: 13 valid U13 pitch positions, no 6/7, Number Eight and fly-half labels, RFU key/detail switch, animator showing 13 players per side plus ball, 13-person age-grade scrum model, live primary/accent theme updates, reduced U12 roster, match selection preserved, 11 home tiles.
- A modelled U13-to-U12 format change moved the no-longer-applicable number-eight selection to the bench while preserving the scrum-half.
- Legacy U13 data migration recovered all five previously selected test players and safely moved #6/#7 to the bench in both match halves.
- Computed coordinate checks across U7, U10, U11, U12, U13 and U14 found no overlaps among their initial animation markers or portrait-pitch selection cards.
- PWA service worker includes every new V4 script and stylesheet.

## Outstanding acceptance testing / limitations

- Actual Safari/iPhone scrolling, pointer gestures, text sizing, portrait rotation and fullscreen use must be checked on a physical device; the development environment cannot run that device directly.
- The published GitHub Pages site could not be independently accessed from the current web reader, but all source files and commit updates are verified.
- Current age-grade rules guide is not a substitute for the official full text; especially check girls' age bands and local competition rules.
- Marker collision logic applies to initial positions, preset formations and editing; movement paths crossing **during playback** do not yet use physics or automatic trajectory avoidance.
- This is still a browser-local preview. Do not enter private children's data until secure user accounts and a private backend are deployed.
