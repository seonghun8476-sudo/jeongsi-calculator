import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
  TextInput,
  Share,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useScoreStore } from '../../store/useScoreStore';
import UniversityCard from '../../components/UniversityCard';
import { AdmissionChance, AdmissionGroup, SortOption, ResultItem } from '../../types';

const sortOptions: { key: SortOption; label: string }[] = [
  { key: 'chance', label: '합격 확률순' },
  { key: 'universityName', label: '대학명순' },
  { key: 'cutoffScore', label: '커트라인순' },
  { key: 'competitionRate', label: '경쟁률순' },
];

const chanceFilters: { key: AdmissionChance | 'all'; label: string; color: string }[] = [
  { key: 'all', label: '전체', color: '#666' },
  { key: '안정', label: '안정', color: '#2E7D32' },
  { key: '적정', label: '적정', color: '#1565C0' },
  { key: '소신', label: '소신', color: '#E65100' },
  { key: '위험', label: '위험', color: '#C62828' },
];

// 학과 카테고리 필터 (학과명 기반 매핑)
const departmentCategories: { key: string; label: string; emoji: string; keywords: string[] }[] = [
  { key: 'all', label: '전체', emoji: '📋', keywords: [] },
  { key: 'medical', label: '의약', emoji: '🏥', keywords: ['의예', '의과', '의학', '약학', '한의', '수의', '치의', '간호'] },
  { key: 'engineering', label: '공학', emoji: '⚙️', keywords: ['공학', '공과', '컴퓨터', '소프트웨어', '전기', '전자', '반도체', '기계', '화학공', '건축', '산업', 'AI', '정보'] },
  { key: 'business', label: '경영/경제', emoji: '💼', keywords: ['경영', '경제', '통상', '무역', '회계', '금융', '세무'] },
  { key: 'humanities', label: '인문', emoji: '📚', keywords: ['국어', '영어', '영문', '중국', '일본', '불어', '독어', '사학', '철학', '문학', '언어', '어학'] },
  { key: 'social', label: '사회', emoji: '🏛️', keywords: ['법학', '행정', '정치', '심리', '사회', '미디어', '신문', '광고', '복지', '관광', '호텔'] },
  { key: 'science', label: '자연과학', emoji: '🔬', keywords: ['수리', '수학', '물리', '화학', '생명', '생물', '지구', '천문', '통계'] },
  { key: 'art', label: '예체능', emoji: '🎨', keywords: ['디자인', '미술', '음악', '체육', '영화', '연극', '무용'] },
];

function getDeptCategory(deptName: string): string {
  for (const cat of departmentCategories) {
    if (cat.key === 'all') continue;
    if (cat.keywords.some(kw => deptName.includes(kw))) return cat.key;
  }
  return 'humanities'; // 기본값
}

