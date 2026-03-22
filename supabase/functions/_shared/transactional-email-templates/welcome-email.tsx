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
  Hr,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

const SITE_NAME = "QRPark"

interface WelcomeEmailProps {
  name?: string
}

const WelcomeEmail = ({ name }: WelcomeEmailProps) => (
  <Html lang="tr" dir="ltr">
    <Head />
    <Preview>QRPark'a hoş geldiniz!</Preview>
    <Body style={main}>
      <Container style={container}>
        <Text style={logo}>QR<span style={logoAccent}>Park</span></Text>
        <Heading style={h1}>
          {name ? `Hoş geldin, ${name}!` : 'QRPark\'a Hoş Geldiniz!'}
        </Heading>
        <Text style={text}>
          Hesabınız başarıyla oluşturuldu. Artık aracınız için QR kod oluşturabilir
          ve park halindeyken size ulaşılmasını kolaylaştırabilirsiniz.
        </Text>
        <Button style={button} href="https://qrpark.xyz/dashboard">
          Panele Git
        </Button>
        <Hr style={hr} />
        <Text style={footer}>
          Bu e-postayı {SITE_NAME} hesabınız oluşturulduğu için aldınız.
        </Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: WelcomeEmail,
  subject: 'QRPark\'a Hoş Geldiniz!',
  displayName: 'Hoş geldin e-postası',
  previewData: { name: 'Ahmet' },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: "'Space Grotesk', Arial, sans-serif" }
const container = { padding: '32px 28px' }
const logo = { fontSize: '28px', fontWeight: 'bold' as const, color: '#0a0c10', margin: '0 0 28px', fontFamily: "'Space Grotesk', Arial, sans-serif" }
const logoAccent = { color: '#0fa968' }
const h1 = { fontSize: '22px', fontWeight: '600' as const, color: '#0a0c10', margin: '0 0 16px', fontFamily: "'Space Grotesk', Arial, sans-serif" }
const text = { fontSize: '14px', color: '#6b7280', lineHeight: '1.6', margin: '0 0 20px' }
const button = { backgroundColor: '#0fa968', color: '#0a0c10', fontSize: '14px', fontWeight: '600' as const, borderRadius: '12px', padding: '14px 24px', textDecoration: 'none' }
const hr = { borderColor: '#e5e7eb', margin: '28px 0' }
const footer = { fontSize: '12px', color: '#9ca3af', margin: '0' }
