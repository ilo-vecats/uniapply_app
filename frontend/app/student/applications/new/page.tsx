'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Cookies from 'js-cookie'
import StudentSidebar from '@/components/StudentSidebar'
import StudentHeader from '@/components/StudentHeader'
import Link from 'next/link'
import { documentsAPI, applicationsAPI } from '@/lib/api'
import { useDropzone } from 'react-dropzone'

// ✅ TYPES
type DocumentItem = {
  document_type: string
  admin_verification_status?: string
  is_rejected?: boolean
  file_name?: string
  ai_extracted_data?: any
}

type RequiredDoc = {
  document_type: string
  is_required: boolean
}

export default function DocumentUploadPage() {
  const router = useRouter()
  const params = useParams<{ id: string }>()  // ✅ FIXED
  const applicationId = params.id

  const [application, setApplication] = useState<any>(null)

  // ✅ CLEAN + SAFE
  const [documents, setDocuments] = useState<DocumentItem[]>([])
  const [requiredDocs, setRequiredDocs] = useState<RequiredDoc[]>([])
  const [uploading, setUploading] = useState(false)

  useEffect(() => {
    const token = Cookies.get('token')
    if (!token) {
      router.push('/auth/login')
      return
    }
    if (!applicationId) return
    loadData()
  }, [applicationId, router])

  const loadData = async () => {
    try {
      const [appRes, docsRes] = await Promise.all([
        applicationsAPI.getById(applicationId),
        documentsAPI.getByApplication(applicationId)
      ])

      setApplication(appRes.data?.data ?? null)
      setDocuments(docsRes.data?.data ?? [])

      // ✅ Mock required documents
      setRequiredDocs([
        { document_type: 'Aadhar Card', is_required: true },
        { document_type: '10th Marksheet', is_required: true },
        { document_type: '12th Marksheet', is_required: true },
        { document_type: 'Graduation Certificate', is_required: false }
      ])
    } catch (error) {
      console.error('Failed to load data:', error)
    }
  }

  const onDrop = async (acceptedFiles: File[], documentType: string) => {
    const file = acceptedFiles[0]
    if (!file) return

    setUploading(true)

    try {
      const formData = new FormData()
      formData.append('document', file)
      formData.append('applicationId', applicationId)
      formData.append('documentType', documentType)

      await documentsAPI.upload(formData)
      loadData()
      alert('Document uploaded successfully!')
    } catch (error: any) {
      alert(error?.response?.data?.message || 'Upload failed')
    } finally {
      setUploading(false)
    }
  }

  const getDocumentStatus = (docType: string) => {
    const doc = documents.find((d) => d.document_type === docType)
    if (!doc) return 'missing'
    if (doc.admin_verification_status === 'verified') return 'verified'
    if (doc.is_rejected) return 'rejected'
    return 'pending'
  }

  return (
    <div className="flex min-h-screen bg-slate-100">
      <StudentSidebar />

      <div className="flex-1 ml-64">
        <StudentHeader />

        <div className="p-6">
          <div className="max-w-4xl mx-auto">
            <Link
              href="/student/applications"
              className="text-slate-500 hover:text-slate-700 flex items-center gap-1 mb-6 text-sm"
            >
              <i className="fas fa-arrow-left"></i> Back to Applications
            </Link>

            <div className="bg-white rounded-xl border border-slate-200 p-6">
              <h2 className="text-xl font-semibold text-slate-900 mb-2">
                Document Upload Wizard
              </h2>

              <p className="text-slate-500 mb-6">
                {application?.program_name} - {application?.university_name}
              </p>

              <div className="space-y-4">
                {requiredDocs.map((reqDoc) => {
                  const status = getDocumentStatus(reqDoc.document_type)

                  return (
                    <DocumentUploadCard
                      key={reqDoc.document_type}
                      documentType={reqDoc.document_type}
                      isRequired={reqDoc.is_required}
                      status={status}
                      document={documents.find(
                        (d) => d.document_type === reqDoc.document_type
                      )}
                      onDrop={(files: File[]) =>
                        onDrop(files, reqDoc.document_type)
                      }
                      uploading={uploading}
                    />
                  )
                })}
              </div>

              <div className="mt-6 flex justify-end gap-4">
                <Link
                  href="/student/applications"
                  className="px-6 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50"
                >
                  Save as Draft
                </Link>

                <button
                  onClick={async () => {
                    try {
                      await applicationsAPI.submit(applicationId)
                      router.push('/student/applications')
                    } catch (error: any) {
                      alert(error?.response?.data?.message || 'Submission failed')
                    }
                  }}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Submit Application
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ✅ STRONGLY TYPED COMPONENT
function DocumentUploadCard({
  documentType,
  isRequired,
  status,
  document,
  onDrop,
  uploading
}: {
  documentType: string
  isRequired: boolean
  status: string
  document?: DocumentItem
  onDrop: (files: File[]) => void
  uploading: boolean
}) {
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'image/*': ['.jpg', '.jpeg', '.png']
    },
    maxFiles: 1,
    disabled: uploading || status === 'verified'
  })

  const getStatusColor = () => {
    if (status === 'verified') return 'border-green-200 bg-green-50'
    if (status === 'rejected') return 'border-red-200 bg-red-50'
    if (status === 'pending') return 'border-yellow-200 bg-yellow-50'
    return 'border-slate-200 bg-slate-50'
  }

  return (
    <div className={`p-4 rounded-lg border-2 ${getStatusColor()}`}>
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="font-medium text-slate-900">{documentType}</h3>
          {isRequired && <span className="text-xs text-red-600">Required</span>}
        </div>
      </div>

      {status === 'missing' && (
        <div
          {...getRootProps()}
          className="border-2 border-dashed border-slate-300 rounded-lg p-6 text-center cursor-pointer hover:border-blue-500"
        >
          <input {...getInputProps()} />
          {isDragActive ? (
            <p className="text-blue-600">Drop the file here...</p>
          ) : (
            <>
              <i className="fas fa-cloud-upload-alt text-3xl text-slate-400 mb-2"></i>
              <p className="text-sm text-slate-600">
                Drag & drop or click to upload
              </p>
              <p className="text-xs text-slate-400 mt-1">
                PDF, JPG, PNG (Max 5MB)
              </p>
            </>
          )}
        </div>
      )}

      {document && (
        <div className="flex items-center justify-between p-3 bg-white rounded border mt-2">
          <p className="font-medium text-slate-900">{document.file_name}</p>
        </div>
      )}
    </div>
  )
}