export default function ResultsScreen() {
  const router = useRouter();
  const store = useScoreStore();
  const [activeChanceFilter, setActiveChanceFilter] = useState<AdmissionChance | 'all'>('all');
  const [activeDeptFilter, setActiveDeptFilter] = useState('all');
  const [activeGroupFilter, setActiveGroupFilter] = useState<AdmissionGroup | 'all'>('all');
  const [showSortMenu, setShowSortMenu] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // 학과 카테고리 + 군 + 검색 필터 적용
  const searchedResults = useMemo(() => {
    let results = store.filteredResults;

    // 학과 카테고리 필터
    if (activeDeptFilter !== 'all') {
      results = results.filter(
        (item: ResultItem) => getDeptCategory(item.department.name) === activeDeptFilter
      );
    }

    // 군 필터
    if (activeGroupFilter !== 'all') {
      results = results.filter(
        (item: ResultItem) => item.department.admissionGroup === activeGroupFilter
      );
    }

    // 검색어 필터
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      results = results.filter(
        (item: ResultItem) =>
          item.university.name.toLowerCase().includes(q) ||
          item.department.name.toLowerCase().includes(q)
      );
    }

    return results;
  }, [store.filteredResults, searchQuery, activeDeptFilter, activeGroupFilter]);

  // 카테고리별 개수 계산
  const deptCounts = useMemo(() => {
    const counts: Record<string, number> = { all: store.filteredResults.length };
    for (const item of store.filteredResults) {
      const cat = getDeptCategory(item.department.name);
      counts[cat] = (counts[cat] || 0) + 1;
    }
    return counts;
  }, [store.filteredResults]);

  const handleChanceFilter = (key: AdmissionChance | 'all') => {
    setActiveChanceFilter(key);
    if (key === 'all') {
      store.setFilters({ ...store.filters, chanceLevel: undefined });
    } else {
      store.setFilters({ ...store.filters, chanceLevel: key });
    }
  };

  const handleSort = (key: SortOption) => {
    store.setSortOption(key);
    setShowSortMenu(false);
  };

  const handleShare = async () => {
    const top5 = searchedResults.slice(0, 5);
    const lines = top5.map((r, i) =>
      `${i + 1}. ${r.university.name} ${r.department.name} [${r.chance} ${r.chancePercent}%]`
    );
    const message = `[어대갈까]\n내 표준점수 합: ${store.totalStandardScore}\n\n${lines.join('\n')}\n\n#정시 #수능 #대입`;
    try {
      await Share.share({ message });
    } catch (e) {
      Alert.alert('공유 실패', '공유할 수 없습니다.');
    }
  };

  if (store.results.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyIcon}>{'\uD83D\uDCCA'}</Text>
        <Text style={styles.emptyTitle}>아직 결과가 없습니다</Text>
        <Text style={styles.emptySubtitle}>
          점수 입력 탭에서 수능 점수를 입력하고{'\n'}'지원 가능 대학 보기'를 눌러주세요
        </Text>
      </View>
    );
  }

  // 통계 계산
  const safeCount = store.filteredResults.filter(r => r.chance === '안정').length;
  const fitCount = store.filteredResults.filter(r => r.chance === '적정').length;
  const boldCount = store.filteredResults.filter(r => r.chance === '소신').length;
  const dangerCount = store.filteredResults.filter(r => r.chance === '위험').length;

  return (
    <View style={styles.container}>
      {/* 검색 바 */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="대학 또는 학과 검색..."
          placeholderTextColor="#aaa"
          value={searchQuery}
          onChangeText={setSearchQuery}
          clearButtonMode="while-editing"
        />
      </View>

      {/* 점수 요약 */}
      <View style={styles.summary}>
        <Text style={styles.summaryLabel}>내 환산 표준점수 합</Text>
        <Text style={styles.summaryScore}>{store.totalStandardScore}</Text>
        {store.englishGrade > 0 && (
          <Text style={styles.summaryEnglish}>영어 {store.englishGrade}등급</Text>
        )}
      </View>

      {/* 학과 카테고리 필터 */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.deptFilterRow}>
        <View style={styles.filterInner}>
          {departmentCategories.map((cat) => (
            <TouchableOpacity
              key={cat.key}
              style={[
                styles.deptChip,
                activeDeptFilter === cat.key && styles.deptChipActive,
              ]}
              onPress={() => setActiveDeptFilter(cat.key)}
            >
              <Text style={styles.deptChipEmoji}>{cat.emoji}</Text>
              <Text
                style={[
                  styles.deptChipText,
                  activeDeptFilter === cat.key && styles.deptChipTextActive,
                ]}
              >
                {cat.label}
                {deptCounts[cat.key] ? ` ${deptCounts[cat.key]}` : ''}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      {/* 가/나/다군 필터 */}
      <View style={styles.groupFilterRow}>
        {([
          { key: 'all' as const, label: '전체' },
          { key: '가' as const, label: '가군' },
          { key: '나' as const, label: '나군' },
          { key: '다' as const, label: '다군' },
        ]).map((g) => (
          <TouchableOpacity
            key={g.key}
            style={[
              styles.groupChip,
              activeGroupFilter === g.key && styles.groupChipActive,
            ]}
            onPress={() => setActiveGroupFilter(g.key)}
          >
            <Text
              style={[
                styles.groupChipText,
                activeGroupFilter === g.key && styles.groupChipTextActive,
              ]}
            >
              {g.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* 합격 확률 필터 */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterRow}>
        <View style={styles.filterInner}>
          {chanceFilters.map((f) => (
            <TouchableOpacity
              key={f.key}
              style={[
                styles.filterChip,
                activeChanceFilter === f.key && { backgroundColor: f.color },
              ]}
              onPress={() => handleChanceFilter(f.key)}
            >
              <Text
                style={[
                  styles.filterChipText,
                  activeChanceFilter === f.key && styles.filterChipTextActive,
                ]}
              >
                {f.label}
                {f.key === 'all' ? ` ${store.filteredResults.length}` :
                 f.key === '안정' ? ` ${safeCount}` :
                 f.key === '적정' ? ` ${fitCount}` :
                 f.key === '소신' ? ` ${boldCount}` :
                 ` ${dangerCount}`}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      {/* 정렬 + 공유 */}
      <View style={styles.sortRow}>
        <Text style={styles.resultCount}>{searchedResults.length}개 결과</Text>
        <TouchableOpacity onPress={handleShare} style={styles.shareButton}>
          <Text style={styles.shareButtonText}>공유</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setShowSortMenu(!showSortMenu)}>
          <Text style={styles.sortButton}>
            {sortOptions.find(s => s.key === store.sortOption)?.label} {'\u25BC'}
          </Text>
        </TouchableOpacity>
      </View>

      {showSortMenu && (
        <View style={styles.sortMenu}>
          {sortOptions.map((s) => (
            <TouchableOpacity
              key={s.key}
              style={styles.sortMenuItem}
              onPress={() => handleSort(s.key)}
            >
              <Text style={[
                styles.sortMenuText,
                store.sortOption === s.key && styles.sortMenuTextActive,
              ]}>
                {s.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* 결과 리스트 */}
      <FlatList
        data={searchedResults}
        keyExtractor={(item) => `${item.department.id}-${item.cutoff.id}`}
        renderItem={({ item }) => (
          <UniversityCard
            item={item}
            onPress={() => router.push(`/university/${item.university.id}`)}
            isFavorite={store.favorites.includes(item.department.id)}
            onToggleFavorite={() => store.toggleFavorite(item.department.id)}
          />
        )}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#fff',
  },
  searchInput: {
    height: 40,
    backgroundColor: '#F0F0F0',
    borderRadius: 12,
    paddingHorizontal: 14,
    fontSize: 14,
    color: '#333',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    paddingHorizontal: 40,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    lineHeight: 20,
  },
  summary: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    gap: 8,
  },
  summaryLabel: {
    fontSize: 13,
    color: '#666',
  },
  summaryScore: {
    fontSize: 22,
    fontWeight: '800',
    color: '#4A90D9',
  },
  summaryEnglish: {
    fontSize: 13,
    color: '#999',
  },
  deptFilterRow: {
    backgroundColor: '#fff',
    minHeight: 48,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  deptChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: '#F0F0F0',
    gap: 4,
  },
  deptChipActive: {
    backgroundColor: '#4A90D9',
  },
  deptChipEmoji: {
    fontSize: 14,
  },
  deptChipText: {
    fontSize: 13,
    color: '#666',
    fontWeight: '600',
  },
  deptChipTextActive: {
    color: '#fff',
  },
  groupFilterRow: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  groupChip: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: '#F0F0F0',
    alignItems: 'center',
  },
  groupChipActive: {
    backgroundColor: '#4A90D9',
  },
  groupChipText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#666',
  },
  groupChipTextActive: {
    color: '#fff',
  },
  filterRow: {
    backgroundColor: '#fff',
    maxHeight: 50,
  },
  filterInner: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#F0F0F0',
  },
  filterChipText: {
    fontSize: 13,
    color: '#666',
    fontWeight: '600',
  },
  filterChipTextActive: {
    color: '#fff',
  },
  sortRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  resultCount: {
    fontSize: 13,
    color: '#999',
  },
  shareButton: {
    marginLeft: 'auto',
    marginRight: 12,
  },
  shareButtonText: {
    fontSize: 13,
    color: '#4A90D9',
    fontWeight: '600',
  },
  sortButton: {
    fontSize: 13,
    color: '#4A90D9',
    fontWeight: '600',
  },
  sortMenu: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    borderRadius: 12,
    padding: 4,
    position: 'absolute',
    right: 16,
    top: 110,
    zIndex: 10,
    ...Platform.select({
      web: {
        boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.1)',
      },
      default: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 5,
      },
    }),
  },
  sortMenuItem: {
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  sortMenuText: {
    fontSize: 14,
    color: '#666',
  },
  sortMenuTextActive: {
    color: '#4A90D9',
    fontWeight: '700',
  },
  listContent: {
    paddingBottom: 20,
  },
});
