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
      commend_tags JSONB DEFAULT '[]',
      recommend_tags JSONB DEFAULT '[]',
      challenge_tags JSONB DEFAULT '[]',
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
