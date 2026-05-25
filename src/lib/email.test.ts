import { describe, it, expect } from 'vitest';
import { renderSpeakerDigest, escapeHtml } from './email';
import type { Evaluation } from './types';

function evalFixture(over: Partial<Evaluation>): Evaluation {
  return {
    id: 1,
    meeting_id: 1,
    evaluator_name: 'Nelson',
    speaker_name: 'Daniel B.',
    speech_type: 'prepared',
    commend_tags: [],
    recommend_tags: [],
    challenge_tags: [],
    comments: '',
    created_at: '',
    ...over,
  };
}

describe('escapeHtml', () => {
  it('escapes HTML-significant characters', () => {
    expect(escapeHtml('<script>"&\'')).toBe('&lt;script&gt;&quot;&amp;&#39;');
  });
});

describe('renderSpeakerDigest', () => {
  it('renders one block per evaluation and a subject with the meeting name', () => {
    const { subject, html } = renderSpeakerDigest({
      speakerName: 'Daniel B.',
      meetingName: 'Tue · May 19',
      evaluations: [
        evalFixture({ evaluator_name: 'Nelson', commend_tags: ['Strong open'] }),
        evalFixture({ id: 2, evaluator_name: 'Mark', recommend_tags: ['Slow the close'] }),
      ],
    });
    expect(subject).toContain('Tue · May 19');
    expect(html).toContain('Evaluation 1');
    expect(html).toContain('Evaluation 2');
    expect(html).toContain('Strong open');
    expect(html).toContain('Slow the close');
    expect(html).toContain('Daniel B.'); // greeting
  });

  it('escapes malicious ballot content (no raw HTML injection)', () => {
    const { html } = renderSpeakerDigest({
      speakerName: 'X',
      meetingName: 'M',
      evaluations: [evalFixture({ comments: '<img src=x onerror=alert(1)>' })],
    });
    expect(html).not.toContain('<img src=x');
    expect(html).toContain('&lt;img src=x');
  });

  it('handles a speaker with no recorded feedback', () => {
    const { html } = renderSpeakerDigest({ speakerName: 'X', meetingName: 'M', evaluations: [] });
    expect(html).toContain('No feedback was recorded');
  });
});
