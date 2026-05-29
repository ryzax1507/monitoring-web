import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { sendDiscordNotification } from '@/lib/notifications';
import { getSSLExpirationDays } from '@/lib/ssl';

export async function GET() {
  try {
    // 1. Ambil semua data dari model Monitor menggunakan Prisma
    const monitors = await prisma.monitor.findMany();
    const results = [];

    // 2. Lakukan looping untuk melakukan fetch ke setiap url
    for (const monitor of monitors) {
      const start = performance.now();
      let isUp = false;
      let statusCode: number | null = null;

      try {
        // Fetch ke setiap url dengan timeout 5000ms dan tanpa cache (cache: 'no-store')
        const response = await fetch(monitor.url, {
          signal: AbortSignal.timeout(5000),
          cache: 'no-store',
        });
        statusCode = response.status;
        isUp = response.ok;
      } catch (error) {
        // Jika error atau timeout, set isUp ke false
        isUp = false;
      }

      // 3. Hitung latency (waktu respon) menggunakan performance.now()
      const end = performance.now();
      const latency = Math.round(end - start);

      try {
        // 5. Simpan hasil pengecekan ini ke model PingLog
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

        // Get SSL remaining days
        const sslDaysRemaining = await getSSLExpirationDays(monitor.url);

        // 6. Update field status pada model Monitor menjadi 'UP' atau 'DOWN' sesuai hasil
        await prisma.monitor.update({
          where: { id: monitor.id },
          data: {
            status: nextStatus,
            sslDaysRemaining,
          },
        });

        // Kirim notifikasi jika status server berubah
        if (oldStatus !== nextStatus) {
          await sendDiscordNotification(monitor.name, monitor.url, nextStatus);
        }

        results.push({
          monitorId: monitor.id,
          name: monitor.name,
          url: monitor.url,
          isUp,
          statusCode,
          latency,
        });
      } catch (dbError) {
        // Log error jika satu monitor gagal database update agar looping tetap berlanjut
        console.error(`Database error for monitor ${monitor.id}:`, dbError);
      }
    }

    // 7. Return NextResponse dengan pesan sukses
    return NextResponse.json({
      success: true,
      message: 'Uptime check completed',
      results,
    });
  } catch (error) {
    console.error('Uptime check cron error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to complete uptime check',
      },
      { status: 500 }
    );
  }
}
