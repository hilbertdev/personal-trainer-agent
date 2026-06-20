# Personal Trainer Mobile

Expo + Expo Router app for the QBS SaaS backend.

## Prerequisites

- Node.js 20+
- Expo Go app (dev) or EAS CLI (production builds)

## Setup

```bash
cd src/mobile
cp .env.example .env
npm install
```

## Development

```bash
npm start
# Press i for iOS simulator, a for Android emulator
```

Set `EXPO_PUBLIC_API_URL` in `.env`:

| Environment | URL |
|-------------|-----|
| iOS Simulator | `http://localhost:5075` |
| Android Emulator | `http://10.0.2.2:5075` |
| Physical device | Your machine LAN IP, e.g. `http://192.168.1.10:5075` |

Start the SaaS API first:

```bash
docker compose -f docker-compose.saas.yml up
```

## Auth flow

1. **Login** — enter email, request OTP (`POST /api/auth/request-otp`)
2. **Verify** — enter 6-digit code (`POST /api/auth/verify-otp`)
3. JWT stored in `expo-secure-store` under `auth_token`

## EAS builds

```bash
npm install -g eas-cli
eas login
eas build --platform ios --profile development
eas build --platform ios --profile production
```

Requires `EXPO_TOKEN` in GitHub secrets for CI (see root `GITHUB_SECRETS.md`).

## Structure

```text
app/
  (auth)/login.tsx, verify.tsx   # OTP screens
  (app)/index.tsx, profile.tsx   # Authenticated tabs
src/
  api/client.ts                  # Axios + JWT interceptor
  api/auth.ts                    # OTP API calls
  hooks/useAuth.ts
  lib/secureStore.ts
```
