'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { ProgressBar } from '@/components/ProgressBar';
import { PenaltyPool } from '@/components/PenaltyPool';
import { QuickActions } from '@/components/QuickActions';
import { WeeklyStatus } from '@/components/WeeklyStatus';
import { TransactionHistory, Transaction } from '@/components/TransactionHistory';
import { Modals } from '@/components/Modals';
import { startOfWeek, endOfWeek, addWeeks, format } from 'date-fns';
import { id } from 'date-fns/locale';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export default function Dashboard() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [isSavingsModalOpen, setIsSavingsModalOpen] = useState(false);
  const [isPenaltyModalOpen, setIsPenaltyModalOpen] = useState(false);
  const [isEditTargetModalOpen, setIsEditTargetModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // State
  const [goal, setGoal] = useState({ targetName: 'Loading...', targetAmount: 0, currentAmount: 0 });
  const [penaltyPool, setPenaltyPool] = useState(0);
  const [usersStatus, setUsersStatus] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [partners, setPartners] = useState<any[]>([]);

  const [weekOffset, setWeekOffset] = useState(0);
  const [dateRangeStr, setDateRangeStr] = useState('');
  const [weeklyTarget, setWeeklyTarget] = useState(70000);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth');
    }
  }, [user, authLoading, router]);

  const fetchData = async () => {
    try {
      // Fetch Goal
      const { data: goalData } = await supabase.from('goals').select('*').limit(1).single();
      if (goalData) {
        setGoal({
          targetName: goalData.target_name,
          targetAmount: Number(goalData.target_amount),
          currentAmount: Number(goalData.current_amount)
        });
      }

      const { data: usersData } = await supabase.from('users').select('*');
      if (usersData) {
        setPartners(usersData);
        // calculateWeeklyStatus will be triggered by useEffect when partners change

        // Fetch Penalty Pool
        const totalPenalty = usersData.reduce((acc: number, curr: any) => acc + Number(curr.total_penalty), 0);
        setPenaltyPool(totalPenalty);
      }

      // Fetch Transactions
      const { data: savings } = await supabase.from('savings_logs')
        .select('*, users(name)')
        .order('created_at', { ascending: false })
        .limit(10);

      const { data: penalties } = await supabase.from('penalty_logs')
        .select('*, users(name)')
        .order('created_at', { ascending: false })
        .limit(10);

      const combined: Transaction[] = [];
      if (savings) {
        savings.forEach((s: any) => {
          combined.push({
            id: s.id,
            type: 'savings',
            user_name: s.users?.name || 'Unknown',
            amount: Number(s.amount),
            description: s.category,
            date: s.created_at
          });
        });
      }
      if (penalties) {
        penalties.forEach((p: any) => {
          combined.push({
            id: p.id,
            type: 'penalty',
            user_name: p.users?.name || 'Unknown',
            amount: Number(p.amount),
            description: p.penalty_type,
            date: p.created_at,
            status: p.status
          });
        });
      }

      combined.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      setTransactions(combined.slice(0, 10));

    } catch (err) {
      console.error("Error fetching data:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!user) return;
    fetchData();

    // Setup Realtime
    const savingsSub = supabase.channel('savings_channel')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'savings_logs' }, fetchData)
      .subscribe();

    const penaltySub = supabase.channel('penalty_channel')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'penalty_logs' }, fetchData)
      .subscribe();

    const usersSub = supabase.channel('users_channel')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'users' }, fetchData)
      .subscribe();

    const goalsSub = supabase.channel('goals_channel')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'goals' }, fetchData)
      .subscribe();

    return () => {
      supabase.removeChannel(savingsSub);
      supabase.removeChannel(penaltySub);
      supabase.removeChannel(usersSub);
      supabase.removeChannel(goalsSub);
    };
  }, [user]);

  const calculateWeeklyStatus = async () => {
    if (partners.length === 0) return;

    const now = new Date();
    const targetDate = addWeeks(now, weekOffset);
    // Set week to start on Monday (1)
    const start = startOfWeek(targetDate, { weekStartsOn: 1 });
    const end = endOfWeek(targetDate, { weekStartsOn: 1 });

    const startStr = format(start, 'd MMM yyyy', { locale: id });
    const endStr = format(end, 'd MMM yyyy', { locale: id });
    setDateRangeStr(`${startStr} - ${endStr}`);

    // Dynamic target logic: Before May 11, 2026, the target is 50,000. On or after, it is 70,000.
    const thresholdDate = new Date(2026, 4, 11); // Bulan 4 = Mei (karena 0-indexed) di zona waktu lokal
    const targetAmt = start.getTime() < thresholdDate.getTime() ? 50000 : 70000;
    setWeeklyTarget(targetAmt);

    const { data: weeklySavings } = await supabase
      .from('savings_logs')
      .select('user_id, amount')
      .gte('created_at', start.toISOString())
      .lte('created_at', end.toISOString());

    const savingsByUserId: Record<string, number> = {};
    if (weeklySavings) {
      weeklySavings.forEach(log => {
        savingsByUserId[log.user_id] = (savingsByUserId[log.user_id] || 0) + Number(log.amount);
      });
    }

    const status = partners.map((u: any) => ({
      name: u.name,
      currentAmount: savingsByUserId[u.id] || 0,
      targetAmount: targetAmt
    }));

    setUsersStatus(status);
  };

  useEffect(() => {
    calculateWeeklyStatus();
  }, [weekOffset, partners]);

  const handleSavingsSubmit = async (amount: number, category: string, userName: string) => {
    const targetUser = partners.find(p => p.name === userName);
    const targetUserId = targetUser ? targetUser.id : user?.id;

    // Optimistic Update (Update UI instantly)
    setGoal(prev => ({ ...prev, currentAmount: prev.currentAmount + amount }));
    setTransactions(prev => [{
      id: 'temp-' + Date.now(),
      type: 'savings',
      user_name: userName,
      amount: amount,
      description: category,
      date: new Date().toISOString()
    }, ...prev]);

    // Backend Update in Parallel for speed
    const dbPromises = [
      supabase.from('savings_logs').insert({
        user_id: targetUserId,
        amount: amount,
        category: category,
        created_at: new Date().toISOString()
      }),
      supabase.from('goals').update({ current_amount: goal.currentAmount + amount }).eq('target_name', goal.targetName)
    ];

    if (targetUser) {
      dbPromises.push(supabase.from('users').update({ balance: Number(targetUser.balance) + amount }).eq('id', targetUserId));
    }

    await Promise.all(dbPromises);

    // Final fetch to ensure data integrity
    fetchData();
  };

  const handleDownloadPDF = async () => {
    try {
      const { data: allSavings } = await supabase.from('savings_logs').select('*, users(name)').order('created_at', { ascending: true });
      const { data: allPenalties } = await supabase.from('penalty_logs').select('*, users(name)').order('created_at', { ascending: true });

      const combined: any[] = [];
      if (allSavings) {
        allSavings.forEach((s: any) => {
          combined.push({
            dateRaw: s.created_at,
            date: format(new Date(s.created_at), 'dd/MM/yyyy HH:mm'),
            type: 'Tabungan',
            name: s.users?.name || 'Unknown',
            desc: s.category,
            amount: s.amount
          });
        });
      }
      if (allPenalties) {
        allPenalties.forEach((p: any) => {
          combined.push({
            dateRaw: p.created_at,
            date: format(new Date(p.created_at), 'dd/MM/yyyy HH:mm'),
            type: 'Denda',
            name: p.users?.name || 'Unknown',
            desc: p.penalty_type,
            amount: p.amount
          });
        });
      }

      combined.sort((a, b) => new Date(a.dateRaw).getTime() - new Date(b.dateRaw).getTime());

      // Format data for autoTable
      const tableData = combined.map((row, index) => [
        index + 1,
        row.date,
        row.type,
        row.name,
        row.desc,
        `Rp ${Number(row.amount).toLocaleString('id-ID')}`
      ]);

      // Calculate totals
      const totalTabungan = combined.filter(r => r.type === 'Tabungan').reduce((acc, curr) => acc + Number(curr.amount), 0);
      const totalDenda = combined.filter(r => r.type === 'Denda').reduce((acc, curr) => acc + Number(curr.amount), 0);

      const doc = new jsPDF();

      // Title
      doc.setFontSize(18);
      doc.setTextColor(40);
      doc.text('Laporan Transaksi Tabungan Kita', 14, 22);

      // Subtitle
      doc.setFontSize(11);
      doc.setTextColor(100);
      doc.text(`Tanggal Cetak: ${format(new Date(), 'dd MMMM yyyy HH:mm', { locale: id })}`, 14, 30);
      doc.text(`Total Tabungan Keseluruhan: Rp ${totalTabungan.toLocaleString('id-ID')}`, 14, 36);
      doc.text(`Total Kas Denda: Rp ${totalDenda.toLocaleString('id-ID')}`, 14, 42);

      // Table
      autoTable(doc, {
        startY: 50,
        head: [['No', 'Tanggal', 'Jenis', 'Nama', 'Keterangan', 'Nominal']],
        body: tableData,
        theme: 'striped',
        headStyles: { fillColor: [236, 72, 153] }, // Pink-500 from Tailwind
        styles: { fontSize: 9 },
        alternateRowStyles: { fillColor: [253, 242, 248] } // Pink-50
      });

      doc.save(`Laporan_Tabungan_${format(new Date(), 'dd_MM_yyyy')}.pdf`);

    } catch (err) {
      console.error("Error downloading PDF", err);
      alert("Gagal mengunduh PDF. Coba lagi.");
    }
  };

  const handlePenaltySubmit = async (userName: string, penaltyType: string) => {
    const targetUser = partners.find(p => p.name === userName);
    const targetUserId = targetUser ? targetUser.id : user?.id;

    // Optimistic Update
    setPenaltyPool(prev => prev + 10000);
    setTransactions(prev => [{
      id: 'temp-p-' + Date.now(),
      type: 'penalty',
      user_name: userName,
      amount: 10000,
      description: penaltyType,
      date: new Date().toISOString()
    }, ...prev]);

    const dbPromises = [
      supabase.from('penalty_logs').insert({
        user_id: targetUserId,
        penalty_type: penaltyType,
        amount: 10000,
        status: 'Belum Bayar'
      })
    ];

    if (targetUser) {
      dbPromises.push(supabase.from('users').update({ total_penalty: Number(targetUser.total_penalty) + 10000 }).eq('id', targetUserId));
    }
    
    await Promise.all(dbPromises);
    fetchData();
  };

  const handleDeleteTransaction = async (trx: Transaction) => {
    if (!window.confirm(`Apakah Anda yakin ingin menghapus transaksi ini? (Akan mengurangi saldo/denda secara otomatis)`)) return;

    try {
      const targetUser = partners.find(p => p.name === trx.user_name);
      
      // Optimistic Update
      setTransactions(prev => prev.filter(t => t.id !== trx.id));
      if (trx.type === 'savings') {
        setGoal(prev => ({ ...prev, currentAmount: prev.currentAmount - trx.amount }));
      } else {
        setPenaltyPool(prev => prev - trx.amount);
      }

      if (trx.type === 'savings') {
        // Delete log
        const { error: delError } = await supabase.from('savings_logs').delete().eq('id', trx.id);
        if (delError) throw delError;
        
        // Deduct balance
        if (targetUser) {
          const { error: userError } = await supabase.from('users').update({ balance: Number(targetUser.balance) - trx.amount }).eq('id', targetUser.id);
          if (userError) throw userError;
        }
        
        // Deduct goal
        const { error: goalError } = await supabase.from('goals').update({ current_amount: goal.currentAmount - trx.amount }).eq('target_name', goal.targetName);
        if (goalError) throw goalError;
        
      } else if (trx.type === 'penalty') {
        // Delete log
        const { error: delError } = await supabase.from('penalty_logs').delete().eq('id', trx.id);
        if (delError) throw delError;
        
        // Deduct penalty
        if (targetUser) {
          const { error: userError } = await supabase.from('users').update({ total_penalty: Number(targetUser.total_penalty) - trx.amount }).eq('id', targetUser.id);
          if (userError) throw userError;
        }
      }

      // Refresh everything
      fetchData();
    } catch (err) {
      console.error("Error deleting transaction", err);
      alert("Gagal menghapus transaksi.");
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/auth');
  };

  const handleEditTarget = async (name: string, amount: number) => {
    await supabase.from('goals').update({ target_name: name, target_amount: amount }).eq('target_name', goal.targetName);
    setIsEditTargetModalOpen(false);
    fetchData();
  };

  if (authLoading || (!user && !authLoading)) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;

  const currentUser = partners.find(p => p.id === user?.id);
  const isAdmin = currentUser?.name === 'Fauzan' || user?.email?.toLowerCase().includes('fauzan') || user?.email?.toLowerCase() === 'fauzan@gmail.com';

  return (
    <main className="min-h-screen bg-gray-50/50 pb-20">
      <header className="bg-white sticky top-0 z-30 border-b border-pink-100 shadow-sm px-4 py-4">
        <div className="max-w-md mx-auto flex justify-between items-center">
          <h1 className="text-xl font-bold bg-gradient-to-r from-pink-500 to-blue-500 bg-clip-text text-transparent">
            Tabungan Kita
          </h1>
          <button onClick={handleLogout} className="text-sm font-medium text-gray-500 hover:text-red-500 transition-colors">
            Keluar
          </button>
        </div>
      </header>

      <div className="max-w-md mx-auto p-4 space-y-6 mt-2">
        <section className="animate-in slide-in-from-bottom-4 duration-500 fade-in fill-mode-both" style={{ animationDelay: '0ms' }}>
          <ProgressBar
            currentAmount={goal.currentAmount}
            targetAmount={goal.targetAmount}
            targetName={goal.targetName}
            isAdmin={isAdmin}
            onEditTarget={() => setIsEditTargetModalOpen(true)}
          />
        </section>

        <section className="animate-in slide-in-from-bottom-4 duration-500 fade-in fill-mode-both" style={{ animationDelay: '100ms' }}>
          <QuickActions
            onSavingsClick={() => setIsSavingsModalOpen(true)}
            onPenaltyClick={() => setIsPenaltyModalOpen(true)}
          />
        </section>

        <section className="animate-in slide-in-from-bottom-4 duration-500 fade-in fill-mode-both" style={{ animationDelay: '200ms' }}>
          <PenaltyPool totalAmount={penaltyPool} />
        </section>

        <section className="animate-in slide-in-from-bottom-4 duration-500 fade-in fill-mode-both" style={{ animationDelay: '300ms' }}>
          <WeeklyStatus
            users={usersStatus}
            dateRange={dateRangeStr}
            weeklyTarget={weeklyTarget}
            onPrev={() => setWeekOffset(prev => prev - 1)}
            onNext={() => setWeekOffset(prev => prev + 1)}
            isNextDisabled={weekOffset >= 0}
          />
        </section>

        <section className="animate-in slide-in-from-bottom-4 duration-500 fade-in fill-mode-both" style={{ animationDelay: '400ms' }}>
          <TransactionHistory 
            transactions={transactions} 
            onDownloadPDF={handleDownloadPDF} 
            onDelete={isAdmin ? handleDeleteTransaction : undefined} 
          />
        </section>
      </div>

      <Modals
        isSavingsOpen={isSavingsModalOpen}
        isPenaltyOpen={isPenaltyModalOpen}
        isEditTargetOpen={isEditTargetModalOpen}
        onCloseSavings={() => setIsSavingsModalOpen(false)}
        onClosePenalty={() => setIsPenaltyModalOpen(false)}
        onCloseEditTarget={() => setIsEditTargetModalOpen(false)}
        onSubmitSavings={handleSavingsSubmit}
        onSubmitPenalty={handlePenaltySubmit}
        onSubmitEditTarget={handleEditTarget}
        initialTargetName={goal.targetName}
        initialTargetAmount={goal.targetAmount}
      />
    </main>
  );
}
