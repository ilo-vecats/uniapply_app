'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Cookies from 'js-cookie'
import StudentSidebar from '@/components/StudentSidebar'
import StudentHeader from '@/components/StudentHeader'
import Link from 'next/link'
import { applicationsAPI, documentsAPI } from '@/lib/api'

export default function ApplicationDetailPage() {
  const router = useRouter()
  const params = useParams()
  const applicationId = params.id
  const [application, setApplication] = useState<any>(null)
  const [documents, setDocuments] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = Cookies.get('token')
    if (!token) {
      router.push('/auth/login')
      return
    }
    loadData()
  }, [applicationId, router])

  const loadData = async () => {
    try {
      const [appRes, docsRes] = await Promise.all([
        applicationsAPI.getById(applicationId as string),
        documentsAPI.getByApplication(applicationId as string)
      ])
      setApplication(appRes.data.data)
      setDocuments(docsRes.data.data || [])
    } catch (error) {
      console.error('Failed to load data:', error)
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'verified': return 'bg-green-100 text-green-600'
      case 'submitted': return 'bg-blue-100 text-blue-600'
      case 'issue_raised': return 'bg-red-100 text-red-600'
      default: return 'bg-yellow-100 text-yellow-600'
    }
  }

  return (
    <div className="flex min-h-screen bg-slate-100">
      <StudentSidebar />
      
      <div className="flex-1 ml-64">
        <StudentHeader />
        
        <div className="p-6">
          <Link href="/student/applications" className="text-slate-500 hover:text-slate-700 flex items-center gap-1 mb-4 text-sm">
            <i className="fas fa-arrow-left"></i> Back to Applications
          </Link>

          <div className="flex justify-between items-start mb-6">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-2xl font-bold text-slate-900">{application?.university_name}</h1>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(application?.status)}`}>
                  {application?.status?.replace('_', ' ').toUpperCase()}
                </span>
              </div>
              <p className="text-slate-600">{application?.program_name}</p>
              <p className="text-sm text-slate-400 mt-1">Application ID: {application?.application_id}</p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-6">
            <div className="col-span-2 space-y-6">
              {/* Status Timeline */}
              <div className="bg-white rounded-xl border border-slate-200 p-5">
                <h2 className="text-lg font-semibold text-slate-900 mb-6">Application Status</h2>
                <div className="flex items-center justify-between">
                  {['Submitted', 'Under Review', 'Docs Pending', 'Verified', 'Payment', 'Decision'].map((step, idx) => {
                    const stepNum = idx + 1
                    const isCompleted = stepNum <= 2
                    const isCurrent = stepNum === 3
                    return (
                      <div key={step} className="flex flex-col items-center flex-1">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white ${
                          isCompleted ? 'bg-green-500' : isCurrent ? 'bg-blue-500' : 'bg-slate-200'
                        }`}>
                          {isCompleted ? <i className="fas fa-check"></i> : isCurrent ? <i className="fas fa-spinner fa-spin"></i> : stepNum}
                        </div>
                        <p className="text-xs mt-2 font-medium">{step}</p>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Documents */}
              <div className="bg-white rounded-xl border border-slate-200 p-5">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-semibold text-slate-900">Documents</h2>
                  <Link
                    href={`/student/applications/${applicationId}/documents`}
                    className="text-blue-600 text-sm font-medium hover:text-blue-700"
                  >
                    <i className="fas fa-plus mr-1"></i> Add Document
                  </Link>
                </div>
                <div className="space-y-3">
                  {documents.map((doc: any) => (
                    <div key={doc.id} className={`p-4 rounded-lg border ${
                      doc.admin_verification_status === 'verified' ? 'border-green-200 bg-green-50' :
                      doc.is_rejected ? 'border-red-200 bg-red-50' :
                      'border-yellow-200 bg-yellow-50'
                    }`}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <i className="fas fa-file-alt text-green-600"></i>
                          <div>
                            <p className="font-medium text-slate-900">{doc.document_type}</p>
                            <p className="text-xs text-slate-500">{doc.file_name}</p>
                            {doc.ai_extracted_data && (
                              <div className="mt-2 text-xs">
                                <p className="text-slate-600">AI Extracted: {JSON.stringify(doc.ai_extracted_data).substring(0, 50)}...</p>
                              </div>
                            )}
                          </div>
                        </div>
                        <span className={`flex items-center gap-1 text-sm ${
                          doc.admin_verification_status === 'verified' ? 'text-green-600' :
                          doc.is_rejected ? 'text-red-600' :
                          'text-yellow-600'
                        }`}>
                          {doc.admin_verification_status === 'verified' && <i className="fas fa-check-circle"></i>}
                          {doc.is_rejected && <i className="fas fa-times-circle"></i>}
                          {!doc.admin_verification_status && <i className="fas fa-clock"></i>}
                          {doc.admin_verification_status === 'verified' ? 'Verified' :
                           doc.is_rejected ? 'Rejected' : 'Pending'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="bg-white rounded-xl border border-slate-200 p-5">
                <h3 className="font-semibold text-slate-900 mb-4">Application Info</h3>
                <div className="space-y-3 text-sm">
                  <div>
                    <p className="text-slate-400">Submitted On</p>
                    <p className="font-medium text-slate-700">
                      {new Date(application?.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-slate-400">Status</p>
                    <p className="font-medium text-slate-700">{application?.status}</p>
                  </div>
                  {application?.payment_amount && (
                    <div>
                      <p className="text-slate-400">Application Fee</p>
                      <p className="font-medium text-slate-700">₹{application.payment_amount}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

