'use client'

import Script from 'next/script'
import { useSyncExternalStore } from 'react'
import { getConsent, subscribeConsentChange } from '@/lib/consent'

export function GoogleAnalytics() {
  const analyticsConsented = useSyncExternalStore(
    subscribeConsentChange,
    () => getConsent()?.analytics === true,
    () => false,
  )

  const measurementId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID
  if (!measurementId || !analyticsConsented) return null

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${measurementId}`}
        strategy="afterInteractive"
      />
      <Script id="google-analytics" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${measurementId}');
        `}
      </Script>
    </>
  )
}
