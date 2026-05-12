import * as React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card"
import { Pencil } from "lucide-react"

interface ProgressBarProps {
  currentAmount: number
  targetAmount: number
  targetName: string
  isAdmin?: boolean
  onEditTarget?: () => void
}

export function ProgressBar({ currentAmount, targetAmount, targetName, isAdmin, onEditTarget }: ProgressBarProps) {
  const percentage = targetAmount > 0 ? Math.min(Math.round((currentAmount / targetAmount) * 100), 100) : 0;

  return (
    <Card className="w-full bg-gradient-to-br from-pink-50 to-blue-50 border-pink-100 shadow-md">
      <CardHeader className="pb-2">
        <CardTitle className="text-gray-700 font-bold text-lg flex justify-between items-center">
          <div className="flex items-center gap-2">
            <span>Target: {targetName}</span>
            {isAdmin && onEditTarget && (
              <button onClick={onEditTarget} className="text-gray-400 hover:text-pink-500 transition-colors" title="Edit Target">
                <Pencil size={16} />
              </button>
            )}
          </div>
          <span className="text-primary">{percentage}%</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="w-full bg-white rounded-full h-4 overflow-hidden border border-gray-100">
          <div 
            className="bg-gradient-to-r from-pink-400 to-blue-400 h-4 rounded-full transition-all duration-1000 ease-out"
            style={{ width: `${percentage}%` }}
          ></div>
        </div>
        <div className="flex justify-between mt-3 text-sm">
          <div className="flex flex-col">
            <span className="text-gray-400 text-xs font-medium">Terkumpul</span>
            <span className="font-bold text-gray-700">Rp {currentAmount.toLocaleString('id-ID')}</span>
          </div>
          <div className="flex flex-col text-right">
            <span className="text-gray-400 text-xs font-medium">Target</span>
            <span className="font-bold text-gray-700">Rp {targetAmount.toLocaleString('id-ID')}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
