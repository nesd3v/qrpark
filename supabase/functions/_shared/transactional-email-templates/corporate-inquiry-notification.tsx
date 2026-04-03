import * as React from 'npm:react@18.3.1'
import {
  Body, Container, Head, Heading, Html, Preview, Text, Section, Hr,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

const SITE_NAME = "QRPark"

interface CorporateInquiryProps {
  companyName?: string
  vehicleCount?: number
  contactPhone?: string
  contactEmail?: string
  planType?: string
  message?: string
}

const CorporateInquiryNotification = ({
  companyName = "Bilinmiyor",
  vehicleCount = 0,
  contactPhone = "",
  contactEmail = "",
  planType = "filo",
  message,
}: CorporateInquiryProps) => (
  <Html lang="tr" dir="ltr">
    <Head />
    <Preview>Yeni kurumsal başvuru: {companyName}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>🏢 Yeni Kurumsal Başvuru</Heading>
        <Text style={text}>
          <strong>{SITE_NAME}</strong> üzerinden yeni bir kurumsal başvuru alındı.
        </Text>
        <Section style={detailsBox}>
          <Text style={detailRow}><strong>Şirket:</strong> {companyName}</Text>
          <Text style={detailRow}><strong>Plan:</strong> {planType === "avm" ? "AVM & Otopark" : "Filo Yönetimi"}</Text>
          <Text style={detailRow}><strong>Araç Sayısı:</strong> {vehicleCount}</Text>
          <Hr style={hr} />
          <Text style={detailRow}><strong>Telefon:</strong> {contactPhone}</Text>
          <Text style={detailRow}><strong>E-posta:</strong> {contactEmail}</Text>
          {message && (
            <>
              <Hr style={hr} />
              <Text style={detailRow}><strong>Mesaj:</strong> {message}</Text>
            </>
          )}
        </Section>
        <Text style={footer}>
          Bu başvuruyu admin panelinden yönetebilirsiniz.
        </Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: CorporateInquiryNotification,
  subject: (data: Record<string, any>) => `Yeni Kurumsal Başvuru: ${data.companyName || 'Bilinmiyor'}`,
  displayName: 'Kurumsal başvuru bildirimi',
  previewData: {
    companyName: 'Örnek Lojistik A.Ş.',
    vehicleCount: 50,
    contactPhone: '0532 123 45 67',
    contactEmail: 'info@orneklojistik.com',
    planType: 'filo',
    message: 'Filo yönetimi için detaylı bilgi almak istiyoruz.',
  },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: 'Arial, sans-serif' }
const container = { padding: '20px 25px', maxWidth: '520px' }
const h1 = { fontSize: '22px', fontWeight: 'bold' as const, color: '#1a1a2e', margin: '0 0 16px' }
const text = { fontSize: '14px', color: '#55575d', lineHeight: '1.6', margin: '0 0 16px' }
const detailsBox = { backgroundColor: '#f8f9fa', borderRadius: '8px', padding: '16px 20px', margin: '0 0 20px' }
const detailRow = { fontSize: '14px', color: '#333', lineHeight: '1.6', margin: '4px 0' }
const hr = { borderColor: '#e0e0e0', margin: '12px 0' }
const footer = { fontSize: '12px', color: '#999', margin: '24px 0 0' }
