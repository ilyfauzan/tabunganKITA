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
      reply = `Halo *${name || 'Sobat Tabungan'}*! 👋\n\nSaya adalah bot Tabungan Kita. Gunakan perintah ini:\n\n- *!total* : Cek saldo tabungan\n- *!denda* : Cek total denda\n- *!status* : Cek siapa yang sudah nabung minggu ini\n- *!halo* : Sapa bot`;
    }
    else if (msg === '!status' || msg === '!cek') {
      const now = new Date();
      // Monday
      const start = new Date(now);
      const day = start.getDay();
      const diff = start.getDate() - day + (day === 0 ? -6 : 1);
      start.setDate(diff);
      start.setHours(0, 0, 0, 0);

      // Sunday
      const end = new Date(start);
      end.setDate(start.getDate() + 6);
      end.setHours(23, 59, 59, 999);

      const options: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'long', year: 'numeric' };
      const startStr = start.toLocaleDateString('id-ID', options);
      const endStr = end.toLocaleDateString('id-ID', options);
      const rangeStr = `${startStr} - ${endStr}`;

      const { data: users, error: uError } = await supabase.from('users').select('id, name');
      const { data: logs, error: lError } = await supabase.from('savings_logs')
        .select('user_id, amount')
        .gte('created_at', start.toISOString());

      console.log("Status Query Results:", { users, logs, uError, lError });

      const savingsMap: Record<string, number> = {};
      logs?.forEach(l => {
        savingsMap[l.user_id] = (savingsMap[l.user_id] || 0) + Number(l.amount);
      });

      const target = 140000;
      let statusList = '';
      users?.forEach(u => {
        const total = savingsMap[u.id] || 0;
        const icon = total >= target ? '✅' : '❌';
        statusList += `${icon} *${u.name}*: Rp ${total.toLocaleString('id-ID')}\n`;
      });

      reply = `📊 *STATUS TABUNGAN MINGGU INI*\n📅 *${rangeStr}*\n(Target: Rp ${target.toLocaleString('id-ID')})\n\n${statusList}\nSemangat nabung bareng-bareng! 💪🚀`;
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
