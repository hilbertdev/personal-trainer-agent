# Mobile OTP sign-in troubleshooting

## Symptom

The login screen shows **"Unable to send sign-in code. Try again."** after entering an email (for example `hilbertmuna@gmail.com`).

The mobile app treats any failed HTTP request as this generic message (`src/mobile/app/(auth)/login.tsx`).

## What we verified

The SaaS API and OTP pipeline work when called directly:

```bash
curl -X POST http://localhost:5075/api/auth/request-otp \
  -H "Content-Type: application/json" \
  -d '{"email":"hilbertmuna@gmail.com"}'
```

Expected response: **HTTP 202** with `{"message":"If the email is valid, an OTP has been sent."}`

OTP emails are captured by **smtp4dev** (not delivered to real Gmail in local dev). Open http://localhost:5050 to read the code.

## Issue 1 — CORS blocks Expo web (most common)

### Cause

When you open the app in the **browser** via Expo, the UI runs on Metro (for example `http://localhost:8081` or `http://172.20.10.5:8081`) but the API client was calling `http://localhost:5075` directly. That is a **cross-origin** request and the browser enforces CORS.

Common failure modes:

1. **Origin not allowlisted** — LAN URLs such as `http://172.20.10.5:8081` were not in `Cors:AllowedOrigins`.
2. **Custom headers on preflight** — The axios interceptor attached `Authorization` / `X-Organization-Id` to every request, including OTP login. The API did not return `Access-Control-Allow-Headers` for those headers, so the browser blocked the preflight even when the origin was allowed.

You can confirm a LAN-origin failure with:

```bash
curl -i -X OPTIONS http://localhost:5075/api/auth/request-otp \
  -H "Origin: http://172.20.10.5:8081" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: content-type,x-organization-id"
```

Before the fix, the response had **no** `Access-Control-Allow-Origin` header.

### Fix

**Backend (`PersonalTrainer.Api`):**

- `AllowAnyHeader()` on the CORS policy.
- `Cors:AllowLocalDevOrigins=true` in `docker-compose.saas.yml` (allows `localhost`, `127.0.0.1`, and private LAN IPs for local Docker).
- Explicit allowlist still includes `http://localhost:8081` and `http://127.0.0.1:8081`.

**Mobile web (recommended for browser dev):**

- Leave `EXPO_PUBLIC_API_URL` **empty** in `src/mobile/.env`.
- Metro proxies `/api/*` → `http://localhost:5075` (`src/mobile/metro.config.js`), same pattern as the Vite frontend. Browser requests stay same-origin — **no CORS**.

**Mobile client:**

- Auth endpoints (`/api/auth/request-otp`, `/api/auth/verify-otp`) no longer attach JWT/org headers, avoiding unnecessary CORS preflights.

Restart after changes:

```bash
docker compose -f docker-compose.saas.yml up -d --build api
cd src/mobile && npm install && npm start
```

## Issue 2 — OTP does not arrive in your real Gmail inbox (local dev)

### Cause

Local Docker uses **smtp4dev** as the SMTP server (`Smtp__Host: smtp4dev` in `docker-compose.saas.yml`). It **captures** outbound mail for development; it does **not** relay to Gmail, Outlook, etc.

The API still succeeds (202), but the code appears only in the smtp4dev UI.

### What to do locally

1. Request a code in the app (or via `curl` above).
2. Open **http://localhost:5050**.
3. Open the message **"Your Personal Trainer sign-in code"** for your email address.
4. Enter the 6-digit code on the verify screen.

To deliver to a real inbox, configure a production email provider (for example Resend with a verified domain) and run without the smtp4dev SMTP override.

## Issue 3 — Physical device / Expo Go uses wrong API URL

### Cause

`EXPO_PUBLIC_API_URL=http://localhost:5075` points to the **phone itself**, not your Mac, when using Expo Go on a physical device.

### Fix

Use your machine’s LAN IP (same network as the phone):

```bash
ipconfig getifaddr en0   # macOS Wi‑Fi example → e.g. 172.20.10.5
```

In `src/mobile/.env`:

```bash
EXPO_PUBLIC_API_URL=http://172.20.10.5:5075
```

Restart Expo (`npm start`). CORS does not apply to native Expo Go requests; connectivity and firewall matter instead.

## Quick checklist

| Check | Command / action |
|-------|------------------|
| API healthy | `curl http://localhost:5075/health` |
| OTP endpoint | `curl -X POST http://localhost:5075/api/auth/request-otp -H "Content-Type: application/json" -d '{"email":"you@example.com"}'` |
| Read OTP locally | http://localhost:5050 |
| Expo web CORS | Origin `http://localhost:8081` allowed in API CORS |
| Phone on LAN | `EXPO_PUBLIC_API_URL=http://<lan-ip>:5075` |

## Related docs

- [Mobile auth storage (SecureStore + web fallback)](mobile-auth-storage.md)
- [Mobile README](../src/mobile/README.md)
