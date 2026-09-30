import { getCurrentUser } from '@/lib/auth';
import { storage } from '@/lib/storage';
import { MENTOR_DATABASE } from '@/lib/ai';
import { redirect } from 'next/navigation';
import { MentorsView } from './mentors-view';

export const dynamic = 'force-dynamic';

export default async function MentorsPage({
  searchParams,
}: {
  searchParams: { chat?: string };
}) {
  const user = await getCurrentUser();
  if (!user) redirect('/login');

  const bookings = await storage.getUserMentorBookings(user.id);

  return (
    <MentorsView
      mentors={MENTOR_DATABASE}
      initialBookings={bookings}
      userId={user.id}
      initialChatMentorId={searchParams.chat}
    />
  );
}