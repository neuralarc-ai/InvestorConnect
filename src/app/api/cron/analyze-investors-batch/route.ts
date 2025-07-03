import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';
import { InvestorAnalyzer } from '@/lib/investor-analyzer';
import type { Investor } from '@/lib/types';

// Manual batch analysis endpoint
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { batchNumber = 0, batchSize = 10, clearExisting = false } = body;

    console.log(`🚀 Starting manual micro-batch analysis: batch ${batchNumber}, size ${batchSize}`);

    // Verify this is a legitimate request (optional security check)
    const authHeader = request.headers.get('authorization');
    if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      console.log('❌ Unauthorized batch analysis request');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Step 1: Get total count
    console.log('📊 Getting total investor count...');
    const { count: totalInvestors, error: countError } = await supabase
      .from('investors')
      .select('*', { count: 'exact', head: true });

    if (countError) {
      console.error('❌ Error getting investor count:', countError);
      return NextResponse.json(
        { error: 'Failed to get investor count', details: countError.message },
        { status: 500 }
      );
    }

    if (!totalInvestors || totalInvestors === 0) {
      console.log('⚠️ No investors found in database');
      return NextResponse.json(
        { message: 'No investors found to analyze' },
        { status: 200 }
      );
    }

    const totalBatches = Math.ceil(totalInvestors / batchSize);
    
    if (batchNumber >= totalBatches) {
      return NextResponse.json(
        { error: `Batch number ${batchNumber} is out of range. Total batches: ${totalBatches}` },
        { status: 400 }
      );
    }

    console.log(`📊 Found ${totalInvestors} total investors. Processing micro-batch ${batchNumber + 1}/${totalBatches}`);

    // Step 2: Clear existing analysis data for this batch (optional)
    if (clearExisting) {
      console.log('🧹 Clearing existing analysis data...');
      const { error: clearError } = await supabase
        .from('investor_match_analysis')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000');

      if (clearError) {
        console.error('❌ Error clearing existing analysis:', clearError);
        return NextResponse.json(
          { error: 'Failed to clear existing analysis', details: clearError.message },
          { status: 500 }
        );
      }
      console.log('✅ Cleared existing analysis data');
    }

    // Step 3: Fetch and analyze specific batch
    const from = batchNumber * batchSize;
    const to = from + batchSize - 1;
    
    console.log(`📦 Fetching micro-batch ${batchNumber + 1} (records ${from + 1}-${Math.min(to + 1, totalInvestors)})`);
    
    const { data: batchInvestors, error: batchError } = await supabase
      .from('investors')
      .select('*')
      .range(from, to)
      .order('id', { ascending: true });

          if (batchError) {
        console.error(`❌ Error fetching micro-batch ${batchNumber + 1}:`, batchError);
        return NextResponse.json(
          { error: 'Failed to fetch micro-batch', details: batchError.message },
          { status: 500 }
        );
      }

      if (!batchInvestors || batchInvestors.length === 0) {
        console.log(`⚠️ No investors in micro-batch ${batchNumber + 1}`);
        return NextResponse.json(
          { message: `No investors found in micro-batch ${batchNumber + 1}` },
          { status: 200 }
        );
      }

      // Step 4: Analyze this micro-batch
      console.log(`🔍 Analyzing micro-batch ${batchNumber + 1}...`);
      const analyzer = new InvestorAnalyzer();
      const batchAnalyses = analyzer.analyzeAllInvestors(batchInvestors as Investor[]);

      console.log(`✅ Micro-batch analysis complete. Generated ${batchAnalyses.length} analysis records`);

    // Step 5: Save batch results to database
    console.log('💾 Saving batch results to database...');
    const INSERT_BATCH_SIZE = 100;
    const insertBatches = [];
    
    for (let i = 0; i < batchAnalyses.length; i += INSERT_BATCH_SIZE) {
      insertBatches.push(batchAnalyses.slice(i, i + INSERT_BATCH_SIZE));
    }

    let totalInserted = 0;
    let totalErrors = 0;

    for (let i = 0; i < insertBatches.length; i++) {
      const batch = insertBatches[i];
      console.log(`💾 Inserting sub-batch ${i + 1}/${insertBatches.length} (${batch.length} records)`);

      const { data: insertedData, error: insertError } = await supabase
        .from('investor_match_analysis')
        .insert(batch)
        .select();

      if (insertError) {
        console.error(`❌ Error inserting sub-batch ${i + 1}:`, insertError);
        totalErrors += batch.length;
      } else {
        totalInserted += insertedData?.length || 0;
        console.log(`✅ Sub-batch ${i + 1} inserted successfully`);
      }

      // Small delay between insert batches
      if (i < insertBatches.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    // Step 6: Generate summary statistics for this batch
    const topRatedCount = batchAnalyses.filter(a => a.top_rated).length;
    const averageScore = Math.round(
      batchAnalyses.reduce((sum, a) => sum + a.score, 0) / batchAnalyses.length
    );
    const highScoreCount = batchAnalyses.filter(a => a.score >= 80).length;
    const mediumScoreCount = batchAnalyses.filter(a => a.score >= 50 && a.score < 80).length;
    const lowScoreCount = batchAnalyses.filter(a => a.score < 50).length;

    const summary = {
      batchNumber: batchNumber + 1,
      totalBatches,
      batchSize,
      totalInvestors,
      totalAnalyzed: batchAnalyses.length,
      totalInserted,
      totalErrors,
      topRatedCount,
      averageScore,
      scoreDistribution: {
        high: highScoreCount,
        medium: mediumScoreCount,
        low: lowScoreCount
      },
      range: {
        from: from + 1,
        to: Math.min(to + 1, totalInvestors)
      }
    };

    console.log('📈 Batch Summary:', summary);

    return NextResponse.json({
      success: true,
      message: `Micro-batch ${batchNumber + 1} analysis completed successfully`,
      summary,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Unexpected error in batch analysis:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}

// Handle GET requests for batch info
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const batchSize = parseInt(searchParams.get('batch_size') || '10');

    // Get total count
    const { count: totalInvestors, error: countError } = await supabase
      .from('investors')
      .select('*', { count: 'exact', head: true });

    if (countError) {
      return NextResponse.json(
        { error: 'Failed to get investor count', details: countError.message },
        { status: 500 }
      );
    }

    const totalBatches = Math.ceil((totalInvestors || 0) / batchSize);

    return NextResponse.json({
      success: true,
      data: {
        totalInvestors,
        totalBatches,
        batchSize,
        batches: Array.from({ length: totalBatches }, (_, i) => ({
          batchNumber: i,
          from: i * batchSize + 1,
          to: Math.min((i + 1) * batchSize, totalInvestors || 0),
          size: Math.min(batchSize, (totalInvestors || 0) - i * batchSize)
        }))
      }
    });

  } catch (error) {
    console.error('Error getting batch info:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 