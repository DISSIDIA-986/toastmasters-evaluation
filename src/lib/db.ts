import { sql } from '@vercel/postgres';
import { AhUmEntry, GrammarEntry, TimerEntry, EvaluatorFeedback, FunctionaryFeedback } from './types';

// Initialize database tables
export async function initializeDatabase() {
  await sql`
    CREATE TABLE IF NOT EXISTS meetings (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      date DATE NOT NULL DEFAULT CURRENT_DATE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS evaluations (
      id SERIAL PRIMARY KEY,
      meeting_id INTEGER REFERENCES meetings(id) ON DELETE CASCADE,
      evaluator_name VARCHAR(255) NOT NULL,
      speaker_name VARCHAR(255) NOT NULL,
      speech_type VARCHAR(50) NOT NULL,
      commend_tags JSONB DEFAULT '[]',
      recommend_tags JSONB DEFAULT '[]',
      challenge_tags JSONB DEFAULT '[]',
      comments TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `;

  // Ah-Um Counter reports table
  await sql`
    CREATE TABLE IF NOT EXISTS ah_um_reports (
      id SERIAL PRIMARY KEY,
      meeting_id INTEGER REFERENCES meetings(id) ON DELETE CASCADE,
      reporter_name VARCHAR(255) NOT NULL,
      entries JSONB DEFAULT '[]',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `;

  // Grammarian reports table
  await sql`
    CREATE TABLE IF NOT EXISTS grammarian_reports (
      id SERIAL PRIMARY KEY,
      meeting_id INTEGER REFERENCES meetings(id) ON DELETE CASCADE,
      reporter_name VARCHAR(255) NOT NULL,
      word_of_day VARCHAR(255),
      word_of_day_definition TEXT,
      entries JSONB DEFAULT '[]',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `;

  // Timer reports table
  await sql`
    CREATE TABLE IF NOT EXISTS timer_reports (
      id SERIAL PRIMARY KEY,
      meeting_id INTEGER REFERENCES meetings(id) ON DELETE CASCADE,
      reporter_name VARCHAR(255) NOT NULL,
      meeting_start VARCHAR(10),
      meeting_end VARCHAR(10),
      entries JSONB DEFAULT '[]',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `;

  // General Evaluator reports table
  await sql`
    CREATE TABLE IF NOT EXISTS general_evaluator_reports (
      id SERIAL PRIMARY KEY,
      meeting_id INTEGER REFERENCES meetings(id) ON DELETE CASCADE,
      reporter_name VARCHAR(255) NOT NULL,
      evaluator_feedbacks JSONB DEFAULT '[]',
      functionary_feedbacks JSONB DEFAULT '[]',
      meeting_highlights TEXT,
      meeting_improvements TEXT,
      overall_comments TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `;
}

// Meeting operations
export async function createMeeting(name: string, date: string) {
  const result = await sql`
    INSERT INTO meetings (name, date)
    VALUES (${name}, ${date})
    RETURNING id, name, date, created_at
  `;
  return result.rows[0];
}

export async function getMeetings() {
  const result = await sql`
    SELECT * FROM meetings ORDER BY date DESC
  `;
  return result.rows;
}

export async function getMeetingById(id: number) {
  const result = await sql`
    SELECT * FROM meetings WHERE id = ${id}
  `;
  return result.rows[0];
}

// Evaluation operations
export async function createEvaluation(data: {
  meeting_id: number;
  evaluator_name: string;
  speaker_name: string;
  speech_type: string;
  commend_tags: string[];
  recommend_tags: string[];
  challenge_tags: string[];
  comments: string;
}) {
  const result = await sql`
    INSERT INTO evaluations (
      meeting_id, evaluator_name, speaker_name, speech_type,
      commend_tags, recommend_tags, challenge_tags, comments
    ) VALUES (
      ${data.meeting_id}, ${data.evaluator_name}, ${data.speaker_name}, ${data.speech_type},
      ${JSON.stringify(data.commend_tags)}, ${JSON.stringify(data.recommend_tags)},
      ${JSON.stringify(data.challenge_tags)}, ${data.comments}
    )
    RETURNING *
  `;
  return result.rows[0];
}

