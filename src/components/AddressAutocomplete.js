import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, TextInput, Pressable, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, radius } from '../theme/theme';
import GlassCard from './GlassCard';

const SEARCH_URL = 'https://nominatim.openstreetmap.org/search';
const DEBOUNCE_MS = 400;
const MIN_QUERY_LENGTH = 3;

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
          limit: '5',
        });
        const response = await fetch(`${SEARCH_URL}?${params.toString()}`, {
          signal: controller.signal,
          headers: { Accept: 'application/json' },
        });
        const results = await response.json();
        setSuggestions(results);
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
    onChangeText(result.display_name);
    setIsValid(true);
    onValidChange?.(true);
    setSuggestions([]);
    setFocused(false);
  };

  const showDropdown = focused && (loading || suggestions.length > 0);
  const showUnverifiedHint = !isValid && !focused && !loading && value.trim().length >= MIN_QUERY_LENGTH;

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
        <Text style={styles.hintText}>Select an address from the list to continue</Text>
      )}

      {showDropdown && (
        <GlassCard style={styles.dropdown} intensity={50}>
          <View>
            {loading ? (
              <View style={styles.statusRow}>
                <ActivityIndicator size="small" color={colors.accent} />
                <Text style={styles.statusText}>Searching addresses…</Text>
              </View>
            ) : (
              suggestions.map((item, index) => (
                <Pressable
                  key={item.place_id ?? index}
                  style={[styles.suggestionRow, index < suggestions.length - 1 && styles.suggestionRowBorder]}
                  onPress={() => handleSelect(item)}
                >
                  <Text style={styles.suggestionText} numberOfLines={2}>
                    {item.display_name}
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
  suggestionText: {
    fontSize: 13,
    color: colors.text,
  },
});
