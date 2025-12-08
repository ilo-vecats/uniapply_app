'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { adminAPI } from '@/lib/api'
import Cookies from 'js-cookie'
import AdminSidebar from '@/components/AdminSidebar'
import AdminHeader from '@/components/AdminHeader'
import Link from 'next/link'

// ================= TYPES =================

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

// ================= COMPONENT =================

export default function AdminDashboard() {
  const router = useRouter()

  const [analytics, setAnalytics] = useState<Analytics | null>(null)
  const [applications, setApplications] = useState<Application[]>([])
  const [loading, setLoading] = useState(true)

  // -------- AUTH CHECK --------
  useEffect(() => {
    const token = Cookies.get('token')
    const role = Cookies.get('userRole')

    if (!token || role !== 'admin') {
      router.push('/auth/login')
      return
    }

    loadData()
  }, [router])

  // -------- DATA LOAD --------
  const loadData = async () => {
    try {
      setLoading(true)

      const [analyticsRes, applicationsRes] = await Promise.all([
        adminAPI.getAnalytics(),
        adminAPI.getApplications({ limit: 10 })
      ])

      setAnalytics(analyticsRes.data?.data || null)
      setApplications(applicationsRes.data?.data || [])
    } catch (error) {
      console.error('Dashboard load failed:', error)
      setAnalytics(null)
      setApplications([])
    } finally {
      setLoading(false)
    }
  }

  // -------- DERIVED METRICS (SAFE) --------
  const totalApplications =
    analytics?.statusCounts?.reduce((sum, s) => sum + Number(s.count || 0), 0) || 0

  const pendingReview =
    analytics?.statusCounts?.find((s) => s.status === 'submitted')?.count || 0

  const openTickets = 0 // backend not implemented yet

  const revenueThisMonth = analytics?.revenue?.application_fee_revenue || 0

  // -------- LOADING --------
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

  // ================= UI =================
  return (
    <div className="flex min-h-screen bg-slate-100">
      <AdminSidebar />

      <div className="flex-1 ml-64">
        <AdminHeader />

        <div className="p-6 space-y-6">

          <div>
            <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
            <p className="text-slate-500">Welcome back!</p>
          </div>

          {/* ===== METRIC CARDS ===== */}
          <div className="grid grid-cols-4 gap-4">

            <div className="bg-white p-5 rounded-xl border">
              <p className="text-sm text-slate-500">Total Applications</p>
              <p className="text-2xl font-bold mt-1">{totalApplications}</p>
            </div>

            <div className="bg-white p-5 rounded-xl border">
              <p className="text-sm text-slate-500">Pending Review</p>
              <p className="text-2xl font-bold mt-1">{pendingReview}</p>
            </div>

            <div className="bg-white p-5 rounded-xl border">
              <p className="text-sm text-slate-500">Revenue (This Month)</p>
              <p className="text-2xl font-bold mt-1">
                ₹{revenueThisMonth}
              </p>
            </div>

            <div className="bg-white p-5 rounded-xl border">
              <p className="text-sm text-slate-500">Open Tickets</p>
              <p className="text-2xl font-bold mt-1">{openTickets}</p>
            </div>

          </div>

          {/* ===== RECENT APPLICATIONS ===== */}
          <div className="bg-white rounded-xl border">
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
  )
}
