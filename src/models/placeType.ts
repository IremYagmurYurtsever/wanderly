export function isLodgingType(type: string) {
  return /hotel|lodging|hostel|guest_house|resort|bed_and_breakfast/i.test(type);
}

export function placeTypeLabel(type: string) {
  return isLodgingType(type) ? 'Otel · Konaklama' : type.replaceAll('_', ' ') || 'Mekân';
}
