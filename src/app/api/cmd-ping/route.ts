import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { target } = await request.json();

    if (!target || typeof target !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Target parameter is required and must be a string' },
        { status: 400 }
      );
    }

    // 1. Buat fungsi pembersih URL: Jika target belum memiliki http:// atau https://, tambahkan https:// di depannya.
    let sanitizedUrl = target.trim();
    if (!/^https?:\/\//i.test(sanitizedUrl)) {
      sanitizedUrl = `https://${sanitizedUrl}`;
    }

    // Ekstrak hostname dari URL untuk response
    let hostname = '';
    try {
      const urlObj = new URL(sanitizedUrl);
      hostname = urlObj.hostname;
    } catch {
      hostname = target;
    }

    // 2. Gunakan performance.now() sebelum dan sesudah melakukan fetch ke target tersebut. Set timeout fetch maksimal 3000ms.
    const start = performance.now();
    try {
      const response = await fetch(sanitizedUrl, {
        signal: AbortSignal.timeout(3000),
        cache: 'no-store',
      });
      const end = performance.now();
      const latency = Math.round(end - start);

      // 3. Tangkap nilai HTTP status code (misal: 200) dan hitung latency
      return NextResponse.json({
        success: true,
        target: hostname,
        ip: 'Host Web',
        latency,
        status: response.status,
      });
    } catch (fetchError) {
      // 4. Handle error dengan try-catch. Jika timeout atau gagal, kembalikan success: false.
      return NextResponse.json({
        success: false,
        target: hostname,
        ip: 'Host Web',
        latency: 0,
        status: 'Error or Timeout',
      });
    }
  } catch (error) {
    console.error('Error in cmd-ping API:', error);
    return NextResponse.json(
      { success: false, error: 'Invalid request body or internal error' },
      { status: 400 }
    );
  }
}
