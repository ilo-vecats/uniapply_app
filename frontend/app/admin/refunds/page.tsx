'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Cookies from 'js-cookie'
import AdminSidebar from '@/components/AdminSidebar'
import AdminHeader from '@/components/AdminHeader'
import api from '@/lib/api'


type Refund = {
  id: number
  refund_id: string
  student_name: string
  email: string
  application_id: string
  amount: number
  reason: string
  status: 'pending' | 'approved' | 'rejected'
}

export default function AdminRefundsPage() {
  const router = useRouter()

 
  const [refunds, setRefunds] = useState<Refund[]>([])

  useEffect(() => {
    const token = Cookies.get('token')
    const role = Cookies.get('userRole')
    
    if (!token || role !== 'admin') {
      router.push('/auth/login')
      return
    }


    setRefunds([
      {
        id: 1,
        refund_id: 'REF-001',
        student_name: 'Priya Singh',
        email: 'priya@email.com',
        application_id: 'APP-2411-000156',
        amount: 3000,
        reason: 'Application withdrawn',
        status: 'pending'
      },
      {
        id: 2,
        refund_id: 'REF-002',
        student_name: 'Amit Kumar',
        email: 'amit@email.com',
        application_id: 'APP-2411-000155',
        amount: 2500,
        reason: 'Application withdrawn',
        status: 'pending'
      }
    ])
  }, [router])

  return (
    <div className="flex min-h-screen bg-slate-100">
      <AdminSidebar />
      
      <div className="flex-1 ml-64">
        <AdminHeader />
        
        <div className="p-6 space-y-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Refund Requests</h1>
            <p className="text-slate-500">Manage and process refund requests</p>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <table className="w-full">
              <thead className="bg-slate-50">
                <tr>
                  <th className="text-left text-sm font-medium text-slate-500 px-4 py-3">Refund ID</th>
                  <th className="text-left text-sm font-medium text-slate-500 px-4 py-3">Student</th>
                  <th className="text-left text-sm font-medium text-slate-500 px-4 py-3">Application ID</th>
                  <th className="text-left text-sm font-medium text-slate-500 px-4 py-3">Amount</th>
                  <th className="text-left text-sm font-medium text-slate-500 px-4 py-3">Reason</th>
                  <th className="text-left text-sm font-medium text-slate-500 px-4 py-3">Status</th>
                  <th className="text-left text-sm font-medium text-slate-500 px-4 py-3">Actions</th>
                </tr>
              </thead>

              <tbody>
                {refunds.map((refund) => (
                  <tr key={refund.id} className="border-t border-slate-100">
                    <td className="px-4 py-4 text-sm font-mono text-slate-900">
                      {refund.refund_id}
                    </td>

                    <td className="px-4 py-4">
                      <p className="text-sm font-medium text-slate-900">
                        {refund.student_name}
                      </p>
                      <p className="text-xs text-slate-500">
                        {refund.email}
                      </p>
                    </td>

                    <td className="px-4 py-4 text-sm text-slate-600">
                      {refund.application_id}
                    </td>

                    <td className="px-4 py-4 text-sm font-medium text-slate-900">
                      ₹{refund.amount}
                    </td>

                    <td className="px-4 py-4 text-sm text-slate-500">
                      {refund.reason}
                    </td>

                    <td className="px-4 py-4">
                      <span
                        className={`px-2 py-1 text-xs rounded-full ${
                          refund.status === 'pending'
                            ? 'bg-yellow-100 text-yellow-600'
                            : refund.status === 'approved'
                            ? 'bg-green-100 text-green-600'
                            : 'bg-red-100 text-red-600'
                        }`}
                      >
                        {refund.status}
                      </span>
                    </td>

                    <td className="px-4 py-4">
                      <div className="flex gap-2">
                        <button className="px-2 py-1 bg-green-600 text-white rounded text-xs hover:bg-green-700">
                          Approve
                        </button>
                        <button className="px-2 py-1 bg-red-600 text-white rounded text-xs hover:bg-red-700">
                          Reject
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>

            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
