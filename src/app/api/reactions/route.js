import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const filePath = path.join(process.cwd(), 'src', 'data', 'reactions.json');

export async function GET() {
    try {
        const fileContent = await fs.promises.readFile(filePath, 'utf8');
        const data = JSON.parse(fileContent);
        return NextResponse.json(data, { status: 200 });
    } catch (error) {
        console.error('Error reading reactions:', error);
        return NextResponse.json({ error: 'Failed to read reactions' }, { status: 500 });
    }
}

export async function POST(request) {
    try {
        const newReactions = await request.json();
        await fs.promises.writeFile(filePath, JSON.stringify(newReactions, null, 4), 'utf8');
        return NextResponse.json({ message: 'Reactions saved successfully' }, { status: 200 });
    } catch (error) {
        console.error('Error saving reactions:', error);
        return NextResponse.json({ error: 'Failed to save reactions' }, { status: 500 });
    }
}
