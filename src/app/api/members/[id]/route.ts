import { NextRequest, NextResponse } from 'next/server';
import { updateMember, deleteMember } from '@/lib/db';
import { requireAuth } from '@/lib/auth';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const denied = await requireAuth(request);
  if (denied) return denied;
  try {
    const { id } = await params;
    const memberId = parseInt(id);
    if (isNaN(memberId)) {
      return NextResponse.json({ error: 'Invalid member ID' }, { status: 400 });
    }
    const body = await request.json();
    const name = typeof body.display_name === 'string' ? body.display_name.trim() : '';
    const mail = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
    if (!name || !EMAIL_RE.test(mail)) {
      return NextResponse.json(
        { error: 'A display name and a valid email are required' },
        { status: 400 },
      );
    }
    const result = await updateMember(memberId, {
      display_name: name,
      email: mail,
      active: body.active !== false, // default true
    });
    if (!result) {
      return NextResponse.json({ error: 'Member not found' }, { status: 404 });
    }
    return NextResponse.json(result);
  } catch (error) {
    console.error('Failed to update member:', error);
    return NextResponse.json({ error: 'Failed to update member' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const denied = await requireAuth(request);
  if (denied) return denied;
  try {
    const { id } = await params;
    const memberId = parseInt(id);
    if (isNaN(memberId)) {
      return NextResponse.json({ error: 'Invalid member ID' }, { status: 400 });
    }
    await deleteMember(memberId);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete member:', error);
    return NextResponse.json({ error: 'Failed to delete member' }, { status: 500 });
  }
}
