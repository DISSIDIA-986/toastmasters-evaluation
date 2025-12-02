import { sql } from '@vercel/postgres';

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
      content_score INTEGER CHECK (content_score >= 1 AND content_score <= 5),
      delivery_score INTEGER CHECK (delivery_score >= 1 AND delivery_score <= 5),
      language_score INTEGER CHECK (language_score >= 1 AND language_score <= 5),
      time_score INTEGER CHECK (time_score >= 1 AND time_score <= 5),
      overall_score INTEGER CHECK (overall_score >= 1 AND overall_score <= 5),
      strengths TEXT,
      improvements TEXT,
      comments TEXT,
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
  content_score: number;
  delivery_score: number;
  language_score: number;
  time_score: number;
  overall_score: number;
  strengths: string;
  improvements: string;
  comments: string;
}) {
  const result = await sql`
    INSERT INTO evaluations (
      meeting_id, evaluator_name, speaker_name, speech_type,
      content_score, delivery_score, language_score, time_score, overall_score,
      strengths, improvements, comments
    ) VALUES (
      ${data.meeting_id}, ${data.evaluator_name}, ${data.speaker_name}, ${data.speech_type},
      ${data.content_score}, ${data.delivery_score}, ${data.language_score},
      ${data.time_score}, ${data.overall_score},
      ${data.strengths}, ${data.improvements}, ${data.comments}
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
