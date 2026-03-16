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

        // Format data into a chat-friendly message
        const chatMessage = formatPredictionResponse(data);

        return NextResponse.json({
            message: chatMessage,
            raw: data,
            source: data.source || 'ml-backend',
            fallback: false,
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

function formatPredictionResponse(data) {
    const {
        reactants,
        product,
        probability,
        yield_pct,
        feasible,
        explanation,
        reaction_type,
        source,
    } = data;

    let msg = '';

    // Header
    if (reactants && reactants.length > 0) {
        msg += `**Reactants:** ${reactants.join(' + ')}\n`;
    }
    msg += `**Predicted Product:** ${product}\n`;
    msg += `**Confidence:** ${probability.toFixed(1)}%\n`;
    msg += `**Estimated Yield:** ${yield_pct.toFixed(1)}%\n`;

    if (reaction_type && reaction_type !== 'unknown') {
        msg += `**Reaction Type:** ${reaction_type}\n`;
    }

    if (!feasible) {
        msg += `\n⚠️ This reaction may not be feasible under normal conditions.\n`;
    }

    // Explanation
    if (explanation) {
        msg += `\n${explanation}`;
    }

    // Source tag
    const sourceLabel = source === 'ml-model' ? '🧠 ML Model' :
                        source === 'rule-based' ? '📘 Rule-Based' :
                        source === 'cache' ? '⚡ Cached' : `📡 ${source}`;
    msg += `\n\n_Powered by ${sourceLabel}_`;

    return msg;
}
