'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { applicationsAPI } from '@/lib/api'
import Cookies from 'js-cookie'
import StudentSidebar from '@/components/StudentSidebar'
import StudentHeader from '@/components/StudentHeader'
import Link from 'next/link'

export default function ApplicationsPage() {
  const router = useRouter()
  const [applications, setApplications] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    const token = Cookies.get('token')
    if (!token) {
      router.push('/auth/login')
      return
    }
    loadApplications()
  }, [router])

  const loadApplications = async () => {
    try {
      const response = await applicationsAPI.getAll()
      setApplications(response.data.data)
    } catch (error) {
      console.error('Failed to load applications:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'verified': return 'bg-green-100 text-green-600'
      case 'submitted': return 'bg-blue-100 text-blue-600'
      case 'issue_raised': return 'bg-red-100 text-red-600'
      case 'draft': return 'bg-slate-100 text-slate-600'
      default: return 'bg-yellow-100 text-yellow-600'
    }
  }

  const filteredApplications = filter === 'all' 
    ? applications 
    : applications.filter((app: any) => app.status === filter)

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen bg-slate-100">
      <StudentSidebar />
      
      <div className="flex-1 ml-64">
        <StudentHeader />
        
        <div className="p-6 space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">My Applications</h1>
              <p className="text-slate-500">Manage and track all your university applications</p>
            </div>
            <Link 
              href="/student/applications/new"
              className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 flex items-center gap-2"
            >
              <i className="fas fa-plus"></i> New Application
            </Link>
          </div>

          <div className="flex gap-3">
            <button 
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-lg text-sm font-medium ${filter === 'all' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
            >
              All ({applications.length})
            </button>
            <button 
              onClick={() => setFilter('submitted')}
              className={`px-4 py-2 rounded-lg text-sm font-medium ${filter === 'submitted' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
            >
              Pending ({applications.filter((a: any) => a.status === 'submitted').length})
            </button>
            <button 
              onClick={() => setFilter('verified')}
              className={`px-4 py-2 rounded-lg text-sm font-medium ${filter === 'verified' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
            >
              Approved ({applications.filter((a: any) => a.status === 'verified').length})
            </button>
            <button 
              onClick={() => setFilter('draft')}
              className={`px-4 py-2 rounded-lg text-sm font-medium ${filter === 'draft' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
            >
              Draft ({applications.filter((a: any) => a.status === 'draft').length})
            </button>
          </div>

          <div className="space-y-4">
            {filteredApplications.length === 0 ? (
              <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
                <i className="fas fa-file-alt text-4xl text-slate-400 mb-4"></i>
                <p className="text-slate-500">No applications found</p>
                <Link 
                  href="/student/applications/new"
                  className="mt-4 inline-block bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                >
                  Create Your First Application
                </Link>
              </div>
            ) : (
              filteredApplications.map((app: any) => (
                <div key={app.id} className="bg-white rounded-xl border border-slate-200 p-5 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between">
                    <div className="flex gap-4">
                      <div className="w-16 h-16 bg-slate-100 rounded-xl flex items-center justify-center">
                        <i className="fas fa-university text-slate-600 text-2xl"></i>
                      </div>
                      <div>
                        <div className="flex items-center gap-3 mb-1">
                          <h3 className="font-semibold text-slate-900 text-lg">{app.university_name || 'University'}</h3>
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(app.status)}`}>
                            {app.status.replace('_', ' ').toUpperCase()}
                          </span>
                        </div>
                        <p className="text-slate-600">{app.program_name || 'Program'}</p>
                        <p className="text-sm text-slate-400 mt-1">Application ID: {app.application_id}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-slate-500">Submitted</p>
                      <p className="font-medium text-slate-900">
                        {new Date(app.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between">
                    <div className="flex gap-6">
                      <div>
                        <p className="text-xs text-slate-400">Status</p>
                        <p className="text-sm font-medium text-slate-700">{app.status}</p>
                      </div>
                      {app.payment_amount && (
                        <div>
                          <p className="text-xs text-slate-400">Application Fee</p>
                          <p className="text-sm font-medium text-slate-700">₹{app.payment_amount}</p>
                        </div>
                      )}
                    </div>
                    <Link
                      href={`/student/applications/${app.id}`}
                      className="px-4 py-2 border border-slate-200 text-slate-600 rounded-lg text-sm font-medium hover:bg-slate-50"
                    >
                      View Details
                    </Link>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

