# Database Setup Guide for Neon PostgreSQL

## Quick Setup Steps

### 1. Set Database URL in Render

In your Render dashboard, go to **Environment Variables** and set:

```
DB_URL=postgresql://neondb_owner:npg_y31iEGHsuqYF@ep-empty-bar-a1qrsoys-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require
```

**Important**: The connection string will automatically have `channel_binding=require` removed if present (it causes issues with Neon).

### 2. Create Database Tables

After deploying, you need to run the migration. You have two options:

#### Option A: Using Render Shell (Recommended)
1. Go to your Render service dashboard
2. Click on **Shell** tab
3. Run: `npm run migrate`

#### Option B: Using Local Connection
```bash
# Set your DB_URL environment variable
export DB_URL="postgresql://neondb_owner:npg_y31iEGHsuqYF@ep-empty-bar-a1qrsoys-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require"

# Run migration
cd backend
npm run migrate
```

### 3. Seed Database (Optional)

To add sample data (admin user, universities, programs):

```bash
cd backend
npm run seed
```

This will create:
- Admin user: `admin@uniapply.com` / `admin123`
- Sample universities and programs
- Required documents configuration

## Troubleshooting

### If you get "relation does not exist" errors:
- The tables haven't been created yet
- Run `npm run migrate` as shown above

### If you get connection errors:
- Verify `DB_URL` is set correctly in Render
- Check that your Neon database is running
- Ensure SSL mode is set to `require`

### Connection String Format
The code automatically removes `channel_binding=require` if present, so you can use:
```
postgresql://user:password@host/database?sslmode=require
```

Or the full format:
```
postgresql://user:password@host/database?sslmode=require&channel_binding=require
```
(The channel_binding will be automatically removed)

