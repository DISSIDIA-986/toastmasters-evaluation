import { redirect } from 'next/navigation';
import { formatYyMMdd, getAgendaEvaluationTargetDate } from '@/lib/date';

export const dynamic = 'force-dynamic';

/**
 * Stable agenda link.
 *
 * Monday-Thursday: route to this week's Tuesday meeting.
 * Friday-Sunday:   route to next week's Tuesday meeting.
 */
export default function EvaluateGoPage() {
  const targetDate = getAgendaEvaluationTargetDate();
  redirect(`/evaluate/${formatYyMMdd(targetDate)}`);
}
