import { TripSpaceViewModel, TripSpaceDay, TripSpaceStop, TripSpaceBasecamp, TripSpaceReservation, TripSpaceIdea, TripSpaceChecklistItem, TripSpaceDocument, TripSpaceProfile } from '@/types/tripSpace.types';

export function buildTripSpaceViewModel(
  trip: any,
  destination: any,
  reservations: any[],
  documents: any[],
  catalog: any[],
  user: any
): TripSpaceViewModel {
  // 1. UTC Date Calculations
  let startDateStr = trip.start_date || '';
  let endDateStr = trip.end_date || '';
  let daysCount = 1;
  let nightsCount = 0;

  if (startDateStr && endDateStr) {
    const partsStart = startDateStr.split('-').map(Number);
    const partsEnd = endDateStr.split('-').map(Number);
    if (partsStart.length === 3 && partsEnd.length === 3 && !partsStart.some(isNaN) && !partsEnd.some(isNaN)) {
      const utcStart = Date.UTC(partsStart[0], partsStart[1] - 1, partsStart[2]);
      const utcEnd = Date.UTC(partsEnd[0], partsEnd[1] - 1, partsEnd[2]);
      if (utcEnd >= utcStart) {
        nightsCount = Math.floor((utcEnd - utcStart) / (1000 * 60 * 60 * 24));
        daysCount = nightsCount + 1;
      }
    }
  }

  // 2. Map Itinerary Days with Proper Attribute Names
  const rawItinerary: any[] = Array.isArray(trip.itinerary) ? trip.itinerary : [];
  
  // Filter out V2 metadata
  const validDays = rawItinerary.filter((d: any) => !d._isMetadata);

  const days: TripSpaceDay[] = validDays.map((d: any, idx: number) => {
    const dayNum = d.day || d.dayNumber || idx + 1;
    
    let dayDateStr = '';
    if (startDateStr) {
      const parts = startDateStr.split('-').map(Number);
      if (parts.length === 3 && !parts.some(isNaN)) {
        const dObj = new Date(Date.UTC(parts[0], parts[1] - 1, parts[2] + (dayNum - 1)));
        dayDateStr = dObj.toLocaleDateString('pt-BR', { timeZone: 'UTC', day: '2-digit', month: 'short', weekday: 'short' });
      }
    }

    const stops: TripSpaceStop[] = [];
    
    // Support both V1 (attractions) and V2 (activities)
    const sourceItems: any[] = Array.isArray(d.activities) 
      ? d.activities 
      : (Array.isArray(d.attractions) ? d.attractions : []);
    
    sourceItems.forEach((att: any, stopIdx: number) => {
      // Find catalog match if experience_id exists
      const matchedFallback = FALLBACK_ATTRACTIONS.find((f: any) =>
        f.id === (att.id || att.sourceExperienceId || att.experience_id) ||
        f.name.toLowerCase().includes((att.title || att.name || '').toLowerCase())
      );

      const categoryDefaultImage =
        (att.type === 'nature' || att.category === 'nature') ? 'https://images.unsplash.com/photo-1501594907352-04cda38ebc29?w=600&q=80' :
        (att.type === 'museum' || att.category === 'culture' || att.type === 'culture') ? 'https://images.unsplash.com/photo-1565008447742-97f6f38c985c?w=600&q=80' :
        (att.type === 'food' || att.category === 'gastronomy') ? 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=600&q=80' :
        'https://images.unsplash.com/photo-1534430480872-3498386e7856?w=600&q=80';

      const imageUrl = att.image || att.images?.[0] || att.imageUrl || att.photoUrl || catExp?.image || catExp?.images?.[0] || catExp?.media_urls?.[0] || matchedFallback?.image || categoryDefaultImage;
      const lat = att.coordinates?.lat ?? att.location_lat ?? att.lat ?? catExp?.coordinates?.lat ?? catExp?.location_lat ?? matchedFallback?.coordinates?.lat;
      const lng = att.coordinates?.lng ?? att.location_lng ?? att.lng ?? catExp?.coordinates?.lng ?? catExp?.location_lng ?? matchedFallback?.coordinates?.lng;

      // Planned start time calculation fallback if missing
      const fallbackHour = 9 + (stopIdx * 3);
      const timeStr = att.startTime || att.plannedStartTime || att.time || `${String(fallbackHour).padStart(2, '0')}:00`;

      // Editorial short description (120-220 chars)
      let desc = att.emotionalDescription || att.short_description || att.description || catExp?.emotionalDescription || catExp?.description || 'Experiência selecionada para o seu roteiro.';
      if (desc.length > 200) {
        desc = desc.substring(0, 197) + '...';
      }

      stops.push({
        id: att.id || att.sourceExperienceId || att.experience_id || `stop_${dayNum}_${stopIdx}`,
        title: att.title || att.name || catExp?.name || catExp?.title || 'Experiência',
        category: att.type || att.category || catExp?.category || 'Atração',
        neighborhood: att.location || att.neighborhood || catExp?.neighborhood || destination?.name || 'Centro',
        description: desc,
        duration: att.durationMinutes ? `${att.durationMinutes} min` : (att.durationHours ? `${att.durationHours * 60} min` : (att.duration ? `${att.duration}` : '1h 30min')),
        cost: att.costUSD !== undefined ? (att.costUSD === 0 ? 'Grátis' : `US$ ${att.costUSD}`) : (att.cost || 'Grátis'),
        imageUrl: imageUrl || undefined,
        lat: lat !== undefined ? Number(lat) : undefined,
        lng: lng !== undefined ? Number(lng) : undefined,
        time: timeStr,
        isBooked: !!att.isBooked || !!att.isFixed || !!att.manualLock || reservations.some((r: any) => r.title?.toLowerCase().includes((att.title || att.name || '').toLowerCase())),
        isLocked: !!att.manualLock || !!att.manualMetadata?.locked,
        isFixed: !!att.isFixed,
        matchScore: att.matchScore || catExp?.score || undefined
      });
    });

    return {
      dayNumber: dayNum,
      dateStr: dayDateStr || `Dia ${dayNum}`,
      theme: d.theme || `Programação do Dia ${dayNum}`,
      stops
    };
  });

  // 3. Basecamp Hotel
  let basecamp: TripSpaceBasecamp | undefined = undefined;
  const hotelRes = reservations.find((r: any) => r.type === 'hotel' || r.structured_data?.is_basecamp);
  if (hotelRes) {
    basecamp = {
      name: hotelRes.title || 'Hospedagem',
      address: hotelRes.location_name || hotelRes.details || destination?.name || '',
      checkIn: hotelRes.date_str || startDateStr,
      checkOut: endDateStr,
      photoUrl: hotelRes.structured_data?.photo_url || hotelRes.photo_url,
      lat: hotelRes.latitude ?? hotelRes.structured_data?.lat,
      lng: hotelRes.longitude ?? hotelRes.structured_data?.lng
    };
  }

  // 4. Map Reservations
  const mappedReservations: TripSpaceReservation[] = reservations.map((r: any) => ({
    id: r.id,
    title: r.title,
    type: r.type || 'activity',
    details: r.details || r.location_name || '',
    status: r.purchase_status || r.status || 'Reservado',
    dateStr: r.start_at || r.date_str || startDateStr,
    photoUrl: r.structured_data?.photo_url || r.photo_url
  }));

  // 5. Saved Ideas from Tinder Match ('yes', 'love', 'maybe')
  const itineraryStopIds = new Set<string>();
  days.forEach(day => day.stops.forEach(s => itineraryStopIds.add(s.id)));

  const tinderVotes = trip.preferences?.match_votes || {};
  const savedIdeas: TripSpaceIdea[] = [];
  const maybeIdeas: TripSpaceIdea[] = [];
  const recommendations: TripSpaceIdea[] = [];

  const destCatalog = catalog.filter((exp: any) => exp.destination_id === trip.destination || exp.destinationId === trip.destination);

  destCatalog.forEach((exp: any) => {
    const vote = tinderVotes[exp.id];
    if (!itineraryStopIds.has(exp.id)) {
      if (vote === 'yes' || vote === 'love') {
        savedIdeas.push({
          id: exp.id,
          title: exp.name || exp.title,
          category: exp.category || 'Atração',
          neighborhood: exp.neighborhood || destination?.name || '',
          photoUrl: exp.image || exp.images?.[0] || exp.media_urls?.[0]
        });
      } else if (vote === 'maybe') {
        maybeIdeas.push({
          id: exp.id,
          title: exp.name || exp.title,
          category: exp.category || 'Atração',
          neighborhood: exp.neighborhood || destination?.name || '',
          photoUrl: exp.image || exp.images?.[0] || exp.media_urls?.[0]
        });
      } else if (!vote && vote !== 'no' && vote !== 'reject' && recommendations.length < 6) {
        recommendations.push({
          id: exp.id,
          title: exp.name || exp.title,
          category: exp.category || 'Atração',
          neighborhood: exp.neighborhood || destination?.name || '',
          photoUrl: exp.image || exp.images?.[0] || exp.media_urls?.[0],
          reason: `Combina com seu interesse em ${exp.category || 'viagem'}`
        });
      }
    }
  });

  if (savedIdeas.length === 0 && recommendations.length === 0) {
    FALLBACK_ATTRACTIONS.slice(0, 6).forEach((exp: any) => {
      recommendations.push({
        id: exp.id,
        title: exp.name,
        category: exp.categoryLabel || exp.category || 'Atração',
        neighborhood: exp.neighborhood || 'Nova York',
        photoUrl: exp.image,
        reason: 'Curadoria Exclusiva Voyage Flow'
      });
    });
  }

  // 6. Map Checklist
  const rawChecklist: any[] = Array.isArray(trip.preferences?.checklist) ? trip.preferences.checklist : [];
  const checklist: TripSpaceChecklistItem[] = rawChecklist.map((c: any, idx: number) => ({
    id: c.id || `chk_${idx}`,
    text: c.text || c.title || '',
    completed: !!c.completed,
    category: c.category
  }));

  // 7. Map Documents
  const mappedDocuments: TripSpaceDocument[] = documents.map((doc: any) => ({
    id: doc.id,
    name: doc.name || doc.title,
    type: doc.type || 'documento',
    validUntil: doc.valid_until,
    status: doc.status || 'Válido',
    fileUrl: doc.file_url
  }));

  // 8. Profile mapping
  const userMetadata = user?.user_metadata || {};
  const profileName = userMetadata.full_name || userMetadata.name || (user?.email ? user.email.split('@')[0] : 'Minha conta');

  const profile: TripSpaceProfile = {
    name: profileName,
    email: user?.email || '',
    avatarUrl: userMetadata.avatar_url,
    isPremium: true
  };

  // Companionship & Travel Style labels
  const companionshipLabel = trip.companionship === 'solo' ? 'Só eu' :
    trip.companionship === 'couple' ? 'Em casal' :
    trip.companionship === 'family' ? 'Em família' :
    trip.companionship === 'friends' ? 'Com amigos' : 'Viajante';

  const travelStyleLabel = trip.preferences?.travel_profile || trip.preferences?.style || 'Cultura & Descoberta';

  // Overview metrics
  const totalStopsCount = days.reduce((acc, d) => acc + d.stops.length, 0);
  const realBookedCount = mappedReservations.length;

  let estimatedBudget: { spent: number; total: number } | undefined = undefined;
  // If there's real budget data from wallet or trip preferences, we could parse it, but for now we leave undefined to avoid mock
  if (trip.budget || trip.preferences?.budget) {
     const tB = trip.budget || trip.preferences?.budget;
     estimatedBudget = { spent: 0, total: Number(tB) || 0 };
  }

  const realPace = trip.pace || trip.preferences?.rhythm || trip.preferences?.pace;

  return {
    tripId: trip.id,
    title: trip.title || `Viagem para ${destination?.name || trip.destination}`,
    destinationId: trip.destination,
    destinationName: destination?.name || trip.destination,
    destinationCountry: destination?.country || 'Destino',
    heroImageUrl: destination?.imageUrl || 'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?auto=format&fit=crop&w=1200&q=80',
    startDate: startDateStr,
    endDate: endDateStr,
    nightsCount,
    daysCount,
    travelersCount: trip.preferences?.travelers_count || (trip.companionship === 'couple' ? 2 : 1),
    travelStyle: `${travelStyleLabel} (${companionshipLabel})`,
    isCollaborative: !!trip.preferences?.is_collaborative,
    budgetLevel: trip.budget_level || 'medium',
    days,
    basecamp,
    reservations: mappedReservations,
    savedIdeas,
    maybeIdeas,
    recommendations,
    checklist,
    documents: mappedDocuments,
    profile,
    totalBudgetLimit: Number(trip.budget || trip.preferences?.budget || 0),
    spentSoFar: 0,
    rawItinerary: rawItinerary,
    rawVersion: trip.updated_at || (rawItinerary?.[0]?._isMetadata ? rawItinerary[0].version : ''),
    estimatedBudget,
    bookedItemsCount: { booked: realBookedCount, total: totalStopsCount },
    pace: realPace
  };
}
