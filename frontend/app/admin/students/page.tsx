'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Cookies from 'js-cookie'
import AdminSidebar from '@/components/AdminSidebar'
import AdminHeader from '@/components/AdminHeader'
import api from '@/lib/api'

type Student = {
  id: number
  first_name: string
  last_name: string
  email: string
  phone?: string
  total_applications: number
  created_at: string
}

export default function AdminStudentsPage() {
  const router = useRouter()

  const [students, setStudents] = useState<Student[]>([] as Student[])
  const [loading, setLoading] = useState<boolean>(true)

  useEffect(() => {
    const token = Cookies.get('token')
    const role = Cookies.get('userRole')

    if (!token || role !== 'admin') {
      router.push('/auth/login')
      return
    }

    loadStudents()
  }, [router])

  const loadStudents = async () => {
    try {
      const response = await api.get('/admin/students')
      setStudents(response.data?.data ?? [])
    } catch {
      console.log('Students endpoint not available, using mock data')

      setStudents([
        {
          id: 1,
          first_name: 'Rahul',
          last_name: 'Sharma',
          email: 'rahul@email.com',
          phone: '9876543210',
          total_applications: 4,
          created_at: new Date().toISOString()
        },
        {
          id: 2,
          first_name: 'Priya',
          last_name: 'Singh',
          email: 'priya@email.com',
          phone: '9876543211',
          total_applications: 2,
          created_at: new Date().toISOString()
        }
      ])
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
              <h1 className="text-2xl font-bold text-slate-900">Students</h1>
              <p className="text-slate-500">Manage all registered students</p>
            </div>
            <button className="px-4 py-2 border border-slate-200 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50 flex items-center gap-2">
              <i className="fas fa-download"></i> Export
            </button>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <table className="w-full">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-4 py-3 text-left">Student</th>
                  <th className="px-4 py-3 text-left">Email</th>
                  <th className="px-4 py-3 text-left">Phone</th>
                  <th className="px-4 py-3 text-left">Applications</th>
                  <th className="px-4 py-3 text-left">Joined</th>
                  <th className="px-4 py-3 text-left">Actions</th>
                </tr>
              </thead>

              <tbody>
                {students.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-slate-500">
                      No students found
                    </td>
                  </tr>
                ) : (
                  students.map((student) => (
                    <tr key={student.id} className="border-t">
                      <td className="px-4 py-4 font-medium">
                        {student.first_name} {student.last_name}
                      </td>
                      <td className="px-4 py-4">{student.email}</td>
                      <td className="px-4 py-4">{student.phone || 'N/A'}</td>
                      <td className="px-4 py-4">{student.total_applications}</td>
                      <td className="px-4 py-4">
                        {new Date(student.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-4">
                        <button className="text-orange-600 hover:text-orange-700">
                          View
                        </button>
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
