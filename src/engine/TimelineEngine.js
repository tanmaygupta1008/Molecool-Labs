/**
 * TimelineEngine
 * Handles playback, seeking, and tracking elapsed time.
 * Evaluates which events currently overlap the playback head.
 */
export class TimelineEngine {
    constructor(events = []) {
        this.events = events;
        this.currentTime = 0; // ms
        this.isPlaying = false;
        this.totalDuration = this.calculateTotalDuration(events);
        this.onTick = null; // (currentTime, activeEvents, deltaMs) => void
    }

    calculateTotalDuration(events) {
        let max = 0;
        events.forEach(event => {
            const end = event.startTime + (event.duration || 0);
            if (end > max) max = end;
        });
        return max;
    }

    play() {
        this.isPlaying = true;
    }

    pause() {
        this.isPlaying = false;
    }

    seek(timeMs) {
        this.currentTime = Math.max(0, Math.min(timeMs, this.totalDuration));
        this.evaluateEvents(0); // seek delta is effectively 0 for state snapshot
    }

    reset() {
        this.currentTime = 0;
        this.isPlaying = false;
        this.evaluateEvents(0);
    }

    tick(deltaMs) {
        if (!this.isPlaying) return;

        this.currentTime += deltaMs;

        // Stop if we reach the end
        if (this.currentTime >= this.totalDuration) {
            this.currentTime = this.totalDuration;
            this.pause();
        }

        this.evaluateEvents(deltaMs);
    }

    evaluateEvents(deltaMs) {
        // Find all events that overlap the current timeline
        const activeEvents = this.events.filter(event => {
            const { startTime, duration = 0 } = event;
            const endTime = startTime + duration;
            return this.currentTime >= startTime && this.currentTime <= endTime;
        });

        if (this.onTick) {
            this.onTick(this.currentTime, activeEvents, deltaMs);
        }
    }
}
