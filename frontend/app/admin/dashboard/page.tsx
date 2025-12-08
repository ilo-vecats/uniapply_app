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
  totalApplications?: number
  pendingReview?: number
  openTickets?: number
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
      setLoading(true)
      const [analyticsRes, applicationsRes] = await Promise.all([
        adminAPI.getAnalytics(),
        adminAPI.getApplications({ limit: 10 })
      ])

      if (analyticsRes.data?.success && analyticsRes.data?.data) {
        setAnalytics(analyticsRes.data.data)
      } else {
        // Fallback if data structure is different
        setAnalytics({
          statusCounts: [],
          aiStatusCounts: [],
          revenue: { application_fee_revenue: 0, issue_resolution_revenue: 0, total_transactions: 0 },
          recentApplications: 0,
          totalApplications: 0,
          pendingReview: 0,
          openTickets: 0
        })
      }

      if (applicationsRes.data?.success && applicationsRes.data?.data) {
        setApplications(applicationsRes.data.data || [])
      } else {
        setApplications([])
      }
    } catch (error: any) {
      console.error('Failed to load data:', error)
      console.error('Error details:', error.response?.data)

      // Set fallback data
      setAnalytics({
        statusCounts: [],
        aiStatusCounts: [],
        revenue: { application_fee_revenue: 0, issue_resolution_revenue: 0, total_transactions: 0 },
        recentApplications: 0,
        totalApplications: 0,
        pendingReview: 0,
        openTickets: 0
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

          {/* Metrics Cards */}
          <div className="grid grid-cols-4 gap-4">
            <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500">Total Applications</p>
                  <p className="text-2xl font-bold text-slate-900 mt-1">
                    {analytics?.totalApplications || 0}
                  </p>
                </div>
                <div className="p-3 bg-blue-100 rounded-lg">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500">Pending Review</p>
                  <p className="text-2xl font-bold text-slate-900 mt-1">
                    {analytics?.pendingReview || 0}
                  </p>
                </div>
                <div className="p-3 bg-yellow-100 rounded-lg">
                  <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500">Revenue (This Month)</p>
                  <p className="text-2xl font-bold text-slate-900 mt-1">
                    ₹{analytics?.revenue?.application_fee_revenue 
                      ? (analytics.revenue.application_fee_revenue / 100000).toFixed(1) + 'L'
                      : '0'}
                  </p>
                </div>
                <div className="p-3 bg-green-100 rounded-lg">
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500">Open Tickets</p>
                  <p className="text-2xl font-bold text-slate-900 mt-1">
                    {analytics?.openTickets || 0}
                  </p>
                </div>
                <div className="p-3 bg-red-100 rounded-lg">
                  <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Applications */}
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
