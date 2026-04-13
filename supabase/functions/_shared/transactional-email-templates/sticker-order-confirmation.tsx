/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'

import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Text,
  Section,
  Hr,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

const SITE_NAME = "QRPark"

interface StickerOrderConfirmationProps {
  plate?: string
}

const StickerOrderConfirmationEmail = ({ plate }: StickerOrderConfirmationProps) => (
  <Html lang="tr" dir="ltr">
    <Head />
    <Preview>Sticker siparişiniz alındı - {SITE_NAME}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>Sipariş Onayı ✅</Heading>
        <Text style={text}>
          Sticker siparişiniz başarıyla alınmıştır!
        </Text>
        {plate && (
          <Section style={detailBox}>
            <Text style={detailLabel}>Plaka</Text>
            <Text style={detailValue}>{plate}</Text>
          </Section>
        )}
        <Hr style={hr} />
        <Text style={text}>
          Siparişiniz en kısa sürede hazırlanıp kargoya verilecektir. Sipariş durumunuzu uygulama üzerinden takip edebilirsiniz.
        </Text>
        <Text style={footer}>
          Teşekkür ederiz,<br />
          {SITE_NAME} Ekibi
        </Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: StickerOrderConfirmationEmail,
  subject: 'Sticker Siparişiniz Alındı - QRPark',
  displayName: 'Sticker sipariş onayı',
  previewData: { plate: '34 ABC 123' },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: 'Arial, sans-serif' }
const container = { padding: '20px 25px', maxWidth: '480px', margin: '0 auto' }
const h1 = { fontSize: '22px', fontWeight: 'bold' as const, color: '#1a1a2e', margin: '0 0 20px' }
const text = { fontSize: '14px', color: '#55575d', lineHeight: '1.6', margin: '0 0 16px' }
const detailBox = { backgroundColor: '#f4f4f5', borderRadius: '8px', padding: '16px', margin: '0 0 16px' }
const detailLabel = { fontSize: '12px', color: '#71717a', margin: '0 0 4px', textTransform: 'uppercase' as const }
const detailValue = { fontSize: '18px', fontWeight: 'bold' as const, color: '#1a1a2e', margin: '0' }
const hr = { borderColor: '#e4e4e7', margin: '16px 0' }
const footer = { fontSize: '12px', color: '#999999', margin: '24px 0 0' }
