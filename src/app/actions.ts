'use server';

import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { sendDiscordNotification } from '@/lib/notifications';
import { getSSLExpirationDays } from '@/lib/ssl';

export async function addMonitor(formData: FormData) {
  const name = formData.get('name') as string;
  const url = formData.get('url') as string;

  if (!name || !url) {
    throw new Error('Name and URL are required');
  }

  try {
    new URL(url);
  } catch {
    throw new Error('Invalid URL. Make sure it includes http:// or https://');
  }

  await prisma.monitor.create({
    data: { name, url, status: 'UP' },
  });
  revalidatePath('/');
}

export async function deleteMonitor(id: string) {
  try {
    await prisma.monitor.delete({ where: { id } });
    revalidatePath('/');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function triggerUptimeCheck() {
  try {
    const monitors = await prisma.monitor.findMany();
    for (const monitor of monitors) {
      const start = performance.now();
      let isUp = false;
      let statusCode: number | null = null;
      try {
        const response = await fetch(monitor.url, {
          signal: AbortSignal.timeout(5000),
          cache: 'no-store',
        });
        statusCode = response.status;
        isUp = response.ok;
      } catch {
        isUp = false;
      }
      const end = performance.now();
      const latency = Math.round(end - start);

      try {
        await prisma.pingLog.create({
          data: {
            monitorId: monitor.id,
            statusCode,
            latency,
            isUp,
          },
        });

        const oldStatus = monitor.status;
        const nextStatus = isUp ? 'UP' : 'DOWN';

        const sslDaysRemaining = await getSSLExpirationDays(monitor.url);

        await prisma.monitor.update({
          where: { id: monitor.id },
          data: { 
            status: nextStatus,
            sslDaysRemaining
          },
        });

        if (oldStatus !== nextStatus) {
          await sendDiscordNotification(monitor.name, monitor.url, nextStatus);
        }
      } catch (dbError) {
        console.error(`Failed db update for monitor ${monitor.id}:`, dbError);
      }
    }
    revalidatePath('/');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
