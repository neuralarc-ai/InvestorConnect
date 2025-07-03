import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';
import { InvestorAnalyzer } from '@/lib/investor-analyzer';
import type { Investor, InvestorMatchAnalysis } from '@/lib/types';

// Progressive analysis endpoint - processes multiple micro-batches
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      startBatch = 0, 
      numBatches = 5, 
      batchSize = 10, 
      clearExisting = false,
      delayBetweenBatches = 500 
    } = body;

    console.log(`🚀 Starting progressive analysis: batches ${startBatch + 1}-${startBatch + numBatches}, size ${batchSize}`);

    // Verify this is a legitimate request (optional security check)
    const authHeader = request.headers.get('authorization');
    if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      console.log('❌ Unauthorized progressive analysis request');
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
    const endBatch = Math.min(startBatch + numBatches - 1, totalBatches - 1);
    
    if (startBatch >= totalBatches) {
      return NextResponse.json(
        { error: `Start batch ${startBatch} is out of range. Total batches: ${totalBatches}` },
        { status: 400 }
      );
    }

    console.log(`📊 Found ${totalInvestors} total investors. Processing micro-batches ${startBatch + 1}-${endBatch + 1}`);

    // Step 2: Clear existing analysis data (optional)
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

    // Step 3: Process micro-batches progressively
    console.log('🔍 Starting progressive micro-batch analysis...');
    const analyzer = new InvestorAnalyzer();
    let allAnalyses: InvestorMatchAnalysis[] = [];
    let totalProcessed = 0;
    let totalTopRated = 0;
    let totalErrors = 0;
    const batchResults: any[] = [];

    for (let batchNum = startBatch; batchNum <= endBatch; batchNum++) {
      const from = batchNum * batchSize;
      const to = from + batchSize - 1;
      
      console.log(`📦 Processing micro-batch ${batchNum + 1}/${totalBatches} (records ${from + 1}-${Math.min(to + 1, totalInvestors)})`);
      
      // Fetch micro-batch of investors
      const { data: batchInvestors, error: batchError } = await supabase
        .from('investors')
        .select('*')
        .range(from, to)
        .order('id', { ascending: true });

      if (batchError) {
        console.error(`❌ Error fetching micro-batch ${batchNum + 1}:`, batchError);
        totalErrors++;
        batchResults.push({
          batchNumber: batchNum + 1,
          success: false,
          error: batchError.message,
          processed: 0,
          topRated: 0
        });
        continue;
      }

      if (!batchInvestors || batchInvestors.length === 0) {
        console.log(`⚠️ No investors in micro-batch ${batchNum + 1}`);
        batchResults.push({
          batchNumber: batchNum + 1,
          success: false,
          error: 'No investors found',
          processed: 0,
          topRated: 0
        });
        continue;
      }

      // Analyze this micro-batch
      console.log(`🔍 Analyzing micro-batch ${batchNum + 1}...`);
      const batchAnalyses = analyzer.analyzeAllInvestors(batchInvestors as Investor[]);
      
      // Save batch results immediately
      const INSERT_BATCH_SIZE = 10; // Small insert batches for micro-batches
      let batchInserted = 0;
      let batchInsertErrors = 0;

      for (let i = 0; i < batchAnalyses.length; i += INSERT_BATCH_SIZE) {
        const insertBatch = batchAnalyses.slice(i, i + INSERT_BATCH_SIZE);
        
        const { data: insertedData, error: insertError } = await supabase
          .from('investor_match_analysis')
          .insert(insertBatch)
          .select();

        if (insertError) {
          console.error(`❌ Error inserting micro-batch ${batchNum + 1} sub-batch:`, insertError);
          batchInsertErrors += insertBatch.length;
        } else {
          batchInserted += insertedData?.length || 0;
        }
      }

      // Update totals
      const batchTopRated = batchAnalyses.filter(a => a.top_rated).length;
      totalProcessed += batchInvestors.length;
      totalTopRated += batchTopRated;
      allAnalyses = [...allAnalyses, ...batchAnalyses];

      console.log(`✅ Micro-batch ${batchNum + 1} complete. Processed ${batchInvestors.length} investors. Top-rated: ${batchTopRated}`);

      // Record batch result
      batchResults.push({
        batchNumber: batchNum + 1,
        success: true,
        processed: batchInvestors.length,
        topRated: batchTopRated,
        inserted: batchInserted,
        errors: batchInsertErrors,
        averageScore: Math.round(
          batchAnalyses.reduce((sum, a) => sum + a.score, 0) / batchAnalyses.length
        )
      });

      // Delay between batches to prevent overload
      if (batchNum < endBatch) {
        console.log(`⏳ Waiting ${delayBetweenBatches}ms before next micro-batch...`);
        await new Promise(resolve => setTimeout(resolve, delayBetweenBatches));
      }
    }

    // Step 4: Generate comprehensive summary
    const averageScore = allAnalyses.length > 0 
      ? Math.round(allAnalyses.reduce((sum, a) => sum + a.score, 0) / allAnalyses.length)
      : 0;
    
    const highScoreCount = allAnalyses.filter(a => a.score >= 80).length;
    const mediumScoreCount = allAnalyses.filter(a => a.score >= 50 && a.score < 80).length;
    const lowScoreCount = allAnalyses.filter(a => a.score < 50).length;

    const summary = {
      totalInvestors,
      totalBatches,
      batchSize,
      startBatch: startBatch + 1,
      endBatch: endBatch + 1,
      batchesProcessed: endBatch - startBatch + 1,
      totalAnalyzed: allAnalyses.length,
      totalProcessed,
      totalTopRated,
      totalErrors,
      averageScore,
      scoreDistribution: {
        high: highScoreCount,
        medium: mediumScoreCount,
        low: lowScoreCount
      },
      batchResults,
      range: {
        from: startBatch * batchSize + 1,
        to: Math.min((endBatch + 1) * batchSize, totalInvestors)
      }
    };

    console.log('📈 Progressive Analysis Summary:', summary);

    return NextResponse.json({
      success: true,
      message: `Progressive analysis completed successfully. Processed ${totalProcessed} investors across ${endBatch - startBatch + 1} micro-batches.`,
      summary,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Unexpected error in progressive analysis:', error);
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

// Handle GET requests for progressive analysis info
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const batchSize = parseInt(searchParams.get('batch_size') || '10');
    const numBatches = parseInt(searchParams.get('num_batches') || '5');

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
    const maxStartBatch = Math.max(0, totalBatches - numBatches);

    return NextResponse.json({
      success: true,
      data: {
        totalInvestors,
        totalBatches,
        batchSize,
        numBatches,
        maxStartBatch,
        estimatedTimePerBatch: 2, // seconds
        estimatedTotalTime: numBatches * 2, // seconds
        recommendedBatches: Math.min(10, totalBatches) // Don't overwhelm the system
      }
    });

  } catch (error) {
    console.error('Error getting progressive analysis info:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 