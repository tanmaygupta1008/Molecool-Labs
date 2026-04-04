import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const SNAP_RULES_PATH = path.join(process.cwd(), 'src', 'data', 'apparatus-snap-rules.json');

export async function GET() {
    try {
        const data = fs.readFileSync(SNAP_RULES_PATH, 'utf-8');
        return NextResponse.json(JSON.parse(data));
    } catch (err) {
        return NextResponse.json({ error: 'Failed to read snap rules' }, { status: 500 });
    }
}

export async function POST(request) {
    try {
        const body = await request.json();
        // Validate minimal structure
        if (!body.rules || typeof body.rules !== 'object') {
            return NextResponse.json({ error: 'Invalid payload: missing rules object' }, { status: 400 });
        }
        // Update metadata timestamp
        body.metadata = body.metadata || {};
        body.metadata.lastUpdated = new Date().toISOString().split('T')[0];
        fs.writeFileSync(SNAP_RULES_PATH, JSON.stringify(body, null, 2), 'utf-8');
        return NextResponse.json({ success: true });
    } catch (err) {
        return NextResponse.json({ error: 'Failed to write snap rules', detail: err.message }, { status: 500 });
    }
}
