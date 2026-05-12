import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { message } = await request.json();
    
    const token = process.env.NEXT_PUBLIC_FONNTE_TOKEN;
    const target = process.env.NEXT_PUBLIC_WA_GROUP_NAME;

    if (!token || !target) {
      return NextResponse.json({ status: false, reason: "Missing Fonnte config" }, { status: 500 });
    }

    const params = new URLSearchParams();
    params.append('target', target);
    params.append('message', message);
    params.append('countryCode', '62');

    const response = await fetch('https://api.fonnte.com/send', {
      method: 'POST',
      headers: {
        'Authorization': token,
      },
      body: params
    });

    const result = await response.json();
    return NextResponse.json(result);

  } catch (err: any) {
    console.error("API Route WA Error:", err);
    return NextResponse.json({ status: false, reason: err.message }, { status: 500 });
  }
}
