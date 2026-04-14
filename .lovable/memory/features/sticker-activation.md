---
name: QR Sticker Activation Flow
description: 3 adımlı sticker aktivasyon akışı - yapıştır, tara, araç bilgisi gir
type: feature
---
Fiziksel sticker'lar için `/activate` sayfasında 3 adımlı aktivasyon akışı:
1. Talimat ekranı (Sticker'ı yapıştır, QR okut, bilgileri gir)
2. Kamera ile QR tarama (html5-qrcode, `sticker_codes` tablosunda doğrulama)
3. Araç bilgileri formu (plaka, marka, model, renk)

Tablo: `sticker_codes` (code, vehicle_id, activated_by, status: available/activated)
Dashboard "QR Aktivasyon" butonu bu sayfaya yönlendirir.
Admin panelden sticker kodları pre-register edilmeli.
