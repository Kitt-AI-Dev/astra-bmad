import type { Metadata } from 'next'
import { Header } from '@/components/Header'
import { Footer } from '@/components/Footer'

export const revalidate = false

export const metadata: Metadata = {
  title: 'Privacy Policy — 404tune',
  description:
    '404tune privacy policy: what cookies we use, what data our infrastructure providers process, and your rights.',
}

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-background px-6 pt-4 pb-10">
      <div className="max-w-[700px] mx-auto">
        <Header />
        <article className="space-y-8 mt-6">
          <h1 className="text-[13px] font-mono text-text-secondary">
            <span className="text-[#5a6896]">{'// '}</span>privacy policy
          </h1>

          <section className="space-y-3">
            <h2 className="text-[11px] font-mono text-text-secondary uppercase tracking-[.14em]">
              1. overview
            </h2>
            <p className="text-[13px] font-mono text-text-primary leading-[1.8]">
              404tune is a daily horoscope service for software teams. We do not create visitor
              accounts and we do not collect names, emails, or any personally identifiable
              information from visitors.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-[11px] font-mono text-text-secondary uppercase tracking-[.14em]">
              2. who operates this service
            </h2>
            <p className="text-[13px] font-mono text-text-primary leading-[1.8]">
              404tune is operated by [FILL IN: operator legal name] in [FILL IN: country /
              jurisdiction]. For privacy questions, see section 5.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-[11px] font-mono text-text-secondary uppercase tracking-[.14em]">
              3. cookies we use
            </h2>
            <p className="text-[13px] font-mono text-text-primary leading-[1.8]">
              We use a small number of cookies to provide the site experience. We do not use
              third-party tracking cookies.
            </p>
            <ul className="text-[13px] font-mono text-text-primary leading-[1.8] list-none space-y-2 pl-0">
              <li>
                <span className="text-[#5a6896]">{'— '}</span>
                <span className="text-accent-violet">404tune_consent</span>
                {' — records your cookie consent choice. Expires in 1 year.'}
              </li>
              <li>
                <span className="text-[#5a6896]">{'— '}</span>
                <span className="text-accent-violet">404tune_prefs</span>
                {' — stores your selected zodiac sign and IT role. Expires in 1 year.'}
              </li>
              <li>
                <span className="text-[#5a6896]">{'— '}</span>
                <span className="text-accent-violet">404tune_team_slot</span>
                {' — stores your daily team reading assignment. Expires at UTC midnight.'}
              </li>
            </ul>
            <p className="text-[13px] font-mono text-text-primary leading-[1.8]">
              If you accept analytics cookies, Google Analytics 4 may set additional cookies to
              measure usage. You will always be asked for consent before any analytics cookie is
              set. You can withdraw consent at any time by clearing your cookies.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-[11px] font-mono text-text-secondary uppercase tracking-[.14em]">
              4. third-party services
            </h2>
            <ul className="text-[13px] font-mono text-text-primary leading-[1.8] list-none space-y-2 pl-0">
              <li>
                <span className="text-[#5a6896]">{'— '}</span>Vercel (hosting and CDN) — delivers
                the site and may process standard request data such as IP address and browser
                information per their own privacy policy.
              </li>
              <li>
                <span className="text-[#5a6896]">{'— '}</span>Google Analytics 4 (analytics) — if
                you accept analytics cookies, Google may process page view data including your
                anonymised IP address per their{' '}
                <a
                  href="https://policies.google.com/privacy"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-accent-violet hover:underline"
                >
                  privacy policy
                </a>
                . You can opt out at any time by clearing your cookies and choosing
                &ldquo;functional only&rdquo; when the banner appears again.
              </li>
              <li>
                <span className="text-[#5a6896]">{'— '}</span>Vercel Web Analytics (usage metrics)
                — collects anonymised page view counts. No cookies. No personal data. Operates
                within GDPR without consent per Vercel&apos;s privacy policy.
              </li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-[11px] font-mono text-text-secondary uppercase tracking-[.14em]">
              5. your rights
            </h2>
            <p className="text-[13px] font-mono text-text-primary leading-[1.8]">
              You can clear your cookies at any time through your browser settings, which removes
              all preference data 404tune stores about you. Instructions for common browsers:
            </p>
            <ul className="text-[13px] font-mono text-text-primary leading-[1.8] list-none space-y-2 pl-0">
              <li>
                <span className="text-[#5a6896]">{'— '}</span>
                <a
                  href="https://support.google.com/chrome/answer/95647"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-accent-violet hover:underline"
                >
                  Chrome
                </a>
              </li>
              <li>
                <span className="text-[#5a6896]">{'— '}</span>
                <a
                  href="https://support.mozilla.org/kb/clear-cookies-and-site-data-firefox"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-accent-violet hover:underline"
                >
                  Firefox
                </a>
              </li>
              <li>
                <span className="text-[#5a6896]">{'— '}</span>
                <a
                  href="https://support.apple.com/en-us/HT201265"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-accent-violet hover:underline"
                >
                  Safari
                </a>
              </li>
              <li>
                <span className="text-[#5a6896]">{'— '}</span>
                <a
                  href="https://support.microsoft.com/en-us/microsoft-edge/delete-cookies-in-microsoft-edge-63947406-40ac-c3b8-57b9-2a946a29ae09"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-accent-violet hover:underline"
                >
                  Edge
                </a>
              </li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-[11px] font-mono text-text-secondary uppercase tracking-[.14em]">
              6. contact
            </h2>
            <p className="text-[13px] font-mono text-text-primary leading-[1.8]">
              Privacy questions:{' '}
              <a href="mailto:privacy@404tune.dev" className="text-accent-violet hover:underline">
                privacy@404tune.dev
              </a>
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-[11px] font-mono text-text-secondary uppercase tracking-[.14em]">
              7. last updated
            </h2>
            <p className="text-[13px] font-mono text-text-primary leading-[1.8]">2026-05-02</p>
          </section>
        </article>
        <Footer />
      </div>
    </main>
  )
}
