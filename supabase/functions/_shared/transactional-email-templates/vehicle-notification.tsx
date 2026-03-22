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

interface NotificationEmailProps {
  plate?: string
  issueType?: string
  note?: string
}

const issueLabels: Record<string, string> = {
  'wrong-park': 'Hatalı Park',
  'lights-on': 'Farlar Açık',
  'damaged': 'Araç Hasarlı',
  'window-open': 'Cam Açık',
  'other': 'Diğer',
}

const NotificationEmail = ({ plate, issueType, note }: NotificationEmailProps) => (
  <Html lang="tr" dir="ltr">
    <Head />
    <Preview>Aracınız ({plate}) hakkında bildirim var</Preview>
    <Body style={main}>
      <Container style={container}>
        <Text style={logo}>QR<span style={logoAccent}>Park</span></Text>
        <Heading style={h1}>Araç Bildirimi</Heading>
        <Text style={text}>
          <strong>{plate}</strong> plakalı aracınız hakkında bir bildirim alındı.
        </Text>
        <Section style={infoBox}>
          <Text style={infoLabel}>Sorun Türü</Text>
          <Text style={infoValue}>{issueType ? (issueLabels[issueType] || issueType) : 'Bilinmiyor'}</Text>
          {note && (
            <>
              <Text style={infoLabel}>Ek Not</Text>
              <Text style={infoValue}>{note}</Text>
            </>
          )}
        </Section>
        <Text style={text}>
          Lütfen aracınızı en kısa sürede kontrol edin.
        </Text>
        <Hr style={hr} />
        <Text style={footer}>
          Bu e-postayı {SITE_NAME} üzerinden aracınıza gönderilen bildirim nedeniyle aldınız.
        </Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: NotificationEmail,
  subject: (data: Record<string, any>) => `QRPark - ${data.plate || 'Aracınız'} hakkında bildirim`,
  displayName: 'Araç bildirimi e-postası',
  previewData: { plate: '34 ABC 123', issueType: 'wrong-park', note: 'Apartman girişini kapatmış' },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: "'Space Grotesk', Arial, sans-serif" }
const container = { padding: '32px 28px' }
const logo = { fontSize: '28px', fontWeight: 'bold' as const, color: '#0a0c10', margin: '0 0 28px', fontFamily: "'Space Grotesk', Arial, sans-serif" }
const logoAccent = { color: '#0fa968' }
const h1 = { fontSize: '22px', fontWeight: '600' as const, color: '#0a0c10', margin: '0 0 16px', fontFamily: "'Space Grotesk', Arial, sans-serif" }
const text = { fontSize: '14px', color: '#6b7280', lineHeight: '1.6', margin: '0 0 20px' }
const infoBox = { backgroundColor: '#f3f4f6', borderRadius: '12px', padding: '20px', margin: '0 0 20px' }
const infoLabel = { fontSize: '11px', color: '#9ca3af', textTransform: 'uppercase' as const, letterSpacing: '1px', margin: '0 0 4px', fontWeight: '600' as const }
const infoValue = { fontSize: '15px', color: '#0a0c10', margin: '0 0 14px', fontWeight: '500' as const }
const hr = { borderColor: '#e5e7eb', margin: '28px 0' }
const footer = { fontSize: '12px', color: '#9ca3af', margin: '0' }
