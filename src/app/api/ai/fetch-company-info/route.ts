import { NextRequest, NextResponse } from 'next/server';

function extractServicesFromText(text: string): any[] {
  // Look for lines starting with '-', '*', or numbered lists
  const lines = text.split('\n');
  const serviceLines = lines.filter(line =>
    /^\s*[-*]\s+/.test(line) || /^\s*\d+\.\s+/.test(line)
  );
  if (serviceLines.length === 0) {
    // Try to find a section labeled 'Services' or 'Products'
    const servicesSection = text.split(/services?:|products?:/i)[1];
    if (servicesSection) {
      return servicesSection.split(/\n|\r/).filter(l => l.trim()).map(s => ({
        name: s.split(/[:\-]/)[0].trim(),
        category: 'Service',
        description: s.trim(),
        targetMarket: ''
      }));
    }
    return [];
  }
  return serviceLines.map(s => ({
    name: s.replace(/^\s*[-*\d.]+\s*/, '').split(/[:\-]/)[0].trim(),
    category: 'Service',
    description: s.replace(/^\s*[-*\d.]+\s*/, '').trim(),
    targetMarket: ''
  }));
}

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
    let description = '';
    let services: any[] = [];
    if (tavilyData.answer) {
      // Try to split answer into description and services
      const answer = tavilyData.answer;
      // Description: everything before the first bullet/numbered list
      const descMatch = answer.match(/^[^\n-\d*]+/);
      description = descMatch ? descMatch[0].trim() : answer.trim();
      services = extractServicesFromText(answer);
    }
    return NextResponse.json({ description, services });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Internal error' }, { status: 500 });
  }
} 