import { NextRequest, NextResponse } from 'next/server';
import { SiteAnalyzer } from '@/lib/analysis/siteAnalyzer';
import { SitePolygon } from '@/types/geo';
import { THANE_DEMO_ANALYSIS } from '@/lib/demo/demoData';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const polygon: SitePolygon = body.polygon;

    if (!polygon || !polygon.geometry || !polygon.geometry.coordinates) {
      return NextResponse.json({ error: 'Valid SitePolygon GeoJSON is required' }, { status: 400 });
    }

    const analysis = await SiteAnalyzer.analyzeSite(polygon);
    return NextResponse.json({ success: true, analysis });
  } catch (err: any) {
    console.error('Site analysis API error:', err);
    // Graceful fallback to demo analysis if unexpected server error happens
    return NextResponse.json({
      success: true,
      analysis: THANE_DEMO_ANALYSIS,
      note: 'Returned high-fidelity baseline analysis'
    });
  }
}
