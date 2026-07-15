export function translateTerm(term: string | null | undefined): string {
  if (!term) return 'N/A';
  const mapping: Record<string, string> = {
    'published': 'Publicado',
    'draft': 'Rascunho',
    'attraction': 'Atração',
    'restaurant': 'Restaurante',
    'hotel': 'Hotel',
    'hostel': 'Hostel',
    'dining': 'Gastronomia',
    'lodging': 'Hospedagem',
    'entertainment': 'Entretenimento',
    'museum': 'Museu',
    'tour': 'Passeio',
    'park': 'Parque',
    'observation deck': 'Observatório',
    'photo spot': 'Ponto fotográfico',
    'shopping': 'Compras',
    'food market': 'Mercado gastronômico',
    'street food': 'Comida de rua',
    'must see': 'Imperdível'
  };
  const lower = term.toLowerCase();
  return mapping[lower] || term;
}
