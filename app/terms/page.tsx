import type { Metadata } from 'next'
import { Header } from '@/components/Header'
import { Footer } from '@/components/Footer'

export const revalidate = false

export const metadata: Metadata = {
  title: 'Terms of Service — 404tune',
  description:
    '404tune terms of service: acceptance, permitted use, AI-generated content disclaimer, and limitation of liability.',
}

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-background px-6 pt-4 pb-10">
      <div className="max-w-[700px] mx-auto">
        <Header />
        <article className="space-y-8 mt-6">
          <h1 className="text-[13px] font-mono text-text-secondary">
            <span className="text-[#5a6896]">{'// '}</span>terms of service
          </h1>

          <section className="border border-accent-violet rounded p-5 space-y-3">
            <h2 className="text-[11px] font-mono text-accent-violet uppercase tracking-[.14em]">
              disclaimer
            </h2>
            <p className="text-[13px] font-mono text-text-primary leading-[1.8]">
              404tune is a joke app. It exists to cheer you up — not to guide your decisions.
            </p>
            <p className="text-[13px] font-mono text-text-primary leading-[1.8]">
              Every reading, prediction, and cosmic pronouncement on this site is a{' '}
              <strong>joke</strong>. The stars do not know your sprint velocity. The AI does not
              know your future. Nothing here should be used as the basis for any personal,
              professional, financial, medical, or life decision of any kind.
            </p>
            <p className="text-[13px] font-mono text-text-primary leading-[1.8]">
              If you make a decision based on a 404tune reading and something goes wrong, that is
              on you. 404tune accepts no liability whatsoever for any outcome — good, bad, or
              chaotic — that results from acting on anything you read here.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-[11px] font-mono text-text-secondary uppercase tracking-[.14em]">
              1. acceptance
            </h2>
            <p className="text-[13px] font-mono text-text-primary leading-[1.8]">
              By using 404tune you agree to these terms. If you do not agree, do not use the
              service.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-[11px] font-mono text-text-secondary uppercase tracking-[.14em]">
              2. use of service
            </h2>
            <p className="text-[13px] font-mono text-text-primary leading-[1.8]">
              404tune provides AI-generated horoscope content for entertainment purposes only. The
              content is not professional advice of any kind. Use at your own discretion.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-[11px] font-mono text-text-secondary uppercase tracking-[.14em]">
              3. content
            </h2>
            <p className="text-[13px] font-mono text-text-primary leading-[1.8]">
              All reading content is AI-generated. Accuracy is not guaranteed. 404tune is not
              responsible for decisions made based on reading content.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-[11px] font-mono text-text-secondary uppercase tracking-[.14em]">
              4. intellectual property
            </h2>
            <p className="text-[13px] font-mono text-text-primary leading-[1.8]">
              The 404tune name, design, and branding are owned by 404tune.
              Reading content is AI-generated and provided as-is.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-[11px] font-mono text-text-secondary uppercase tracking-[.14em]">
              5. disclaimer of warranties
            </h2>
            <p className="text-[13px] font-mono text-text-primary leading-[1.8]">
              The service is provided &ldquo;as is&rdquo; without warranties of any kind. We do not
              warrant that the service will be uninterrupted, error-free, or that any particular
              reading will be accurate, useful, or entertaining.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-[11px] font-mono text-text-secondary uppercase tracking-[.14em]">
              6. limitation of liability
            </h2>
            <p className="text-[13px] font-mono text-text-primary leading-[1.8]">
              404tune is not liable for any indirect, incidental, or consequential damages arising from
              use of the service.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-[11px] font-mono text-text-secondary uppercase tracking-[.14em]">
              7. changes
            </h2>
            <p className="text-[13px] font-mono text-text-primary leading-[1.8]">
              These terms may be updated at any time. Continued use of the service constitutes
              acceptance of the updated terms.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-[11px] font-mono text-text-secondary uppercase tracking-[.14em]">
              8. last updated
            </h2>
            <p className="text-[13px] font-mono text-text-primary leading-[1.8]">2026-05-01</p>
          </section>
        </article>
        <Footer />
      </div>
    </main>
  )
}
