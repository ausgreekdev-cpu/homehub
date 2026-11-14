# HomeHub Mobile (Expo)

## Setup
1. Copy `.env.example` to `.env` and set Supabase values.
2. From repo root: `pnpm install`
3. Run: `pnpm --filter @homehub/mobile start`

## Features (Phase 20 foundation)
- Supabase auth (email/password)
- Push notifications (Expo Notifications, registered on mount)
- Dashboard (signed-in user info, sign out)
- Payments (bills list from Supabase)
- Maintenance (requests list + create new request form)
- Messages (notifications list from Supabase)

## EAS Build
```bash
# Install EAS CLI
npm install -g eas-cli
eas login

# Build for development
eas build --profile development --platform all

# Build for production
eas build --profile production --platform all
```

## Push Notifications
- Registered automatically on app launch
- Token stored in `push_tokens` table (Supabase)
- Server-side dispatch via Supabase Edge Function (to be implemented)

## Next Steps
- Stripe Payment Sheet for rent payments
- Image upload for maintenance requests
- Real-time message updates
- Offline support (AsyncStorage cache)
