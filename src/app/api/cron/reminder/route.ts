import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  // Security check: Only allow Vercel Cron to trigger this
  // In production, you should also check for CRON_SECRET header if configured
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;
  
  if (process.env.NODE_ENV === 'production' && cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return new Response('Unauthorized', { status: 401 });
  }

  try {
    const token = process.env.NEXT_PUBLIC_FONNTE_TOKEN;
    const target = process.env.NEXT_PUBLIC_WA_GROUP_NAME;

    console.log("Triggering Cron for:", target);

    if (!token || !target) {
      console.error("Missing Config:", { hasToken: !!token, hasTarget: !!target });
      throw new Error("Missing Fonnte configuration");
    }

    const message = `📢 *PENGINGAT MINGGUAN!*\n\nHalo semuanya! 👋\nHari ini hari Minggu jam 12 siang. Jangan lupa untuk mengisi tabungan mingguan ya agar target kita cepat tercapai! 💰🚀\n\nKlik link ini untuk mengisi: https://tabungan-kita.vercel.app`;

    const params = new URLSearchParams();
    params.append('target', target);
    params.append('message', message);
    params.append('countryCode', '62');

    const response = await fetch('https://api.fonnte.com/send', {
      method: 'POST',
      headers: {
        'Authorization': token,
      },
      body: params,
      cache: 'no-store'
    });

    const result = await response.json();
    console.log("Fonnte Response:", result);
    return NextResponse.json({ success: true, result });

  } catch (err: any) {
    console.error("Cron Reminder Error:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
