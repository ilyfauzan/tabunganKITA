import * as React from "react"
import { useState } from "react"
import { Button } from "./ui/button"

interface ModalsProps {
  isSavingsOpen: boolean
  isPenaltyOpen: boolean
  isEditTargetOpen?: boolean
  onCloseSavings: () => void
  onClosePenalty: () => void
  onCloseEditTarget?: () => void
  onSubmitSavings: (amount: number, category: string, userName: string) => void
  onSubmitPenalty: (user: string, penaltyType: string) => void
  onSubmitEditTarget?: (name: string, amount: number) => void
  
  initialTargetName?: string
  initialTargetAmount?: number
}

export function Modals({
  isSavingsOpen,
  isPenaltyOpen,
  isEditTargetOpen,
  onCloseSavings,
  onClosePenalty,
  onCloseEditTarget,
  onSubmitSavings,
  onSubmitPenalty,
  onSubmitEditTarget,
  initialTargetName = '',
  initialTargetAmount = 0
}: ModalsProps) {
  const [savingsAmount, setSavingsAmount] = useState<number>(70000)
  const [savingsUser, setSavingsUser] = useState<string>('Fauzan')

  const [penaltyUser, setPenaltyUser] = useState<string>('Fauzan')
  const [penaltyType, setPenaltyType] = useState<string>('Lupa Pergi')
  const [customPenalty, setCustomPenalty] = useState<string>('')

  // Admin states
  const [targetName, setTargetName] = useState(initialTargetName)
  const [targetAmount, setTargetAmount] = useState(initialTargetAmount)

  React.useEffect(() => {
    if (isEditTargetOpen) {
      setTargetName(initialTargetName)
      setTargetAmount(initialTargetAmount)
    }
  }, [isEditTargetOpen, initialTargetName, initialTargetAmount])

  if (!isSavingsOpen && !isPenaltyOpen && !isEditTargetOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      {isSavingsOpen && (
        <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-xl animate-in fade-in zoom-in duration-200">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Bayar Tabungan</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Siapa yang menabung?</label>
              <select 
                className="w-full border-gray-200 rounded-lg p-2.5 bg-gray-50 border focus:ring-2 focus:ring-primary/20 outline-none transition-all mb-2"
                value={savingsUser}
                onChange={(e) => setSavingsUser(e.target.value)}
              >
                <option value="Fauzan">Fauzan</option>
                <option value="Alvina">Alvina</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nominal (Minimal Rp 70.000)</label>
              <input 
                type="number"
                className="w-full border-gray-200 rounded-lg p-2.5 bg-gray-50 border focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                value={savingsAmount === 0 ? '' : savingsAmount}
                onChange={(e) => setSavingsAmount(e.target.value ? Number(e.target.value) : 0)}
                min={70000}
              />
              {savingsAmount > 0 && savingsAmount < 70000 && (
                <p className="text-xs text-red-500 mt-1.5">Nominal minimal adalah Rp 70.000</p>
              )}
            </div>
            <div className="flex gap-3 pt-4">
              <Button variant="outline" className="w-full" onClick={onCloseSavings}>Batal</Button>
              <Button 
                className="w-full" 
                disabled={savingsAmount < 70000}
                onClick={() => {
                  onSubmitSavings(savingsAmount, 'Wajib', savingsUser)
                  onCloseSavings()
                }}
              >
                Simpan
              </Button>
            </div>
          </div>
        </div>
      )}

      {isPenaltyOpen && (
        <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-xl animate-in fade-in zoom-in duration-200">
          <h2 className="text-xl font-bold text-red-600 mb-4">Input Denda</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Siapa yang didenda?</label>
              <select 
                className="w-full border-gray-200 rounded-lg p-2.5 bg-gray-50 border focus:ring-2 focus:ring-red-400/20 outline-none transition-all"
                value={penaltyUser}
                onChange={(e) => setPenaltyUser(e.target.value)}
              >
                <option value="Fauzan">Fauzan</option>
                <option value="Alvina">Alvina</option>
              </select>
            </div>

            <div className="flex gap-3 pt-4">
              <Button variant="outline" className="w-full" onClick={onClosePenalty}>Batal</Button>
              <Button variant="destructive" className="w-full" onClick={() => {
                onSubmitPenalty(penaltyUser, 'Melanggar Aturan')
                onClosePenalty()
              }}>Catat Denda</Button>
            </div>
          </div>
        </div>
      )}

      {/* Admin: Edit Target */}
      {isEditTargetOpen && (
        <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-xl animate-in fade-in zoom-in duration-200 border-2 border-pink-200">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-gray-800">Edit Target (Admin)</h2>
            <span className="text-xs font-bold bg-pink-100 text-pink-600 px-2 py-1 rounded-md">👑 Mode Admin</span>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nama Target</label>
              <input 
                type="text"
                className="w-full border-gray-200 rounded-lg p-2.5 bg-gray-50 border focus:ring-2 focus:ring-pink-400/20 outline-none transition-all"
                value={targetName}
                onChange={(e) => setTargetName(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nominal Target Akhir (Rp)</label>
              <input 
                type="number"
                className="w-full border-gray-200 rounded-lg p-2.5 bg-gray-50 border focus:ring-2 focus:ring-pink-400/20 outline-none transition-all"
                value={targetAmount === 0 ? '' : targetAmount}
                onChange={(e) => setTargetAmount(e.target.value ? Number(e.target.value) : 0)}
              />
            </div>
            <div className="flex gap-3 pt-4">
              <Button variant="outline" className="w-full" onClick={onCloseEditTarget}>Batal</Button>
              <Button className="w-full" onClick={() => {
                if (onSubmitEditTarget) onSubmitEditTarget(targetName, targetAmount)
              }}>Simpan Perubahan</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
