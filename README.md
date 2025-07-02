# InvestorConnect

A modern investor relationship management platform built with Next.js 15, TypeScript, and Supabase.

## Features

- 📊 **Investor Dashboard** - Manage and view investor contacts
- 📧 **Email Generation** - AI-powered personalized email creation
- 🔐 **Pitch Deck Access** - Secure PIN-based access to pitch materials
- 📁 **CSV Import** - Bulk import investor data
- 🎨 **Modern UI** - Built with Tailwind CSS and ShadCN UI

## Environment Variables

Create a `.env.local` file in the root directory with the following variables:

```bash
# Pitch Supabase Configuration
NEXT_PUBLIC_PITCH_SUPABASE_URL=your_pitch_supabase_url_here
PITCH_SUPABASE_SERVICE_ROLE_KEY=your_pitch_service_role_key_here

# Pitch Deck URL (for public access)
NEXT_PUBLIC_PITCH_URL=https://your-pitch-deck-url.com

# SMTP Configuration for sending emails (optional - only needed for standalone access emails)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
SMTP_FROM=your_email@gmail.com
```

## Database Setup

### 1. Create the `investors_pin` table in your Pitch Supabase project:

```sql
CREATE TABLE investors_pin (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  pin TEXT NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster lookups
CREATE INDEX idx_investors_pin_email ON investors_pin(email);
CREATE INDEX idx_investors_pin_expires ON investors_pin(expires_at);

-- Enable Row Level Security (optional)
ALTER TABLE investors_pin ENABLE ROW LEVEL SECURITY;
```

## Getting Started

1. Clone the repository
2. Install dependencies: `npm install`
3. Set up environment variables in `.env.local`
4. Create the database table in Supabase
5. Run the development server: `npm run dev`

## Usage

1. **Add Investors**: Use the Plus icon in the header to manually add investor records
2. **Import Data**: Upload CSV files with investor information
3. **Generate Emails**: Create personalized emails with pitch deck access
4. **Send Access**: Share secure PIN-based access to your pitch materials
