/**
 * All outbound email goes through here (P4). Centralizing the Resend client +
 * templates keeps the API key read in one place and makes the digest renderer
 * unit-testable.
 *
 * From address: set EMAIL_FROM once a club sending domain is verified in Resend
 * (SPF/DKIM). Until then it defaults to Resend's onboarding domain, which only
 * delivers to the Resend account owner — fine for testing, not for real sends.
 */
import { Resend } from 'resend';
import type { Evaluation } from './types';

const DEFAULT_FROM = 'Spoken Word Club <onboarding@resend.dev>';

export function emailFrom(): string {
  return process.env.EMAIL_FROM || DEFAULT_FROM;
}

function getResend(): Resend {
  const key = process.env.RESEND_API_KEY;
  if (!key) throw new Error('RESEND_API_KEY env var is not set');
  return new Resend(key);
}

/** Minimal HTML escaping — ballot text is public user input, never trust it raw. */
export function escapeHtml(s: string): string {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function tagList(label: string, tags: string[] | undefined): string {
  if (!tags || tags.length === 0) return '';
  const items = tags.map((t) => `<li>${escapeHtml(t)}</li>`).join('');
  return `<p style="margin:8px 0 2px;font-weight:600">${label}</p><ul style="margin:0 0 8px;padding-left:20px">${items}</ul>`;
}

/**
 * Render one speaker's feedback as an HTML digest, one block per evaluator.
 * Exported for unit testing (no network).
 */
export function renderSpeakerDigest(args: {
  speakerName: string;
  meetingName: string;
  meetingDate?: string;
  evaluations: Evaluation[];
}): { subject: string; html: string } {
  const { speakerName, meetingName, meetingDate, evaluations } = args;
  const blocks = evaluations
    .map((e, i) => {
      const comment = e.comments?.trim()
        ? `<p style="margin:8px 0 2px;font-weight:600">Comments</p><p style="margin:0 0 8px;white-space:pre-wrap">${escapeHtml(e.comments)}</p>`
        : '';
      return `
        <div style="border:1px solid #e5e7eb;border-radius:10px;padding:14px;margin:0 0 12px">
          <p style="margin:0 0 6px;color:#6b7280;font-size:13px">Evaluation ${i + 1} · from ${escapeHtml(e.evaluator_name)}</p>
          ${tagList('What went well', e.commend_tags)}
          ${tagList('Recommendations', e.recommend_tags)}
          ${tagList('Challenges', e.challenge_tags)}
          ${comment}
        </div>`;
    })
    .join('');

  const dateLine = meetingDate ? ` · ${escapeHtml(meetingDate)}` : '';
  const html = `<!doctype html><html><body style="font-family:-apple-system,system-ui,sans-serif;color:#111827;max-width:560px;margin:0 auto;padding:16px">
    <h2 style="margin:0 0 2px">Hi ${escapeHtml(speakerName)}, here's your feedback</h2>
    <p style="margin:0 0 16px;color:#6b7280">${escapeHtml(meetingName)}${dateLine} · ${evaluations.length} evaluation${evaluations.length === 1 ? '' : 's'}</p>
    ${blocks || '<p>No feedback was recorded for this speech.</p>'}
    <p style="margin:18px 0 0;color:#9ca3af;font-size:12px">Spoken Word Toastmasters Club</p>
  </body></html>`;

  return { subject: `Your feedback from ${meetingName}`, html };
}

/** Send a speaker their feedback digest. Returns {ok} or {ok:false, error}. */
export async function sendSpeakerDigest(args: {
  to: string;
  speakerName: string;
  meetingName: string;
  meetingDate?: string;
  evaluations: Evaluation[];
}): Promise<{ ok: boolean; id?: string; error?: string }> {
  const { subject, html } = renderSpeakerDigest(args);
  try {
    const { data, error } = await getResend().emails.send({
      from: emailFrom(),
      to: args.to,
      subject,
      html,
    });
    if (error) return { ok: false, error: error.message };
    return { ok: true, id: data?.id };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'send failed' };
  }
}

/** Generic send (used by the connectivity test script). */
export async function sendEmail(args: {
  to: string;
  subject: string;
  html: string;
}): Promise<{ ok: boolean; id?: string; error?: string }> {
  try {
    const { data, error } = await getResend().emails.send({
      from: emailFrom(),
      to: args.to,
      subject: args.subject,
      html: args.html,
    });
    if (error) return { ok: false, error: error.message };
    return { ok: true, id: data?.id };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'send failed' };
  }
}
