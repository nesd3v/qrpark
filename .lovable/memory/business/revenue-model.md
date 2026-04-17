---
name: Revenue Model
description: Free tier + Premium subscription (₺49 monthly / ₺499 yearly) + Corporate plan with admin approval. Sticker system removed.
type: feature
---
İş modeli abonelik tabanlıdır:
- Ücretsiz kullanıcılar: Araç kaydı, QR oluşturma, SMS bildirim alma (7 günlük QR yenileme)
- Premium (Bireysel): Aylık ₺49 / Yıllık ₺499. PayTR ile otomatik aktivasyon. Süresiz QR, sınırsız bildirim, öncelikli destek
- Kurumsal: İletişim formundan başvuru → admin onayı → corporate_members tablosuna eklenir → /corporate-dashboard erişimi
- Fiziksel sticker satışı tamamen kaldırıldı. sticker_codes ve sticker_orders tabloları drop edildi.
- /activate, AdminStickerPanel, create-sticker-payment edge function kaldırıldı.
