import { TripEngineInputV1 } from './contracts';
import { ItineraryDraftV1 } from './schedulerV1';

export class GeoAuditExporter {
  static build(inputData: TripEngineInputV1, draft: ItineraryDraftV1, tripId: string) {
    const exportData: any = {
      tripId,
      basecamp: null,
      draftActivities: [],
      summary: {
        totalEntities: 0,
        draftActivitiesCount: 0,
        validGps: 0,
        missingGps: 0,
        invalidGps: 0,
        coveragePercent: 0,
        basecampHasGps: false,
        possibleSegments: 0
      }
    };

    const getSituation = (lat?: number, lng?: number) => {
      if (lat === undefined || lat === null || lng === undefined || lng === null) return 'missing_gps';
      if (isNaN(lat) || isNaN(lng) || lat === 0 || lng === 0) return 'invalid_gps';
      return 'valid_gps';
    };

    let valid = 0;
    let missing = 0;
    let invalid = 0;
    
    if (inputData.basecamp) {
      const lat = inputData.basecamp.lat;
      const lng = inputData.basecamp.lng;
      const situation = getSituation(lat, lng);
      exportData.basecamp = {
        id: inputData.basecamp.id,
        name: inputData.basecamp.name,
        type: 'Basecamp',
        address: inputData.basecamp.neighborhood || 'Não especificado',
        neighborhood: inputData.basecamp.neighborhood || 'Não especificado',
        lat,
        lng,
        origin: 'reservation',
        situation
      };
      if (situation === 'valid_gps') { valid++; exportData.summary.basecampHasGps = true; }
      else if (situation === 'invalid_gps') invalid++;
      else missing++;
    }

    let mappingFailures = 0;

    const usedExpIds = new Set<string>();
    draft.days.forEach(d => {
      d.activities.forEach(a => {
        if (a.type === 'experience') {
           const origId = a.sourceExperienceId || a.id;
           usedExpIds.add(origId);
           const catItem = inputData.catalog.find(c => c.id === origId);
           
           let situation = getSituation(a.coordinates?.lat, a.coordinates?.lng);
           
           if (!catItem) {
              situation = 'mapping_failed';
           }

           const actData = {
             id: origId,
             activityId: a.id,
             name: a.title,
             type: 'Experience',
             address: catItem?.address || 'Não preenchido',
             neighborhood: catItem?.neighborhood || 'Não preenchido',
             lat: a.coordinates?.lat,
             lng: a.coordinates?.lng,
             origin: a.geoSource || 'catalog',
             confidence: a.geoConfidence || 'unknown',
             situation,
             diagnostics: {
               catalogFields: {
                 location_lat: catItem?.location_lat,
                 location_lng: catItem?.location_lng,
                 latitude: catItem?.latitude,
                 longitude: catItem?.longitude,
                 coordinates: catItem?.coordinates
               },
               normalizedFields: {
                 lat: catItem?.coordinates?.lat || catItem?.location_lat || catItem?.latitude,
                 lng: catItem?.coordinates?.lng || catItem?.location_lng || catItem?.longitude
               },
               finalCoordinates: a.coordinates,
               reasonIfMissing: situation === 'mapping_failed' ? 'Falha no mapping. Origem não encontrada no catálogo.' : situation !== 'valid_gps' ? 'Coordenadas ausentes no banco ou InputBuilder.' : null
             }
           };

           if (situation === 'valid_gps') valid++;
           else if (situation === 'invalid_gps') invalid++;
           else if (situation === 'mapping_failed') mappingFailures++;
           else missing++;

           exportData.draftActivities.push(actData);
        }
      });
    });

    exportData.summary.totalEntities = (inputData.basecamp ? 1 : 0) + exportData.draftActivities.length;
    exportData.summary.draftActivitiesCount = exportData.draftActivities.length;
    exportData.summary.validGps = valid;
    exportData.summary.missingGps = missing;
    exportData.summary.invalidGps = invalid;
    exportData.summary.mappingFailures = mappingFailures;
    exportData.summary.coveragePercent = exportData.summary.totalEntities > 0 ? Math.round((valid / exportData.summary.totalEntities) * 100) : 0;
    
    let possibleSegments = 0;
    draft.days.forEach(d => {
       let lastHadGps = exportData.summary.basecampHasGps;
       d.activities.forEach(a => {
          if (a.type === 'logistics' || a.isWindow) return;
          const hasGps = getSituation(a.coordinates?.lat, a.coordinates?.lng) === 'valid_gps';
          if (lastHadGps && hasGps) {
             possibleSegments++;
          }
          lastHadGps = hasGps;
       });
    });
    exportData.summary.possibleSegments = possibleSegments;

    // Remove any sensitive keys implicitly by only building from safe primitives, no ...spread of arbitrary objects.
    return exportData;
  }
}
