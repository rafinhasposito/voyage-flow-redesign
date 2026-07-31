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
    // IGNORAR o d.day do banco para não pular dias
    const dayNum = idx + 1;
    
    let dayDateStr = '';
    let fullDateStr = '';
    if (startDateStr) {
      const parts = startDateStr.split('-').map(Number);
      if (parts.length === 3 && !parts.some(isNaN)) {
        const dObj = new Date(Date.UTC(parts[0], parts[1] - 1, parts[2] + (dayNum - 1)));
        dayDateStr = dObj.toLocaleDateString('pt-BR', { timeZone: 'UTC', day: '2-digit', month: 'short', weekday: 'short' });
        fullDateStr = dObj.toLocaleDateString('pt-BR', { timeZone: 'UTC', day: '2-digit', month: '2-digit', year: 'numeric' });
      }
    }

    // Attempt to parse a location from destination
    let locationSubtitle = 'SP - BRASIL 🇧🇷'; // default fallback mock for demo
    if (destination?.name) {
      locationSubtitle = `${destination.name} - ${destination.country || 'Destino'}`;
    }

    const stops: TripSpaceStop[] = [];
    
    // Support both V1 (attractions) and V2 (activities)
    const sourceItems: any[] = Array.isArray(d.activities) 
      ? d.activities 
      : (Array.isArray(d.attractions) ? d.attractions : []);
    
    sourceItems.forEach((att: any, stopIdx: number) => {
      // Find catalog match if experience_id exists (prioritize sourceExperienceId as att.id might be deterministic draft id)
      const catExp = catalog.find((c: any) => c.id === att.sourceExperienceId || c.id === att.experience_id || c.id === att.id);



      let rawTitle = att.title || att.name || catExp?.name || catExp?.title || 'Atividade';
      if (rawTitle.startsWith('Experiência ') && (catExp?.name || catExp?.title)) {
        rawTitle = catExp.name || catExp.title;
      }

      const catExpImageUrl = catExp?.cover_image_url || catExp?.cover_media_url || catExp?.photoUrl || catExp?.imageUrl || catExp?.image_url || catExp?.image || catExp?.images?.[0] || (catExp?.media_urls && catExp.media_urls.length > 0 ? catExp.media_urls[0] : null);
      const imageUrl = att.image || att.images?.[0] || att.imageUrl || att.photoUrl || catExpImageUrl || undefined;
      const lat = att.coordinates?.lat ?? att.location_lat ?? att.lat ?? catExp?.coordinates?.lat ?? catExp?.location_lat;
      const lng = att.coordinates?.lng ?? att.location_lng ?? att.lng ?? catExp?.coordinates?.lng ?? catExp?.location_lng;

      // Planned start time calculation fallback if missing
      const fallbackHour = 9 + (stopIdx * 3);
      let timeStr = att.plannedStartTime || att.time || att.startTime || `${String(fallbackHour).padStart(2, '0')}:00`;
      if (typeof timeStr === 'string' && timeStr.includes('T')) {
        timeStr = timeStr.split('T')[1].substring(0, 5);
      }

      // Editorial short description (120-220 chars)
      let desc = att.emotionalDescription || att.short_description || att.description || catExp?.emotionalDescription || catExp?.description || 'Experiência selecionada para o seu roteiro.';
      if (desc.length > 200) {
        desc = desc.substring(0, 197) + '...';
      }

      const category = att.type || att.category || catExp?.category || 'Atração';

      stops.push({
        id: att.id || att.sourceExperienceId || att.experience_id || `stop_${dayNum}_${stopIdx}`,
        title: rawTitle,
        category: category,
        neighborhood: att.location || att.neighborhood || catExp?.neighborhood || destination?.name || 'Centro',
        description: desc,
        duration: att.durationMinutes ? `${att.durationMinutes} min` : (att.durationHours ? `${att.durationHours * 60} min` : (att.duration ? `${att.duration}` : '1h 30min')),
        cost: att.costUSD !== undefined ? (att.costUSD === 0 ? 'Grátis' : `US$ ${att.costUSD}`) : (att.cost || 'Grátis'),
        imageUrl: imageUrl || undefined,
        lat: lat !== undefined ? Number(lat) : undefined,
        lng: lng !== undefined ? Number(lng) : undefined,
        locationAddress: att.locationAddress || catExp?.locationAddress || catExp?.address || catExp?.location || undefined,
        openingHours: att.openingHours || catExp?.openingHours || catExp?.hours || catExp?.business_hours || undefined,
        bookingUrl: att.bookingUrl || catExp?.booking_url || catExp?.bookingUrl || catExp?.tickets_url || catExp?.website || undefined,
        contactPhone: att.contactPhone || catExp?.contactPhone || catExp?.phone || undefined,
        externalLink: att.externalLink || catExp?.externalLink || catExp?.website || undefined,
        rating: att.rating || catExp?.rating || catExp?.score || undefined,
        reviewCount: att.reviewCount || catExp?.review_count || catExp?.reviews || undefined,
        time: timeStr,
        isBooked: !!att.isBooked || !!att.isFixed || !!att.manualLock || (() => { const t = (att.title || att.name || '').toLowerCase(); return t.length > 2 && reservations.some((r: any) => (r.title || '').toLowerCase().includes(t)); })(),
        isLocked: !!att.manualLock || !!att.manualMetadata?.locked,
        isFixed: !!att.isFixed,
        matchScore: att.matchScore || catExp?.score || undefined,
        matchReasons: att.matchReasons || undefined
      });
    });



    return {
      dayNumber: dayNum,
      dateStr: dayDateStr || `Dia ${dayNum}`,
      fullDateStr,
      locationSubtitle,
      theme: d.theme || `Programação do Dia ${dayNum}`,
      stops
    };
  });

  // 3. Basecamp Hotel
  let basecamp: TripSpaceBasecamp | undefined = undefined;
  const hotelRes = reservations.find((r: any) => r.type === 'hotel' || r.structured_data?.is_basecamp);
  if (hotelRes) {
    // Try to find the exact hotel in the catalog to get the full registered address
    const matchedExp = catalog.find((c: any) => c.title === hotelRes.title || c.name === hotelRes.title || c.id === hotelRes.structured_data?.experience_id);
    const realAddress = matchedExp?.location || matchedExp?.address || hotelRes.structured_data?.address || hotelRes.address || hotelRes.location_name || hotelRes.details || destination?.name || '';

    basecamp = {
      name: hotelRes.title || 'Hospedagem',
      address: realAddress,
      checkIn: hotelRes.date_str || startDateStr,
      checkOut: endDateStr,
      photoUrl: hotelRes.structured_data?.photo_url || hotelRes.photo_url || matchedExp?.image || matchedExp?.images?.[0],
      lat: hotelRes.latitude ?? hotelRes.structured_data?.lat ?? matchedExp?.coordinates?.lat ?? matchedExp?.location_lat,
      lng: hotelRes.longitude ?? hotelRes.structured_data?.lng ?? matchedExp?.coordinates?.lng ?? matchedExp?.location_lng
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

  const tinderVotes = trip.preferences?.tinder_votes || trip.preferences?.match_votes || {};
  const savedIdeas: TripSpaceIdea[] = [];
  const maybeIdeas: TripSpaceIdea[] = [];
  const recommendations: TripSpaceIdea[] = [];

  const destCatalog = catalog.filter((exp: any) => 
    exp.destination_id === trip.destination || 
    exp.destinationId === trip.destination ||
    exp.destination === trip.destination
  );
  const effectiveCatalog = destCatalog.length > 0 ? destCatalog : catalog;

  effectiveCatalog.forEach((exp: any) => {
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
    effectiveCatalog.slice(0, 6).forEach((exp: any) => {
      recommendations.push({
        id: exp.id,
        title: exp.name || exp.title || 'Sugestão de Experiência',
        category: exp.categoryLabel || exp.category || 'Atração',
        neighborhood: exp.neighborhood || destination?.name || 'Local',
        photoUrl: exp.image || exp.images?.[0] || exp.media_urls?.[0],
        reason: 'Curadoria Oficial'
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
  // If there's real budget data from wallet or trip preferences, parse it
  const budgetVal = trip.preferences?.budget_value || trip.budget_value || trip.budget || trip.preferences?.budget;
  if (budgetVal) {
     const tB = Number(budgetVal.toString().replace(/[^0-9.]/g, ''));
     if (!isNaN(tB) && tB > 0) {
       // Multiply daily budget by total days to get total budget (if it's daily)
       const totalBudget = trip.preferences?.budget_type === 'daily' ? tB * daysCount : tB;
       
       // Calculate spent from reservations cost
       const spent = mappedReservations.reduce((acc, r) => {
         const match = r.title.match(/US\$\s*(\d+)/i) || []; // very naive extraction for fallback
         return acc; // The Wallet handles actual sum, but keeping this zero initially or implement true sum if costs are mapped in reservations.
       }, 0);

       estimatedBudget = { spent: 0, total: totalBudget };
     }
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
    userId: user?.id || user?.sub || undefined,
    totalBudgetLimit: Number(trip.budget || trip.preferences?.budget || 0),
    spentSoFar: 0,
    rawItinerary: rawItinerary,
    rawVersion: trip.updated_at || (rawItinerary?.[0]?._isMetadata ? rawItinerary[0].version : ''),
    estimatedBudget,
    bookedItemsCount: { booked: realBookedCount, total: totalStopsCount },
    pace: realPace,
    catalog
  };
}
