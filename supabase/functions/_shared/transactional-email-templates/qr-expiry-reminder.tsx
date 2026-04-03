import * as React from 'npm:react@18.3.1'
import {
  Body, Container, Head, Heading, Html, Preview, Text, Button, Section, Hr,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

const SITE_NAME = "QRPark"

interface QrExpiryReminderProps {
  plate?: string
  expiryDate?: string
}

const QrExpiryReminderEmail = ({ plate, expiryDate }: QrExpiryReminderProps) => (
  <Html lang="tr" dir="ltr">
    <Head />
    <Preview>QR kodunuzun süresi dolmak üzere - {SITE_NAME}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={logoSection}>
          <Text style={logo}>QR<span style={{ color: '#6366f1' }}>Park</span></Text>
        </Section>

        <Heading style={h1}>QR Kodunuzun Süresi Dolmak Üzere ⏰</Heading>

        <Text style={text}>
          {plate ? (
            <>
              <strong>{plate}</strong> plakalı aracınızın QR kodu{' '}
              {expiryDate ? <strong>{expiryDate}</strong> : 'yarın'} tarihinde sona erecek.
            </>
          ) : (
            'Aracınızın QR kodunun süresi yarın sona erecek.'
          )}
        </Text>

        <Text style={text}>
          QR kodunuz sona erdikten sonra, aracınıza bildirim gönderilemeyecektir.
          QR kodunuzu yenilemek için uygulamaya giriş yapın.
        </Text>

        <Section style={ctaSection}>
          <Button style={primaryButton} href="https://qqrpark.lovable.app/generate">
            QR Kodumu Yenile
          </Button>
        </Section>

        <Hr style={hr} />

        <Text style={premiumText}>
          💎 <strong>Premium ile süresiz QR kodu</strong> elde edin. Sınırsız araç kaydı, detaylı istatistikler ve daha fazlası.
        </Text>

        <Section style={ctaSection}>
          <Button style={secondaryButton} href="https://qqrpark.lovable.app/pricing">
            Premium'a Geç
          </Button>
        </Section>

        <Text style={footer}>
          Bu e-posta {SITE_NAME} tarafından otomatik olarak gönderilmiştir.
        </Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: QrExpiryReminderEmail,
  subject: (data: Record<string, any>) =>
    data.plate
      ? `⏰ ${data.plate} plakalı aracınızın QR kodu yarın sona erecek`
      : '⏰ QR kodunuzun süresi dolmak üzere',
  displayName: 'QR süre dolum hatırlatması',
  previewData: { plate: '34 ABC 123', expiryDate: '15 Ocak 2025 14:30' },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }
const container = { padding: '30px 25px', maxWidth: '520px', margin: '0 auto' }
const logoSection = { textAlign: 'center' as const, marginBottom: '24px' }
const logo = { fontSize: '28px', fontWeight: 'bold' as const, color: '#111827', margin: '0' }
const h1 = { fontSize: '22px', fontWeight: 'bold' as const, color: '#111827', margin: '0 0 16px', textAlign: 'center' as const }
const text = { fontSize: '14px', color: '#55575d', lineHeight: '1.6', margin: '0 0 16px' }
const ctaSection = { textAlign: 'center' as const, margin: '24px 0' }
const primaryButton = { backgroundColor: '#6366f1', color: '#ffffff', padding: '12px 28px', borderRadius: '8px', fontSize: '14px', fontWeight: 'bold' as const, textDecoration: 'none' }
const secondaryButton = { backgroundColor: '#f3f4f6', color: '#6366f1', padding: '10px 24px', borderRadius: '8px', fontSize: '13px', fontWeight: '600' as const, textDecoration: 'none', border: '1px solid #e5e7eb' }
const hr = { borderColor: '#e5e7eb', margin: '24px 0' }
const premiumText = { fontSize: '13px', color: '#6366f1', lineHeight: '1.5', margin: '0 0 8px', textAlign: 'center' as const, backgroundColor: '#eef2ff', padding: '12px 16px', borderRadius: '8px' }
const footer = { fontSize: '11px', color: '#999999', margin: '24px 0 0', textAlign: 'center' as const }
