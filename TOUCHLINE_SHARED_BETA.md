# Touchline Live Beta — provisioned 21 November 2026

## Current verified status

- **Created** dedicated London project `touchline-rugby-beta` in HFI2026's Org (free project, quoted $0/month).
- **Installed** four isolated Touchline tables, checked workspace/member RLS, database grants and private invitation RPCs.
- **Enabled** Realtime publication on `touchline_updates`, a protected version-only signal that avoids broadcasting children's information.
- **Connected** GitHub Pages JavaScript to the actual Supabase API URL with a **publishable** browser key, never a service-role credential.
- **Verified on the database itself**, using temporary transaction data that was rolled back: owner/editor writes, version conflict checks, one-use invitations, viewer read-only restriction, uninvited-user denial, maximum four users, version update trigger and metadata-only notifications.
- **Verified** GitHub Pages successful deployment history. A current later publish was still being processed at last check.
- **NOT YET VERIFIED**: four real-device sign-ins / WebSocket subscriptions and in-browser interactive end-to-end behaviour.

## Two dashboard settings required before outside testers can sign in

1. **Authentication → URL Configuration**:
   https://supabase.com/dashboard/project/jwwqkrrvcwtunumoqzmq/auth/url-configuration
   Set Site URL to `https://hfi2026.github.io/Touchline-Rugby/`.
   Add `https://hfi2026.github.io/Touchline-Rugby/**` as an allowed Redirect URL.
2. **Authentication → SMTP settings**:
   https://supabase.com/dashboard/project/jwwqkrrvcwtunumoqzmq/auth/smtp
   Connect an authenticated SMTP provider and verify its sending address/domain. Supabase's default sender can only send to organisation-authorised addresses and currently allows only two messages per hour. It cannot support four external testers.

Do not turn off email verification to work around SMTP. Do not grant testers Supabase organisation membership to make them eligible for the default email sender.

## After configuring those two settings

Open https://hfi2026.github.io/Touchline-Rugby/ in Safari, sign in via email magic link, select **Team access → Create shared team**, and distribute three **one-use** coach invitations to the other testers. Each tester opens their link, signs in on the same browser, and joins. Select “editor” for coaches; “viewer” for a spectator. Wait for the status **Live · All changes saved** before relying on cross-device changes.

The first imported workspace takes its squad/fixtures from the creator's current device. Use anonymised players only for this beta. The database starts empty intentionally; it does not silently copy demo or old personal data until the owner explicitly creates the shared workspace.

---

# Touchline shared beta — 3–4 testers, live updates

## Current deployment status

The **frontend integration and database schema are committed**. The hosted beta is **not live yet** until a dedicated Supabase project is created, the SQL is executed, the public project URL/key are added, and the test accounts are verified on real devices.

Current GitHub Pages frontend: https://hfi2026.github.io/Touchline-Rugby/

## Architecture

- Static GitHub Pages PWA remains the frontend.
- Dedicated Supabase PostgreSQL stores the private rugby workspace document.
- Supabase Auth uses email sign-in links; the public site has **no service-role or secret key**.
- Database RLS allows authenticated workspace members to read only their joined workspace.
- Only owner/editor accounts can save changes. Viewer accounts may read and navigate.
- One workspace is limited to **4 accounts** total (owner plus three invited testers).
- Owner sends one-use, expiring invite codes to other testers.
- Optimistic document revisions and a three-way merge support concurrent editing of independent records.
- Changes to the *same* field prompt a conflict and an unsynced-data backup option rather than silently overwriting.
- A lightweight protected `touchline_updates` table publishes a version signal; clients retrieve the full workspace row via RLS. This avoids pushing children's full data into the notification payload.
- Fallback refresh on app focus, returning online, visibility and roughly every 22 seconds. The UI distinguishes **Live**, **Checking**, **Syncing**, **Offline** and **Conflict** states.
- Device-specific pages, current match, current period and selected animation step do not override each other's navigation.

## Database setup (after choosing a Supabase organisation)

1. Provision **a new dedicated project**, separate from the unrelated Project Forge preview.
2. Run the checked-in file `touchline_supabase_setup.sql` as project owner.
3. Verify RLS is enabled on all four Touchline tables and functions are authorised.
4. Turn on Auth email sign-in. In Authentication → URL Configuration, set:
   - Site URL: `https://hfi2026.github.io/Touchline-Rugby/`
   - Additional redirect: `https://hfi2026.github.io/Touchline-Rugby/**` (if needed by redirect matching)
5. In the public `touchline-cloud-config.js`, set `enabled: true`, `projectUrl` to the project's API URL and `publishableKey` to the project's **publishable** browser key. Never enter a service-role key, secret or database password.
6. Test sign-in with an owner email, create the team, issue three separate tester invitations and sign in on separate phones.
7. Validate that a non-member cannot read workspace data, a viewer cannot edit, and the fifth account is denied.

## Tomorrow's acceptance test (minimum)

Use two separate devices simultaneously, plus one or two additional testers:
- Coach A selects a player at #8; Coach B sees it in the same fixture without manually refreshing.
- Coach B adds a scoring event; Coach A sees the scorer, points and timestamp.
- Coach A records attendance; Coach B sees the updated value.
- Two testers modify different player/fixture records concurrently; both changes are retained.
- Two testers edit the same field concurrently; a visible conflict is shown, and neither change silently replaces the other.
- Switch app screens, lock the device, reopen and verify latest data is loaded.
- Temporarily cut connectivity and verify the app displays Offline and prevents normal editing until reconnected.
- Log out and verify shared team information is gated behind sign-in.

## Data handling and cautions

- Use **first names only** for youth player testing, and share access only with authorised adults.
- Whole-team data is visible to all beta members; this is **not yet** a parent-by-child privacy model.
- The existing parent vote UI does not yet bind a vote securely to the parent's authenticated identity, so do not use it as a final official vote.
- The private workspace is shared through the database, but cloud edits **are not guaranteed to survive closing the app while offline**. Wait for the green **Live · All changes saved** indication before leaving a page.
- A small number of testers can meaningfully validate live editing, but complete live production security, penetration and real-device regression testing is still outstanding.
- Local-only demo data is not uploaded until an authorised owner explicitly creates a shared team from their current device.
- The ability to invite testers, not just a public URL, is required; never publish invitation codes or actual youth data in GitHub.

## Current blocker

A Supabase connector is linked, but the only existing Supabase project is a **paused Project Forge preview**. A dedicated Touchline project needs a **user-selected organisation** before creating it. The organisation available is `HFI2026's Org` (Free), and Supabase returned a current project quote of **$0/month** for that organisation. Deployment must not be described as live before this setup and cross-device testing is completed.
