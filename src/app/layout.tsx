import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Lowcaps.io - Elite Blockchain Development Team | Web3 & DeFi Experts',
  description: 'Top-tier blockchain development team specializing in smart contracts, DeFi protocols, NFT platforms, and Web3 solutions. 5 expert developers available for freelance projects.',
  keywords: 'blockchain development, smart contracts, DeFi, NFT marketplace, Web3 development, Solidity, dApp development, cryptocurrency, ethereum, blockchain consulting, security audits, freelance blockchain developers',
  authors: [{ name: 'Lowcaps.io Team' }],
  robots: 'index, follow',

  // Open Graph
  openGraph: {
    type: 'website',
    url: 'https://lowcaps.io/',
    title: 'Lowcaps.io - Elite Blockchain Development Team',
    description: 'Transform your Web3 vision into reality. Expert blockchain developers specializing in smart contracts, DeFi, and NFT solutions.',
    images: [
      {
        url: 'https://lowcaps.io/assets/icons/logo.png',
        width: 1200,
        height: 630,
        alt: 'Lowcaps.io Logo',
      },
    ],
    siteName: 'Lowcaps.io',
    locale: 'en_US',
  },

  // Twitter
  twitter: {
    card: 'summary_large_image',
    site: '@Low_Caps_',
    creator: '@Low_Caps_',
    title: 'Lowcaps.io - Elite Blockchain Development Team',
    description: 'Transform your Web3 vision into reality. Expert blockchain developers specializing in smart contracts, DeFi, and NFT solutions.',
    images: ['https://lowcaps.io/assets/twitter-card.png'],
  },

  // Additional Meta
  other: {
    'theme-color': '#4A9FFF',
    'msapplication-TileColor': '#0A0E27',
  },

  // Icons
  icons: {
    icon: [
      { url: '/assets/icons/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/assets/icons/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
    ],
    apple: [
      { url: '/assets/icons/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
    other: [
      { rel: 'manifest', url: '/site.webmanifest' },
    ],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        {/* Preconnect to external domains */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="dns-prefetch" href="https://fonts.googleapis.com" />

        {/* Canonical URL - you'll need to update this for production */}
        <link rel="canonical" href="https://lowcaps.io/" />

        {/* Structured Data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Organization",
              "name": "Lowcaps.io",
              "description": "Elite blockchain development team specializing in Web3 solutions",
              "url": "https://lowcaps.io",
              "logo": "https://lowcaps.io/assets/logo.png",
              "email": "brett@lowcaps.io",
              "foundingDate": "2025",
              "employees": [
                {
                  "@type": "Person",
                  "name": "Brett",
                  "jobTitle": "Project manager"
                },
                {
                  "@type": "Person",
                  "name": "Andy",
                  "jobTitle": "Marketing Professional"
                },
                {
                  "@type": "Person",
                  "name": "Jena",
                  "jobTitle": "Blockchain Specialist"
                },
                {
                  "@type": "Person",
                  "name": "Mohit",
                  "jobTitle": "Frontend Engineer"
                },
                {
                  "@type": "Person",
                  "name": "Ryan",
                  "jobTitle": "AI Professional"
                }
              ],
              "sameAs": [
                "https://x.com/Low_Caps_"
              ],
              "service": {
                "@type": "Service",
                "serviceType": "Blockchain Development",
                "provider": {
                  "@type": "Organization",
                  "name": "Lowcaps.io"
                },
                "areaServed": "Worldwide",
                "hasOfferCatalog": {
                  "@type": "OfferCatalog",
                  "name": "Blockchain Development Services",
                  "itemListElement": [
                    {
                      "@type": "Offer",
                      "itemOffered": {
                        "@type": "Service",
                        "name": "Smart Contract Development"
                      }
                    },
                    {
                      "@type": "Offer",
                      "itemOffered": {
                        "@type": "Service",
                        "name": "DApp Development"
                      }
                    },
                    {
                      "@type": "Offer",
                      "itemOffered": {
                        "@type": "Service",
                        "name": "NFT Platform Development"
                      }
                    },
                    {
                      "@type": "Offer",
                      "itemOffered": {
                        "@type": "Service",
                        "name": "DeFi Solutions"
                      }
                    },
                    {
                      "@type": "Offer",
                      "itemOffered": {
                        "@type": "Service",
                        "name": "Security Audits"
                      }
                    }
                  ]
                }
              }
            })
          }}
        />
      </head>
      <body className={inter.className}>
        {children}
      </body>
    </html>
  );
}