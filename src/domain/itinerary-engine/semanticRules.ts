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
    const role = this.getExperienceRole(experience); // Re-use the role classifier
    const bestTime = (experience.bestTime || '').toLowerCase();

    if (role === 'dinner') {
      return [{ startMs: 18 * 3600000, endMs: 23 * 3600000 }];
    }
    
    if (role === 'lunch') {
      return [{ startMs: 11 * 3600000 + 1800000, endMs: 15 * 3600000 }]; 
    }

    if (role === 'breakfast') {
      return [{ startMs: 7 * 3600000, endMs: 11 * 3600000 + 1800000 }]; 
    }
    
    if (role === 'brunch') {
      return [{ startMs: 10 * 3600000, endMs: 14 * 3600000 }];
    }

    if (role === 'fast_food' || role === 'pizza' || role === 'flexible_food') {
      return [{ startMs: 11 * 3600000 + 1800000, endMs: 22 * 3600000 }]; // Block before 11:30
    }

    // Daytime specific rooftops
    if (role === 'rooftop_day_view') {
      return [{ startMs: 11 * 3600000, endMs: 18 * 3600000 }];
    }

    if (role === 'nightlife' || role === 'rooftop') {
      return [{ startMs: 18 * 3600000, endMs: 26 * 3600000 }]; // 18:00 to 02:00
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
    const classif = this.getClassification(experience);
    return classif ? classif.semanticRole : null;
  }

  static getClassification(experience: any): { semanticRole: string, parentRole: string, foodSubtype?: string } | null {
    if (experience.experienceRole) {
       return { semanticRole: experience.experienceRole, parentRole: experience.experienceRole };
    }
    
    const cat = (experience.category || '').toLowerCase();
    const tags = (experience.tags || []).map((t: string) => t.toLowerCase());
    const title = (experience.title || experience.name || '').toLowerCase();

    // Priority 1: Explicit Title rules
    if (title.includes('jantar') || title.includes('dinner')) return { semanticRole: 'dinner', parentRole: 'food' };
    if (title.includes('festa') || title.includes('party') || title.includes('nightclub') || tags.includes('nightclub') || tags.includes('noite') && title.includes('edge')) return { semanticRole: 'nightlife', parentRole: 'nightlife' };
    if (title.includes('brunch') || tags.includes('brunch')) return { semanticRole: 'brunch', parentRole: 'food' };
    if (title.includes('almoço') || title.includes('lunch')) return { semanticRole: 'lunch', parentRole: 'food' };
    if (tags.includes('café da manhã') || tags.includes('breakfast')) return { semanticRole: 'breakfast', parentRole: 'food' };

    if (cat === 'show' || tags.includes('broadway') || tags.includes('teatro') || title.includes('broadway') || title.includes('show')) return { semanticRole: 'theater_show', parentRole: 'theater_show' };
    
    // Check for daytime rooftop
    if (tags.includes('rooftop') && (tags.includes('almoço') || tags.includes('dia') || tags.includes('view') || title.includes('one40'))) return { semanticRole: 'rooftop_day_view', parentRole: 'rooftop' };
    if (tags.includes('rooftop') || title.includes('rooftop')) return { semanticRole: 'rooftop_bar', parentRole: 'rooftop' };
    
    if (tags.includes('pizza') || title.includes('pizza')) return { semanticRole: 'flexible_food', parentRole: 'food', foodSubtype: 'pizza' };
    if (tags.includes('hamburguer') || tags.includes('rápido') || title.includes('shake shack')) return { semanticRole: 'flexible_food', parentRole: 'food', foodSubtype: 'fast_food' };
    if (tags.includes('park') || title.includes('park')) return { semanticRole: 'park', parentRole: 'park' };
    if (tags.includes('museum') || title.includes('museum') || cat === 'museum') return { semanticRole: 'museum', parentRole: 'museum' };
    if (tags.includes('panoramic_view') || title.includes('edge') || title.includes('summit')) return { semanticRole: 'panoramic_view', parentRole: 'panoramic_view' };
    
    return null;
  }

  static getMaxInstancesPerRole(parentRole: string): number {
    switch(parentRole) {
      case 'rooftop': return 2; // Max 2 rooftops per trip globally
      case 'theater_show': return 2; 
      case 'panoramic_view': return 2;
      case 'museum': return 3;
      case 'park': return 3;
      default: return 99; // Unlimited if role not strictly capped
    }
  }

  static getMaxInstancesPerFoodSubtype(foodSubtype: string): number {
    switch(foodSubtype) {
      case 'pizza': return 2;
      case 'fast_food': return 2;
      default: return 99;
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
