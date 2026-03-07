import type { Metadata } from 'next';
import Link from 'next/link';
import styles from '../legal.module.css';

export const metadata: Metadata = {
  title: 'Privacy Policy — {messmass}',
  description: '{messmass} privacy policy. How we collect, use, and protect your data.',
};

export default function PrivacyPage() {
  return (
    <div className={styles.wrapper}>
      <div className={styles.inner}>
        <Link href="/" className={styles.back}>← Back to {'{messmass}'}</Link>
        <h1 className={styles.title}>Privacy Policy</h1>
        <p className={styles.updated}>Last updated: February 2025</p>

        <div className={styles.content}>
          <section>
            <h2>1. Introduction</h2>
            <p>
              {'{messmass}'} (&quot;we&quot;, &quot;our&quot;, or &quot;us&quot;) is committed to protecting your privacy.
              This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use
              our platform and services at messmass.com and related applications.
            </p>
          </section>

          <section>
            <h2>2. Data we collect</h2>
            <p>We may collect:</p>
            <ul>
              <li>Account and profile information (name, email, organisation)</li>
              <li>Usage data (how you use the platform, features accessed)</li>
              <li>Data you upload or create within the platform (reports, KYC datasets, event data)</li>
              <li>Technical data (IP address, browser type, device information) where necessary for security or compliance</li>
            </ul>
          </section>

          <section>
            <h2>3. How we use your data</h2>
            <p>We use your data to:</p>
            <ul>
              <li>Provide, operate, and improve our services</li>
              <li>Authenticate users and manage access</li>
              <li>Process and store your content in line with our local-first and sovereign decision intelligence approach</li>
              <li>Comply with legal obligations and enforce our terms</li>
              <li>Communicate with you about the service (e.g. support, important updates)</li>
            </ul>
          </section>

          <section>
            <h2>4. Data location and retention</h2>
            <p>
              Where we host the service, we process and store data in accordance with your subscription and applicable law.
              We retain your data for as long as your account is active or as needed to provide the service, and for a
              reasonable period thereafter for legal and operational purposes.
            </p>
          </section>

          <section>
            <h2>5. Your rights</h2>
            <p>
              Depending on your jurisdiction, you may have the right to access, correct, delete, or port your data, and
              to object to or restrict certain processing. Contact us using the details below to exercise these rights.
            </p>
          </section>

          <section>
            <h2>6. Contact</h2>
            <p>
              For privacy-related questions or requests, contact us via the contact form at{' '}
              <Link href="/#contact">messmass.com</Link> or at the email address provided there.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
