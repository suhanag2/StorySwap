import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { stances } = body as { stances: { topicId: string; stanceSelected: string }[] };

    if (!stances || !Array.isArray(stances) || stances.length === 0) {
      return NextResponse.json(
        { error: 'Stances array is required' },
        { status: 400 }
      );
    }

    // Validate each stance
    for (const stance of stances) {
      if (!stance.topicId || !stance.stanceSelected) {
        return NextResponse.json(
          { error: 'Each stance must have topicId and stanceSelected' },
          { status: 400 }
        );
      }
      if (stance.stanceSelected !== 'A' && stance.stanceSelected !== 'B') {
        return NextResponse.json(
          { error: 'stanceSelected must be "A" or "B"' },
          { status: 400 }
        );
      }
    }

    // Create/update all user stances using upsert
    const upsertPromises = stances.map(stance =>
      db.userStance.upsert({
        where: {
          userId_topicId: {
            userId: user.id,
            topicId: stance.topicId,
          },
        },
        update: {
          stanceSelected: stance.stanceSelected,
        },
        create: {
          userId: user.id,
          topicId: stance.topicId,
          stanceSelected: stance.stanceSelected,
        },
      })
    );

    await Promise.all(upsertPromises);

    // Mark user onboarding as done
    await db.user.update({
      where: { id: user.id },
      data: { onboardingDone: true },
    });

    // Return updated stances
    const updatedStances = await db.userStance.findMany({
      where: { userId: user.id },
    });

    return NextResponse.json({ stances: updatedStances });
  } catch (error) {
    console.error('Save stances error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
