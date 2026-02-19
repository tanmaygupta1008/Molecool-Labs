
import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

// WARNING: This API writes directly to the source code file.
// It is intended for development/refinement use only.

export async function POST(req) {
    try {
        const { reactionId, visualRules } = await req.json();

        if (!reactionId || !visualRules) {
            return NextResponse.json({ error: 'Missing reactionId or visualRules' }, { status: 400 });
        }

        // Path to the source file (works in development mode)
        // Adjust based on project root if necessary
        const filePath = path.join(process.cwd(), 'src/data/reactions.json');

        // Read the file
        const fileContent = fs.readFileSync(filePath, 'utf8');
        const reactions = JSON.parse(fileContent);

        // Find and Update
        const reactionIndex = reactions.findIndex(r => r.id === reactionId);

        if (reactionIndex === -1) {
            return NextResponse.json({ error: 'Reaction not found' }, { status: 404 });
        }

        // Initialize macroView object if missing
        if (!reactions[reactionIndex].macroView) {
            reactions[reactionIndex].macroView = {};
        }

        // Update Visual Rules
        reactions[reactionIndex].macroView.visualRules = visualRules;

        // Write back to file with formatting
        fs.writeFileSync(filePath, JSON.stringify(reactions, null, 4), 'utf8');

        return NextResponse.json({
            success: true,
            message: 'Visual rules saved successfully!',
            updatedReaction: reactions[reactionIndex]
        });

    } catch (error) {
        console.error('Error saving reaction:', error);
        return NextResponse.json({
            error: 'Failed to save reaction file.',
            details: error.message
        }, { status: 500 });
    }
}
