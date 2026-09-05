import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, TextInput, Pressable, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, radius } from '../theme/theme';
import GlassCard from './GlassCard';

const SEARCH_URL = 'https://nominatim.openstreetmap.org/search';
const DEBOUNCE_MS = 400;
const MIN_QUERY_LENGTH = 3;

// Ottawa's city boundary, roughly (left,top,right,bottom = minLon,maxLat,maxLon,minLat).
const OTTAWA_VIEWBOX = '-76.3556,45.5376,-75.2465,44.9617';

const PROVINCE_ABBR = {
  ontario: 'ON',
  quebec: 'QC',
  'nova scotia': 'NS',
  'new brunswick': 'NB',
  manitoba: 'MB',
  'british columbia': 'BC',
  'prince edward island': 'PE',
  saskatchewan: 'SK',
  alberta: 'AB',
  newfoundland: 'NL',
  'newfoundland and labrador': 'NL',
};

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

function abbreviateStreet(road) {
  const words = road.split(' ');
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

function isInOttawa(result) {
  const city = result.address?.city || result.address?.town || result.address?.village || result.address?.municipality;
  if (city) return city.toLowerCase() === 'ottawa';
  return result.display_name.toLowerCase().includes('ottawa');
}

function getStreetLine(result) {
  const a = result.address || {};
  if (a.house_number && a.road) return `${a.house_number} ${abbreviateStreet(a.road)}`;
  if (a.road) return abbreviateStreet(a.road);
  return result.display_name.split(',')[0];
}

function getLocality(result) {
  const a = result.address || {};
  return a.suburb || a.neighbourhood || a.hamlet || a.village || a.town || a.city || '';
}

function getProvinceAbbr(result) {
  const state = result.address?.state;
  if (!state) return '';
  return PROVINCE_ABBR[state.toLowerCase()] || state;
}

function getAreaLine(result) {
  const locality = getLocality(result);
  const province = getProvinceAbbr(result);
  const postcode = result.address?.postcode || '';
  return [locality, [province, postcode].filter(Boolean).join(' ')].filter(Boolean).join(', ');
}

function getFullAddress(result) {
  const street = getStreetLine(result);
  const locality = getLocality(result);
  const province = getProvinceAbbr(result);
  const postcode = result.address?.postcode || '';
  return [street, locality, [province, postcode].filter(Boolean).join(' ')].filter(Boolean).join(', ');
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
        const params = new URLSearchParams({
          format: 'json',
          q: value,
          addressdetails: '1',
          limit: '10',
          countrycodes: 'ca',
          viewbox: OTTAWA_VIEWBOX,
          bounded: '1',
        });
        const response = await fetch(`${SEARCH_URL}?${params.toString()}`, {
          signal: controller.signal,
          headers: { Accept: 'application/json' },
        });
        const results = await response.json();
        setSuggestions(results.filter(isInOttawa).slice(0, 5));
      } catch (err) {
        if (err.name !== 'AbortError') setSuggestions([]);
      } finally {
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

  const handleSelect = (result) => {
    skipNextFetch.current = true;
    onChangeText(getFullAddress(result));
    setIsValid(true);
    onValidChange?.(true);
    setSuggestions([]);
    setFocused(false);
  };

  const hasSearched = !loading && value.trim().length >= MIN_QUERY_LENGTH;
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
        />
        {isValid && (
          <View style={styles.validIcon}>
            <Ionicons name="checkmark-circle" size={18} color="#3F8557" />
          </View>
        )}
      </View>

      {isValid && (
        <Text style={styles.validText}>Verified address</Text>
      )}
      {showUnverifiedHint && (
        <Text style={styles.hintText}>Select an Ottawa address from the list to continue</Text>
      )}

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
                <Text style={styles.statusText}>We only serve Ottawa right now — no matches found.</Text>
              </View>
            ) : (
              suggestions.map((item, index) => (
                <Pressable
                  key={item.place_id ?? index}
                  style={[styles.suggestionRow, index < suggestions.length - 1 && styles.suggestionRowBorder]}
                  onPress={() => handleSelect(item)}
                >
                  <Text style={styles.suggestionStreet} numberOfLines={1}>
                    {getStreetLine(item)}
                  </Text>
                  {getAreaLine(item) ? (
                    <Text style={styles.suggestionArea} numberOfLines={1}>
                      {getAreaLine(item)}
                    </Text>
                  ) : null}
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
