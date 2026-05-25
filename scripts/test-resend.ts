/**
 * Verifies RESEND_API_KEY works by sending one test email.
 *
 *   npx tsx scripts/test-resend.ts [recipient@email]
 *
 * Default recipient is the Resend account owner (required when sending from the
 * onboarding@resend.dev domain, which only delivers to the account owner until
 * a real sending domain is verified).
 */
import { config } from 'dotenv';
import { resolve } from 'path';

config({ path: resolve(process.cwd(), '.env.local') });

import { sendEmail, emailFrom } from '../src/lib/email';

async function main() {
  const to = process.argv[2] || 'yupoca24@gmail.com';
  console.log(`Sending test email from "${emailFrom()}" to ${to}…`);
  const res = await sendEmail({
    to,
    subject: 'Spoken Word Club — Resend test',
    html: '<p>If you can read this, the RESEND_API_KEY works and the speaker-digest pipeline can send.</p>',
  });
  if (res.ok) {
    console.log(`OK — Resend accepted the message (id: ${res.id}).`);
  } else {
    console.error(`FAILED — ${res.error}`);
    process.exit(1);
  }
}

main().catch((err) => {
  console.error('Test failed:', err);
  process.exit(1);
});