export async function getEvaluationsByMeeting(meetingId: number) {
  const result = await sql`
    SELECT * FROM evaluations
    WHERE meeting_id = ${meetingId}
    ORDER BY created_at DESC
  `;
  return result.rows;
}

export async function getEvaluationsBySpeaker(meetingId: number, speakerName: string) {
  const result = await sql`
    SELECT * FROM evaluations
    WHERE meeting_id = ${meetingId} AND speaker_name = ${speakerName}
    ORDER BY created_at DESC
  `;
  return result.rows;
}

export async function getAllEvaluations() {
  const result = await sql`
    SELECT e.*, m.name as meeting_name, m.date as meeting_date
    FROM evaluations e
    JOIN meetings m ON e.meeting_id = m.id
    ORDER BY e.created_at DESC
  `;
  return result.rows;
}

// ============ Ah-Um Counter Report Operations ============

export async function createAhUmReport(data: {
  meeting_id: number;
  reporter_name: string;
  entries: AhUmEntry[];
}) {
  const result = await sql`
    INSERT INTO ah_um_reports (meeting_id, reporter_name, entries)
    VALUES (${data.meeting_id}, ${data.reporter_name}, ${JSON.stringify(data.entries)})
    RETURNING *
  `;
  return result.rows[0];
}

export async function getAhUmReportsByMeeting(meetingId: number) {
  const result = await sql`
    SELECT * FROM ah_um_reports
    WHERE meeting_id = ${meetingId}
    ORDER BY created_at DESC
  `;
  return result.rows;
}

export async function updateAhUmReport(id: number, data: {
  reporter_name: string;
  entries: AhUmEntry[];
}) {
  const result = await sql`
    UPDATE ah_um_reports
    SET reporter_name = ${data.reporter_name}, entries = ${JSON.stringify(data.entries)}
    WHERE id = ${id}
    RETURNING *
  `;
  return result.rows[0];
}

export async function deleteAhUmReport(id: number) {
  await sql`DELETE FROM ah_um_reports WHERE id = ${id}`;
}

// ============ Grammarian Report Operations ============

export async function createGrammarianReport(data: {
  meeting_id: number;
  reporter_name: string;
  word_of_day: string;
  word_of_day_definition: string;
  entries: GrammarEntry[];
}) {
  const result = await sql`
    INSERT INTO grammarian_reports (meeting_id, reporter_name, word_of_day, word_of_day_definition, entries)
    VALUES (${data.meeting_id}, ${data.reporter_name}, ${data.word_of_day}, ${data.word_of_day_definition}, ${JSON.stringify(data.entries)})
    RETURNING *
  `;
  return result.rows[0];
}

export async function getGrammarianReportsByMeeting(meetingId: number) {
  const result = await sql`
    SELECT * FROM grammarian_reports
    WHERE meeting_id = ${meetingId}
    ORDER BY created_at DESC
  `;
  return result.rows;
}

export async function updateGrammarianReport(id: number, data: {
  reporter_name: string;
  word_of_day: string;
  word_of_day_definition: string;
  entries: GrammarEntry[];
}) {
  const result = await sql`
    UPDATE grammarian_reports
    SET reporter_name = ${data.reporter_name},
        word_of_day = ${data.word_of_day},
        word_of_day_definition = ${data.word_of_day_definition},
        entries = ${JSON.stringify(data.entries)}
    WHERE id = ${id}
    RETURNING *
  `;
  return result.rows[0];
}

export async function deleteGrammarianReport(id: number) {
  await sql`DELETE FROM grammarian_reports WHERE id = ${id}`;
}

// ============ Timer Report Operations ============

