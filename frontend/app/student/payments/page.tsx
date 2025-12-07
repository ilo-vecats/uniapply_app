'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Cookies from 'js-cookie'
import StudentSidebar from '@/components/StudentSidebar'
import StudentHeader from '@/components/StudentHeader'
import { paymentsAPI } from '@/lib/api'

export default function PaymentsPage() {
  const router = useRouter()
  const [payments, setPayments] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = Cookies.get('token')
    if (!token) {
      router.push('/auth/login')
      return
    }
    loadPayments()
  }, [router])

  const loadPayments = async () => {
    try {
      const response = await paymentsAPI.getAll()
      setPayments(response.data.data || [])
    } catch (error) {
      console.error('Failed to load payments:', error)
    } finally {
      setLoading(false)
    }
  }

  const totalPaid = payments
    .filter((p: any) => p.status === 'completed' && p.payment_type === 'application_fee')
    .reduce((sum: number, p: any) => sum + parseFloat(p.amount || 0), 0)

  const pending = payments
    .filter((p: any) => p.status === 'pending')
    .reduce((sum: number, p: any) => sum + parseFloat(p.amount || 0), 0)

  return (
    <div className="flex min-h-screen bg-slate-100">
      <StudentSidebar />
      
      <div className="flex-1 ml-64">
        <StudentHeader />
        
        <div className="p-6 space-y-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Payments</h1>
            <p className="text-slate-500">Track all your payment transactions</p>
          </div>

          <div className="grid grid-cols-4 gap-4">
            <div className="bg-white rounded-xl p-5 border border-slate-200">
              <p className="text-sm text-slate-500 mb-1">Total Paid</p>
              <p className="text-2xl font-bold text-slate-900">₹{totalPaid}</p>
            </div>
            <div className="bg-white rounded-xl p-5 border border-slate-200">
              <p className="text-sm text-slate-500 mb-1">Pending</p>
              <p className="text-2xl font-bold text-orange-600">₹{pending}</p>
            </div>
            <div className="bg-white rounded-xl p-5 border border-slate-200">
              <p className="text-sm text-slate-500 mb-1">Refunds</p>
              <p className="text-2xl font-bold text-green-600">₹0</p>
            </div>
            <div className="bg-white rounded-xl p-5 border border-slate-200">
              <p className="text-sm text-slate-500 mb-1">Transactions</p>
              <p className="text-2xl font-bold text-slate-900">{payments.length}</p>
            </div>
          </div>

          {pending > 0 && (
            <div className="bg-orange-50 border border-orange-200 rounded-xl p-5">
              <h3 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
                <i className="fas fa-exclamation-circle text-orange-500"></i> Pending Payment
              </h3>
              <div className="flex items-center justify-between bg-white rounded-lg p-4 border border-orange-200">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-slate-100 rounded-lg flex items-center justify-center">
                    <i className="fas fa-university text-slate-600"></i>
                  </div>
                  <div>
                    <p className="font-medium text-slate-900">Application Fee</p>
                    <p className="text-sm text-slate-500">Pending payment</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <p className="text-xl font-bold text-slate-900">₹{pending}</p>
                  <button className="px-4 py-2 bg-orange-600 text-white rounded-lg font-medium hover:bg-orange-700">
                    Pay Now
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className="bg-white rounded-xl border border-slate-200">
            <div className="p-5 border-b border-slate-200">
              <h2 className="text-lg font-semibold text-slate-900">Transaction History</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="text-left text-sm font-medium text-slate-500 px-4 py-3">Transaction ID</th>
                    <th className="text-left text-sm font-medium text-slate-500 px-4 py-3">Type</th>
                    <th className="text-left text-sm font-medium text-slate-500 px-4 py-3">Date</th>
                    <th className="text-left text-sm font-medium text-slate-500 px-4 py-3">Amount</th>
                    <th className="text-left text-sm font-medium text-slate-500 px-4 py-3">Status</th>
                    <th className="text-left text-sm font-medium text-slate-500 px-4 py-3">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {payments.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-8 text-center text-slate-500">
                        No transactions yet
                      </td>
                    </tr>
                  ) : (
                    payments.map((payment: any) => (
                      <tr key={payment.id} className="border-t border-slate-100">
                        <td className="px-4 py-3 text-sm font-mono text-slate-900">{payment.payment_id}</td>
                        <td className="px-4 py-3 text-sm text-slate-600">{payment.payment_type}</td>
                        <td className="px-4 py-3 text-sm text-slate-600">
                          {new Date(payment.created_at).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-3 text-sm font-medium text-slate-900">₹{payment.amount}</td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            payment.status === 'completed' ? 'bg-green-100 text-green-600' :
                            payment.status === 'pending' ? 'bg-yellow-100 text-yellow-600' :
                            'bg-red-100 text-red-600'
                          }`}>
                            {payment.status}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          {payment.status === 'completed' && (
                            <button className="text-blue-600 text-sm hover:text-blue-700">
                              <i className="fas fa-download mr-1"></i> Receipt
                            </button>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

