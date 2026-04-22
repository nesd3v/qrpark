# Memory: index.md
Updated: today

# Project Memory

## Core
React, Supabase, PWA/Capacitor (Mobile-first). Theme: Emerald Green (#10B981) & Black.
Auth via Twilio SMS OTP and email/password. Mobile native uses email/password (Supabase auth).
Deployment: GitHub Actions to cPanel FTP. Must use `npm install`, NOT `npm ci`.
Payment via PayTR only (Premium subscription model). Stripe is removed.
Communication via SMS (Twilio) and React Email. No WhatsApp.
Constraints: No free-text SMS (use presets). NO sticker ordering flow in current code.
Business: Revenue via Premium subscription (₺39/ay, ₺349/yıl). Sticker model is deprecated/removed.
UI: Capacitor handles platform-aware layout. Native=MobileLayout, Web=Navbar/Footer.
Capacitor build: `server.url` in capacitor.config.ts is DISABLED — APK serves bundled `dist/` (avoids stale cache showing old screens).

## Memories
- [Architecture](mem://tech/architecture) — React, Supabase, Capacitor, Twilio OTP, AES-256 chat
- [Infrastructure](mem://backend/infrastructure) — Supabase RLS, cPanel SPA routing, no-cache config
- [Payment Integration](mem://integrations/payment) — PayTR integration (Stripe removed)
- [Core Functionality](mem://features/core-functionality) — Vehicle management, encrypted chat, notifications
- [Communication](mem://integrations/communication) — Twilio SMS, React Email on notify.qrpark.xyz
- [Deployment](mem://deployment/strategy) — GitHub Actions + FTP to cPanel, `npm install`
- [Verification Flow](mem://features/verification-workflow) — User declaration + ruhsat photo (AI verify-ruhsat)
- [Special Accounts](mem://project/special-accounts) — Admin and PayTR test account credentials
- [Automation](mem://backend/automation) — QR expiry reminder Edge Function via pg_net cron
- [Advertising](mem://integrations/advertising) — Google AdSense on production domains
- [Billing](mem://features/billing) — Subscription management and dynamic HTML receipts
- [Admin Management](mem://features/admin-management) — Sidebar admin panel
- [Vehicle Management](mem://features/vehicle-management) — Vehicle registration, QR preview
- [Sticker Ordering — DEPRECATED](mem://features/sticker-ordering) — Removed from codebase, do not re-add
- [Sticker Checkout — DEPRECATED](mem://features/sticker-checkout-flow) — Removed, PayTR is now subscription-only
- [Auth Flow](mem://auth/flow) — Email/password + Twilio OTP for vehicle verification
- [Revenue Model](mem://business/revenue-model) — Premium subscription via PayTR (₺39/ay, ₺349/yıl)
- [Mobile Interface](mem://ui/mobile-interface) — Bottom nav, native MobileLayout, safe-area support
- [QR Scanner](mem://features/qr-scanner) — html5-qrcode camera scanner routing to notify
- [Support Inbox](mem://features/support-inbox) — Chronological message history
- [Platform-Aware Layout](mem://ui/platform-aware-layout) — `usePlatform` hook detects Capacitor → renders Mobile* page
- [Profile Management](mem://features/profile-management-v2) — Native app style, collapsible vehicles
- [Notification Center](mem://features/notification-center) — Dedicated /notifications page (mobile only)
