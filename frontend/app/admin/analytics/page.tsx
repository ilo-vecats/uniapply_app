'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Cookies from 'js-cookie'
import AdminSidebar from '@/components/AdminSidebar'
import AdminHeader from '@/components/AdminHeader'
import { adminAPI } from '@/lib/api'


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

export default function AdminAnalyticsPage() {
  const router = useRouter()


  const [analytics, setAnalytics] = useState<Analytics | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = Cookies.get('token')
    const role = Cookies.get('userRole')

    if (!token || role !== 'admin') {
      router.push('/auth/login')
      return
    }

    loadAnalytics()
  }, [router])

  const loadAnalytics = async () => {
    try {
      const response = await adminAPI.getAnalytics()
      setAnalytics(response.data.data)
    } catch (error) {
      console.error('Failed to load analytics:', error)

    
      setAnalytics({
        statusCounts: [],
        aiStatusCounts: [],
        revenue: { application_fee_revenue: 0 },
        recentApplications: 0
      })
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
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Analytics</h1>
            <p className="text-slate-500">Comprehensive analytics and insights</p>
          </div>

          <div className="grid grid-cols-4 gap-4">
            <div className="bg-white rounded-xl p-5 border border-slate-200">
              <p className="text-sm text-slate-500 mb-1">Total Applications</p>
              <p className="text-2xl font-bold text-slate-900">
                {analytics?.statusCounts?.reduce(
                  (sum, s) => sum + Number(s.count || 0),
                  0
                ) || 0}
              </p>
            </div>

            <div className="bg-white rounded-xl p-5 border border-slate-200">
              <p className="text-sm text-slate-500 mb-1">AI Verified</p>
              <p className="text-2xl font-bold text-green-600">
                {analytics?.aiStatusCounts?.find(
                  (s) => s.ai_verification_status === 'verified'
                )?.count || 0}
              </p>
            </div>

            <div className="bg-white rounded-xl p-5 border border-slate-200">
              <p className="text-sm text-slate-500 mb-1">Total Revenue</p>
              <p className="text-2xl font-bold text-slate-900">
                ₹{analytics?.revenue?.application_fee_revenue || 0}
              </p>
            </div>

            <div className="bg-white rounded-xl p-5 border border-slate-200">
              <p className="text-sm text-slate-500 mb-1">Recent (7 days)</p>
              <p className="text-2xl font-bold text-slate-900">
                {analytics?.recentApplications || 0}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div className="bg-white rounded-xl border border-slate-200 p-5">
              <h3 className="font-semibold text-slate-900 mb-4">
                Application Status Distribution
              </h3>

              <div className="space-y-3">
                {analytics?.statusCounts?.map((status) => (
                  <div
                    key={status.status}
                    className="flex items-center justify-between"
                  >
                    <span className="text-sm text-slate-600">
                      {status.status}
                    </span>
                    <span className="font-medium text-slate-900">
                      {status.count}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 p-5">
              <h3 className="font-semibold text-slate-900 mb-4">
                AI Verification Status
              </h3>

              <div className="space-y-3">
                {analytics?.aiStatusCounts?.map((status) => (
                  <div
                    key={status.ai_verification_status}
                    className="flex items-center justify-between"
                  >
                    <span className="text-sm text-slate-600">
                      {status.ai_verification_status || 'Pending'}
                    </span>
                    <span className="font-medium text-slate-900">
                      {status.count}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}
