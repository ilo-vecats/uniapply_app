'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { adminAPI } from '@/lib/api'
import Cookies from 'js-cookie'
import AdminSidebar from '@/components/AdminSidebar'
import AdminHeader from '@/components/AdminHeader'
import Link from 'next/link'

export default function AdminApplicationsPage() {
  const router = useRouter()
  const [applications, setApplications] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    const token = Cookies.get('token')
    const role = Cookies.get('userRole')
    
    if (!token || role !== 'admin') {
      router.push('/auth/login')
      return
    }
    loadApplications()
  }, [router, filter])

  const loadApplications = async () => {
    try {
      const params: any = { limit: 50 }
      if (filter !== 'all') {
        params.status = filter
      }
      const response = await adminAPI.getApplications(params)
      setApplications(response.data.data || [])
    } catch (error) {
      console.error('Failed to load applications:', error)
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
              <h1 className="text-2xl font-bold text-slate-900">Applications</h1>
              <p className="text-slate-500">Manage and review all student applications</p>
            </div>
            <div className="flex items-center gap-3">
              <button className="px-4 py-2 border border-slate-200 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50 flex items-center gap-2">
                <i className="fas fa-filter"></i> Filters
              </button>
              <button className="px-4 py-2 border border-slate-200 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50 flex items-center gap-2">
                <i className="fas fa-download"></i> Export
              </button>
            </div>
          </div>

          <div className="flex gap-2 overflow-x-auto pb-2">
            <button 
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-lg text-sm font-medium ${filter === 'all' ? 'bg-orange-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
            >
              All ({applications.length})
            </button>
            <button 
              onClick={() => setFilter('submitted')}
              className={`px-4 py-2 rounded-lg text-sm font-medium ${filter === 'submitted' ? 'bg-orange-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
            >
              New (45)
            </button>
            <button 
              onClick={() => setFilter('submitted')}
              className={`px-4 py-2 rounded-lg text-sm font-medium ${filter === 'submitted' ? 'bg-orange-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
            >
              Under Review (89)
            </button>
            <button 
              onClick={() => setFilter('issue_raised')}
              className={`px-4 py-2 rounded-lg text-sm font-medium ${filter === 'issue_raised' ? 'bg-orange-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
            >
              Docs Pending (32)
            </button>
            <button 
              onClick={() => setFilter('verified')}
              className={`px-4 py-2 rounded-lg text-sm font-medium ${filter === 'verified' ? 'bg-orange-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
            >
              Verified (156)
            </button>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <table className="w-full">
              <thead className="bg-slate-50">
                <tr>
                  <th className="text-left text-sm font-medium text-slate-500 px-4 py-3 w-10">
                    <input type="checkbox" className="rounded" />
                  </th>
                  <th className="text-left text-sm font-medium text-slate-500 px-4 py-3">Application</th>
                  <th className="text-left text-sm font-medium text-slate-500 px-4 py-3">Student</th>
                  <th className="text-left text-sm font-medium text-slate-500 px-4 py-3">Program</th>
                  <th className="text-left text-sm font-medium text-slate-500 px-4 py-3">Documents</th>
                  <th className="text-left text-sm font-medium text-slate-500 px-4 py-3">Status</th>
                  <th className="text-left text-sm font-medium text-slate-500 px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {applications.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-slate-500">
                      No applications found
                    </td>
                  </tr>
                ) : (
                  applications.map((app: any) => (
                    <tr key={app.id} className="border-t border-slate-100 hover:bg-slate-50">
                      <td className="px-4 py-4">
                        <input type="checkbox" className="rounded" />
                      </td>
                      <td className="px-4 py-4">
                        <p className="font-medium text-slate-900">{app.application_id}</p>
                        <p className="text-xs text-slate-500">
                          {new Date(app.created_at).toLocaleDateString()}
                        </p>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center">
                            <i className="fas fa-user text-slate-600 text-xs"></i>
                          </div>
                          <div>
                            <p className="font-medium text-slate-900">{app.first_name} {app.last_name}</p>
                            <p className="text-xs text-slate-500">{app.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <p className="text-sm text-slate-900">{app.university_name}</p>
                        <p className="text-xs text-slate-500">{app.program_name}</p>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2">
                          <div className="w-24 h-2 bg-slate-200 rounded-full overflow-hidden">
                            <div className="h-full bg-yellow-500 rounded-full" style={{ width: '40%' }}></div>
                          </div>
                          <span className="text-xs text-slate-500">2/5</span>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          app.status === 'verified' ? 'bg-green-100 text-green-600' :
                          app.status === 'submitted' ? 'bg-blue-100 text-blue-600' :
                          app.status === 'issue_raised' ? 'bg-orange-100 text-orange-600' :
                          'bg-yellow-100 text-yellow-600'
                        }`}>
                          {app.status}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <Link
                          href={`/admin/applications/${app.id}`}
                          className="px-3 py-1 bg-orange-600 text-white rounded text-sm hover:bg-orange-700"
                        >
                          Review
                        </Link>
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

