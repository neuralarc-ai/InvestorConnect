import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabase-server'
import { supabase } from '@/lib/supabaseClient'

export async function POST(request: NextRequest) {
  try {
    // Debug environment variables
    console.log('API: Environment check:');
    console.log('API: NEXT_PUBLIC_SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL ? 'Set' : 'Missing');
    console.log('API: NEXT_SUPABASE_SERVICE_ROLE_KEY:', process.env.NEXT_SUPABASE_SERVICE_ROLE_KEY ? 'Set' : 'Missing');
    console.log('API: supabaseServer available:', !!supabaseServer);

    const investorData = await request.json()
    
    console.log('API: Received investor data:', investorData)
    
    // Validate required fields
    if (!investorData.investor_name || !investorData.contact_person) {
      return NextResponse.json(
        { error: 'Investor name and contact person are required' },
        { status: 400 }
      )
    }

    // Try server-side client first, fallback to regular client
    let data, error;
    
    if (supabaseServer) {
      try {
        console.log('API: Using server-side client with service role');
        const result = await supabaseServer
          .from('investors')
          .insert([investorData])
          .select();
        data = result.data;
        error = result.error;
      } catch (serverError) {
        console.log('Server client failed, trying regular client:', serverError);
        const result = await supabase
          .from('investors')
          .insert([investorData])
          .select();
        data = result.data;
        error = result.error;
      }
    } else {
      console.log('API: Service role key not available, using regular client');
      const result = await supabase
        .from('investors')
        .insert([investorData])
        .select();
      data = result.data;
      error = result.error;
    }

    console.log('API: Supabase response:', { data, error })

    if (error) {
      console.error('API: Insert error:', error)
      return NextResponse.json(
        { 
          error: 'Failed to insert investor',
          details: error.message,
          code: error.code
        },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: data[0],
      message: 'Investor added successfully'
    })

  } catch (error) {
    console.error('API: Unexpected error:', error)
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
} 