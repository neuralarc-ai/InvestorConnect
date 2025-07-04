import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';
import { InvestorAnalyzer } from '@/lib/investor-analyzer';
import type { Investor, InvestorMatchAnalysis } from '@/lib/types';

// Vercel cron job handler
export async function GET(request: NextRequest) {
  try {
    console.log('🚀 Starting investor analysis cron job...');
    
    // Verify this is a legitimate cron request (optional security check)
    const authHeader = request.headers.get('authorization');
    if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      console.log('❌ Unauthorized cron job request');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Step 1: Get total count and process in batches
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

    console.log(`📊 Found ${totalInvestors} total investors to analyze`);

    // Step 1.5: Get last batch processed from cron_progress
    let lastBatchProcessed = 0;
    const { data: progressData, error: progressError } = await supabase
      .from('cron_progress')
      .select('last_batch_processed')
      .eq('id', 'investor_analysis')
      .single();
    if (progressData && typeof progressData.last_batch_processed === 'number') {
      lastBatchProcessed = progressData.last_batch_processed;
    }

    // Step 2: Clear existing analysis data only if starting from batch 0
    if (lastBatchProcessed === 0) {
      console.log('🧹 Clearing existing analysis data...');
      const { error: clearError } = await supabase
        .from('investor_match_analysis')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all records

      if (clearError) {
        console.error('❌ Error clearing existing analysis:', clearError);
        return NextResponse.json(
          { error: 'Failed to clear existing analysis', details: clearError.message },
          { status: 500 }
        );
      }
      console.log('✅ Cleared existing analysis data');
    } else {
      console.log(`⏩ Resuming from batch ${lastBatchProcessed}`);
    }

    // Step 3: Process investors in small batches of 10
    console.log('🔍 Starting micro-batch analysis...');
    const analyzer = new InvestorAnalyzer();
    const BATCH_SIZE = 10; // Process only 10 investors at a time
    const totalBatches = Math.ceil(totalInvestors / BATCH_SIZE);
    let allAnalyses: InvestorMatchAnalysis[] = [];
    let processedCount = 0;

    for (let batchNum = lastBatchProcessed; batchNum < totalBatches; batchNum++) {
      const from = batchNum * BATCH_SIZE;
      const to = from + BATCH_SIZE - 1;
      console.log(`📦 Processing micro-batch ${batchNum + 1}/${totalBatches} (records ${from + 1}-${Math.min(to + 1, totalInvestors)})`);
      // Fetch micro-batch of investors
      const { data: batchInvestors, error: batchError } = await supabase
        .from('investors')
        .select('*')
        .range(from, to)
        .order('id', { ascending: true });
      if (batchError) {
        console.error(`❌ Error fetching micro-batch ${batchNum + 1}:`, batchError);
        continue;
      }
      if (!batchInvestors || batchInvestors.length === 0) {
        console.log(`⚠️ No investors in micro-batch ${batchNum + 1}`);
        continue;
      }
      // Analyze this micro-batch
      const batchAnalyses = analyzer.analyzeAllInvestors(batchInvestors as Investor[]);
      allAnalyses = [...allAnalyses, ...batchAnalyses];
      processedCount += batchInvestors.length;
      console.log(`✅ Micro-batch ${batchNum + 1} complete. Processed ${batchInvestors.length} investors. Total processed: ${processedCount}/${totalInvestors}`);
      // Update cron_progress after each batch
      await supabase.from('cron_progress').upsert({
        id: 'investor_analysis',
        last_batch_processed: batchNum + 1,
        updated_at: new Date().toISOString()
      });
      // Longer delay between micro-batches to prevent overload
      if (batchNum < totalBatches - 1) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }

    // After all batches, reset progress
    await supabase.from('cron_progress').upsert({
      id: 'investor_analysis',
      last_batch_processed: 0,
      updated_at: new Date().toISOString()
    });

    console.log(`✅ Micro-batch analysis complete. Generated ${allAnalyses.length} analysis records`);

    // Step 4: Save analysis results to database in batches
    console.log('💾 Saving analysis results to database...');
    const INSERT_BATCH_SIZE = 100;
    const insertBatches = [];
    
    for (let i = 0; i < allAnalyses.length; i += INSERT_BATCH_SIZE) {
      insertBatches.push(allAnalyses.slice(i, i + INSERT_BATCH_SIZE));
    }

    let totalInserted = 0;
    let totalErrors = 0;

    for (let i = 0; i < insertBatches.length; i++) {
      const batch = insertBatches[i];
      console.log(`💾 Inserting batch ${i + 1}/${insertBatches.length} (${batch.length} records)`);

      const { data: insertedData, error: insertError } = await supabase
        .from('investor_match_analysis')
        .insert(batch)
        .select();

      if (insertError) {
        console.error(`❌ Error inserting batch ${i + 1}:`, insertError);
        totalErrors += batch.length;
      } else {
        totalInserted += insertedData?.length || 0;
        console.log(`✅ Insert batch ${i + 1} successful`);
      }

      // Small delay between insert batches to avoid overwhelming the database
      if (i < insertBatches.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    // Step 5: Generate summary statistics
    const topRatedCount = allAnalyses.filter(a => a.top_rated).length;
    const averageScore = Math.round(
      allAnalyses.reduce((sum, a) => sum + a.score, 0) / allAnalyses.length
    );
    const highScoreCount = allAnalyses.filter(a => a.score >= 80).length;
    const mediumScoreCount = allAnalyses.filter(a => a.score >= 50 && a.score < 80).length;
    const lowScoreCount = allAnalyses.filter(a => a.score < 50).length;

    const summary = {
      totalInvestors,
      totalAnalyzed: allAnalyses.length,
      totalInserted,
      totalErrors,
      topRatedCount,
      averageScore,
      scoreDistribution: {
        high: highScoreCount,
        medium: mediumScoreCount,
        low: lowScoreCount
      },
      batchInfo: {
        totalBatches,
        batchSize: BATCH_SIZE,
        processedCount
      }
    };

    console.log('📈 Analysis Summary:', summary);

    // Step 6: Return success response
    return NextResponse.json({
      success: true,
      message: 'Investor analysis completed successfully',
      summary,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Unexpected error in cron job:', error);
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

// Handle POST requests as well (for manual triggering)
export async function POST(request: NextRequest) {
  return GET(request);
} 