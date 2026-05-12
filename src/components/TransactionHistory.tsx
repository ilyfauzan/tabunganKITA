import * as React from "react"
import { FileText, Trash2 } from "lucide-react"

export type Transaction = {
  id: string
  type: 'savings' | 'penalty'
  user_name: string
  amount: number
  description: string
  date: string
  status?: string
}

interface TransactionHistoryProps {
  transactions: Transaction[]
  onDownloadPDF?: () => void
  onDelete?: (trx: Transaction) => void
}

export function TransactionHistory({ transactions, onDownloadPDF, onDelete }: TransactionHistoryProps) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="p-4 sm:p-5 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
        <h3 className="font-semibold text-gray-800">Riwayat Transaksi Terakhir</h3>
        {onDownloadPDF && (
          <button
            onClick={onDownloadPDF}
            className="flex items-center gap-1.5 text-xs font-medium text-red-600 bg-red-50 px-3 py-1.5 rounded-full hover:bg-red-100 transition-colors active:scale-95"
          >
            <FileText size={14} />
            <span className="hidden sm:inline">Download PDF</span>
            <span className="sm:hidden">PDF</span>
          </button>
        )}
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="text-xs text-gray-500 bg-gray-50 uppercase">
            <tr>
              <th className="px-3 py-3">Tanggal</th>
              <th className="px-3 py-3">Nama</th>
              <th className="px-3 py-3">Kategori</th>
              <th className="px-3 py-3 text-right">Nominal</th>
              {onDelete && <th className="px-2 py-3 w-10"></th>}
            </tr>
          </thead>
          <tbody>
            {transactions.length === 0 ? (
              <tr>
                <td colSpan={onDelete ? 5 : 4} className="px-5 py-8 text-center text-gray-400 italic">
                  Belum ada riwayat transaksi
                </td>
              </tr>
            ) : (
              transactions.map((trx) => (
                <tr key={trx.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                  <td className="px-3 py-3 text-gray-500 whitespace-nowrap">
                    {new Date(trx.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                  </td>
                  <td className="px-3 py-3 font-medium text-gray-700">{trx.user_name}</td>
                  <td className="px-3 py-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${trx.type === 'savings'
                        ? 'bg-blue-50 text-blue-600'
                        : 'bg-red-50 text-red-600'
                      }`}>
                      {trx.description}
                    </span>
                  </td>
                  <td className={`px-3 py-3 text-right font-medium whitespace-nowrap ${trx.type === 'savings' ? 'text-green-600' : 'text-red-600'
                    }`}>
                    {trx.type === 'savings' ? '+' : ''}Rp {trx.amount.toLocaleString('id-ID')}
                  </td>
                  {onDelete && (
                    <td className="px-2 py-3 text-center">
                      <button 
                        onClick={() => onDelete(trx)}
                        className="text-gray-400 hover:text-red-500 transition-colors p-1.5 rounded-full hover:bg-red-50"
                        title="Hapus transaksi"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
