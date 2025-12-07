'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Cookies from 'js-cookie'
import AdminSidebar from '@/components/AdminSidebar'
import AdminHeader from '@/components/AdminHeader'
import api from '@/lib/api'

export default function DocumentConfigPage() {
  const router = useRouter()
  const [programs, setPrograms] = useState([])
  const [selectedProgram, setSelectedProgram] = useState<any>(null)
  const [requiredDocs, setRequiredDocs] = useState([])

  useEffect(() => {
    const token = Cookies.get('token')
    const role = Cookies.get('userRole')
    
    if (!token || role !== 'admin') {
      router.push('/auth/login')
      return
    }
    loadPrograms()
  }, [router])

  const loadPrograms = async () => {
    try {
      // Mock programs for now
      setPrograms([
        { id: 1, name: 'M.Tech Computer Science', code: 'MTECH_CS' },
        { id: 2, name: 'M.Tech Data Science', code: 'MTECH_DS' },
        { id: 3, name: 'MBA', code: 'MBA' }
      ])
      setRequiredDocs([
        { document_type: '10th Marksheet', is_required: true },
        { document_type: '12th Marksheet', is_required: true },
        { document_type: 'Aadhar Card', is_required: true },
        { document_type: 'Graduation Certificate', is_required: false }
      ])
    } catch (error) {
      console.error('Failed to load programs:', error)
    }
  }

  return (
    <div className="flex min-h-screen bg-slate-100">
      <AdminSidebar />
      
      <div className="flex-1 ml-64">
        <AdminHeader />
        
        <div className="p-6 space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Document Configuration</h1>
              <p className="text-slate-500">Configure required documents for each program</p>
            </div>
            <button className="px-4 py-2 bg-orange-600 text-white rounded-lg text-sm font-medium hover:bg-orange-700 flex items-center gap-2">
              <i className="fas fa-plus"></i> Add Document Type
            </button>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Required Documents</h2>
            <div className="space-y-3">
              {requiredDocs.map((doc: any, idx: number) => (
                <div key={idx} className="flex items-center justify-between p-4 border border-slate-200 rounded-lg">
                  <div className="flex items-center gap-3">
                    <i className="fas fa-file-pdf text-red-500 text-xl"></i>
                    <div>
                      <p className="font-medium text-slate-900">{doc.document_type}</p>
                      <p className="text-sm text-slate-500">
                        {doc.is_required ? 'Required for all programs' : 'Optional'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      doc.is_required ? 'bg-green-100 text-green-600' : 'bg-slate-100 text-slate-600'
                    }`}>
                      {doc.is_required ? 'Required' : 'Optional'}
                    </span>
                    <button className="p-2 text-slate-400 hover:text-slate-600">
                      <i className="fas fa-edit"></i>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

