# Mobile auth storage (Expo SecureStore + web fallback)

## Problem

Running the Expo app on **web** (`npm start` → open in browser) crashed on startup with:

```text
TypeError: ExpoSecureStore.default.getValueWithKeyAsync is not a function
```

The failure happened in `src/mobile/src/lib/secureStore.ts` when `useAuth` called `getAuthToken()` on mount.

## Cause

[`expo-secure-store`](https://docs.expo.dev/versions/latest/sdk/securestore/) only supports **iOS and Android**. It uses the device keychain / Keystore and does not provide working async APIs on web.

The project imported `SecureStore` directly in:

- `src/mobile/src/lib/secureStore.ts`
- `src/mobile/src/api/client.ts`

Any web bundle (Metro web target or static export) therefore hit an unsupported code path immediately.

## Fix

All auth token and organization ID reads/writes now go through **`src/mobile/src/lib/secureStore.ts`**, which picks storage by platform:

| Platform | Storage | Notes |
|----------|---------|-------|
| iOS / Android | `expo-secure-store` | Encrypted native storage (production path) |
| Web | `localStorage` | Dev-only fallback so OTP login works in the browser |

`src/mobile/src/api/client.ts` was updated to use `getAuthToken()` and `getActiveOrgId()` instead of calling `SecureStore` directly.

## Usage

- **Simulators / Expo Go (recommended for auth testing):** no change — still uses SecureStore.
- **Web (`http://localhost:8081`):** works for local development; tokens live in `localStorage`, not the device keychain.

For production mobile builds, continue testing OTP and JWT persistence on iOS or Android. Web storage is not a substitute for SecureStore in shipped apps.

## Related files

- `src/mobile/src/lib/secureStore.ts` — platform-aware storage helpers
- `src/mobile/src/api/client.ts` — axios JWT / org header interceptor
- `src/mobile/src/hooks/useAuth.ts` — session bootstrap on app load
