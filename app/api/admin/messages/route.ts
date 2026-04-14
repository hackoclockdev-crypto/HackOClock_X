import { NextRequest, NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { supabase } from '@/lib/supabase-admin';
import { checkIsAdmin } from '@/lib/auth-utils';
import type { ContactSubmission } from '@/types';

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email || !checkIsAdmin(session.user.email)) {
    return NextResponse.json({ message: 'Not found' }, { status: 404 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const searchQuery = searchParams.get('search')?.slice(0, 100);

    const { data: snapshot, error } = await supabase
      .from('contact_submissions')
      .select('*')
      .order('submitted_at', { ascending: false })
      .limit(500);

    if (error) throw error;

    const messages = snapshot.map(data => ({
      id: data.id,
      name: data.name,
      email: data.email,
      subject: data.subject,
      message: data.message,
      submittedAt: data.submitted_at ?? new Date().toISOString(),
      ip: data.ip
    } as ContactSubmission));

    const filtered = searchQuery
      ? messages.filter(m =>
          m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          m.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
          m.subject.toLowerCase().includes(searchQuery.toLowerCase())
        )
      : messages;

    return NextResponse.json({ success: true, data: filtered, total: filtered.length });
  } catch (error) {
    console.error('[admin/messages] Error:', error);
    return NextResponse.json({ success: false, message: 'Failed to fetch messages.' }, { status: 500 });
  }
}
