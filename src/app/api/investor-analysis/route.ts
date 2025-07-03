import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Query parameters
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const topRated = searchParams.get('top_rated');
    const minScore = parseInt(searchParams.get('min_score') || '0');
    const maxScore = parseInt(searchParams.get('max_score') || '100');
    const sortBy = searchParams.get('sort_by') || 'score';
    const sortOrder = searchParams.get('sort_order') || 'desc';

    // Calculate offset
    const offset = (page - 1) * limit;

    // Build query
    let query = supabase
      .from('investor_match_analysis')
      .select(`
        *,
        investor:investors(
          id,
          investor_name,
          contact_person,
          designation,
          email,
          phone,
          website,
          linkedin,
          company_linkedin,
          twitter,
          facebook,
          country,
          state,
          city,
          founded_year,
          investor_type,
          practice_areas,
          description,
          overview,
          investment_score,
          business_models,
          contact_summary,
          location,
          domain_name,
          blog_url,
          tracxn_url
        )
      `);

    // Apply filters
    if (topRated === 'true') {
      query = query.eq('top_rated', true);
    }
    
    if (minScore > 0) {
      query = query.gte('score', minScore);
    }
    
    if (maxScore < 100) {
      query = query.lte('score', maxScore);
    }

    // Apply sorting
    if (sortBy === 'score') {
      query = query.order('score', { ascending: sortOrder === 'asc' });
    } else if (sortBy === 'created_at') {
      query = query.order('created_at', { ascending: sortOrder === 'asc' });
    } else {
      query = query.order('score', { ascending: false });
    }

    // Apply pagination
    query = query.range(offset, offset + limit - 1);

    // Execute query
    const { data: analyses, error, count } = await query;

    if (error) {
      console.error('Error fetching investor analysis:', error);
      return NextResponse.json(
        { error: 'Failed to fetch analysis data', details: error.message },
        { status: 500 }
      );
    }

    // Get total count for pagination
    const { count: totalCount } = await supabase
      .from('investor_match_analysis')
      .select('*', { count: 'exact', head: true });

    const totalPages = Math.ceil((totalCount || 0) / limit);

    return NextResponse.json({
      success: true,
      data: analyses,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    });

  } catch (error) {
    console.error('Error in investor analysis API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 