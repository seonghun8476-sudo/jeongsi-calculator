import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useScoreStore } from '../../store/useScoreStore';
import { useDataStore } from '../../store/useDataStore';
import { getUniversityDepartments } from '../../lib/calculator';
import ProbabilityBadge from '../../components/ProbabilityBadge';
import { useTheme } from '../../lib/theme';
import { CutoffScore } from '../../types';

const YEARS = [2025, 2024, 2023];

export default function UniversityDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const store = useScoreStore();
  const dataStore = useDataStore();
  const { colors } = useTheme();
  const [selectedYear, setSelectedYear] = useState(2025);

  const university = dataStore.universities.find((u) => u.id === id);

  // 선택한 연도의 커트라인만 필터링
  const yearCutoffs = dataStore.cutoffScores.filter((c) => c.year === selectedYear);

  const departmentResults = getUniversityDepartments(
    id,
    store.totalStandardScore,
    dataStore.universities,
    dataStore.departments,
    yearCutoffs
  );

  // 3개년 추이 데이터 (학과별)
  const depts = dataStore.departments.filter((d) => d.universityId === id);

  function getCutoffForDeptYear(deptId: string, year: number): CutoffScore | undefined {
    return dataStore.cutoffScores.find((c) => c.departmentId === deptId && c.year === year);
  }

  if (!university) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Text style={[styles.errorText, { color: colors.textTertiary }]}>대학 정보를 찾을 수 없습니다.</Text>
      </View>
    );
  }

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]} showsVerticalScrollIndicator={false}>
      {/* 대학 헤더 */}
      <View style={[styles.header, { backgroundColor: colors.card }]}>
        <Text style={[styles.universityName, { color: colors.text }]}>{university.name}</Text>
        <View style={styles.metaRow}>
          <View style={[styles.metaBadge, { backgroundColor: colors.background }]}>
            <Text style={[styles.metaBadgeText, { color: colors.textSecondary }]}>{university.region}</Text>
          </View>
          <View style={[styles.metaBadge, { backgroundColor: colors.background }]}>
            <Text style={[styles.metaBadgeText, { color: colors.textSecondary }]}>{university.type}</Text>
          </View>
        </View>
      </View>

      {/* 내 점수 */}
      <View style={[styles.myScoreSection, { backgroundColor: colors.card }]}>
        <Text style={[styles.myScoreLabel, { color: colors.textSecondary }]}>내 환산 표준점수 합</Text>
        <Text style={[styles.myScoreValue, { color: colors.primary }]}>{store.totalStandardScore}</Text>
      </View>

      {/* 연도 선택 탭 */}
      <View style={[styles.yearTabRow, { backgroundColor: colors.card }]}>
        {YEARS.map((year) => (
          <TouchableOpacity
            key={year}
            style={[styles.yearTab, selectedYear === year && { backgroundColor: colors.primary }]}
            onPress={() => setSelectedYear(year)}
          >
            <Text style={[styles.yearTabText, selectedYear === year && styles.yearTabTextActive]}>
              {year}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* 학과별 커트라인 */}
      <View style={[styles.section, { backgroundColor: colors.card }]}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>학과별 커트라인 ({selectedYear})</Text>

        <View style={[styles.tableHeader, { backgroundColor: colors.background, borderColor: colors.border }]}>
          <Text style={[styles.tableHeaderText, styles.colDept, { color: colors.textTertiary }]}>학과</Text>
          <Text style={[styles.tableHeaderText, styles.colScore, { color: colors.textTertiary }]}>커트라인</Text>
          <Text style={[styles.tableHeaderText, styles.colGap, { color: colors.textTertiary }]}>차이</Text>
          <Text style={[styles.tableHeaderText, styles.colRate, { color: colors.textTertiary }]}>경쟁률</Text>
          <Text style={[styles.tableHeaderText, styles.colChance, { color: colors.textTertiary }]}>확률</Text>
        </View>

        {departmentResults.map((item) => (
          <View key={item.department.id} style={[styles.tableRow, { borderBottomColor: colors.border }]}>
            <View style={styles.colDept}>
              <Text style={[styles.deptName, { color: colors.text }]}>{item.department.name}</Text>
              <Text style={[styles.deptCategory, { color: colors.textTertiary }]}>{item.department.category}</Text>
            </View>
            <Text style={[styles.cellText, styles.colScore, { color: colors.text }]}>
              {item.cutoff.minStandardScore}
            </Text>
            <Text style={[styles.cellText, styles.colGap, { color: item.gapFromCutoff >= 0 ? colors.positive : colors.negative }]}>
              {item.gapFromCutoff >= 0 ? '+' : ''}{item.gapFromCutoff}
            </Text>
            <Text style={[styles.cellText, styles.colRate, { color: colors.text }]}>
              {item.cutoff.competitionRate}:1
            </Text>
            <View style={styles.colChance}>
              <ProbabilityBadge chance={item.chance} percent={item.chancePercent} size="small" />
            </View>
          </View>
        ))}
      </View>

      {/* 3개년 추이 */}
      <View style={[styles.section, { backgroundColor: colors.card }]}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>3개년 커트라인 추이</Text>

        <View style={[styles.tableHeader, { backgroundColor: colors.background, borderColor: colors.border }]}>
          <Text style={[styles.tableHeaderText, { flex: 3, color: colors.textTertiary }]}>학과</Text>
          <Text style={[styles.tableHeaderText, { flex: 1.5, textAlign: 'center', color: colors.textTertiary }]}>2023</Text>
          <Text style={[styles.tableHeaderText, { flex: 1.5, textAlign: 'center', color: colors.textTertiary }]}>2024</Text>
          <Text style={[styles.tableHeaderText, { flex: 1.5, textAlign: 'center', color: colors.textTertiary }]}>2025</Text>
          <Text style={[styles.tableHeaderText, { flex: 1.5, textAlign: 'center', color: colors.textTertiary }]}>추세</Text>
        </View>

        {depts.map((dept) => {
          const c23 = getCutoffForDeptYear(dept.id, 2023);
          const c24 = getCutoffForDeptYear(dept.id, 2024);
          const c25 = getCutoffForDeptYear(dept.id, 2025);

          // 추세 계산
          let trend = '-';
          if (c23 && c25) {
            const diff = c25.minStandardScore - c23.minStandardScore;
            if (diff > 2) trend = '\u2191'; // 상승
            else if (diff < -2) trend = '\u2193'; // 하락
            else trend = '\u2192'; // 유지
          }

          return (
            <View key={dept.id} style={[styles.tableRow, { borderBottomColor: colors.border }]}>
              <View style={{ flex: 3 }}>
                <Text style={[styles.deptName, { color: colors.text }]}>{dept.name}</Text>
              </View>
              <Text style={[styles.cellText, { flex: 1.5, textAlign: 'center', color: colors.textSecondary }]}>
                {c23?.minStandardScore ?? '-'}
              </Text>
              <Text style={[styles.cellText, { flex: 1.5, textAlign: 'center', color: colors.textSecondary }]}>
                {c24?.minStandardScore ?? '-'}
              </Text>
              <Text style={[styles.cellText, { flex: 1.5, textAlign: 'center', color: colors.primary, fontWeight: '700' }]}>
                {c25?.minStandardScore ?? '-'}
              </Text>
              <Text style={[styles.trendText, {
                flex: 1.5,
                color: trend === '\u2191' ? colors.negative : trend === '\u2193' ? colors.positive : colors.textTertiary,
              }]}>
                {trend}
              </Text>
            </View>
          );
        })}
      </View>

      {/* 참고 사항 */}
      <View style={[styles.disclaimerSection, { backgroundColor: colors.card }]}>
        <Text style={[styles.disclaimerTitle, { color: colors.textSecondary }]}>참고 사항</Text>
        <Text style={[styles.disclaimerText, { color: colors.textTertiary }]}>
          {'\u2022'} 커트라인은 샘플 데이터이며 실제 합격선과 다를 수 있습니다.{'\n'}
          {'\u2022'} 영어 등급에 따른 가산점은 대학별로 다르게 적용됩니다.{'\n'}
          {'\u2022'} \u2191 상승 \u2192 유지 \u2193 하락 (2023 대비 2025 기준)
        </Text>
      </View>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 100,
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    alignItems: 'center',
  },
  universityName: {
    fontSize: 24,
    fontWeight: '800',
  },
  metaRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  metaBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  metaBadgeText: {
    fontSize: 13,
    fontWeight: '500',
  },
  myScoreSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 12,
    marginTop: 1,
  },
  myScoreLabel: {
    fontSize: 14,
  },
  myScoreValue: {
    fontSize: 28,
    fontWeight: '800',
  },
  yearTabRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    marginTop: 1,
  },
  yearTab: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F0F0F0',
  },
  yearTabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  yearTabTextActive: {
    color: '#fff',
  },
  section: {
    marginTop: 12,
    paddingVertical: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  tableHeader: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderBottomWidth: 1,
  },
  tableHeaderText: {
    fontSize: 12,
    fontWeight: '600',
  },
  tableRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    alignItems: 'center',
  },
  colDept: {
    flex: 3,
  },
  colScore: {
    flex: 2,
    textAlign: 'center',
  },
  colGap: {
    flex: 1.5,
    textAlign: 'center',
  },
  colRate: {
    flex: 1.5,
    textAlign: 'center',
  },
  colChance: {
    flex: 2,
    alignItems: 'flex-end',
  },
  deptName: {
    fontSize: 14,
    fontWeight: '600',
  },
  deptCategory: {
    fontSize: 11,
    marginTop: 2,
  },
  cellText: {
    fontSize: 14,
    fontWeight: '600',
  },
  trendText: {
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
  },
  disclaimerSection: {
    marginTop: 12,
    padding: 16,
  },
  disclaimerTitle: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 8,
  },
  disclaimerText: {
    fontSize: 12,
    lineHeight: 20,
  },
});
