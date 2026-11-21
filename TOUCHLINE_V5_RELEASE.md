# Touchline V5 — Club Home, Team Sheet and Match Clock

Release: 21 November 2026

## Premium overview redesign
- New editorial club welcome with prominent club crest and custom SVG graphic assets; no image-search dependencies.
- Twelve large, responsive navigation cards: Team selection, Move studio, Match stopwatch, Match centre, Fixtures & diary, Attendance, Player awards, Player squad, RFU rules, Leagues & results, Season insights, Club settings.
- Removed card numbering and “/ TOUCHLINE” metadata. Names and descriptions are plain, functional and accessible.
- Desktop/tablet: 3-column launchpad with prominent first three cards. On narrow iPhones: two columns, with major functions spanning the full width.
- One click opens each respective Touchline screen.
- Current date and time are shown in the club welcome banner in UK local time and update while the app is open.
- The Touchline wordmark retains its fixed deep-green/gold identity even when club colours change. Club-specific themes still apply elsewhere.
- Badge occupies a more prominent hero location. Displays a user-uploaded crest with object-fit contain rather than cropping.

## Team sheet
- Team selection pitch is constrained to its card, preventing its 690px internal canvas from expanding the parent grid or stretching the app viewport.
- A separate **Expand team sheet** action opens a full-viewport editor overlay. The pitch can be scrolled without shifting the parent page, with the squad/bench still accessible.
- The expanded view can be closed using its button or Escape (where supported), retaining the current lineup.

## Match stopwatch
- Dedicated page with oversized clock, start/pause, reset, mark moment, target period length, countdown toggle and 1–4 selectable periods.
- Can attach stopwatch data to individual fixtures; match clock data saved in current-browser local storage.
- Uses system timestamps to calculate elapsed time through navigation or screen locking, rather than assuming an interval continuously executes.
- Referee remains official timekeeper; the watch is for parent/coach reference.
- The clock does not currently change match scoring state or substitution records automatically.

## QA performed
- All main JavaScript and enhancement modules passed a syntax check.
- GitHub files read back after commit; Home V5 JS/CSS and stopwatch V5 JS/CSS are linked in index.html.
- Isolated DOM harness: 12 home buttons, 12 corresponding vector icons, all page routes, no numbered header labels, welcome section, club crest and Touchline branding.
- Isolated DOM harness: stopwatch elapsed time, page switching, selection pitch, expanding and closing the editor, and rules page.
- Cache updated to touchline-shell-v11, including the home and stopwatch assets.

## Remaining checks
- Physical iPhone Safari and iOS Home Screen acceptance testing is still required, particularly the large crest, popup editing gestures and stopwatch when backgrounded.
- Live GitHub Pages response could not be independently fetched from the current external inspection environment, though source commits were verified via the connected GitHub account.
- Private player data is not protected by accounts yet. Use demonstration records only pending a secure multi-user backend.
