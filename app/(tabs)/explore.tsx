import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  SectionList,
} from 'react-native';
import { useDataStore } from '../../store/useDataStore';
import { useTheme } from '../../lib/theme';
import { University, Department, CutoffScore } from '../../types';

type ViewMode = 'university' | 'department';

// Region order for 대학별 mode
const REGION_ORDER = ['서울', '경기', '인천', '부산', '대구', '광주', '대전', '울산', '세종', '강원', '충북', '충남', '전북', '전남', '경북', '경남', '제주'];

// Category labels for 학과별 mode
const CATEGORY_ORDER: { key: Department['category']; label: string }[] = [
  { key: '의약', label: '의약계열' },
  { key: '자연', label: '공학/자연계열' },
  { key: '인문', label: '인문/사회계열' },
  { key: '예체능', label: '예체능계열' },
];

export default function ExploreScreen() {
  const { colors } = useTheme();
  const { universities, departments, cutoffScores } = useDataStore();

  const [viewMode, setViewMode] = useState<ViewMode>('university');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Build a map: departmentId -> latest cutoff
  const cutoffMap = useMemo(() => {
    const map = new Map<string, CutoffScore>();
    for (const c of cutoffScores) {
      const existing = map.get(c.departmentId);
      if (!existing || c.year > existing.year) {
        map.set(c.departmentId, c);
      }
    }
    return map;
  }, [cutoffScores]);

  // Build university map
  const universityMap = useMemo(() => {
    const map = new Map<string, University>();
    for (const u of universities) {
      map.set(u.id, u);
    }
    return map;
  }, [universities]);

  // ===== University mode data =====
  const universityModeSections = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    // Filter universities and departments by search
    let filteredUnis = universities;
    let filteredDepts = departments;

    if (query) {
      // Find universities matching by name
      const matchingUniIds = new Set(
        universities.filter((u) => u.name.toLowerCase().includes(query)).map((u) => u.id)
      );
      // Find departments matching by name
      const matchingDeptUniIds = new Set(
        departments.filter((d) => d.name.toLowerCase().includes(query)).map((d) => d.universityId)
      );
      // Combine: show unis that match OR have matching departments
      const allMatchingIds = new Set([...matchingUniIds, ...matchingDeptUniIds]);
      filteredUnis = universities.filter((u) => allMatchingIds.has(u.id));

      // For department filtering within expanded uni, filter by dept name too
      if (query) {
        filteredDepts = departments.filter(
          (d) => d.name.toLowerCase().includes(query) || matchingUniIds.has(d.universityId)
        );
      }
    }

    // Group by region
    const regionMap = new Map<string, University[]>();
    for (const u of filteredUnis) {
      const list = regionMap.get(u.region) || [];
      list.push(u);
      regionMap.set(u.region, list);
    }

    const sections = REGION_ORDER
      .filter((r) => regionMap.has(r))
      .map((region) => ({
        title: region,
        data: regionMap.get(region)!,
      }));

    // Add any regions not in the predefined order
    for (const [region, unis] of regionMap) {
      if (!REGION_ORDER.includes(region)) {
        sections.push({ title: region, data: unis });
      }
    }

    return { sections, filteredDepts };
  }, [universities, departments, searchQuery]);

  // ===== Department mode data =====
  const departmentModeSections = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    let filteredDepts = departments;
    if (query) {
      filteredDepts = departments.filter(
        (d) =>
          d.name.toLowerCase().includes(query) ||
          d.universityName.toLowerCase().includes(query)
      );
    }

    const sections = CATEGORY_ORDER.map((cat) => {
      const depts = filteredDepts.filter((d) => d.category === cat.key);
      // Sort by cutoff score descending
      depts.sort((a, b) => {
        const cutA = cutoffMap.get(a.id)?.minStandardScore ?? 0;
        const cutB = cutoffMap.get(b.id)?.minStandardScore ?? 0;
        return cutB - cutA;
      });
      return {
        title: cat.label,
        key: cat.key,
        data: depts,
      };
    }).filter((s) => s.data.length > 0);

    return sections;
  }, [departments, searchQuery, cutoffMap]);

  // Toggle expand for university mode
  const toggleExpand = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  // Render a department row (used in both modes)
  const renderDeptRow = (dept: Department, showUniName: boolean) => {
    const cutoff = cutoffMap.get(dept.id);
    return (
      <View
        key={dept.id}
        style={[styles.deptRow, { backgroundColor: colors.card, borderBottomColor: colors.border }]}
      >
        <View style={styles.deptInfo}>
          {showUniName && (
            <Text style={[styles.deptUniName, { color: colors.primary }]} numberOfLines={1}>
              {dept.universityName}
            </Text>
          )}
          <Text style={[styles.deptName, { color: colors.text }]} numberOfLines={1}>
            {dept.name}
          </Text>
          <View style={styles.badgeRow}>
            <View style={[styles.badge, { backgroundColor: getCategoryColor(dept.category) }]}>
              <Text style={styles.badgeText}>{dept.category}</Text>
            </View>
          </View>
        </View>
        <View style={styles.deptScores}>
          {cutoff ? (
            <>
              <Text style={[styles.scoreLabel, { color: colors.textTertiary }]}>2025 커트라인</Text>
              <Text style={[styles.scoreValue, { color: colors.text }]}>{cutoff.minStandardScore}점</Text>
              <Text style={[styles.competitionRate, { color: colors.textSecondary }]}>
                경쟁률 {cutoff.competitionRate.toFixed(1)}:1
              </Text>
            </>
          ) : (
            <Text style={[styles.noData, { color: colors.textTertiary }]}>데이터 없음</Text>
          )}
        </View>
      </View>
    );
  };

  // University mode: render university item
  const renderUniversityItem = (uni: University) => {
    const isExpanded = expandedId === uni.id;
    const uniDepts = universityModeSections.filteredDepts.filter(
      (d) => d.universityId === uni.id
    );
    const deptCount = uniDepts.length;

    return (
      <View key={uni.id}>
        <TouchableOpacity
          style={[styles.uniItem, { backgroundColor: colors.card, borderBottomColor: colors.border }]}
          onPress={() => toggleExpand(uni.id)}
          activeOpacity={0.7}
        >
          <View style={styles.uniInfo}>
            <Text style={[styles.uniName, { color: colors.text }]}>{uni.name}</Text>
            <View style={styles.uniMeta}>
              <Text style={[styles.uniType, { color: colors.textTertiary }]}>{uni.type}</Text>
              <Text style={[styles.uniDeptCount, { color: colors.textSecondary }]}>
                {deptCount}개 학과
              </Text>
            </View>
          </View>
          <Text style={[styles.expandIcon, { color: colors.textTertiary }]}>
            {isExpanded ? '\u25B2' : '\u25BC'}
          </Text>
        </TouchableOpacity>
        {isExpanded && (
          <View style={styles.deptList}>
            {uniDepts.map((d) => renderDeptRow(d, false))}
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Search bar */}
      <View style={[styles.searchContainer, { backgroundColor: colors.card }]}>
        <View style={[styles.searchBar, { backgroundColor: colors.searchBg }]}>
          <Text style={styles.searchIcon}>{'\uD83D\uDD0D'}</Text>
          <TextInput
            style={[styles.searchInput, { color: colors.text }]}
            placeholder="대학 또는 학과 검색..."
            placeholderTextColor={colors.textTertiary}
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCorrect={false}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.clearButton}>
              <Text style={[styles.clearText, { color: colors.textTertiary }]}>{'\u2715'}</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Mode toggle */}
      <View style={[styles.modeContainer, { backgroundColor: colors.card }]}>
        <TouchableOpacity
          style={[
            styles.modeTab,
            viewMode === 'university' && { backgroundColor: colors.primary },
          ]}
          onPress={() => {
            setViewMode('university');
            setExpandedId(null);
          }}
        >
          <Text
            style={[
              styles.modeText,
              viewMode === 'university' && styles.modeTextActive,
              viewMode !== 'university' && { color: colors.textSecondary },
            ]}
          >
            대학별
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.modeTab,
            viewMode === 'department' && { backgroundColor: colors.primary },
          ]}
          onPress={() => {
            setViewMode('department');
            setExpandedId(null);
          }}
        >
          <Text
            style={[
              styles.modeText,
              viewMode === 'department' && styles.modeTextActive,
              viewMode !== 'department' && { color: colors.textSecondary },
            ]}
          >
            학과별
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      {viewMode === 'university' ? (
        <SectionList
          sections={universityModeSections.sections}
          keyExtractor={(item) => item.id}
          renderSectionHeader={({ section }) => (
            <View style={[styles.sectionHeader, { backgroundColor: colors.background }]}>
              <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
                {section.title} ({section.data.length})
              </Text>
            </View>
          )}
          renderItem={({ item }) => renderUniversityItem(item)}
          stickySectionHeadersEnabled
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={[styles.emptyText, { color: colors.textTertiary }]}>
                검색 결과가 없습니다
              </Text>
            </View>
          }
        />
      ) : (
        <SectionList
          sections={departmentModeSections}
          keyExtractor={(item) => item.id}
          renderSectionHeader={({ section }) => (
            <View style={[styles.sectionHeader, { backgroundColor: colors.background }]}>
              <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
                {section.title} ({section.data.length})
              </Text>
            </View>
          )}
          renderItem={({ item }) => renderDeptRow(item, true)}
          stickySectionHeadersEnabled
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={[styles.emptyText, { color: colors.textTertiary }]}>
                검색 결과가 없습니다
              </Text>
            </View>
          }
        />
      )}
    </View>
  );
}

