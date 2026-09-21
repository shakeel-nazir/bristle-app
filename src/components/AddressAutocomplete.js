import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, TextInput, Pressable, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, radius } from '../theme/theme';
import GlassCard from './GlassCard';

// Photon does search-as-you-type on OpenStreetMap data; Nominatim confirms a street exists
// when the map has the street but not that particular house number.
const PHOTON_URL = 'https://photon.komoot.io/api/';
const NOMINATIM_URL = 'https://nominatim.openstreetmap.org/search';
const DEBOUNCE_MS = 400;
const MIN_QUERY_LENGTH = 3;

// The region we search: Ottawa and its surroundings, Gatineau, Rockland and the rural south.
// (minLon, minLat, maxLon, maxLat). What is actually accepted is decided by SERVICE_CITIES below.
const REGION = { minLon: -76.45, minLat: 44.85, maxLon: -75.05, maxLat: 45.7 };
const PHOTON_BBOX = `${REGION.minLon},${REGION.minLat},${REGION.maxLon},${REGION.maxLat}`;
const NOMINATIM_VIEWBOX = `${REGION.minLon},${REGION.maxLat},${REGION.maxLon},${REGION.minLat}`;

// Where we clean, by the city name the map uses -> the name shown on the address.
const SERVICE_CITIES = {
  ottawa: 'Ottawa', // includes Orleans, Kanata, Barrhaven, Cumberland and the rural south
  gatineau: 'Gatineau', // the Quebec side (Hull, Aylmer, Buckingham…)
  rockland: 'Rockland',
  'clarence-rockland': 'Rockland',
};

// Communities inside the City of Ottawa that people write on their mail instead of "Ottawa".
const OTTAWA_COMMUNITIES = {
  orleans: 'Orleans',
  kanata: 'Kanata',
  barrhaven: 'Barrhaven',
  cumberland: 'Cumberland',
  manotick: 'Manotick',
  greely: 'Greely',
  osgoode: 'Osgoode',
  metcalfe: 'Metcalfe',
  stittsville: 'Stittsville',
  richmond: 'Richmond',
  carp: 'Carp',
};

const PROVINCE_ABBR = { ontario: 'ON', quebec: 'QC' };

const STREET_SUFFIX_ABBR = {
  street: 'St',
  avenue: 'Ave',
  road: 'Rd',
  drive: 'Dr',
  boulevard: 'Blvd',
  crescent: 'Cres',
  court: 'Ct',
  lane: 'Ln',
  place: 'Pl',
  terrace: 'Terr',
  circle: 'Cir',
  way: 'Way',
  parkway: 'Pkwy',
  trail: 'Trail',
  gate: 'Gate',
  path: 'Path',
};

const DIRECTION_ABBR = {
  north: 'N',
  south: 'S',
  east: 'E',
  west: 'W',
  northeast: 'NE',
  northwest: 'NW',
  southeast: 'SE',
  southwest: 'SW',
};

// Places that have a street number but are not somebody's home (shops, hotels, stations…).
const NON_HOME_KEYS = new Set([
  'shop',
  'amenity',
  'tourism',
  'office',
  'leisure',
  'historic',
  'railway',
  'man_made',
  'bridge',
  'craft',
  'healthcare',
  'aeroway',
  'public_transport',
  'waterway',
  'natural',
  'landuse',
  'highway',
]);

function abbreviateStreet(road) {
  const words = road.trim().split(/\s+/);
  let suffixIndex = words.length - 1;

  const lastWord = words[suffixIndex].toLowerCase();
  if (DIRECTION_ABBR[lastWord]) {
    words[suffixIndex] = DIRECTION_ABBR[lastWord];
    suffixIndex -= 1;
  }

  if (suffixIndex >= 0) {
    const suffixWord = words[suffixIndex].toLowerCase();
    if (STREET_SUFFIX_ABBR[suffixWord]) {
      words[suffixIndex] = STREET_SUFFIX_ABBR[suffixWord];
    }
  }

  return words.join(' ');
}

// Town names people tack on the end ("1500 Laurier St Rockland"). Not part of the street name.
const PLACE_WORDS = new Set([
  ...Object.keys(SERVICE_CITIES).flatMap((c) => c.split('-')),
  ...Object.keys(OTTAWA_COMMUNITIES),
  'clarence',
  // sectors people name instead of the city
  'aylmer',
  'hull',
  'buckingham',
  'masson',
  'angers',
  'nepean',
  'gloucester',
  'vanier',
  'ontario',
  'quebec',
  'on',
  'qc',
]);

// "48 elgin" -> { number: '48', street: 'elgin' }. Addresses in Canada read number first, then street.
function parseTyped(text) {
  const m = /^\s*(\d+[A-Za-z]?)\s+(.+?)\s*$/.exec(text || '');
  const number = m ? m[1] : '';
  const words = (m ? m[2] : (text || '').trim()).split(/[\s,]+/).filter(Boolean);
  // Drop trailing town names, but never everything ("100 Richmond" is the street Richmond).
  while (words.length > 1 && PLACE_WORDS.has(words[words.length - 1].toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, ''))) {
    words.pop();
  }
  return { number, street: words.join(' ') };
}

