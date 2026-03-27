import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform, Linking } from 'react-native';
import { ResultItem } from '../types';
import ProbabilityBadge from './ProbabilityBadge';
import { useTheme } from '../lib/theme';

interface Props {
  item: ResultItem;
  onPress: () => void;
  isFavorite: boolean;
  onToggleFavorite: () => void;
}

export default function UniversityCard({
  item,
  onPress,
  isFavorite,
  onToggleFavorite,
}: Props) {
  const { colors, isDark } = useTheme();

  return (
    <TouchableOpacity
      style={[styles.card, {
        backgroundColor: colors.card,
        ...(Platform.OS === 'web'
          ? { boxShadow: isDark ? 'none' : '0px 2px 8px rgba(0,0,0,0.08)' } as any
          : isDark ? {} : {
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.08,
              shadowRadius: 8,
              elevation: 3,
            }),
      }]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Text style={[styles.universityName, { color: colors.text }]}>{item.university.name}</Text>
          <TouchableOpacity onPress={onToggleFavorite} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Text style={styles.favoriteIcon}>{isFavorite ? '\u2605' : '\u2606'}</Text>
          </TouchableOpacity>
        </View>
        <Text style={[styles.departmentName, { color: colors.textSecondary }]}>{item.department.name}</Text>
      </View>

      <View style={styles.body}>
        <View style={styles.scoreRow}>
          <View style={styles.scoreItem}>
            <Text style={[styles.scoreLabel, { color: colors.textTertiary }]}>커트라인</Text>
            <Text style={[styles.scoreValue, { color: colors.text }]}>{item.cutoff.minStandardScore}</Text>
          </View>
          <View style={styles.scoreItem}>
            <Text style={[styles.scoreLabel, { color: colors.textTertiary }]}>내 점수</Text>
            <Text style={[styles.scoreValue, { color: item.gapFromCutoff >= 0 ? colors.positive : colors.negative }]}>
              {item.myScore}
            </Text>
          </View>
          <View style={styles.scoreItem}>
            <Text style={[styles.scoreLabel, { color: colors.textTertiary }]}>차이</Text>
            <Text style={[styles.scoreValue, { color: item.gapFromCutoff >= 0 ? colors.positive : colors.negative }]}>
              {item.gapFromCutoff >= 0 ? '+' : ''}{item.gapFromCutoff}
            </Text>
          </View>
          <ProbabilityBadge chance={item.chance} percent={item.chancePercent} />
        </View>

        <View style={styles.metaRow}>
          {item.department.admissionGroup && (
            <>
              <Text style={[styles.metaText, { color: '#4A90D9', fontWeight: '700' }]}>{item.department.admissionGroup}군</Text>
              <Text style={[styles.metaDot, { color: colors.border }]}>&middot;</Text>
            </>
          )}
          <Text style={[styles.metaText, { color: colors.textTertiary }]}>{item.department.category}</Text>
          <Text style={[styles.metaDot, { color: colors.border }]}>&middot;</Text>
          <Text style={[styles.metaText, { color: colors.textTertiary }]}>{item.university.region}</Text>
          <Text style={[styles.metaDot, { color: colors.border }]}>&middot;</Text>
          <Text style={[styles.metaText, { color: colors.textTertiary }]}>경쟁률 {item.cutoff.competitionRate}:1</Text>
        </View>
      </View>

      {item.university.admissionUrl && (
        <TouchableOpacity
          style={styles.applyButton}
          onPress={() => Linking.openURL(item.university.admissionUrl!)}
          activeOpacity={0.6}
        >
          <Text style={styles.applyButtonText}>지원하기 →</Text>
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 6,
  },
  header: {
    marginBottom: 12,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  universityName: {
    fontSize: 17,
    fontWeight: '700',
  },
  favoriteIcon: {
    fontSize: 22,
    color: '#FFB300',
  },
  departmentName: {
    fontSize: 14,
    marginTop: 2,
  },
  body: {},
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  scoreItem: {
    alignItems: 'center',
  },
  scoreLabel: {
    fontSize: 11,
    marginBottom: 2,
  },
  scoreValue: {
    fontSize: 16,
    fontWeight: '700',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    gap: 6,
  },
  metaText: {
    fontSize: 12,
  },
  metaDot: {
    fontSize: 12,
  },
  applyButton: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(0,0,0,0.08)',
    alignItems: 'flex-end',
  },
  applyButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4A90D9',
  },
});
