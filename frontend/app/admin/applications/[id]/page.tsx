'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Cookies from 'js-cookie'
import AdminSidebar from '@/components/AdminSidebar'
import AdminHeader from '@/components/AdminHeader'
import Link from 'next/link'
import { adminAPI } from '@/lib/api'

export default function AdminApplicationReviewPage() {
  const router = useRouter()
  const params = useParams()
  const applicationId = params.id
  const [application, setApplication] = useState<any>(null)
  const [documents, setDocuments] = useState([])
  const [loading, setLoading] = useState(true)
  const [notes, setNotes] = useState('')

  useEffect(() => {
    const token = Cookies.get('token')
    const role = Cookies.get('userRole')
    
    if (!token || role !== 'admin') {
      router.push('/auth/login')
      return
    }
    loadData()
  }, [applicationId, router])

  const loadData = async () => {
    try {
      const response = await adminAPI.getApplicationDetails(applicationId as string)
      const appData = response.data.data.application
      
      // Parse AI verification result if it's a string
      if (appData.ai_verification_result && typeof appData.ai_verification_result === 'string') {
        try {
          appData.ai_verification_result = JSON.parse(appData.ai_verification_result)
        } catch (e) {
          console.error('Failed to parse AI verification result:', e)
        }
      }
      
      // Parse document AI extracted data
      const docs = (response.data.data.documents || []).map((doc: any) => {
        if (doc.ai_extracted_data && typeof doc.ai_extracted_data === 'string') {
          try {
            doc.ai_extracted_data = JSON.parse(doc.ai_extracted_data)
          } catch (e) {
            console.error('Failed to parse document AI data:', e)
          }
        }
        return doc
      })
      
      setApplication(appData)
      setDocuments(docs)
      setNotes(appData?.admin_notes || '')
    } catch (error) {
      console.error('Failed to load data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleVerifyDocument = async (docId: string, status: string) => {
    try {
      await adminAPI.verifyDocument(docId, { status, notes: '' })
      loadData()
      alert(`Document ${status} successfully`)
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to verify document')
    }
  }

  const handleApprove = async () => {
    if (!confirm('Approve this application?')) return
    try {
      await adminAPI.approveApplication(applicationId as string)
      alert('Application approved!')
      router.push('/admin/applications')
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to approve')
    }
  }

  const handleRaiseIssue = async () => {
    const issueDetails = prompt('Enter issue details:')
    if (!issueDetails) return
    try {
      await adminAPI.raiseIssue(applicationId as string, { issueDetails })
      alert('Issue raised successfully')
      loadData()
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to raise issue')
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
          <div className="flex justify-between items-start">
            <div>
              <Link href="/admin/applications" className="text-slate-500 hover:text-slate-700 flex items-center gap-1 mb-2 text-sm">
                <i className="fas fa-arrow-left"></i> Back to Applications
              </Link>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold text-slate-900">{application?.application_id}</h1>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                  application?.status === 'verified' ? 'bg-green-100 text-green-600' :
                  application?.status === 'submitted' ? 'bg-blue-100 text-blue-600' :
                  'bg-yellow-100 text-yellow-600'
                }`}>
                  {application?.status}
                </span>
              </div>
              <p className="text-slate-500">{application?.program_name} - {application?.university_name}</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleRaiseIssue}
                className="px-4 py-2 border border-red-200 text-red-600 rounded-lg text-sm font-medium hover:bg-red-50"
              >
                <i className="fas fa-times mr-2"></i>Raise Issue
              </button>
              <button
                onClick={handleApprove}
                className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700"
              >
                <i className="fas fa-check mr-2"></i>Approve
              </button>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-6">
            <div className="col-span-2 space-y-6">
              <div className="bg-white rounded-xl border border-slate-200 p-5">
                <h2 className="text-lg font-semibold text-slate-900 mb-4">Student Information</h2>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center">
                      <i className="fas fa-user text-slate-600 text-2xl"></i>
                    </div>
                    <div>
                      <p className="font-semibold text-slate-900 text-lg">
                        {application?.first_name} {application?.last_name}
                      </p>
                      <p className="text-sm text-slate-500">{application?.email}</p>
                    </div>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <i className="fas fa-phone text-slate-400 w-4"></i>
                      <span className="text-slate-600">{application?.phone || 'N/A'}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* AI Verification Status */}
              {application?.ai_verification_status && (
                <div className={`bg-white rounded-xl border p-5 ${
                  application.ai_verification_status === 'verified' ? 'border-green-200 bg-green-50' :
                  application.ai_verification_status === 'flagged' ? 'border-orange-200 bg-orange-50' :
                  'border-yellow-200 bg-yellow-50'
                }`}>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <i className={`fas fa-robot text-xl ${
                        application.ai_verification_status === 'verified' ? 'text-green-600' :
                        application.ai_verification_status === 'flagged' ? 'text-orange-600' :
                        'text-yellow-600'
                      }`}></i>
                      <h3 className="font-semibold text-slate-900">Level 1: AI Verification</h3>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      application.ai_verification_status === 'verified' ? 'bg-green-100 text-green-600' :
                      application.ai_verification_status === 'flagged' ? 'bg-orange-100 text-orange-600' :
                      'bg-yellow-100 text-yellow-600'
                    }`}>
                      {application.ai_verification_status === 'verified' ? '✓ Verified' :
                       application.ai_verification_status === 'flagged' ? '⚠ Flagged for Review' :
                       '⏳ Pending'}
                    </span>
                  </div>
                  {application.ai_verification_result && (
                    <div className="mt-3 space-y-2">
                      {application.ai_verification_result.issues && application.ai_verification_result.issues.length > 0 ? (
                        <div className="bg-white rounded-lg p-3 border border-orange-200">
                          <p className="text-sm font-medium text-orange-900 mb-2">⚠ AI Detected Issues:</p>
                          <ul className="list-disc list-inside space-y-1">
                            {application.ai_verification_result.issues.map((issue: string, idx: number) => (
                              <li key={idx} className="text-sm text-orange-700">{issue}</li>
                            ))}
                          </ul>
                        </div>
                      ) : (
                        <div className="bg-white rounded-lg p-3 border border-green-200">
                          <p className="text-sm text-green-700">
                            <i className="fas fa-check-circle mr-1"></i>
                            AI verification passed. All documents match application details.
                          </p>
                        </div>
                      )}
                      {application.ai_verification_result.verified && (
                        <div className="bg-white rounded-lg p-3 border border-slate-200">
                          <p className="text-xs font-medium text-slate-500 mb-2">Verified Fields:</p>
                          <div className="flex flex-wrap gap-2">
                            {Object.entries(application.ai_verification_result.verified).map(([key, value]: [string, any]) => (
                              value && (
                                <span key={key} className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">
                                  ✓ {key.replace(/([A-Z])/g, ' $1').trim()}
                                </span>
                              )
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              <div className="bg-white rounded-xl border border-slate-200 p-5">
                <div className="flex justify-between items-center mb-4">
                  <div>
                    <h2 className="text-lg font-semibold text-slate-900">Level 2: Manual Document Review</h2>
                    <p className="text-sm text-slate-500 mt-1">Review each document and verify manually</p>
                  </div>
                  <button className="text-orange-600 text-sm font-medium hover:text-orange-700">
                    <i className="fas fa-plus mr-1"></i>Request Additional
                  </button>
                </div>
                <div className="space-y-3">
                  {documents.length === 0 ? (
                    <p className="text-center text-slate-500 py-4">No documents uploaded yet</p>
                  ) : (
                    documents.map((doc: any) => {
                      const aiData = typeof doc.ai_extracted_data === 'string' 
                        ? JSON.parse(doc.ai_extracted_data) 
                        : doc.ai_extracted_data
                      const aiStatus = doc.ai_verification_status || 'pending'
                      
                      return (
                        <div key={doc.id} className={`p-4 rounded-lg border-2 ${
                          doc.admin_verification_status === 'verified' ? 'border-green-300 bg-green-50' :
                          doc.is_rejected ? 'border-red-300 bg-red-50' :
                          aiStatus === 'flagged' ? 'border-orange-300 bg-orange-50' :
                          'border-yellow-200 bg-yellow-50'
                        }`}>
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex items-start gap-3 flex-1">
                              <i className="fas fa-file-alt text-blue-600 mt-1 text-xl"></i>
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <p className="font-medium text-slate-900">{doc.document_type}</p>
                                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                                    aiStatus === 'verified' ? 'bg-green-100 text-green-700' :
                                    aiStatus === 'flagged' ? 'bg-orange-100 text-orange-700' :
                                    'bg-gray-100 text-gray-600'
                                  }`}>
                                    AI: {aiStatus === 'verified' ? '✓' : aiStatus === 'flagged' ? '⚠' : '⏳'}
                                  </span>
                                </div>
                                <p className="text-xs text-slate-500">{doc.file_name}</p>
                                
                                {/* AI Extracted Data */}
                                {aiData && Object.keys(aiData).length > 0 && (
                                  <div className="mt-3 p-3 bg-white rounded-lg border border-blue-200">
                                    <p className="text-xs font-medium text-slate-600 mb-2 flex items-center gap-1">
                                      <i className="fas fa-robot text-blue-600"></i>
                                      AI Extracted Data:
                                    </p>
                                    <div className="grid grid-cols-2 gap-2">
                                      {Object.entries(aiData).map(([key, value]: [string, any]) => (
                                        <div key={key} className="text-xs">
                                          <span className="text-slate-500">{key.replace(/([A-Z])/g, ' $1').trim()}:</span>
                                          <span className="ml-1 font-medium text-slate-900">{String(value)}</span>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-2 ml-4">
                              {doc.admin_verification_status !== 'verified' && !doc.is_rejected && (
                                <>
                                  <button
                                    onClick={() => handleVerifyDocument(doc.id, 'verified')}
                                    className="px-3 py-1.5 bg-green-600 text-white rounded text-xs font-medium hover:bg-green-700 flex items-center gap-1"
                                  >
                                    <i className="fas fa-check"></i> Verify
                                  </button>
                                  <button
                                    onClick={() => handleVerifyDocument(doc.id, 'rejected')}
                                    className="px-3 py-1.5 bg-red-600 text-white rounded text-xs font-medium hover:bg-red-700 flex items-center gap-1"
                                  >
                                    <i className="fas fa-times"></i> Reject
                                  </button>
                                </>
                              )}
                              {doc.admin_verification_status === 'verified' && (
                                <span className="flex items-center gap-1 text-green-600 text-sm font-medium">
                                  <i className="fas fa-check-circle"></i> Verified
                                </span>
                              )}
                              {doc.is_rejected && (
                                <span className="text-red-600 text-sm font-medium">
                                  <i className="fas fa-times-circle mr-1"></i>Rejected
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      )
                    })
                  )}
                </div>
              </div>

              <div className="bg-white rounded-xl border border-slate-200 p-5">
                <h2 className="text-lg font-semibold text-slate-900 mb-4">Internal Notes</h2>
                <textarea
                  placeholder="Add internal notes about this application..."
                  className="w-full p-3 border border-slate-200 rounded-lg text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
                <div className="flex justify-end mt-3">
                  <button className="px-4 py-2 bg-slate-900 text-white rounded-lg text-sm font-medium hover:bg-slate-800">
                    Save Note
                  </button>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="bg-white rounded-xl border border-slate-200 p-5">
                <h3 className="font-semibold text-slate-900 mb-4">Quick Actions</h3>
                <div className="space-y-2">
                  <button className="w-full flex items-center gap-3 p-3 rounded-lg border border-slate-200 hover:bg-slate-50 text-left">
                    <i className="fas fa-envelope text-slate-600 w-5"></i>
                    <span className="text-sm text-slate-700">Email Student</span>
                  </button>
                  <button className="w-full flex items-center gap-3 p-3 rounded-lg border border-slate-200 hover:bg-slate-50 text-left">
                    <i className="fas fa-file-alt text-slate-600 w-5"></i>
                    <span className="text-sm text-slate-700">Request Document</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

