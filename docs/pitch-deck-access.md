# Pitch Deck Access Functionality

This feature integrates pitch deck access directly into the email generation process. When you generate a personalized email for an investor, it automatically includes a pitch deck access link and PIN.

## Environment Variables Required

Add these to your `.env.local` file:

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

## Supabase Setup

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

### 2. Get your Supabase credentials:
- Go to your Pitch Supabase project dashboard
- Navigate to Settings > API
- Copy the Project URL and Service Role Key

## How It Works

### Integrated Email Generation Flow:
1. **Click "Generate Email with Pitch Access"** → Shows loading state
2. **AI generates personalized email** → Creates outreach message
3. **System generates 4-digit PIN** → Random number 1000-9999
4. **Email includes pitch access section** → Automatically appended to email
5. **User can edit and send** → Opens email client with full content
6. **PIN saved to database** → When email is sent

### Email Content Structure:
```
[AI Generated Personalized Outreach Message]

---
Pitch Deck Access

I've also attached access to our detailed pitch deck for your review:

Access Link: https://your-pitch-deck-url.com
Your PIN: 1234

This PIN will expire in 48 hours for security purposes. Please let me know if you need any additional information or have questions about our pitch.

---
```

## Features

- ✅ **Integrated workflow** - Pitch access included in email generation
- ✅ **4-digit random PIN** generation with 48-hour expiry
- ✅ **Automatic PIN saving** to Supabase when email is sent
- ✅ **Professional email template** with clear formatting
- ✅ **PIN display** in UI for reference
- ✅ **Error handling** and validation
- ✅ **Loading states** and user feedback

## API Endpoints

- `POST /api/send-access-email` - Saves PIN to database (called when sending email)

## Usage

1. **Open investor details** in the InvestorConnect app
2. **Click "Generate Email with Pitch Access"** 
3. **Review the generated email** - includes personalized message + pitch access
4. **Edit if needed** - modify the content as required
5. **Click "Send Email"** - opens email client with full content
6. **PIN is automatically saved** to database for tracking

## Security Notes

- **Service Role Key** has admin privileges - keep it secure
- **PINs expire automatically** after 48 hours
- **Email validation** prevents invalid addresses
- **All data is sanitized** before processing
- **PINs are unique per email** and can be updated

## UI Features

- **Blue info box** - Explains what's included in generated emails
- **Green PIN display** - Shows generated PIN prominently
- **Integrated workflow** - Single button for complete email generation
- **Real-time feedback** - Loading states and success messages 