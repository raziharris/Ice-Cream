# Booking calendar

Public site: https://43-156-11-241.sslip.io/Icecream/

Admin: https://43-156-11-241.sslip.io/Icecream/admin/

Customers select an available date and submit their name, phone, event, guest count and venue. Requests are pending until an administrator confirms them. Confirmation reserves the whole day. Pending requests do not reserve dates. The admin can block days or mark existing offline bookings, and confirm, decline or cancel requests. Contact customers directly; no automatic messages are sent.

Dates use Malaysia time. Future dates default to available, up to one year ahead. Availability and the admin inbox refresh every 30 seconds. Conflicting confirmations are rejected on the server.

## Operations

Node built-ins only. `npm.cmd start` serves localhost:3333. The server requires a server-only `auth.json` in DATA_DIR (default `.local`). It contains a random hex salt and a 64-byte scrypt password hash encoded as hex. Never commit credentials or customer records. Local credentials have already been provisioned.

Production uses systemd `aiscreme`, port 4198, app `/var/www/aiscreme-app`, persistent data `/var/lib/aiscreme` (separate from releases). `bookings.json` is atomically replaced after each mutation. Sessions expire after 12 hours and on server restart. Production cookies require HTTPS. Login is rate-limited; admin writes require a session and CSRF token.

Run `./deploy.ps1` from PowerShell. It checks sibling routes, saves the existing app and Nginx configuration under `/var/backups/aiscreme-calendar-*`, validates Nginx and rolls back failed releases. Persistent customer data is retained. Back up `/var/lib/aiscreme` separately before maintenance; it contains private customer details and the password hash. Do not publish those backups.

Tests: set TEST_ADMIN_PASSWORD in the process environment, then run `node test-booking.mjs`. Tests use a temporary isolated data directory and port 3344. They cover auth, CSRF, conflicts, validation, persistence and public data privacy.

Browser/iPhone visual verification remains outstanding because the browser automation host was unavailable during implementation.
