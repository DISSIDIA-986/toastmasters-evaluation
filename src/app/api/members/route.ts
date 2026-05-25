import { NextRequest, NextResponse } from 'next/server';
import { getMembers, upsertMember } from '@/lib/db';
import { requireAuth } from '@/lib/auth';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// All member endpoints are admin-only: the roster is PII (emails). The public
// evaluate form does NOT read this (the public dropdown is deferred).
export async function GET(request: NextRequest) {
  const denied = await requireAuth(request);
  if (denied) return denied;
  try {
    const members = await getMembers();
    return NextResponse.json(members);
  } catch (error) {
    console.error('Failed to fetch members:', error);
    return NextResponse.json({ error: 'Failed to fetch members' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const denied = await requireAuth(request);
  if (denied) return denied;
  try {
    const { display_name, email } = await request.json();
    const name = typeof display_name === 'string' ? display_name.trim() : '';
    const mail = typeof email === 'string' ? email.trim().toLowerCase() : '';
    if (!name || !EMAIL_RE.test(mail)) {
      return NextResponse.json(
        { error: 'A display name and a valid email are required' },
        { status: 400 },
      );
    }
    const member = await upsertMember(name, mail);
    return NextResponse.json(member, { status: 201 });
  } catch (error) {
    console.error('Failed to create member:', error);
    return NextResponse.json({ error: 'Failed to create member' }, { status: 500 });
  }
}
