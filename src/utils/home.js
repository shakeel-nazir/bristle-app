export const BEDROOM_OPTIONS = [
  { value: 0, label: 'Studio' },
  { value: 1, label: '1' },
  { value: 2, label: '2' },
  { value: 3, label: '3' },
  { value: 4, label: '4' },
  { value: 5, label: '5' },
  { value: 6, label: '6+' },
];

export const BATHROOM_OPTIONS = [
  { value: 1, label: '1' },
  { value: 1.5, label: '1.5' },
  { value: 2, label: '2' },
  { value: 2.5, label: '2.5' },
  { value: 3, label: '3' },
  { value: 4, label: '4+' },
];

export const PET_OPTIONS = [
  { value: 'none', label: 'No pets' },
  { value: 'dog', label: 'Dog' },
  { value: 'cat', label: 'Cat' },
  { value: 'other', label: 'Other' },
];

const PET_LABELS = { dog: 'Dog', cat: 'Cat', other: 'Other pet' };

// e.g. "2 bed · 1.5 bath · Dog, Cat"
export function describeHome(home) {
  if (!home) return '';
  const bed = home.bedrooms === 0 ? 'Studio' : `${home.bedrooms} bed`;
  const bath = `${home.bathrooms} bath`;
  const pets = home.pets?.length ? home.pets.map((p) => PET_LABELS[p] || p).join(', ') : 'No pets';
  return `${bed} · ${bath} · ${pets}`;
}
