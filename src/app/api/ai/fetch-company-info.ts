import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { url } = await req.json();
    if (!url) {
      return NextResponse.json({ error: 'Missing url' }, { status: 400 });
    }
    const TAVILY_API_KEY = process.env.TAVILY_API_KEY;
    if (!TAVILY_API_KEY) {
      return NextResponse.json({ error: 'Missing Tavily API key' }, { status: 500 });
    }
    // Tavily API: https://docs.tavily.com/reference/retrieve
    const tavilyRes = await fetch('https://api.tavily.com/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${TAVILY_API_KEY}`,
      },
      body: JSON.stringify({
        query: `Summarize the company at this website. Give a concise company description and a bullet list of main services or products. Website: ${url}`,
        include_answer: true,
        include_raw_content: false,
        include_images: false,
        include_sources: false,
        max_results: 1,
      }),
    });
    if (!tavilyRes.ok) {
      return NextResponse.json({ error: 'Failed to fetch from Tavily' }, { status: 500 });
    }
    const tavilyData = await tavilyRes.json();
    // Try to parse answer for description and services
    let description = '';
    let services: any[] = [];
    if (tavilyData.answer) {
      // Try to split answer into description and services
      const answer = tavilyData.answer;
      const [desc, ...rest] = answer.split(/\n- |\n\d+\. /);
      description = desc.trim();
      if (rest.length > 0) {
        services = rest.map(s => ({
          name: s.split(/[:\-]/)[0].trim(),
          category: 'Service',
          description: s.trim(),
          targetMarket: ''
        }));
      }
    }
    return NextResponse.json({ description, services });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Internal error' }, { status: 500 });
  }
} 