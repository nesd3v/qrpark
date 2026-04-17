---
name: Premium Subscription Flow
description: Bireysel premium PayTR ile otomatik, kurumsal admin onaylı. Pricing sayfasında plan seçimi.
type: feature
---
Premium abonelik akışı:
- /pricing sayfasında 3 plan: Ücretsiz, Premium (Bireysel), Kurumsal
- Bireysel: Aylık ₺49 / Yıllık ₺499. PayTRModal üzerinden ödeme → paytr-callback → subscriptions tablosuna aktif kayıt
- Araç QR kodu ilk oluşturulduğunda 7 gün geçerlidir; süre dolunca kullanıcı Premium'a yönlendirilir
- Premium aktifken araçların QR geçerliliği abonelik bitiş tarihine kadar otomatik uzatılır
- Kurumsal: Form (şirket adı, telefon, email, araç sayısı) → corporate_inquiries tablosu → admin AdminCorporatePanel'den onaylar → corporate_members oluşturulur
- Onaylı kurumsal kullanıcılar /corporate-dashboard sayfasına erişir (filo yönetimi)
- Dashboard ve Profile sayfasında PremiumStatusCard plan durumunu gösterir
- useSubscription hook check-subscription edge function ile her 60 saniyede senkronize olur
