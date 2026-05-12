import * as React from "react"
import { Button } from "./ui/button"
import { Wallet, AlertOctagon } from "lucide-react"

interface QuickActionsProps {
  onSavingsClick: () => void
  onPenaltyClick: () => void
}

export function QuickActions({ onSavingsClick, onPenaltyClick }: QuickActionsProps) {
  return (
    <div className="grid grid-cols-2 gap-4 w-full">
      <Button 
        onClick={onSavingsClick}
        className="h-24 flex flex-col gap-2 rounded-2xl bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 shadow-sm transition-all hover:shadow-md hover:-translate-y-1"
        variant="outline"
      >
        <Wallet size={28} />
        <span className="font-semibold">Bayar Tabungan</span>
      </Button>

      <Button 
        onClick={onPenaltyClick}
        className="h-24 flex flex-col gap-2 rounded-2xl bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 shadow-sm transition-all hover:shadow-md hover:-translate-y-1"
        variant="outline"
      >
        <AlertOctagon size={28} />
        <span className="font-semibold">Input Denda</span>
      </Button>
    </div>
  )
}
