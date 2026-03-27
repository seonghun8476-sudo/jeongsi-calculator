import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { AdmissionChance } from '../types';
import { useTheme, ThemeColors } from '../lib/theme';

function getChanceColors(chance: AdmissionChance, colors: ThemeColors) {
  switch (chance) {
    case '안정': return { bg: colors.safeBg, text: colors.safe };
    case '적정': return { bg: colors.fitBg, text: colors.fit };
    case '소신': return { bg: colors.boldBg, text: colors.bold };
    case '위험': return { bg: colors.dangerBg, text: colors.danger };
  }
}

interface Props {
  chance: AdmissionChance;
  percent: number;
  size?: 'small' | 'large';
}

export default function ProbabilityBadge({ chance, percent, size = 'small' }: Props) {
  const { colors } = useTheme();
  const cc = getChanceColors(chance, colors);
  const isLarge = size === 'large';

  return (
    <View style={[styles.badge, { backgroundColor: cc.bg }, isLarge && styles.badgeLarge]}>
      <Text style={[styles.chanceText, { color: cc.text }, isLarge && styles.chanceTextLarge]}>
        {chance}
      </Text>
      <Text style={[styles.percentText, { color: cc.text }, isLarge && styles.percentTextLarge]}>
        {percent}%
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  badgeLarge: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
  },
  chanceText: {
    fontSize: 12,
    fontWeight: '700',
  },
  chanceTextLarge: {
    fontSize: 16,
  },
  percentText: {
    fontSize: 11,
    fontWeight: '500',
  },
  percentTextLarge: {
    fontSize: 14,
  },
});
