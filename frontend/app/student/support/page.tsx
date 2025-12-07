'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Cookies from 'js-cookie'
import StudentSidebar from '@/components/StudentSidebar'
import StudentHeader from '@/components/StudentHeader'
import { supportAPI } from '@/lib/api'

export default function SupportPage() {
  const router = useRouter()
  const [tickets, setTickets] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({
    subject: '',
    category: 'general',
    description: '',
    applicationId: ''
  })

  useEffect(() => {
    const token = Cookies.get('token')
    if (!token) {
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
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await supportAPI.createTicket(formData)
      setShowForm(false)
      setFormData({ subject: '', category: 'general', description: '', applicationId: '' })
      loadTickets()
      alert('Ticket created successfully!')
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to create ticket')
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
      <StudentSidebar />
      
      <div className="flex-1 ml-64">
        <StudentHeader />
        
        <div className="p-6 space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Support</h1>
              <p className="text-slate-500">Get help with your applications</p>
            </div>
            <button
              onClick={() => setShowForm(!showForm)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700"
            >
              {showForm ? 'Cancel' : '+ Create Ticket'}
            </button>
          </div>

          {showForm && (
            <div className="bg-white rounded-xl border border-slate-200 p-5">
              <h2 className="text-lg font-semibold text-slate-900 mb-4">Create Support Ticket</h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Subject</label>
                  <input
                    type="text"
                    required
                    className="w-full px-4 py-2 border border-slate-200 rounded-lg text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Category</label>
                  <select
                    className="w-full px-4 py-2 border border-slate-200 rounded-lg text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  >
                    <option value="general">General Inquiry</option>
                    <option value="application">Application Issue</option>
                    <option value="payment">Payment Issue</option>
                    <option value="document">Document Issue</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Description</label>
                  <textarea
                    rows={5}
                    required
                    className="w-full px-4 py-2 border border-slate-200 rounded-lg text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  />
                </div>
                <button
                  type="submit"
                  className="w-full bg-blue-600 text-white py-2 rounded-lg font-medium hover:bg-blue-700"
                >
                  Submit Ticket
                </button>
              </form>
            </div>
          )}

          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">My Tickets</h2>
            <div className="space-y-3">
              {tickets.length === 0 ? (
                <p className="text-center text-slate-500 py-8">No tickets yet</p>
              ) : (
                tickets.map((ticket: any) => (
                  <div key={ticket.id} className="p-4 hover:bg-slate-50 cursor-pointer border border-slate-100 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-medium text-slate-400">{ticket.ticket_id}</span>
                          <span className="px-2 py-0.5 text-xs rounded-full bg-slate-100 text-slate-600">
                            {ticket.category}
                          </span>
                        </div>
                        <p className="font-medium text-slate-900">{ticket.subject}</p>
                        <p className="text-sm text-slate-500">{new Date(ticket.created_at).toLocaleDateString()}</p>
                        {ticket.admin_response && (
                          <p className="text-sm text-blue-600 mt-2">Response: {ticket.admin_response}</p>
                        )}
                      </div>
                      <span className={`px-3 py-1 text-xs rounded-full ${getStatusColor(ticket.status)}`}>
                        {ticket.status}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <h3 className="font-semibold text-slate-900 mb-4">Contact Us</h3>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <i className="fas fa-phone text-blue-600"></i>
                </div>
                <div>
                  <p className="text-sm text-slate-500">Phone</p>
                  <p className="font-medium text-slate-900">1800-123-4567</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <i className="fas fa-envelope text-blue-600"></i>
                </div>
                <div>
                  <p className="text-sm text-slate-500">Email</p>
                  <p className="font-medium text-slate-900">support@uniapply.com</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

