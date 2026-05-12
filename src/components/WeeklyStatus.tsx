import * as React from "react"
import { CheckCircle2, XCircle, ChevronLeft, ChevronRight } from "lucide-react"

interface UserStatus {
  name: string
  currentAmount: number
  targetAmount: number
}

interface WeeklyStatusProps {
  users: UserStatus[]
  dateRange: string
  weeklyTarget: number
  onPrev: () => void
  onNext: () => void
  isNextDisabled: boolean
}

export function WeeklyStatus({ users, dateRange, weeklyTarget, onPrev, onNext, isNextDisabled }: WeeklyStatusProps) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
      <div className="flex flex-col mb-4 gap-2">
        <h3 className="font-semibold text-gray-800 flex items-center justify-between">
          <span>Status Mingguan</span>
          <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
            Wajib Rp {weeklyTarget.toLocaleString('id-ID')}
          </span>
        </h3>
        
        <div className="flex items-center justify-between bg-gray-50 rounded-lg p-1.5 border border-gray-100">
          <button 
            onClick={onPrev}
            className="p-1.5 rounded-md hover:bg-white hover:shadow-sm text-gray-500 transition-all active:scale-95"
          >
            <ChevronLeft size={18} />
          </button>
          <span className="text-sm font-medium text-gray-600">{dateRange}</span>
          <button 
            onClick={onNext}
            disabled={isNextDisabled}
            className={`p-1.5 rounded-md transition-all active:scale-95 ${isNextDisabled ? 'text-gray-300 opacity-50 cursor-not-allowed' : 'hover:bg-white hover:shadow-sm text-gray-500'}`}
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </div>
      <div className="space-y-4">
        {users.map((user, idx) => {
          const isComplete = user.currentAmount >= user.targetAmount
          const progress = Math.min((user.currentAmount / user.targetAmount) * 100, 100)

          return (
            <div key={idx} className="flex flex-col gap-2">
              <div className="flex justify-between items-center">
                <span className="font-medium text-gray-700">{user.name}</span>
                <div className="flex items-center gap-1.5">
                  <span className="text-sm font-medium text-gray-500">
                    Rp {user.currentAmount.toLocaleString('id-ID')}
                  </span>
                  {isComplete ? (
                    <CheckCircle2 size={18} className="text-green-500" />
                  ) : (
                    <XCircle size={18} className="text-red-400" />
                  )}
                </div>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full transition-all duration-500 ${isComplete ? 'bg-green-400' : 'bg-blue-400'}`}
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
