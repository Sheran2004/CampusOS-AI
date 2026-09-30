import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { storage } from '@/lib/storage';
import { analyzeResume } from '@/lib/ai';

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    if (!file) return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });

    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: 'File too large (max 5MB)' }, { status: 400 });
    }

    const fileName = file.name.toLowerCase();
    let extractedText = '';

    if (file.type === 'application/pdf' || fileName.endsWith('.pdf')) {
      const buffer = Buffer.from(await file.arrayBuffer());
      try {
        const pdfParse = require('pdf-parse');
        const parsed = await pdfParse(buffer);
        extractedText = parsed.text || '';
      } catch (e: any) {
        return NextResponse.json(
          { error: `Failed to parse PDF: ${e.message}. Try pasting text directly.` },
          { status: 400 }
        );
      }
    } else if (file.type === 'text/plain' || fileName.endsWith('.txt') || fileName.endsWith('.md')) {
      extractedText = await file.text();
    } else if (
      file.type === 'application/msword' ||
      file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
      fileName.endsWith('.doc') ||
      fileName.endsWith('.docx')
    ) {
      return NextResponse.json(
        { error: 'DOCX support coming soon. Please paste text or upload a PDF instead.' },
        { status: 400 }
      );
    } else {
      return NextResponse.json(
        { error: 'Unsupported file type. Upload PDF, TXT, or paste text directly.' },
        { status: 400 }
      );
    }

    if (!extractedText || extractedText.trim().length < 50) {
      return NextResponse.json(
        { error: 'Could not extract enough text from the file (min 50 characters). Try pasting text directly.' },
        { status: 400 }
      );
    }

    const truncated = extractedText.substring(0, 15000);
    const analysis = await analyzeResume(truncated);

    await storage.saveResumeScore({
      userId: user.id,
      score: analysis.score,
      atsScore: analysis.atsScore,
      feedback: analysis,
    });

    return NextResponse.json({ analysis, extractedLength: extractedText.length });
  } catch (err: any) {
    console.error('Resume upload error:', err);
    return NextResponse.json({ error: err.message || 'Upload failed' }, { status: 500 });
  }
}
