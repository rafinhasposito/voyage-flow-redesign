import { ScheduledActivity } from './schedulerV1';
import { TripEngineInputV1, FlightSegment } from './contracts';

export interface SemanticWindow {
  startMs: number; 
  endMs: number;   
}

export class SemanticRules {
  
  static getValidWindows(experience: any, dateStr: string): SemanticWindow[] {
    const dateObj = new Date(dateStr + "T12:00:00Z");
    const dayOfWeek = dateObj.getDay(); // 0 = Sunday

    // 0. Strict Weekday rules based on Tags/Title
    const title = (experience.title || experience.name || '').toLowerCase();
    const tags = (experience.tags || []).map((t: string) => t.toLowerCase());

    if ((title.includes('sunday') || tags.includes('sunday')) && dayOfWeek !== 0) return [];
    if ((title.includes('saturday') || tags.includes('saturday')) && dayOfWeek !== 6) return [];
    if ((title.includes('friday') || tags.includes('friday')) && dayOfWeek !== 5) return [];

    // 1. Operating Hours Check (Highest Priority)
    if (experience.operating_hours && experience.operating_hours.length > 0) {
       const opDay = experience.operating_hours.find((o: any) => o.day_of_week === dayOfWeek || o.day_of_week === (dayOfWeek === 0 ? 7 : dayOfWeek));
       if (opDay && !opDay.is_closed && opDay.open_time && opDay.close_time) {
          return [this.parseTimeString(opDay.open_time, opDay.close_time)];
       }
       if (opDay && opDay.is_closed) return []; 
    }

    // 2. Meal Periods and structured types
    const cat = (experience.category || '').toLowerCase();
    const role = (experience.experienceRole || '').toLowerCase();
    const bestTime = (experience.bestTime || '').toLowerCase();

    if (role === 'dinner' || cat === 'dinner' || (tags.includes('dinner') && !tags.includes('fast_food')) || tags.includes('jantar')) {
      return [{ startMs: 18 * 3600000, endMs: 23 * 3600000 }];
    }
    
    if (role === 'lunch' || cat === 'lunch' || (tags.includes('lunch') && !tags.includes('fast_food')) || tags.includes('almoço')) {
      return [{ startMs: 11 * 3600000 + 1800000, endMs: 15 * 3600000 }]; 
    }

    if (role === 'breakfast' || tags.includes('breakfast') || tags.includes('café da manhã') || cat === 'cafe') {
      return [{ startMs: 7 * 3600000, endMs: 11 * 3600000 + 1800000 }]; 
    }
    
    if (tags.includes('brunch') || title.includes('brunch')) {
      return [{ startMs: 10 * 3600000, endMs: 14 * 3600000 }];
    }

    if (tags.includes('fast_food') || tags.includes('pizza') || role === 'flexible_food' || title.includes('shake shack') || title.includes('pizza')) {
      return [{ startMs: 11 * 3600000 + 1800000, endMs: 22 * 3600000 }]; // 11:30 to 22:00
    }

    // Daytime specific rooftops
    if (tags.includes('rooftop_day_view') || title.includes('edge') || title.includes('summit')) {
      return [{ startMs: 9 * 3600000, endMs: 18 * 3600000 }];
    }

    if (tags.includes('nightlife') || tags.includes('rooftop') || tags.includes('bar') || tags.includes('club') || cat === 'nightlife') {
      return [{ startMs: 18 * 3600000, endMs: 26 * 3600000 }]; // Shifted back to 18:00
    }

    if (tags.includes('sunrise') || tags.includes('nascer do sol')) {
      return [{ startMs: 5 * 3600000, endMs: 9 * 3600000 }];
    }

    if (tags.includes('show') || tags.includes('broadway') || tags.includes('teatro') || cat === 'show' || title.includes('broadway')) {
      return [{ startMs: 19 * 3600000, endMs: 23 * 3600000 }];
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

    // Default fallback (conservative)
    return [{ startMs: 9 * 3600000, endMs: 18 * 3600000 }];
  }

  static getEstimatedDurationMs(experience: any): number {
    let duration = 0;
    
    const cat = (experience.category || '').toLowerCase();
    const tags = (experience.tags || []).map((t: string) => t.toLowerCase());
    const title = (experience.title || experience.name || '').toLowerCase();

    if (experience.durationHours) {
       duration = experience.durationHours * 3600000;
    } else if (cat === 'show' || tags.includes('broadway') || title.includes('broadway')) {
       duration = 3 * 3600000;
    } else if (cat === 'museum' || tags.includes('museum')) {
       duration = 2.5 * 3600000; 
    } else if (tags.includes('dinner')) {
       duration = 2 * 3600000; 
    } else if (tags.includes('lunch') || tags.includes('brunch')) {
       duration = 1.5 * 3600000; 
    } else if (tags.includes('breakfast') || cat === 'cafe') {
       duration = 1 * 3600000; 
    } else if (tags.includes('helicopter') || title.includes('helicopter')) {
       duration = 1 * 3600000; // Even if flight is 15min, ops take 1h
    } else {
       duration = 2 * 3600000; 
    }

    // Minimum buffer: Nothing should take less than 1 hour in a real itinerary logistically
    return Math.max(duration, 3600000); 
  }

  static isHighFriction(experience: any): boolean {
    const cat = (experience.category || '').toLowerCase();
    const tags = (experience.tags || []).map((t: string) => t.toLowerCase());
    const title = (experience.title || experience.name || '').toLowerCase();

    if (tags.includes('helicopter') || title.includes('helicopter')) return true;
    if (cat === 'show' || tags.includes('broadway') || title.includes('broadway')) return true;
    if (tags.includes('tour') && tags.includes('boat')) return true;
    if (title.includes('summit') || title.includes('edge') || tags.includes('panoramic_view')) return true;

    return false;
  }

  static getExperienceRole(experience: any): string | null {
    if (experience.experienceRole) return experience.experienceRole;
    
    const cat = (experience.category || '').toLowerCase();
    const tags = (experience.tags || []).map((t: string) => t.toLowerCase());
    const title = (experience.title || experience.name || '').toLowerCase();

    if (cat === 'show' || tags.includes('broadway') || tags.includes('teatro') || title.includes('broadway') || title.includes('show')) return 'theater_show';
    if (tags.includes('rooftop') || title.includes('rooftop')) return 'rooftop';
    if (tags.includes('pizza') || title.includes('pizza')) return 'pizza';
    if (tags.includes('park') || title.includes('park')) return 'park';
    if (tags.includes('museum') || title.includes('museum') || cat === 'museum') return 'museum';
    if (tags.includes('panoramic_view') || title.includes('edge') || title.includes('summit')) return 'panoramic_view';
    
    return null;
  }

  static getMaxInstancesPerRole(role: string): number {
    switch(role) {
      case 'theater_show': return 2; // Max 2 shows per trip
      case 'rooftop': return 2;
      case 'panoramic_view': return 1;
      case 'pizza': return 2;
      case 'museum': return 3;
      case 'park': return 3;
      default: return 99; // Unlimited if role not strictly capped
    }
  }

  private static parseTimeString(open: string, close: string): SemanticWindow {
    const parse = (time: string) => {
       const [h, m] = time.split(':').map(Number);
       return (h * 3600000) + ((m || 0) * 60000);
    };
    return { startMs: parse(open), endMs: parse(close) };
  }
}
