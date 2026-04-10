// src/app/api/ml-predict/route.js
import { NextResponse } from 'next/server';

const ML_BACKEND_URL = process.env.ML_BACKEND_URL || 'http://localhost:8000';

export async function POST(request) {
    try {
        const body = await request.json();
        const { query, session_id } = body;

        if (!query || !query.trim()) {
            return NextResponse.json(
                { error: 'Query is required' },
                { status: 400 }
            );
        }

        // Forward to FastAPI backend
        const response = await fetch(`${ML_BACKEND_URL}/predict`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ query, session_id }),
            signal: AbortSignal.timeout(15000), // 15s timeout
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            return NextResponse.json(
                {
                    error: errorData.detail || 'Prediction failed',
                    fallback: true,
                },
                { status: response.status }
            );
        }

        const data = await response.json();

        // The FastAPI backend now returns { message: "...", docs: [...], source: "..." }
        return NextResponse.json({
            message: data.message || "No answer returned.",
            docs: data.docs || [],
            source: data.source || 'ChemistryRAG Model',
            fallback: false,
            raw: data,
        });

    } catch (error) {
        console.error('[ml-predict] Backend unreachable:', error.message);
        return NextResponse.json(
            {
                error: 'ML backend is not reachable',
                fallback: true,
            },
            { status: 503 }
        );
    }
}

// Health-check endpoint for connectivity indicator
export async function GET() {
    try {
        const response = await fetch(`${ML_BACKEND_URL}/health`, {
            signal: AbortSignal.timeout(3000),
        });
        const data = await response.json();
        return NextResponse.json({ connected: true, ...data });
    } catch {
        return NextResponse.json({ connected: false }, { status: 503 });
    }
}
