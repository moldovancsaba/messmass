import type { Metadata } from 'next';
import Link from 'next/link';
import styles from '../legal.module.css';

export const metadata: Metadata = {
  title: 'Terms and Conditions — MessMass',
  description: 'Terms and conditions of use for the MessMass platform.',
};

export default function TermsPage() {
  return (
    <div className={styles.wrapper}>
      <div className={styles.inner}>
        <Link href="/" className={styles.back}>← Back to MessMass</Link>
        <h1 className={styles.title}>Terms and Conditions</h1>
        <p className={styles.updated}>Last updated: February 2025</p>

        <div className={styles.content}>
          <section>
            <h2>1. Agreement to terms</h2>
            <p>
              By accessing or using MessMass (&quot;the Platform&quot;), you agree to be bound by these Terms and Conditions.
              If you do not agree, do not use the Platform.
            </p>
          </section>

          <section>
            <h2>2. Description of service</h2>
            <p>
              MessMass provides sovereign decision intelligence: local-first, data-privacy-focused tools for analytics,
              reporting, and KYC-related workflows. Features and limits depend on your subscription tier (Welcome, Business,
              or Organisation).
            </p>
          </section>

          <section>
            <h2>3. Acceptable use</h2>
            <p>You agree to:</p>
            <ul>
              <li>Use the Platform only for lawful purposes and in line with these terms</li>
              <li>Not misuse, disrupt, or attempt to gain unauthorised access to the Platform or others&apos; data</li>
              <li>Comply with applicable laws, including data protection and KYC regulations where relevant</li>
              <li>Keep your account credentials secure and notify us of any unauthorised use</li>
            </ul>
          </section>

          <section>
            <h2>4. Subscription and payment</h2>
            <p>
              Paid tiers (e.g. Business, Organisation) are subject to the pricing and billing terms presented at sign-up or
              in your agreement. Fees are in USD unless otherwise stated. You are responsible for any taxes applicable to
              your use of the service.
            </p>
          </section>

          <section>
            <h2>5. Intellectual property</h2>
            <p>
              MessMass and its branding, software, and documentation are owned by us or our licensors. You retain
              ownership of the data and content you upload; you grant us the limited rights necessary to operate and
              provide the service.
            </p>
          </section>

          <section>
            <h2>6. Limitation of liability</h2>
            <p>
              The Platform is provided &quot;as is&quot;. To the maximum extent permitted by law, we are not liable for
              indirect, incidental, special, or consequential damages arising from your use of the Platform. Our total
              liability is limited to the amount you paid us in the twelve months preceding the claim.
            </p>
          </section>

          <section>
            <h2>7. Changes</h2>
            <p>
              We may update these terms from time to time. We will notify you of material changes (e.g. by email or a
              notice on the Platform). Continued use after the effective date constitutes acceptance of the updated terms.
            </p>
          </section>

          <section>
            <h2>8. Contact</h2>
            <p>
              For questions about these terms, contact us via the contact form at{' '}
              <Link href="/#contact">messmass.com</Link> or the email address provided there.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
