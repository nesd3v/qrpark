/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'

import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Text,
  Hr,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

const SITE_NAME = "QRPark"

interface CorporateWelcomeProps {
  companyName?: string
  maxVehicles?: number
  planType?: string
  loginUrl?: string
  dashboardUrl?: string
}

const CorporateWelcome = ({
  companyName = "Şirketiniz",
  maxVehicles = 50,
  planType = "Filo",
  loginUrl = "https://qrpark.xyz/auth",
  dashboardUrl = "https://qrpark.xyz/corporate-dashboard",
}: CorporateWelcomeProps) => (
  <Html lang="tr" dir="ltr">
    <Head />
    <Preview>{companyName} için kurumsal üyeliğiniz aktif</Preview>
    <Body style={main}>
      <Container style={container}>
        <Text style={logo}>QR<span style={logoAccent}>Park</span></Text>
        <Section style={badge}>
          <Text style={badgeText}>👑 KURUMSAL ÜYE</Text>
        </Section>
        <Heading style={h1}>Hoş geldiniz, {companyName}!</Heading>
        <Text style={text}>
          Kurumsal başvurunuz onaylandı ve <strong>{planType}</strong> planınız aktifleştirildi.
          Artık {SITE_NAME} kurumsal panelinden filonuzdaki tüm araçları tek yerden yönetebilirsiniz.
        </Text>

        <Section style={featureBox}>
          <Text style={featureTitle}>Plan detayları</Text>
          <Text style={featureItem}>✓ Maksimum <strong>{maxVehicles}</strong> araç kaydı</Text>
          <Text style={featureItem}>✓ Filo geneli istatistikler ve raporlar</Text>
          <Text style={featureItem}>✓ Toplu QR kod yönetimi</Text>
          <Text style={featureItem}>✓ Öncelikli destek</Text>
        </Section>

        <Button style={button} href={dashboardUrl}>
          Kurumsal Panele Git
        </Button>

        <Text style={smallText}>
          Hesabınıza giriş yapmak için: <a href={loginUrl} style={link}>{loginUrl}</a>
        </Text>

        <Hr style={hr} />
        <Text style={footer}>
          Bu e-postayı {SITE_NAME} kurumsal başvurunuz onaylandığı için aldınız.
          Sorularınız için support@qrpark.xyz adresine yazabilirsiniz.
        </Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: CorporateWelcome,
  subject: (data: Record<string, any>) =>
    `${data?.companyName || 'Şirketiniz'} için QRPark Kurumsal aktif!`,
  displayName: 'Kurumsal hoş geldin',
  previewData: {
    companyName: 'ABC Lojistik A.Ş.',
    maxVehicles: 100,
    planType: 'Filo',
    loginUrl: 'https://qrpark.xyz/auth',
    dashboardUrl: 'https://qrpark.xyz/corporate-dashboard',
  },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: "'Space Grotesk', Arial, sans-serif" }
const container = { padding: '32px 28px', maxWidth: '560px' }
const logo = { fontSize: '28px', fontWeight: 'bold' as const, color: '#0a0c10', margin: '0 0 20px' }
const logoAccent = { color: '#0fa968' }
const badge = { backgroundColor: '#0fa96815', borderRadius: '999px', padding: '6px 14px', display: 'inline-block', margin: '0 0 20px' }
const badgeText = { color: '#0fa968', fontSize: '11px', fontWeight: '700' as const, letterSpacing: '0.08em', margin: '0' }
const h1 = { fontSize: '24px', fontWeight: '700' as const, color: '#0a0c10', margin: '0 0 16px' }
const text = { fontSize: '15px', color: '#374151', lineHeight: '1.6', margin: '0 0 24px' }
const featureBox = { backgroundColor: '#f9fafb', borderRadius: '12px', padding: '20px 22px', margin: '0 0 28px', borderLeft: '3px solid #0fa968' }
const featureTitle = { fontSize: '13px', fontWeight: '700' as const, color: '#0a0c10', margin: '0 0 10px', textTransform: 'uppercase' as const, letterSpacing: '0.05em' }
const featureItem = { fontSize: '14px', color: '#374151', lineHeight: '1.7', margin: '0' }
const button = { backgroundColor: '#0fa968', color: '#ffffff', fontSize: '15px', fontWeight: '600' as const, borderRadius: '12px', padding: '14px 28px', textDecoration: 'none', display: 'inline-block' }
const smallText = { fontSize: '13px', color: '#6b7280', margin: '20px 0 0' }
const link = { color: '#0fa968', textDecoration: 'none' }
const hr = { borderColor: '#e5e7eb', margin: '32px 0 20px' }
const footer = { fontSize: '12px', color: '#9ca3af', lineHeight: '1.6', margin: '0' }
