'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Cookies from 'js-cookie'
import AdminSidebar from '@/components/AdminSidebar'
import AdminHeader from '@/components/AdminHeader'
import { paymentsAPI } from '@/lib/api'

export default function AdminPaymentsPage() {
  const router = useRouter()
  const [payments, setPayments] = useState([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    total: 0,
    completed: 0,
    pending: 0,
    revenue: 0
  })

  useEffect(() => {
    const token = Cookies.get('token')
    const role = Cookies.get('userRole')
    
    if (!token || role !== 'admin') {
      router.push('/auth/login')
      return
    }
    loadPayments()
  }, [router])

  const loadPayments = async () => {
    try {
      const response = await paymentsAPI.getAll()
      const allPayments = response.data.data || []
      setPayments(allPayments)
      
      // Calculate stats
      setStats({
        total: allPayments.length,
        completed: allPayments.filter((p: any) => p.status === 'completed').length,
        pending: allPayments.filter((p: any) => p.status === 'pending').length,
        revenue: allPayments
          .filter((p: any) => p.status === 'completed')
          .reduce((sum: number, p: any) => sum + parseFloat(p.amount || 0), 0)
      })
    } catch (error) {
      console.error('Failed to load payments:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen bg-slate-100">
      <AdminSidebar />
      
      <div className="flex-1 ml-64">
        <AdminHeader />
        
        <div className="p-6 space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Payments</h1>
              <p className="text-slate-500">Manage all payment transactions</p>
            </div>
            <button className="px-4 py-2 border border-slate-200 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50 flex items-center gap-2">
              <i className="fas fa-download"></i> Export
            </button>
          </div>

          <div className="grid grid-cols-4 gap-4">
            <div className="bg-white rounded-xl p-5 border border-slate-200">
              <p className="text-sm text-slate-500 mb-1">Total Transactions</p>
              <p className="text-2xl font-bold text-slate-900">{stats.total}</p>
            </div>
            <div className="bg-white rounded-xl p-5 border border-slate-200">
              <p className="text-sm text-slate-500 mb-1">Completed</p>
              <p className="text-2xl font-bold text-green-600">{stats.completed}</p>
            </div>
            <div className="bg-white rounded-xl p-5 border border-slate-200">
              <p className="text-sm text-slate-500 mb-1">Pending</p>
              <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
            </div>
            <div className="bg-white rounded-xl p-5 border border-slate-200">
              <p className="text-sm text-slate-500 mb-1">Total Revenue</p>
              <p className="text-2xl font-bold text-slate-900">₹{stats.revenue.toLocaleString()}</p>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <table className="w-full">
              <thead className="bg-slate-50">
                <tr>
                  <th className="text-left text-sm font-medium text-slate-500 px-4 py-3">Transaction ID</th>
                  <th className="text-left text-sm font-medium text-slate-500 px-4 py-3">Student</th>
                  <th className="text-left text-sm font-medium text-slate-500 px-4 py-3">Type</th>
                  <th className="text-left text-sm font-medium text-slate-500 px-4 py-3">Amount</th>
                  <th className="text-left text-sm font-medium text-slate-500 px-4 py-3">Status</th>
                  <th className="text-left text-sm font-medium text-slate-500 px-4 py-3">Date</th>
                  <th className="text-left text-sm font-medium text-slate-500 px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {payments.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-slate-500">
                      No payments found
                    </td>
                  </tr>
                ) : (
                  payments.map((payment: any) => (
                    <tr key={payment.id} className="border-t border-slate-100 hover:bg-slate-50">
                      <td className="px-4 py-4 text-sm font-mono text-slate-900">{payment.payment_id}</td>
                      <td className="px-4 py-4 text-sm text-slate-600">
                        {payment.user_id || 'N/A'}
                      </td>
                      <td className="px-4 py-4 text-sm text-slate-600">{payment.payment_type}</td>
                      <td className="px-4 py-4 text-sm font-medium text-slate-900">₹{payment.amount}</td>
                      <td className="px-4 py-4">
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          payment.status === 'completed' ? 'bg-green-100 text-green-600' :
                          payment.status === 'pending' ? 'bg-yellow-100 text-yellow-600' :
                          'bg-red-100 text-red-600'
                        }`}>
                          {payment.status}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-sm text-slate-600">
                        {new Date(payment.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-4">
                        <button className="text-orange-600 text-sm hover:text-orange-700">
                          View
                        </button>
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
  )
}

