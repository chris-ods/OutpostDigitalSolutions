import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy – Outpost Digital Solutions",
  description: "How Outpost Digital Solutions collects, uses, and protects your information.",
};

export default function PrivacyPolicy() {
  return (
    <>
      <style>{`
        .pp-body {
          font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Segoe UI', Helvetica, Arial, sans-serif;
          background: #030712;
          color: #f1f5f9;
          line-height: 1.7;
          min-height: 100vh;
        }
        .pp-nav {
          position: fixed;
          top: 0; left: 0; right: 0;
          padding: 1.25rem 2rem;
          display: flex;
          align-items: center;
          justify-content: space-between;
          background: rgba(3,7,18,0.88);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border-bottom: 1px solid rgba(255,255,255,0.08);
          z-index: 100;
        }
        .pp-logo {
          font-size: 1.05rem;
          font-weight: 700;
          color: #f1f5f9;
          text-decoration: none;
        }
        .pp-logo span { color: #60a5fa; }
        .pp-back {
          font-size: 0.85rem;
          color: #94a3b8;
          text-decoration: none;
          transition: color 0.2s;
        }
        .pp-back:hover { color: #f1f5f9; }
        .pp-main {
          max-width: 720px;
          margin: 0 auto;
          padding: 7rem 1.5rem 5rem;
        }
        .pp-header {
          margin-bottom: 3rem;
          padding-bottom: 2rem;
          border-bottom: 1px solid rgba(255,255,255,0.08);
        }
        .pp-header h1 {
          font-size: clamp(2rem, 5vw, 3rem);
          font-weight: 800;
          letter-spacing: -1.5px;
          line-height: 1.1;
          margin-bottom: 0.75rem;
          color: #f1f5f9;
        }
        .pp-meta { font-size: 0.85rem; color: #94a3b8; }
        .pp-badge {
          display: inline-block;
          padding: 0.2rem 0.7rem;
          border-radius: 100px;
          background: rgba(37,99,235,0.15);
          border: 1px solid rgba(37,99,235,0.3);
          color: #60a5fa;
          font-size: 0.75rem;
          font-weight: 600;
          margin-right: 0.5rem;
        }
        .pp-callout {
          background: rgba(37,99,235,0.08);
          border: 1px solid rgba(37,99,235,0.2);
          border-radius: 14px;
          padding: 1.25rem 1.5rem;
          margin-bottom: 2rem;
        }
        .pp-callout p { margin: 0; font-size: 0.9rem; color: #94a3b8; }
        .pp-section { margin-bottom: 2.75rem; }
        .pp-section h2 {
          font-size: 1.2rem;
          font-weight: 700;
          letter-spacing: -0.3px;
          margin-bottom: 0.85rem;
          color: #f1f5f9;
        }
        .pp-section p {
          font-size: 0.95rem;
          color: #94a3b8;
          margin-bottom: 0.85rem;
        }
        .pp-section p:last-child { margin-bottom: 0; }
        .pp-section ul, .pp-section ol {
          margin: 0.5rem 0 0.85rem 1.4rem;
        }
        .pp-section li {
          font-size: 0.95rem;
          color: #94a3b8;
          margin-bottom: 0.35rem;
          line-height: 1.6;
        }
        .pp-section strong { color: #f1f5f9; font-weight: 600; }
        .pp-section a { color: #60a5fa; text-decoration: none; }
        .pp-section a:hover { text-decoration: underline; }
        .pp-footer {
          padding: 2.5rem 1.5rem;
          text-align: center;
          color: #94a3b8;
          font-size: 0.8rem;
          border-top: 1px solid rgba(255,255,255,0.08);
        }
        .pp-footer a { color: #94a3b8; text-decoration: none; }
        .pp-footer a:hover { color: #f1f5f9; }
        .pp-footer-links {
          display: flex;
          gap: 1.5rem;
          justify-content: center;
          margin-bottom: 1rem;
        }
        @media (max-width: 500px) { .pp-nav { padding: 1rem 1.25rem; } }
      `}</style>

      <div className="pp-body">
        <nav className="pp-nav">
          <a href="/" className="pp-logo">Outpost <span>Digital Solutions</span></a>
          <a href="/" className="pp-back">← Back to Home</a>
        </nav>

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
              This Privacy Policy applies to <strong>Outpost Digital Solutions LLC</strong> ("we," "us," or "our"),
              a limited liability company providing software development and digital services. It covers our
              website at <a href="https://outpostdigitalsolutions.com">outpostdigitalsolutions.com</a>,
              our internal business portal, and any services we operate (collectively, the "Services").
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
              <li><strong>Usage analytics</strong> — we use Google Analytics 4 to understand how visitors use our website (pages visited, session duration, traffic sources). This data is aggregated and does not personally identify you.</li>
              <li><strong>Authentication signals</strong> — Firebase Authentication and Google reCAPTCHA Enterprise analyze browser and device signals to prevent unauthorized access and abuse.</li>
              <li><strong>Performance diagnostics</strong> — Firebase automatically collects crash reports and performance data to help us maintain service reliability.</li>
            </ul>
            <p><strong>Information we do NOT collect:</strong></p>
            <ul>
              <li>Payment or credit card information (handled by third-party processors if applicable)</li>
              <li>Precise geolocation data</li>
              <li>Contacts, camera, or microphone access</li>
              <li>Any data beyond what is described above</li>
            </ul>
          </div>

          <div className="pp-section">
            <h2>3. How We Use Your Information</h2>
            <p>We use the information we collect to:</p>
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
            <p>We share data only with providers necessary to operate our Services:</p>
            <ul>
              <li>
                <strong>Google Firebase</strong> — provides our database, authentication, file storage, and
                hosting. Your data is stored on Google infrastructure. See{" "}
                <a href="https://firebase.google.com/support/privacy" target="_blank" rel="noopener">Firebase&apos;s privacy documentation</a>.
              </li>
              <li>
                <strong>Google Analytics 4</strong> — provides aggregated website usage analytics. See{" "}
                <a href="https://policies.google.com/privacy" target="_blank" rel="noopener">Google&apos;s Privacy Policy</a>.
              </li>
              <li>
                <strong>Google reCAPTCHA Enterprise</strong> — processes authentication requests to detect abuse.
              </li>
            </ul>
            <p>
              We may also disclose information if required by law, court order, or to protect the safety
              of our users or the public.
            </p>
          </div>

          <div className="pp-section">
            <h2>5. Data Storage and Security</h2>
            <p>
              Your data is stored in Google Firebase infrastructure, which provides industry-standard
              encryption at rest and in transit. We use Firebase Security Rules to ensure users can only
              access data they are authorized to view.
            </p>
            <p>
              No method of transmission or storage is 100% secure. While we take reasonable steps to
              protect your information, we cannot guarantee absolute security.
            </p>
          </div>

          <div className="pp-section">
            <h2>6. Data Retention</h2>
            <p>
              We retain your account data for as long as your account is active or as needed to provide
              the Services. If you request deletion of your account, we will remove your personal
              information from our active systems within 30 days, except where retention is required by law.
            </p>
          </div>

          <div className="pp-section">
            <h2>7. Your Rights and Choices</h2>
            <p>Depending on where you live, you may have the right to:</p>
            <ul>
              <li><strong>Access</strong> the personal information we hold about you</li>
              <li><strong>Correct</strong> inaccurate information</li>
              <li><strong>Delete</strong> your account and associated data</li>
              <li><strong>Export</strong> your data in a portable format</li>
              <li>
                <strong>Opt out</strong> of Google Analytics via the{" "}
                <a href="https://tools.google.com/dlpage/gaoptout" target="_blank" rel="noopener">Google Analytics Opt-out Browser Add-on</a>
              </li>
            </ul>
            <p>
              To exercise any of these rights, email us at{" "}
              <a href="mailto:admin@outpostdigitalsolutions.com">admin@outpostdigitalsolutions.com</a>.
              We will respond within 30 days.
            </p>
          </div>

          <div className="pp-section">
            <h2>8. California Residents (CCPA)</h2>
            <p>
              If you are a California resident, you have additional rights under the California Consumer
              Privacy Act (CCPA), including the right to know what personal information we collect,
              the right to delete it, and the right to opt out of the sale of personal information.
            </p>
            <p>
              <strong>We do not sell personal information.</strong> To exercise your CCPA rights, contact
              us at <a href="mailto:admin@outpostdigitalsolutions.com">admin@outpostdigitalsolutions.com</a>.
            </p>
          </div>

          <div className="pp-section">
            <h2>9. International Users</h2>
            <p>
              Outpost Digital Solutions is operated from the United States. If you access our Services
              from outside the US, your information will be transferred to and processed in the United
              States, where data protection laws may differ from those in your country.
            </p>
          </div>

          <div className="pp-section">
            <h2>10. Changes to This Policy</h2>
            <p>
              We may update this Privacy Policy from time to time. When we do, we will update the
              &quot;Last updated&quot; date at the top of this page. For significant changes, we will notify
              you via email or an in-app notice.
            </p>
          </div>

          <div className="pp-section">
            <h2>11. Contact Us</h2>
            <p>
              If you have questions, concerns, or requests related to this Privacy Policy, please contact:
            </p>
            <p>
              <strong>Outpost Digital Solutions LLC</strong><br />
              Email: <a href="mailto:admin@outpostdigitalsolutions.com">admin@outpostdigitalsolutions.com</a><br />
              Website: <a href="https://outpostdigitalsolutions.com">outpostdigitalsolutions.com</a>
            </p>
          </div>
        </main>

        <footer className="pp-footer">
          <div className="pp-footer-links">
            <a href="mailto:admin@outpostdigitalsolutions.com">Contact</a>
            <a href="/privacy">Privacy Policy</a>
          </div>
          <p>&copy; 2026 Outpost Digital Solutions LLC. All rights reserved.</p>
        </footer>
      </div>
    </>
  );
}
