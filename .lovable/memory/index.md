# Memory: index.md
Updated: now

# Project Memory

## Core
React, Supabase, PWA/Capacitor (Mobile-first). Theme: Emerald Green (#10B981) & Black.
Auth via Twilio SMS OTP only. No traditional email auth.
Deployment: GitHub Actions to cPanel FTP. Must use `npm install`, NOT `npm ci`.
Payment via PayTR only. Stripe is removed.
Communication via SMS (Twilio) and React Email. No WhatsApp.
Constraints: No free-text SMS (use presets), no license upload.
Business: Free + Premium (₺49/ay, ₺499/yıl) + Kurumsal (admin onaylı). Sticker sistemi tamamen kaldırıldı.
UI: Capacitor handles platform-aware layout. Native=MobileLayout, Web=Navbar/Footer.

## Memories
- [Architecture](mem://tech/architecture) — React, Supabase, Capacitor, Twilio OTP, AES-256 chat
- [Infrastructure](mem://backend/infrastructure) — Supabase RLS, cPanel SPA routing, no-cache config
- [Payment Integration](mem://integrations/payment) — PayTR integration (Stripe removed)
- [Core Functionality](mem://features/core-functionality) — Vehicle management, encrypted chat, notifications
- [Communication](mem://integrations/communication) — Twilio SMS, React Email on notify.qrpark.xyz
- [Deployment](mem://deployment/strategy) — GitHub Actions + FTP to cPanel, `npm install`
- [Verification Flow](mem://features/verification-workflow) — User declaration (no license upload)
- [Special Accounts](mem://project/special-accounts) — Admin and PayTR test account credentials
- [Automation](mem://backend/automation) — QR expiry reminder Edge Function via pg_net cron
- [Advertising](mem://integrations/advertising) — Google AdSense on production domains
- [Billing](mem://features/billing) — Subscription management and dynamic HTML receipts
- [Admin Management](mem://features/admin-management) — Sidebar admin panel with Corporate inquiries
- [Vehicle Management](mem://features/vehicle-management) — Vehicle registration, QR preview
- [Auth Flow](mem://auth/flow) — 3-step Twilio OTP, magic link tokens, 5-min code expiry
- [Revenue Model](mem://business/revenue-model) — Free + Premium subscription + Corporate
- [Premium Subscription](mem://features/premium-subscription) — Bireysel PayTR, Kurumsal admin onaylı, /corporate-dashboard
- [Mobile Interface](mem://ui/mobile-interface) — Bottom nav, dashboard grid, safe-area support
- [QR Scanner](mem://features/qr-scanner) — html5-qrcode camera scanner routing to notify
- [Support Inbox](mem://features/support-inbox) — Chronological message history, dynamic chat widget
- [Platform-Aware Layout](mem://ui/platform-aware-layout) — `window.Capacitor` routing
- [Profile Management](mem://features/profile-management-v2) — Native app style, no email field
- [Notification Center](mem://features/notification-center) — Dedicated /notifications page by plate
