# UniApply - Unified University Application Portal

A full-stack web application for managing university applications with AI-powered document verification, two-level verification system (AI + Manual), and configurable eligibility criteria.

## 🎯 Features

### Student Features
- **User Registration & Authentication**: Secure login/registration system
- **University & Program Selection**: Browse and select from available universities and programs
- **Application Form**: Comprehensive application form with personal and academic details
- **Document Upload Wizard**: Guided document upload with drag & drop support
- **AI Document Processing**: Automatic extraction and verification of document data
- **Application Status Tracking**: Real-time tracking of application progress
- **Payment Integration**: Three-tier payment system (Free, Issue Resolution, Application Fee)
- **Support Tickets**: Create and track support tickets

### Admin Features
- **Dashboard Analytics**: Overview of applications, revenue, and metrics
- **Two-Level Verification**:
  - **Level 1 (AI)**: Automatic document verification and data extraction
  - **Level 2 (Manual)**: Admin review and approval/rejection
- **Application Management**: View, review, and manage all student applications
- **Document Verification**: Verify or reject uploaded documents
- **Issue Management**: Raise issues on applications with detailed comments
- **Document Configuration**: Configure required documents per program
- **Support Ticket Management**: Respond to and manage support tickets

## 🛠️ Tech Stack

### Frontend
- **Next.js 14** - React framework with App Router
- **React 18** - UI library
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **Axios** - HTTP client
- **React Hook Form** - Form management
- **React Dropzone** - File uploads

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **PostgreSQL** - Relational database
- **Redis** - Session storage
- **JWT** - Authentication
- **Multer** - File upload handling
- **PDF-Parse** - PDF text extraction
- **OpenAI API** (or similar) - AI document processing

### Infrastructure
- **Docker** - Containerization
- **Docker Compose** - Multi-container orchestration

## 📋 Prerequisites

Before you begin, ensure you have the following installed:
- **Node.js** (v18 or higher)
- **PostgreSQL** (v15 or higher)
- **Redis** (v7 or higher)
- **Docker** and **Docker Compose** (optional, for containerized deployment)
- **npm** or **yarn**

## 🚀 Quick Start


#### Backend Setup

1. **Navigate to backend directory**
   ```bash
   cd backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your database and API credentials
   ```

4. **Set up PostgreSQL database**
   ```bash
   # Create database
   createdb uniapply_db
   
   # Or using psql
   psql -U postgres -c "CREATE DATABASE uniapply_db;"
   ```



5. **Start the backend server**
   ```bash
   npm run dev  # Development mode
   # or
   npm start    # Production mode
   ```

   Backend will run on http://localhost:3001

#### Frontend Setup

1. **Navigate to frontend directory**
   ```bash
   cd frontend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   # Create .env.local file
   echo "NEXT_PUBLIC_API_URL=http://localhost:3001/api" > .env.local
   ```

4. **Start the development server**
   ```bash
   npm run dev
   ```

   Frontend will run on http://localhost:3000

## 📁 Project Structure

```
uniapply-app/
├── backend/
│   ├── config/
│   │   └── database.js          # Database configuration
│   ├── middleware/
│   │   └── auth.js              # Authentication middleware
│   ├── routes/
│   │   ├── auth.js              # Authentication routes
│   │   ├── applications.js      # Application routes
│   │   ├── documents.js         # Document routes
│   │   ├── admin.js             # Admin routes
│   │   ├── payments.js           # Payment routes
│   │   └── support.js           # Support ticket routes
│   ├── services/
│   │   └── aiService.js         # AI document processing
│   ├── uploads/                 # Uploaded files directory
│   ├── server.js                # Express server entry point
│   └── package.json
├── frontend/
│   ├── app/                     # Next.js App Router
│   │   ├── auth/                # Authentication pages
│   │   ├── student/             # Student portal pages
│   │   ├── admin/               # Admin panel pages
│   │   └── layout.tsx           # Root layout
│   ├── components/              # React components
│   ├── lib/
│   │   └── api.ts              # API client
│   ├── public/                  # Static assets
│   └── package.json
├── docker-compose.yml           # Docker Compose configuration
├── Dockerfile                   # Multi-stage Dockerfile
└── README.md                   # This file
```

## 🔐 Environment Variables


## 🗄️ Database Schema

The application uses PostgreSQL with the following main tables:
- **users** - User accounts (students and admins)
- **universities** - University information
- **programs** - Program details per university
- **applications** - Student applications
- **documents** - Uploaded documents with AI extraction data
- **required_documents** - Admin-configured document requirements
- **payments** - Payment transactions
- **support_tickets** - Support ticket system

## 🔄 Application Flow

### Student Flow
1. **Register/Login** → Student creates account
2. **Select University & Program** → Browse and select
3. **Fill Application Form** → Enter personal and academic details
4. **Upload Documents** → Upload required documents via wizard
5. **AI Processing** → Documents automatically processed and verified
6. **Submit Application** → Application moves to "Submitted" status
7. **Admin Review** → Admin reviews and verifies
8. **Payment** → Pay application fee after verification
9. **Track Status** → Monitor application progress

### Admin Flow
1. **Login** → Admin logs in
2. **View Applications** → See all applications with AI verification status
3. **Review Applications** → Review flagged applications
4. **Verify Documents** → Approve or reject documents
5. **Raise Issues** → Flag issues requiring student attention
6. **Approve Application** → Final approval after verification
7. **Manage Configuration** → Configure document requirements per program





## 📝 API Documentation

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user
- `POST /api/auth/logout` - Logout user

### Applications
- `POST /api/applications` - Create application
- `GET /api/applications` - Get user's applications
- `GET /api/applications/:id` - Get application details
- `PUT /api/applications/:id` - Update application
- `POST /api/applications/:id/submit` - Submit application

### Documents
- `POST /api/documents/upload` - Upload document
- `GET /api/documents/:applicationId` - Get documents for application

### Admin
- `GET /api/admin/applications` - Get all applications
- `GET /api/admin/applications/:id` - Get application details
- `POST /api/admin/documents/:id/verify` - Verify document
- `POST /api/admin/applications/:id/raise-issue` - Raise issue
- `POST /api/admin/applications/:id/approve` - Approve application
- `GET /api/admin/analytics` - Get dashboard analytics

### Payments
- `POST /api/payments/application-fee` - Create application fee payment
- `POST /api/payments/issue-resolution` - Create issue resolution payment
- `POST /api/payments/verify` - Verify payment
- `GET /api/payments` - Get payment history

### Support
- `POST /api/support/tickets` - Create support ticket
- `GET /api/support/tickets` - Get tickets
- `PUT /api/support/tickets/:id` - Update ticket


