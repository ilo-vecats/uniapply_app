'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { applicationsAPI } from '@/lib/api'
import Cookies from 'js-cookie'
import StudentSidebar from '@/components/StudentSidebar'
import StudentHeader from '@/components/StudentHeader'
import Link from 'next/link'

export default function StudentDashboard() {
  const router = useRouter()
  const [applications, setApplications] = useState([])
  const [loading, setLoading] = useState(true)

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
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  const stats = {
    total: applications.length,
    underReview: applications.filter((a: any) => a.status === 'submitted').length,
    documentsPending: applications.filter((a: any) => a.status === 'issue_raised').length,
    approved: applications.filter((a: any) => a.status === 'verified').length
  }

  return (
    <div className="flex min-h-screen bg-slate-100">
      <StudentSidebar />
      
      <div className="flex-1 ml-64">
        <StudentHeader />
        
        <div className="p-6 space-y-6">
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl p-6 text-white">
            <h1 className="text-2xl font-bold mb-2">Welcome back! 👋</h1>
            <p className="text-blue-100 mb-4">Track your applications and manage your documents all in one place.</p>
            <Link
              href="/student/applications/new"
              className="bg-white text-blue-600 px-4 py-2 rounded-lg font-medium hover:bg-blue-50 flex items-center gap-2 inline-block"
            >
              <i className="fas fa-plus"></i> New Application
            </Link>
          </div>

          <div className="grid grid-cols-4 gap-4">
            <div className="bg-white rounded-xl p-5 border border-slate-200">
              <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center mb-3">
                <i className="fas fa-file-alt text-blue-600 text-xl"></i>
              </div>
              <p className="text-2xl font-bold text-slate-900">{stats.total}</p>
              <p className="text-sm text-slate-500">Total Applications</p>
            </div>
            <div className="bg-white rounded-xl p-5 border border-slate-200">
              <div className="w-12 h-12 rounded-lg bg-yellow-100 flex items-center justify-center mb-3">
                <i className="fas fa-clock text-yellow-600 text-xl"></i>
              </div>
              <p className="text-2xl font-bold text-slate-900">{stats.underReview}</p>
              <p className="text-sm text-slate-500">Under Review</p>
            </div>
            <div className="bg-white rounded-xl p-5 border border-slate-200">
              <div className="w-12 h-12 rounded-lg bg-orange-100 flex items-center justify-center mb-3">
                <i className="fas fa-exclamation-circle text-orange-600 text-xl"></i>
              </div>
              <p className="text-2xl font-bold text-slate-900">{stats.documentsPending}</p>
              <p className="text-sm text-slate-500">Documents Pending</p>
            </div>
            <div className="bg-white rounded-xl p-5 border border-slate-200">
              <div className="w-12 h-12 rounded-lg bg-green-100 flex items-center justify-center mb-3">
                <i className="fas fa-check-circle text-green-600 text-xl"></i>
              </div>
              <p className="text-2xl font-bold text-slate-900">{stats.approved}</p>
              <p className="text-sm text-slate-500">Approved</p>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200">
            <div className="p-5 border-b border-slate-200 flex justify-between items-center">
              <h2 className="text-lg font-semibold text-slate-900">Recent Applications</h2>
              <Link href="/student/applications" className="text-blue-600 text-sm font-medium hover:text-blue-700">
                View All →
              </Link>
            </div>
            <div className="divide-y divide-slate-100">
              {applications.slice(0, 3).map((app: any) => (
                <Link
                  key={app.id}
                  href={`/student/applications/${app.id}`}
                  className="p-5 flex items-center justify-between hover:bg-slate-50 cursor-pointer"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-slate-100 rounded-lg flex items-center justify-center">
                      <i className="fas fa-university text-slate-600 text-xl"></i>
                    </div>
                    <div>
                      <p className="font-medium text-slate-900">{app.university_name || 'University'}</p>
                      <p className="text-sm text-slate-500">{app.program_name || 'Program'}</p>
                      <p className="text-xs text-slate-400 mt-1">APP-{app.application_id}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      app.status === 'verified' ? 'bg-green-100 text-green-600' :
                      app.status === 'submitted' ? 'bg-blue-100 text-blue-600' :
                      'bg-yellow-100 text-yellow-600'
                    }`}>
                      {app.status?.replace('_', ' ').toUpperCase()}
                    </span>
                    <i className="fas fa-chevron-right text-slate-400"></i>
                  </div>
                </Link>
              ))}
              {applications.length === 0 && (
                <div className="p-12 text-center">
                  <p className="text-slate-500">No applications yet. Create your first application!</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
