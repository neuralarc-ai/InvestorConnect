import { NextRequest, NextResponse } from 'next/server'
import { pitchSupabase } from '@/lib/pitch-supabase-client'

export async function POST(request: NextRequest) {
  try {
    const { email, pin } = await request.json()

    if (!email || !pin) {
      return NextResponse.json(
        { error: 'Email and PIN are required' },
        { status: 400 }
      )
    }

    console.log('Testing PIN storage for:', email)

    // Test 1: Save PIN to database
    const expiresAt = new Date()
    expiresAt.setHours(expiresAt.getHours() + 48)

    const { data: saveData, error: saveError } = await pitchSupabase
      .from('investors_pin')
      .upsert(
        {
          email,
          pin,
          expires_at: expiresAt.toISOString(),
        },
        {
          onConflict: 'email',
        }
      )

    if (saveError) {
      console.error('Save error:', saveError)
      return NextResponse.json(
        { error: 'Failed to save PIN', details: saveError },
        { status: 500 }
      )
    }

    console.log('PIN saved successfully:', saveData)

    // Test 2: Retrieve PIN from database
    const { data: retrieveData, error: retrieveError } = await pitchSupabase
      .from('investors_pin')
      .select('*')
      .eq('email', email)
      .single()

    if (retrieveError) {
      console.error('Retrieve error:', retrieveError)
      return NextResponse.json(
        { error: 'Failed to retrieve PIN', details: retrieveError },
        { status: 500 }
      )
    }

    console.log('PIN retrieved successfully:', retrieveData)

    return NextResponse.json({
      success: true,
      message: 'PIN storage and retrieval test successful',
      saved: saveData,
      retrieved: retrieveData
    })

  } catch (error) {
    console.error('Test PIN error:', error)
    return NextResponse.json(
      { 
        error: 'Test failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const email = searchParams.get('email')
    const pin = searchParams.get('pin')

    if (!email || !pin) {
      return NextResponse.json(
        { error: 'Email and PIN are required' },
        { status: 400 }
      )
    }

    console.log('Testing PIN validation for:', email)

    // Test PIN validation
    const { data, error } = await pitchSupabase
      .from('investors_pin')
      .select('*')
      .eq('email', email)
      .eq('pin', pin)
      .single()

    if (error) {
      console.error('Validation error:', error)
      return NextResponse.json(
        { error: 'Failed to validate PIN', details: error },
        { status: 500 }
      )
    }

    if (!data) {
      return NextResponse.json({
        success: false,
        message: 'PIN not found or invalid'
      })
    }

    const expiresAt = new Date(data.expires_at)
    const now = new Date()
    const isValid = expiresAt > now

    return NextResponse.json({
      success: true,
      message: isValid ? 'PIN is valid' : 'PIN has expired',
      isValid,
      expiresAt: data.expires_at,
      found: data
    })

  } catch (error) {
    console.error('Test PIN validation error:', error)
    return NextResponse.json(
      { 
        error: 'Validation test failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
} 