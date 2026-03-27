import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import ScoreInput from '../../components/ScoreInput';
import { useScoreStore } from '../../store/useScoreStore';
import { useTheme } from '../../lib/theme';
import AdBanner from '../../components/AdBanner';

export default function ScoreInputScreen() {
  const router = useRouter();
  const store = useScoreStore();
  const { colors } = useTheme();

  const handleCalculate = () => {
    // 최소 하나의 점수가 입력되었는지 확인
    const hasKorean = Object.values(store.koreanScore).some(v => v !== undefined && v !== null);
    const hasMath = Object.values(store.mathScore).some(v => v !== undefined && v !== null);

    if (!hasKorean && !hasMath) {
      Alert.alert('알림', '국어 또는 수학 점수를 입력해주세요.');
      return;
    }

    store.calculateResults();
    router.push('/(tabs)/results');
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScoreInput />
      <AdBanner />
      <View style={[styles.buttonContainer, { backgroundColor: colors.background, borderTopColor: colors.border }]}>
        <TouchableOpacity style={[styles.calculateButton, { backgroundColor: colors.primary }]} onPress={handleCalculate}>
          <Text style={styles.calculateButtonText}>지원 가능 대학 보기</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.resetButton, { backgroundColor: colors.card, borderColor: colors.inputBorder }]} onPress={store.resetScores}>
          <Text style={[styles.resetButtonText, { color: colors.textTertiary }]}>초기화</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  buttonContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 10,
    backgroundColor: '#F8F9FA',
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  calculateButton: {
    flex: 3,
    backgroundColor: '#4A90D9',
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
  },
  calculateButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  resetButton: {
    flex: 1,
    backgroundColor: '#fff',
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  resetButtonText: {
    color: '#999',
    fontSize: 14,
    fontWeight: '600',
  },
});
