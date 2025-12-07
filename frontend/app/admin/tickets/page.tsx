'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Cookies from 'js-cookie'
import AdminSidebar from '@/components/AdminSidebar'
import AdminHeader from '@/components/AdminHeader'
import { supportAPI } from '@/lib/api'

export default function AdminTicketsPage() {
  const router = useRouter()
  const [tickets, setTickets] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = Cookies.get('token')
    const role = Cookies.get('userRole')
    
    if (!token || role !== 'admin') {
      router.push('/auth/login')
      return
    }
    loadTickets()
  }, [router])

  const loadTickets = async () => {
    try {
      const response = await supportAPI.getTickets()
      setTickets(response.data.data || [])
    } catch (error) {
      console.error('Failed to load tickets:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'resolved': return 'bg-green-100 text-green-600'
      case 'in_progress': return 'bg-yellow-100 text-yellow-600'
      default: return 'bg-blue-100 text-blue-600'
    }
  }

  return (
    <div className="flex min-h-screen bg-slate-100">
      <AdminSidebar />
      
      <div className="flex-1 ml-64">
        <AdminHeader />
        
        <div className="p-6 space-y-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Support Tickets</h1>
            <p className="text-slate-500">Manage student support tickets</p>
          </div>

          <div className="grid grid-cols-4 gap-4">
            <div className="bg-white rounded-xl p-5 border border-slate-200">
              <p className="text-sm text-slate-500 mb-1">Open Tickets</p>
              <p className="text-2xl font-bold text-slate-900">23</p>
            </div>
            <div className="bg-white rounded-xl p-5 border border-slate-200">
              <p className="text-sm text-slate-500 mb-1">In Progress</p>
              <p className="text-2xl font-bold text-yellow-600">12</p>
            </div>
            <div className="bg-white rounded-xl p-5 border border-slate-200">
              <p className="text-sm text-slate-500 mb-1">Resolved</p>
              <p className="text-2xl font-bold text-green-600">156</p>
            </div>
            <div className="bg-white rounded-xl p-5 border border-slate-200">
              <p className="text-sm text-slate-500 mb-1">Total</p>
              <p className="text-2xl font-bold text-slate-900">191</p>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200">
            <div className="p-5 border-b border-slate-200">
              <h2 className="text-lg font-semibold text-slate-900">All Tickets</h2>
            </div>
            <div className="divide-y divide-slate-100">
              {tickets.map((ticket: any) => (
                <div key={ticket.id} className="p-4 flex items-center justify-between hover:bg-slate-50">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-medium text-slate-400">{ticket.ticket_id}</span>
                      <span className="px-2 py-0.5 text-xs rounded-full bg-slate-100 text-slate-600">
                        {ticket.category}
                      </span>
                    </div>
                    <p className="font-medium text-slate-900">{ticket.subject}</p>
                    <p className="text-sm text-slate-500">
                      {ticket.first_name} {ticket.last_name} • {new Date(ticket.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <span className={`px-3 py-1 text-xs rounded-full ${getStatusColor(ticket.status)}`}>
                    {ticket.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

