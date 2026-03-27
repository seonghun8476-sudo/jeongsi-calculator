import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { ResultItem } from '../types';
import ProbabilityBadge from './ProbabilityBadge';
import { useTheme } from '../lib/theme';

interface Props {
  items: ResultItem[];
}

export default function CompareView({ items }: Props) {
  const { colors } = useTheme();

  if (items.length < 2) {
    return (
      <View style={[styles.emptyContainer, { backgroundColor: colors.background }]}>
        <Text style={[styles.emptyText, { color: colors.textTertiary }]}>
          비교하려면 관심 대학을 2개 이상 선택하세요
        </Text>
      </View>
    );
  }

  const rows = [
    { label: '대학', render: (item: ResultItem) => item.university.name },
    { label: '학과', render: (item: ResultItem) => item.department.name },
    { label: '계열', render: (item: ResultItem) => item.department.category },
    { label: '커트라인', render: (item: ResultItem) => String(item.cutoff.minStandardScore) },
    { label: '내 점수', render: (item: ResultItem) => String(item.myScore) },
    { label: '차이', render: (item: ResultItem) => `${item.gapFromCutoff >= 0 ? '+' : ''}${item.gapFromCutoff}` },
    { label: '경쟁률', render: (item: ResultItem) => `${item.cutoff.competitionRate}:1` },
    { label: '합격자 평균', render: (item: ResultItem) => item.cutoff.avgStandardScore ? String(item.cutoff.avgStandardScore) : '-' },
  ];

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View>
          {/* 합격 확률 행 */}
          <View style={[styles.row, { borderBottomColor: colors.border }]}>
            <View style={[styles.labelCell, { backgroundColor: colors.card }]}>
              <Text style={[styles.labelText, { color: colors.textSecondary }]}>합격 확률</Text>
            </View>
            {items.map((item) => (
              <View key={item.department.id} style={[styles.valueCell, { backgroundColor: colors.card }]}>
                <ProbabilityBadge chance={item.chance} percent={item.chancePercent} size="large" />
              </View>
            ))}
          </View>

          {/* 데이터 행 */}
          {rows.map((row, i) => (
            <View key={row.label} style={[styles.row, { borderBottomColor: colors.border }]}>
              <View style={[styles.labelCell, { backgroundColor: i % 2 === 0 ? colors.background : colors.card }]}>
                <Text style={[styles.labelText, { color: colors.textSecondary }]}>{row.label}</Text>
              </View>
              {items.map((item) => {
                const value = row.render(item);
                const isGap = row.label === '차이';
                return (
                  <View key={item.department.id} style={[styles.valueCell, { backgroundColor: i % 2 === 0 ? colors.background : colors.card }]}>
                    <Text style={[
                      styles.valueText,
                      { color: colors.text },
                      isGap && { color: item.gapFromCutoff >= 0 ? colors.positive : colors.negative },
                    ]}>
                      {value}
                    </Text>
                  </View>
                );
              })}
            </View>
          ))}
        </View>
      </ScrollView>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 14,
    textAlign: 'center',
  },
  row: {
    flexDirection: 'row',
    borderBottomWidth: 1,
  },
  labelCell: {
    width: 90,
    paddingVertical: 14,
    paddingHorizontal: 12,
    justifyContent: 'center',
  },
  labelText: {
    fontSize: 13,
    fontWeight: '600',
  },
  valueCell: {
    width: 140,
    paddingVertical: 14,
    paddingHorizontal: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  valueText: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
});
