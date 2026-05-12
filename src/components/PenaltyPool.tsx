import * as React from "react"
import { Card, CardContent } from "./ui/card"
import { AlertCircle, Utensils } from "lucide-react"

interface PenaltyPoolProps {
  totalAmount: number
}

export function PenaltyPool({ totalAmount }: PenaltyPoolProps) {
  return (
    <Card className="w-full bg-gradient-to-br from-red-50 to-orange-50 border-red-100 shadow-sm relative overflow-hidden">
      <div className="absolute -right-4 -top-4 opacity-10">
        <Utensils size={100} />
      </div>
      <CardContent className="p-6">
        <div className="flex items-center space-x-3 mb-2">
          <div className="p-2 bg-red-100 rounded-full text-red-500">
            <AlertCircle size={24} />
          </div>
          <h3 className="font-semibold text-red-900 text-lg">Total Denda</h3>
        </div>
        <div className="text-3xl font-bold text-red-600">
          Rp {totalAmount.toLocaleString('id-ID')}
        </div>
      </CardContent>
    </Card>
  )
}
