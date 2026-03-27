import React, { useState } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useScoreStore } from '../../store/useScoreStore';
import UniversityCard from '../../components/UniversityCard';
import CompareView from '../../components/CompareView';
import { useTheme } from '../../lib/theme';

export default function FavoritesScreen() {
  const router = useRouter();
  const store = useScoreStore();
  const { colors } = useTheme();
  const [mode, setMode] = useState<'list' | 'compare'>('list');

  const favoriteResults = store.results.filter((r) =>
    store.favorites.includes(r.department.id)
  );

  if (favoriteResults.length === 0) {
    return (
      <View style={[styles.emptyContainer, { backgroundColor: colors.background }]}>
        <Text style={styles.emptyIcon}>{'\u2B50'}</Text>
        <Text style={[styles.emptyTitle, { color: colors.text }]}>관심 대학이 없습니다</Text>
        <Text style={[styles.emptySubtitle, { color: colors.textTertiary }]}>
          결과 화면에서 별 아이콘을 눌러{'\n'}관심 대학을 추가해보세요
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* 모드 전환 */}
      <View style={[styles.modeRow, { backgroundColor: colors.card }]}>
        <TouchableOpacity
          style={[styles.modeTab, mode === 'list' && { backgroundColor: colors.primary }]}
          onPress={() => setMode('list')}
        >
          <Text style={[styles.modeText, mode === 'list' && styles.modeTextActive]}>목록</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.modeTab, mode === 'compare' && { backgroundColor: colors.primary }]}
          onPress={() => setMode('compare')}
        >
          <Text style={[styles.modeText, mode === 'compare' && styles.modeTextActive]}>비교</Text>
        </TouchableOpacity>
        <Text style={[styles.count, { color: colors.textTertiary }]}>{favoriteResults.length}개</Text>
      </View>

      {mode === 'compare' ? (
        <CompareView items={favoriteResults.slice(0, 4)} />
      ) : (
        <FlatList
          data={favoriteResults}
          keyExtractor={(item) => `fav-${item.department.id}`}
          renderItem={({ item }) => (
            <UniversityCard
              item={item}
              onPress={() => router.push(`/university/${item.university.id}`)}
              isFavorite={true}
              onToggleFavorite={() => store.toggleFavorite(item.department.id)}
            />
          )}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
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
    paddingHorizontal: 40,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  modeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
  },
  modeTab: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#F0F0F0',
  },
  modeText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#666',
  },
  modeTextActive: {
    color: '#fff',
  },
  count: {
    fontSize: 13,
    marginLeft: 'auto',
  },
  listContent: {
    paddingBottom: 20,
  },
});
