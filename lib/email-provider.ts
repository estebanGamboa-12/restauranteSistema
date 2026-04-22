/**
 * Email provider abstraction compatible with Resend and SendGrid.
 * Default: Resend (RESEND_API_KEY + RESEND_FROM_EMAIL).
 * To use SendGrid: install @sendgrid/mail, set SENDGRID_API_KEY and SENDGRID_FROM_EMAIL,
 * and ensure RESEND_API_KEY is unset so getEmailProvider() uses SendGrid (see email-provider-sendgrid.ts).
 */

import { Resend } from "resend";

export interface SendEmailParams {
  to: string;
  subject: string;
  html: string;
  from?: string;
}

export interface EmailProvider {
  send(params: SendEmailParams): Promise<void>;
}

const FROM_EMAIL =
  process.env.RESEND_FROM_EMAIL ||
  process.env.SENDGRID_FROM_EMAIL ||
  "reservas@example.com";

function createResendProvider(): EmailProvider | null {
  const key = process.env.RESEND_API_KEY;
  if (!key) return null;
  const resend = new Resend(key);
  return {
    async send({ to, subject, html, from }) {
      const { error } = await resend.emails.send({
        from: from ?? FROM_EMAIL,
        to,
        subject,
        html,
      });
      if (error) throw new Error(error.message);
    },
  };
}

let _provider: EmailProvider | null | undefined;

export async function getEmailProvider(): Promise<EmailProvider> {
  if (_provider !== undefined) return _provider as EmailProvider;
  const resend = createResendProvider();
  if (resend) {
    _provider = resend;
    return resend;
  }
  throw new Error(
    "No email provider configured. Set RESEND_API_KEY (or SENDGRID_API_KEY with @sendgrid/mail for SendGrid)."
  );
}

export function getFromEmail(): string {
  return FROM_EMAIL;
}