const fold = (text) =>
  String(text || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();

// Is this place in our service area? Returns the community to write on the address and the
// province, or null if we don't clean there.
function placeFor({ city, district, locality, state }) {
  const base = SERVICE_CITIES[fold(city)];
  if (!base) return null;
  let community = base;
  if (base === 'Ottawa') {
    const hit = [district, locality]
      .map(fold)
      .map((name) => Object.keys(OTTAWA_COMMUNITIES).find((key) => name.startsWith(key)))
      .find(Boolean);
    if (hit) community = OTTAWA_COMMUNITIES[hit];
  }
  const province = PROVINCE_ABBR[fold(state)] || (base === 'Gatineau' ? 'QC' : 'ON');
  return { community, province };
}

const plain = (text) =>
  text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .split(/[\s-]+/)
    .filter(Boolean);

const GENERIC_WORDS = new Set([
  ...Object.keys(STREET_SUFFIX_ABBR),
  ...Object.values(STREET_SUFFIX_ABBR).map((v) => v.toLowerCase()),
  ...Object.keys(DIRECTION_ABBR),
  ...Object.values(DIRECTION_ABBR).map((v) => v.toLowerCase()),
]);

// Does the street on the map fit what was typed? Every typed word (other than "street", "west"…)
// must be the start of a word in the street's name, so "ban" fits "Bank Street" but "zzqxv" fits nothing.
function streetMatches(typedStreet, road) {
  const wanted = plain(typedStreet).filter((w) => !GENERIC_WORDS.has(w));
  if (wanted.length === 0) return true;
  const have = plain(road);
  return wanted.every((w) => have.some((h) => h.startsWith(w)));
}

// One clean shape for every suggestion, however it was found.
function makeAddress({ number, road, district, locality, place, postcode, approximate }) {
  const { community, province } = place;
  const streetLine = `${number} ${abbreviateStreet(road)}`;
  // A small grey neighbourhood hint: "Centretown" for Ottawa itself, "Bridlewood" inside Kanata, etc.
  const neighbourhood =
    community === 'Ottawa'
      ? district
      : locality && fold(locality) !== fold(community) && !fold(locality).startsWith(fold(community))
        ? locality
        : '';
  const region = [province, postcode].filter(Boolean).join(' ');
  return {
    key: `${number}|${road}|${postcode || ''}`.toLowerCase(),
    road,
    streetLine,
    areaLine: [neighbourhood && neighbourhood !== community ? neighbourhood : '', community, region]
      .filter(Boolean)
      .join(', '),
    // Mailing style: "123 Bank St, Ottawa, ON K1P 5N5"
    full: `${streetLine}, ${community}, ${region}`,
    approximate: !!approximate,
  };
}

function fromPhoton(feature) {
  const p = feature.properties || {};
  const place = placeFor(p);
  const isHome = !NON_HOME_KEYS.has(p.osm_key);
  if (!place || !isHome || !p.housenumber || !p.street) return null;
  return makeAddress({
    number: p.housenumber,
    road: p.street,
    district: p.district,
    locality: p.locality,
    place,
    postcode: p.postcode,
  });
}

// The map knows the street but not this house number: offer the address as typed.
async function streetFallback(typed, signal) {
  if (!typed.number || typed.street.length < 3) return null;
  const params = new URLSearchParams({
    format: 'json',
    street: `${typed.number} ${typed.street}`,
    countrycodes: 'ca',
    viewbox: NOMINATIM_VIEWBOX,
    bounded: '1',
    addressdetails: '1',
    limit: '10',
  });
  const response = await fetch(`${NOMINATIM_URL}?${params.toString()}`, { signal, headers: { Accept: 'application/json' } });
  const rows = await response.json();
  for (const r of rows) {
    const a = r.address || {};
    const place = placeFor({ city: a.city || a.town, district: a.suburb, state: a.state });
    if (a.road && place && streetMatches(typed.street, a.road)) {
      return makeAddress({ number: typed.number, road: a.road, district: a.suburb, place, approximate: true });
    }
  }
  return null;
}

async function searchAddresses(text, signal) {
  const typed = parseTyped(text);
  const params = new URLSearchParams({ q: text, limit: '15', lang: 'en', bbox: PHOTON_BBOX });
  const response = await fetch(`${PHOTON_URL}?${params.toString()}`, { signal, headers: { Accept: 'application/json' } });
  const data = await response.json();

  const seen = new Set();
  let results = (data.features || [])
    .map(fromPhoton)
    .filter((a) => {
      if (!a || seen.has(a.key)) return false;
      seen.add(a.key);
      return true;
    });

  // Photon guesses when it can't find a match, so keep only what was actually typed: the same
  // street number (not "1204" for "123") and a street whose name starts with the words typed.
  if (typed.number) results = results.filter((a) => a.streetLine.startsWith(`${typed.number} `));
  results = results.filter((a) => streetMatches(typed.street, a.road));

  if (results.length === 0 && typed.number) {
    const fallback = await streetFallback(typed, signal);
    if (fallback) results = [fallback];
  }
  return results.slice(0, 5);
}

export default function AddressAutocomplete({ value, onChangeText, onValidChange, placeholder }) {
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [focused, setFocused] = useState(false);
  const [isValid, setIsValid] = useState(false);
  const debounceRef = useRef(null);
  const abortRef = useRef(null);
  const skipNextFetch = useRef(false);

  useEffect(() => {
    if (skipNextFetch.current) {
      skipNextFetch.current = false;
      return;
    }
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (!value || value.trim().length < MIN_QUERY_LENGTH) {
      setSuggestions([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    debounceRef.current = setTimeout(async () => {
      if (abortRef.current) abortRef.current.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      try {
        setSuggestions(await searchAddresses(value, controller.signal));
        setLoading(false);
      } catch (err) {
        if (err.name === 'AbortError') return; // a newer search replaced this one
        setSuggestions([]);
        setLoading(false);
      }
    }, DEBOUNCE_MS);

    return () => clearTimeout(debounceRef.current);
  }, [value]);

  const handleTextChange = (text) => {
    onChangeText(text);
    if (isValid) {
      setIsValid(false);
      onValidChange?.(false);
    }
  };

  const handleSelect = (address) => {
    skipNextFetch.current = true;
    onChangeText(address.full);
    setIsValid(true);
    onValidChange?.(true);
    setSuggestions([]);
    setFocused(false);
  };

  const typedNumber = parseTyped(value || '').number;
  const hasSearched = !loading && (value || '').trim().length >= MIN_QUERY_LENGTH;
  const showDropdown = focused && (loading || suggestions.length > 0 || hasSearched);
  const showUnverifiedHint = !isValid && !focused && hasSearched;

  return (
    <View>
      <View style={styles.inputWrap}>
        <TextInput
          style={[styles.input, isValid && styles.inputValid]}
          placeholder={placeholder}
          placeholderTextColor={colors.textSecondary}
          value={value}
          onChangeText={handleTextChange}
          onFocus={() => setFocused(true)}
          onBlur={() => setTimeout(() => setFocused(false), 150)}
          autoCapitalize="words"
          autoCorrect={false}
        />
        {isValid && (
          <View style={styles.validIcon}>
            <Ionicons name="checkmark-circle" size={18} color="#3F8557" />
          </View>
        )}
      </View>

      {isValid && <Text style={styles.validText}>Verified address</Text>}
      {showUnverifiedHint && <Text style={styles.hintText}>Select an address from the list to continue</Text>}

      {showDropdown && (
        <GlassCard style={styles.dropdown} intensity={50}>
          <View>
            {loading ? (
              <View style={styles.statusRow}>
                <ActivityIndicator size="small" color={colors.accent} />
                <Text style={styles.statusText}>Searching addresses…</Text>
              </View>
            ) : suggestions.length === 0 ? (
              <View style={styles.statusRow}>
                <Text style={styles.statusText}>
                  {typedNumber
                    ? 'No address found in our service area. Check the street name.'
                    : 'Start with the street number, like 123 Bank St.'}
                </Text>
              </View>
            ) : (
              suggestions.map((item, index) => (
                <Pressable
                  key={item.key}
                  style={[styles.suggestionRow, index < suggestions.length - 1 && styles.suggestionRowBorder]}
                  onPress={() => handleSelect(item)}
                >
                  <Text style={styles.suggestionStreet} numberOfLines={1}>
                    {item.streetLine}
                  </Text>
                  <Text style={styles.suggestionArea} numberOfLines={1}>
                    {item.areaLine}
                  </Text>
                </Pressable>
              ))
            )}
          </View>
        </GlassCard>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  inputWrap: {
    position: 'relative',
    justifyContent: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
    borderRadius: radius.sm,
    padding: spacing.md,
    paddingRight: spacing.xl,
    fontSize: 14,
    color: colors.text,
  },
  inputValid: {
    borderColor: '#3F8557',
  },
  validIcon: {
    position: 'absolute',
    right: spacing.md,
  },
  validText: {
    fontSize: 12,
    color: '#3F8557',
    marginTop: spacing.xs,
    fontWeight: '600',
  },
  hintText: {
    fontSize: 12,
    color: colors.accent,
    marginTop: spacing.xs,
  },
  dropdown: {
    borderRadius: radius.sm,
    marginTop: spacing.xs,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.md,
  },
  statusText: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  suggestionRow: {
    padding: spacing.md,
  },
  suggestionRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  suggestionStreet: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text,
  },
  suggestionArea: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 1,
  },
});
