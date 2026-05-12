import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase for server-side usage
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export async function POST(request: Request) {
  try {
    // Fonnte sends data as Form Data or JSON
    // We'll handle both but usually it's Form Data
    const contentType = request.headers.get('content-type') || '';
    let body: any = {};
    
    if (contentType.includes('application/json')) {
      body = await request.json();
    } else {
      const formData = await request.formData();
      formData.forEach((value, key) => {
        body[key] = value;
      });
    }

    const { message, sender, name } = body;
    console.log("Full Webhook Body:", body);
    console.log("Incoming WA Message:", { message, sender, name });

    if (!message) {
      console.log("No message found in body");
      return NextResponse.json({ status: true });
    }

    const msg = String(message).toLowerCase().trim();
    let reply = '';

    // Command Logic
    if (msg === '!total' || msg === '!saldo') {
      const { data: goal } = await supabase.from('goals').select('current_amount').single();
      const amount = goal?.current_amount || 0;
      reply = `💰 *TOTAL TABUNGAN KITA*\n\nSaat ini total tabungan terkumpul adalah:\n*Rp ${amount.toLocaleString('id-ID')}*\n\nSemangat terus menabungnya! 🚀`;
    } 
    else if (msg === '!denda') {
      const { data: penalties } = await supabase.from('penalty_logs').select('amount').eq('status', 'Belum Bayar');
      const totalDenda = penalties?.reduce((sum, p) => sum + (p.amount || 0), 0) || 0;
      reply = `🚨 *TOTAL DENDA BELUM BAYAR*\n\nTotal denda yang harus dikumpulkan adalah:\n*Rp ${totalDenda.toLocaleString('id-ID')}*\n\nJangan lupa segera dibayar ya! 👮‍♂️`;
    }
    else if (msg === '!halo' || msg === '!hi') {
      reply = `Halo *${name || 'Sobat Tabungan'}*! 👋\n\nSaya adalah bot Tabungan Kita. Gunakan perintah ini:\n\n- *!total* : Cek saldo tabungan\n- *!denda* : Cek total denda\n- *!halo* : Sapa bot`;
    }

    // If there's a reply, send it back via Fonnte API
    if (reply) {
      const token = process.env.NEXT_PUBLIC_FONNTE_TOKEN;
      if (!token) throw new Error("Fonnte Token Missing");

      const params = new URLSearchParams();
      params.append('target', sender); // Reply to the sender (individual or group)
      params.append('message', reply);

      await fetch('https://api.fonnte.com/send', {
        method: 'POST',
        headers: { 'Authorization': token },
        body: params
      });
    }

    return NextResponse.json({ status: true });

  } catch (err: any) {
    console.error("Webhook Error:", err);
    return NextResponse.json({ status: false, error: err.message }, { status: 500 });
  }
}
