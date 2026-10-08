# Go-Live Checklist

The site is currently a **demo**. The items below are deliberate shortcuts that make
the demo work. Each one must be replaced before real users, real money or real
personal data are involved. Findings come from a code review (no live testing).

## 1. Authentication (backend/routes/auth.js)
- [ ] Remove the passwordless `role` shortcut in `POST /login` (returns admin / investigator / claimant tokens).
- [ ] Remove the `123456` bypass in `/verify-2fa` and `/reset-password`.
- [ ] Stop returning `sampleTestOtp` in `/register` and `/forgot-password`; send codes by email/SMS only.
- [ ] Generate codes with `crypto.randomInt`, limit attempts, and expire them after use.
- [ ] Make register / forgot-password responses identical for existing and unknown emails.
- [ ] Add rate limiting (login, OTP, reset) and a stronger password policy.
- [ ] Require `JWT_SECRET` at startup (no hardcoded fallback; the 3 fallback strings differ today).
- [ ] Remove the demo-session fallback in `frontend/src/context/AuthContext.jsx` (fake sessions when the API is down).
- [ ] Consider httpOnly cookies instead of `localStorage` tokens, and shorter token lifetime.

## 2. Authorization (backend/routes/cases.js, evidence.js)
Add `authMiddleware` plus a role check (`admin` / `investigator`) or an ownership check to:
- [ ] `GET /api/cases` (currently returns every claimant's data to anonymous callers) and `GET /api/cases/admin/all`
- [ ] `PATCH /:caseNumber/details`, `/milestones`, `/withdrawal-permission`, `/affidavit-status`
- [ ] `POST /:caseNumber/settle`, `/affidavit`, `/ack-settlement`
- [ ] `GET/POST /:caseNumber/messages` (derive `sender` from the user's role, not the request body)
- [ ] All `/api/evidence/*` routes
- [ ] `POST /api/cases`: take the owner from the token only; ignore `userId` / `claimantEmail` in the body and drop the demo-user fallback.
- [ ] Send the `Authorization` header from every frontend call that hits these routes (some do not today).

## 3. Evidence uploads
- [ ] Serve files only through the authenticated download route; remove the public `/uploads` static mount.
- [ ] Allow-list file types (pdf, png, jpg, ...), validate magic bytes, and lower the 50 MB limit.
- [ ] Never serve user uploads from the app's own origin with an inline content type.

## 4. Money flow
- [ ] Wrap withdrawals / settlements in database transactions (read-modify-write races allow double payout).
- [ ] Keep an immutable ledger instead of overwriting `settledAmount` when a withdrawal happens.
- [ ] Decide the real fee model with legal review before any live payment. Do not collect fees by wire or crypto outside a regulated processor.

## 5. Claims, content and data
- [ ] Replace placeholder compliance claims (SOC 2, CFPB, FinCEN, eIDAS, "Insured", "Regulated Clearinghouse") with true, documented statements, or remove them.
- [ ] Replace the sample testimonials and invented case numbers with real, consented ones, or label them as examples.
- [ ] Remove seeded accounts and `Password123!` (backend/config/db.js, backend/seed.js, .env.example `ADMIN_PASSWORD`).
- [ ] Remove default fake names/amounts ("David Vance", `$4,850` checkout default) and the cached-data fallbacks in the dashboard.
- [ ] Delete the legacy `server/` folder if it is no longer used.

## 6. Hardening
- [ ] Add `helmet`, restrict CORS to the real site origin, add request body size limits.
- [ ] HTML-escape every value inserted into the printable documents (DashboardPage.jsx and StartCasePage.jsx use `document.write` / template strings).
- [ ] Add input validation (e.g. `zod`) on every route, and audit logging for admin actions.

## 7. UX / accessibility
- [x] Pinch-zoom re-enabled (viewport no longer blocks zoom).
- [ ] Add a real 404 page (hash routing currently shows Home for unknown paths).
- [ ] Show a clear error state when the API fails instead of silently showing cached or demo data.
- [ ] Audit keyboard focus order, form error messages and screen-reader labels.
