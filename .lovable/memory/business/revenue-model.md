---
name: Revenue Model
description: Hem dijital QR hem fiziksel sticker desteklenir. Sticker aktivasyon sistemi mevcut.
type: feature
---
İş modeli hem dijital QR hem fiziksel sticker satışını destekler.
- Dijital QR: Kullanıcılar araç kaydı sonrası otomatik 7 günlük QR kodu alır
- Fiziksel Sticker: Sipariş edilen sticker'lar `sticker_codes` tablosunda pre-register edilir
- Sticker Aktivasyon: 3 adımlı akış (yapıştır → QR tara → araç bilgisi gir) `/activate` rotasında
- Dashboard'da "QR Aktivasyon" butonu `/activate` sayfasına yönlendirir
- Premium abonelik sistemi arka planda, sticker satışı ana gelir kaynağı
