import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy – Outpost Digital Solutions",
  description: "How Outpost Digital Solutions collects, uses, and protects your information.",
};

export default function PrivacyPolicy() {
  return (
    <>
      <style>{`
        .pp-main { max-width: 720px; margin: 0 auto; padding: 3rem 1.5rem 5rem; }
        .pp-header { margin-bottom: 3rem; padding-bottom: 2rem; border-bottom: 1px solid rgba(255,255,255,0.08); }
        .pp-header h1 { font-size: clamp(2rem, 5vw, 3rem); font-weight: 800; letter-spacing: -1.5px; line-height: 1.1; margin-bottom: 0.75rem; }
        .pp-meta { font-size: 0.85rem; color: #94a3b8; }
        .pp-badge { display: inline-block; padding: 0.2rem 0.7rem; border-radius: 100px; background: rgba(37,99,235,0.15); border: 1px solid rgba(37,99,235,0.3); color: #60a5fa; font-size: 0.75rem; font-weight: 600; margin-right: 0.5rem; }
        .pp-callout { background: rgba(37,99,235,0.08); border: 1px solid rgba(37,99,235,0.2); border-radius: 14px; padding: 1.25rem 1.5rem; margin-bottom: 2rem; }
        .pp-callout p { margin: 0; font-size: 0.9rem; color: #94a3b8; }
        .pp-section { margin-bottom: 2.75rem; }
        .pp-section h2 { font-size: 1.2rem; font-weight: 700; letter-spacing: -0.3px; margin-bottom: 0.85rem; }
        .pp-section p { font-size: 0.95rem; color: #94a3b8; margin-bottom: 0.85rem; }
        .pp-section p:last-child { margin-bottom: 0; }
        .pp-section ul, .pp-section ol { margin: 0.5rem 0 0.85rem 1.4rem; }
        .pp-section li { font-size: 0.95rem; color: #94a3b8; margin-bottom: 0.35rem; line-height: 1.6; }
        .pp-section strong { color: #f1f5f9; font-weight: 600; }
        .pp-section a { color: #60a5fa; text-decoration: none; }
        .pp-section a:hover { text-decoration: underline; }
      `}</style>

      <main className="pp-main">
        <div className="pp-header">
          <h1>Privacy Policy</h1>
          <p className="pp-meta">
            <span className="pp-badge">Last updated: March 18, 2026</span>
            Effective for outpostdigitalsolutions.com and all associated services.
          </p>
        </div>

        <div className="pp-callout">
          <p>
            <strong>The short version:</strong> Outpost Digital Solutions collects only the information
            needed to operate our services. We do not sell your data, show you ads, or share your
            information with third parties beyond what is required to run our business.
          </p>
        </div>

        <div className="pp-section">
          <h2>1. Who We Are</h2>
          <p>
            This Privacy Policy applies to <strong>Outpost Digital Solutions LLC</strong> (&ldquo;we,&rdquo; &ldquo;us,&rdquo; or &ldquo;our&rdquo;),
            a limited liability company providing software development and digital services. It covers our
            website at <a href="https://outpostdigitalsolutions.com">outpostdigitalsolutions.com</a>,
            our internal business portal, and any services we operate (collectively, the &ldquo;Services&rdquo;).
          </p>
          <p>
            Questions about this policy? Contact us at{" "}
            <a href="mailto:admin@outpostdigitalsolutions.com">admin@outpostdigitalsolutions.com</a>.
          </p>
        </div>

        <div className="pp-section">
          <h2>2. Information We Collect</h2>
          <p><strong>Information you provide directly:</strong></p>
          <ul>
            <li><strong>Email address</strong> — when you create an account, sign in, or contact us.</li>
            <li><strong>Display name</strong> — chosen during account setup or imported from your Google account.</li>
            <li><strong>Business content</strong> — documents, client records, project notes, time entries, and any other data you create within our portal.</li>
            <li><strong>Communications</strong> — messages or inquiries you send us directly.</li>
          </ul>
          <p><strong>Information collected automatically:</strong></p>
          <ul>
            <li><strong>Usage analytics</strong> — we use Google Analytics 4 to understand how visitors use our website. This data is aggregated and does not personally identify you.</li>
            <li><strong>Authentication signals</strong> — Firebase Authentication and Google reCAPTCHA Enterprise analyze browser and device signals to prevent unauthorized access.</li>
            <li><strong>Performance diagnostics</strong> — Firebase automatically collects crash reports and performance data to help us maintain service reliability.</li>
          </ul>
          <p><strong>Information we do NOT collect:</strong></p>
          <ul>
            <li>Payment or credit card information</li>
            <li>Precise geolocation data</li>
            <li>Contacts, camera, or microphone access</li>
          </ul>
        </div>

        <div className="pp-section">
          <h2>3. How We Use Your Information</h2>
          <ul>
            <li>Create and maintain your account and portal access</li>
            <li>Deliver and improve our services</li>
            <li>Understand how our website is used so we can improve it</li>
            <li>Prevent fraud, abuse, and unauthorized access</li>
            <li>Communicate with you about your account or our services</li>
            <li>Meet our legal and regulatory obligations</li>
          </ul>
          <p>
            We do <strong>not</strong> use your information for advertising, sell it to data brokers,
            or share it with third parties for their own marketing purposes.
          </p>
        </div>

        <div className="pp-section">
          <h2>4. How We Share Your Information</h2>
          <ul>
            <li><strong>Google Firebase</strong> — provides our database, authentication, file storage, and hosting.</li>
            <li><strong>Google Analytics 4</strong> — provides aggregated website usage analytics.</li>
            <li><strong>Google reCAPTCHA Enterprise</strong> — processes authentication requests to detect abuse.</li>
          </ul>
          <p>
            We may also disclose information if required by law, court order, or to protect the safety
            of our users or the public.
          </p>
        </div>

        <div className="pp-section">
          <h2>5. Data Storage and Security</h2>
          <p>
            Your data is stored in Google Firebase infrastructure with industry-standard
            encryption at rest and in transit. We use Firebase Security Rules to ensure users can only
            access data they are authorized to view.
          </p>
        </div>

        <div className="pp-section">
          <h2>6. Data Retention</h2>
          <p>
            We retain your account data for as long as your account is active. If you request deletion,
            we will remove your personal information within 30 days, except where retention is required by law.
          </p>
        </div>

        <div className="pp-section">
          <h2>7. Your Rights and Choices</h2>
          <ul>
            <li><strong>Access</strong> the personal information we hold about you</li>
            <li><strong>Correct</strong> inaccurate information</li>
            <li><strong>Delete</strong> your account and associated data</li>
            <li><strong>Export</strong> your data in a portable format</li>
            <li><strong>Opt out</strong> of Google Analytics</li>
          </ul>
          <p>
            To exercise any of these rights, email us at{" "}
            <a href="mailto:admin@outpostdigitalsolutions.com">admin@outpostdigitalsolutions.com</a>.
          </p>
        </div>

        <div className="pp-section">
          <h2>8. California Residents (CCPA)</h2>
          <p>
            <strong>We do not sell personal information.</strong> To exercise your CCPA rights, contact
            us at <a href="mailto:admin@outpostdigitalsolutions.com">admin@outpostdigitalsolutions.com</a>.
          </p>
        </div>

        <div className="pp-section">
          <h2>9. Changes to This Policy</h2>
          <p>
            We may update this Privacy Policy from time to time. For significant changes, we will notify
            you via email or an in-app notice.
          </p>
        </div>

        <div className="pp-section">
          <h2>10. Contact Us</h2>
          <p>
            <strong>Outpost Digital Solutions LLC</strong><br />
            Email: <a href="mailto:admin@outpostdigitalsolutions.com">admin@outpostdigitalsolutions.com</a><br />
            Website: <a href="https://outpostdigitalsolutions.com">outpostdigitalsolutions.com</a>
          </p>
        </div>
      </main>
    </>
  );
}
