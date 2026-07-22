import { ScheduledActivity } from './schedulerV1';
import { TripEngineInputV1, FlightSegment } from './contracts';

export interface SemanticWindow {
  startMs: number; // ms from 00:00
  endMs: number;   // ms from 00:00
}

export class SemanticRules {
  /**
   * Determine the valid time windows for a given experience in the catalog.
   */
  static getValidWindows(experience: any, dateStr: string): SemanticWindow[] {
    // 1. Operating Hours Check (Highest Priority)
    // Assuming experience.operating_hours is available and mapped.
    // If not, fallback to semantic derivation.
    if (experience.operating_hours && experience.operating_hours.length > 0) {
       const dateObj = new Date(dateStr + "T12:00:00Z");
       const dayOfWeek = dateObj.getDay(); // 0 = Sunday
       // Try to find matching day (assuming DB uses 0-6 or 1-7)
       const opDay = experience.operating_hours.find((o: any) => o.day_of_week === dayOfWeek || o.day_of_week === (dayOfWeek === 0 ? 7 : dayOfWeek));
       if (opDay && !opDay.is_closed && opDay.open_time && opDay.close_time) {
          return [this.parseTimeString(opDay.open_time, opDay.close_time)];
       }
       if (opDay && opDay.is_closed) return []; // Explicitly closed
    }

    // 2. Meal Periods and structured types
    const cat = (experience.category || '').toLowerCase();
    const type = (experience.type || '').toLowerCase();
    const tags = (experience.tags || []).map((t: string) => t.toLowerCase());
    const role = (experience.experienceRole || '').toLowerCase();
    const bestTime = (experience.bestTime || '').toLowerCase(); // If it exists dynamically

    if (role === 'dinner' || cat === 'dinner' || tags.includes('dinner') || tags.includes('jantar')) {
      return [{ startMs: 18 * 3600000, endMs: 23 * 3600000 }];
    }
    
    if (role === 'lunch' || cat === 'lunch' || tags.includes('lunch') || tags.includes('almoço')) {
      return [{ startMs: 11 * 3600000 + 1800000, endMs: 15 * 3600000 }]; // 11:30 to 15:00
    }

    if (role === 'breakfast' || tags.includes('breakfast') || tags.includes('café da manhã') || cat === 'cafe') {
      return [{ startMs: 7 * 3600000, endMs: 11 * 3600000 + 1800000 }]; // 07:00 to 11:30
    }
    
    if (tags.includes('brunch')) {
      return [{ startMs: 10 * 3600000, endMs: 14 * 3600000 }];
    }

    if (tags.includes('nightlife') || tags.includes('rooftop') || tags.includes('bar') || tags.includes('club') || cat === 'nightlife') {
      return [{ startMs: 19 * 3600000, endMs: 26 * 3600000 }]; // 19:00 to 02:00 next day
    }

    if (tags.includes('sunrise') || tags.includes('nascer do sol')) {
      return [{ startMs: 5 * 3600000, endMs: 9 * 3600000 }];
    }

    if (tags.includes('show') || tags.includes('broadway') || tags.includes('teatro') || cat === 'show') {
      return [{ startMs: 18 * 3600000, endMs: 23 * 3600000 }];
    }

    if (bestTime === 'morning') {
      return [{ startMs: 8 * 3600000, endMs: 12 * 3600000 }];
    }

    if (bestTime === 'afternoon') {
      return [{ startMs: 12 * 3600000, endMs: 18 * 3600000 }];
    }

    if (bestTime === 'night') {
      return [{ startMs: 18 * 3600000, endMs: 24 * 3600000 }];
    }

    // Default fallback (conservative for open attractions)
    return [{ startMs: 9 * 3600000, endMs: 18 * 3600000 }];
  }

  static getEstimatedDurationMs(experience: any): number {
    if (experience.durationHours) {
       return experience.durationHours * 3600000;
    }
    
    const cat = (experience.category || '').toLowerCase();
    const tags = (experience.tags || []).map((t: string) => t.toLowerCase());

    if (cat === 'show' || tags.includes('broadway')) return 3 * 3600000; // 3h
    if (cat === 'museum' || tags.includes('museum')) return 2.5 * 3600000; // 2.5h
    if (tags.includes('dinner')) return 2 * 3600000; // 2h
    if (tags.includes('lunch') || tags.includes('brunch')) return 1.5 * 3600000; // 1.5h
    if (tags.includes('breakfast') || cat === 'cafe') return 1 * 3600000; // 1h

    return 2 * 3600000; // Default 2h
  }

  private static parseTimeString(open: string, close: string): SemanticWindow {
    // Expected format "HH:MM:SS"
    const parse = (time: string) => {
       const [h, m] = time.split(':').map(Number);
       return (h * 3600000) + ((m || 0) * 60000);
    };
    return { startMs: parse(open), endMs: parse(close) };
  }
}
