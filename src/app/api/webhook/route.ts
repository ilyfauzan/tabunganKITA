// Trigger rebuild
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase for server-side usage
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function handleIncomingMessage(request: Request, method: string) {
  try {
    let body: any = {};
    if (method === 'POST') {
      const contentType = request.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        body = await request.json();
      } else {
        const formData = await request.formData();
        formData.forEach((value, key) => { body[key] = value; });
      }
    } else {
      const url = new URL(request.url);
      url.searchParams.forEach((value, key) => { body[key] = value; });
    }

    console.log(`--- WEBHOOK ${method} RECEIVED ---`);
    console.log("Body/Query:", body);

    // Fonnte sends fields as 'pesan' and 'pengirim' (Indonesian)
    const message = body.pesan || body.message;
    const sender = body.pengirim || body.sender;
    const name = body.nama || body.name;

    if (!message) return NextResponse.json({ status: true });

    const msg = String(message).toLowerCase().trim();
    let reply = '';

    if (msg === '!total' || msg === '!saldo') {
      const { data: goal, error } = await supabase.from('goals').select('current_amount').single();
      console.log("Goal Query Result:", { goal, error });
      reply = `💰 *TOTAL TABUNGAN KITA*\n\nSaat ini total tabungan terkumpul adalah:\n*Rp ${(goal?.current_amount || 0).toLocaleString('id-ID')}*\n\nSemangat terus menabungnya! 🚀`;
    } 
    else if (msg === '!denda') {
      const { data: penalties, error } = await supabase.from('penalty_logs').select('amount').eq('status', 'Belum Bayar');
      console.log("Penalty Query Result:", { penalties, error });
      const totalDenda = penalties?.reduce((sum, p) => sum + (p.amount || 0), 0) || 0;
      reply = `🚨 *TOTAL DENDA BELUM BAYAR*\n\nTotal denda yang harus dikumpulkan adalah:\n*Rp ${totalDenda.toLocaleString('id-ID')}*\n\nJangan lupa segera dibayar ya! 👮‍♂️`;
    }
    else if (msg === '!halo' || msg === '!hi') {
      reply = `Halo *${name || 'Sobat Tabungan'}*! 👋\n\nSaya adalah bot Tabungan Kita. Gunakan perintah ini:\n\n- *!total* : Cek saldo tabungan\n- *!denda* : Cek total denda\n- *!halo* : Sapa bot`;
    }

    if (reply && sender) {
      const token = process.env.NEXT_PUBLIC_FONNTE_TOKEN;
      const params = new URLSearchParams();
      params.append('target', sender);
      params.append('message', reply);
      await fetch('https://api.fonnte.com/send', {
        method: 'POST',
        headers: { 'Authorization': token! },
        body: params
      });
    }

    return NextResponse.json({ status: true });
  } catch (err: any) {
    console.error("Webhook Error:", err);
    return NextResponse.json({ status: false, error: err.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  return handleIncomingMessage(request, 'POST');
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  if (url.searchParams.has('message')) {
    return handleIncomingMessage(request, 'GET');
  }
  return new Response("Webhook is active and listening!", { status: 200 });
}