function getCategoryColor(category: Department['category']): string {
  switch (category) {
    case '의약':
      return '#E8F5E9';
    case '자연':
      return '#E3F2FD';
    case '인문':
      return '#FFF3E0';
    case '예체능':
      return '#F3E5F5';
    default:
      return '#F5F5F5';
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 44,
  },
  searchIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    paddingVertical: 0,
  },
  clearButton: {
    padding: 4,
  },
  clearText: {
    fontSize: 16,
    fontWeight: '600',
  },
  modeContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
  },
  modeTab: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F0F0F0',
  },
  modeText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  modeTextActive: {
    color: '#FFFFFF',
  },
  sectionHeader: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  uniItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  uniInfo: {
    flex: 1,
  },
  uniName: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  uniMeta: {
    flexDirection: 'row',
    gap: 8,
  },
  uniType: {
    fontSize: 12,
  },
  uniDeptCount: {
    fontSize: 12,
  },
  expandIcon: {
    fontSize: 12,
    marginLeft: 8,
  },
  deptList: {
    paddingLeft: 0,
  },
  deptRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  deptInfo: {
    flex: 1,
  },
  deptUniName: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 2,
  },
  deptName: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 4,
  },
  badgeRow: {
    flexDirection: 'row',
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#555',
  },
  deptScores: {
    alignItems: 'flex-end',
    minWidth: 90,
  },
  scoreLabel: {
    fontSize: 10,
    marginBottom: 2,
  },
  scoreValue: {
    fontSize: 16,
    fontWeight: '700',
  },
  competitionRate: {
    fontSize: 11,
    marginTop: 2,
  },
  noData: {
    fontSize: 12,
  },
  listContent: {
    paddingBottom: 30,
  },
  emptyContainer: {
    paddingVertical: 60,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 15,
  },
});
