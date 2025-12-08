'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { adminAPI } from '@/lib/api'
import Cookies from 'js-cookie'
import AdminSidebar from '@/components/AdminSidebar'
import AdminHeader from '@/components/AdminHeader'
import Link from 'next/link'


type StatusCount = {
  status: string
  count: number
}

type AIStatusCount = {
  ai_verification_status: string
  count: number
}

type Revenue = {
  application_fee_revenue: number
}

type Analytics = {
  statusCounts: StatusCount[]
  aiStatusCounts: AIStatusCount[]
  revenue: Revenue
  recentApplications: number
}

type Application = {
  id: number
  application_id?: string
  first_name?: string
  last_name?: string
  email?: string
  university_name?: string
  program_name?: string
  status?: string
  created_at?: string
}

export default function AdminDashboard() {
  const router = useRouter()


  const [analytics, setAnalytics] = useState<Analytics | null>(null)
  const [applications, setApplications] = useState<Application[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const checkAuth = async () => {
      const token = Cookies.get('token')
      const role = Cookies.get('userRole')
      
      if (!token || role !== 'admin') {
        router.push('/auth/login')
        return
      }

      try {
        await adminAPI.getAnalytics()
        loadData()
      } catch (error) {
        Cookies.remove('token')
        Cookies.remove('userRole')
        router.push('/auth/login')
      }
    }
    
    checkAuth()
  }, [router])

  const loadData = async () => {
    try {
      const [analyticsRes, applicationsRes] = await Promise.all([
        adminAPI.getAnalytics(),
        adminAPI.getApplications({ limit: 10 })
      ])

      setAnalytics(analyticsRes.data.data)
      setApplications(applicationsRes.data.data || [])
    } catch (error) {
      console.error('Failed to load data:', error)

    
      setAnalytics({
        statusCounts: [],
        aiStatusCounts: [],
        revenue: { application_fee_revenue: 0 },
        recentApplications: 0
      })
      setApplications([])
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
              <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
              <p className="text-slate-500">Welcome back! Here's what's happening today.</p>
            </div>
          </div>

          {}
          <div className="grid grid-cols-4 gap-4">
            <div className="bg-white rounded-xl p-5 border">Total Applications</div>
            <div className="bg-white rounded-xl p-5 border">Pending Review</div>
            <div className="bg-white rounded-xl p-5 border">Revenue</div>
            <div className="bg-white rounded-xl p-5 border">Open Tickets</div>
          </div>

          {}
          <div className="grid grid-cols-3 gap-6">
            <div className="col-span-2 bg-white rounded-xl border">
              <div className="p-5 border-b flex justify-between">
                <h2 className="text-lg font-semibold">Recent Applications</h2>
                <Link href="/admin/applications" className="text-orange-600 text-sm">
                  View All →
                </Link>
              </div>

              <div className="divide-y">
                {applications.length > 0 ? (
                  applications.slice(0, 5).map((app, idx) => (
                    <Link
                      key={app.id || idx}
                      href={`/admin/applications/${app.id || idx}`}
                      className="p-4 flex justify-between hover:bg-slate-50"
                    >
                      <div>
                        <p className="font-medium">
                          {app.first_name} {app.last_name}
                        </p>
                        <p className="text-xs text-slate-500">
                          {app.university_name} - {app.program_name}
                        </p>
                      </div>
                      <span className="text-xs text-slate-400">
                        {app.status || 'submitted'}
                      </span>
                    </Link>
                  ))
                ) : (
                  <p className="p-6 text-center text-slate-500">
                    No recent applications
                  </p>
                )}
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}