export async function createTimerReport(data: {
  meeting_id: number;
  reporter_name: string;
  meeting_start: string;
  meeting_end: string;
  entries: TimerEntry[];
}) {
  const result = await sql`
    INSERT INTO timer_reports (meeting_id, reporter_name, meeting_start, meeting_end, entries)
    VALUES (${data.meeting_id}, ${data.reporter_name}, ${data.meeting_start}, ${data.meeting_end}, ${JSON.stringify(data.entries)})
    RETURNING *
  `;
  return result.rows[0];
}

export async function getTimerReportsByMeeting(meetingId: number) {
  const result = await sql`
    SELECT * FROM timer_reports
    WHERE meeting_id = ${meetingId}
    ORDER BY created_at DESC
  `;
  return result.rows;
}

export async function updateTimerReport(id: number, data: {
  reporter_name: string;
  meeting_start: string;
  meeting_end: string;
  entries: TimerEntry[];
}) {
  const result = await sql`
    UPDATE timer_reports
    SET reporter_name = ${data.reporter_name},
        meeting_start = ${data.meeting_start},
        meeting_end = ${data.meeting_end},
        entries = ${JSON.stringify(data.entries)}
    WHERE id = ${id}
    RETURNING *
  `;
  return result.rows[0];
}

export async function deleteTimerReport(id: number) {
  await sql`DELETE FROM timer_reports WHERE id = ${id}`;
}

// ============ General Evaluator Report Operations ============

export async function createGeneralEvaluatorReport(data: {
  meeting_id: number;
  reporter_name: string;
  evaluator_feedbacks: EvaluatorFeedback[];
  functionary_feedbacks: FunctionaryFeedback[];
  meeting_highlights: string;
  meeting_improvements: string;
  overall_comments: string;
}) {
  const result = await sql`
    INSERT INTO general_evaluator_reports (
      meeting_id, reporter_name, evaluator_feedbacks, functionary_feedbacks,
      meeting_highlights, meeting_improvements, overall_comments
    )
    VALUES (
      ${data.meeting_id}, ${data.reporter_name},
      ${JSON.stringify(data.evaluator_feedbacks)}, ${JSON.stringify(data.functionary_feedbacks)},
      ${data.meeting_highlights}, ${data.meeting_improvements}, ${data.overall_comments}
    )
    RETURNING *
  `;
  return result.rows[0];
}

export async function getGeneralEvaluatorReportsByMeeting(meetingId: number) {
  const result = await sql`
    SELECT * FROM general_evaluator_reports
    WHERE meeting_id = ${meetingId}
    ORDER BY created_at DESC
  `;
  return result.rows;
}

export async function updateGeneralEvaluatorReport(id: number, data: {
  reporter_name: string;
  evaluator_feedbacks: EvaluatorFeedback[];
  functionary_feedbacks: FunctionaryFeedback[];
  meeting_highlights: string;
  meeting_improvements: string;
  overall_comments: string;
}) {
  const result = await sql`
    UPDATE general_evaluator_reports
    SET reporter_name = ${data.reporter_name},
        evaluator_feedbacks = ${JSON.stringify(data.evaluator_feedbacks)},
        functionary_feedbacks = ${JSON.stringify(data.functionary_feedbacks)},
        meeting_highlights = ${data.meeting_highlights},
        meeting_improvements = ${data.meeting_improvements},
        overall_comments = ${data.overall_comments}
    WHERE id = ${id}
    RETURNING *
  `;
  return result.rows[0];
}

export async function deleteGeneralEvaluatorReport(id: number) {
  await sql`DELETE FROM general_evaluator_reports WHERE id = ${id}`;
}

// ============ Get All Reports for a Meeting ============

export async function getAllReportsByMeeting(meetingId: number) {
  const [ahUm, grammarian, timer, generalEvaluator] = await Promise.all([
    getAhUmReportsByMeeting(meetingId),
    getGrammarianReportsByMeeting(meetingId),
    getTimerReportsByMeeting(meetingId),
    getGeneralEvaluatorReportsByMeeting(meetingId),
  ]);
  return { ahUm, grammarian, timer, generalEvaluator };
}
