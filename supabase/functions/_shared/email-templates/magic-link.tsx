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
  Text,
} from 'npm:@react-email/components@0.0.22'

interface MagicLinkEmailProps {
  siteName: string
  confirmationUrl: string
}

export const MagicLinkEmail = ({
  siteName,
  confirmationUrl,
}: MagicLinkEmailProps) => (
  <Html lang="tr" dir="ltr">
    <Head />
    <Preview>QRPark giriş bağlantınız</Preview>
    <Body style={main}>
      <Container style={container}>
        <Text style={logo}>QR<span style={logoAccent}>Park</span></Text>
        <Heading style={h1}>Giriş Bağlantınız</Heading>
        <Text style={text}>
          {siteName} hesabınıza giriş yapmak için aşağıdaki butona tıklayın. Bu bağlantı kısa süre içinde geçerliliğini yitirecektir.
        </Text>
        <Button style={button} href={confirmationUrl}>
          Giriş Yap
        </Button>
        <Text style={footer}>
          Bu bağlantıyı siz talep etmediyseniz, bu e-postayı güvenle görmezden gelebilirsiniz.
        </Text>
      </Container>
    </Body>
  </Html>
)

export default MagicLinkEmail

const main = { backgroundColor: '#ffffff', fontFamily: "'Space Grotesk', Arial, sans-serif" }
const container = { padding: '32px 28px' }
const logo = { fontSize: '28px', fontWeight: 'bold' as const, color: '#0a0c10', margin: '0 0 28px', fontFamily: "'Space Grotesk', Arial, sans-serif" }
const logoAccent = { color: '#0fa968' }
const h1 = { fontSize: '22px', fontWeight: '600' as const, color: '#0a0c10', margin: '0 0 16px', fontFamily: "'Space Grotesk', Arial, sans-serif" }
const text = { fontSize: '14px', color: '#6b7280', lineHeight: '1.6', margin: '0 0 20px' }
const button = { backgroundColor: '#0fa968', color: '#0a0c10', fontSize: '14px', fontWeight: '600' as const, borderRadius: '12px', padding: '14px 24px', textDecoration: 'none' }
const footer = { fontSize: '12px', color: '#9ca3af', margin: '32px 0 0' }
