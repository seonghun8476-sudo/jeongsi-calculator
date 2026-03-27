import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Dimensions,
  TouchableOpacity,
  NativeScrollEvent,
  NativeSyntheticEvent,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { useTheme } from '../lib/theme';

const { width } = Dimensions.get('window');

const ONBOARDING_KEY = '@jeongsi_onboarding_done';

const slides = [
  {
    id: '1',
    emoji: '\uD83C\uDFAF',
    title: '수능 점수 입력',
    description: '원점수, 표준점수, 백분위, 등급\n4가지 방식으로 입력할 수 있어요',
  },
  {
    id: '2',
    emoji: '\uD83C\uDFE0',
    title: '지원 가능 대학 확인',
    description: '내 점수로 지원 가능한 대학과 학과를\n합격 확률과 함께 보여드려요',
  },
  {
    id: '3',
    emoji: '\uD83D\uDCC8',
    title: '3개년 추이 분석',
    description: '최근 3년간 커트라인 변화를\n한눈에 확인할 수 있어요',
  },
  {
    id: '4',
    emoji: '\u2B50',
    title: '관심 대학 관리',
    description: '관심 있는 대학을 저장하고\n로그인하면 여러 기기에서 동기화돼요',
  },
];

export default function OnboardingScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const index = Math.round(event.nativeEvent.contentOffset.x / width);
    setCurrentIndex(index);
  };

  const handleNext = () => {
    if (currentIndex < slides.length - 1) {
      flatListRef.current?.scrollToIndex({ index: currentIndex + 1 });
    } else {
      finishOnboarding();
    }
  };

  const finishOnboarding = async () => {
    await AsyncStorage.setItem(ONBOARDING_KEY, 'true');
    router.replace('/(tabs)');
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <FlatList
        ref={flatListRef}
        data={slides}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={[styles.slide, { width }]}>
            <Text style={styles.emoji}>{item.emoji}</Text>
            <Text style={[styles.title, { color: colors.text }]}>{item.title}</Text>
            <Text style={[styles.description, { color: colors.textSecondary }]}>{item.description}</Text>
          </View>
        )}
      />

      {/* 인디케이터 */}
      <View style={styles.indicatorRow}>
        {slides.map((_, index) => (
          <View
            key={index}
            style={[
              styles.indicator,
              {
                backgroundColor: index === currentIndex ? colors.primary : colors.border,
                width: index === currentIndex ? 24 : 8,
              },
            ]}
          />
        ))}
      </View>

      {/* 버튼 영역 */}
      <View style={styles.buttonRow}>
        {currentIndex < slides.length - 1 ? (
          <>
            <TouchableOpacity onPress={finishOnboarding}>
              <Text style={[styles.skipText, { color: colors.textTertiary }]}>건너뛰기</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.nextButton, { backgroundColor: colors.primary }]} onPress={handleNext}>
              <Text style={styles.nextButtonText}>다음</Text>
            </TouchableOpacity>
          </>
        ) : (
          <TouchableOpacity
            style={[styles.startButton, { backgroundColor: colors.primary }]}
            onPress={finishOnboarding}
          >
            <Text style={styles.startButtonText}>시작하기</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

export async function hasSeenOnboarding(): Promise<boolean> {
  const value = await AsyncStorage.getItem(ONBOARDING_KEY);
  return value === 'true';
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  slide: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emoji: {
    fontSize: 72,
    marginBottom: 32,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    marginBottom: 12,
    textAlign: 'center',
  },
  description: {
    fontSize: 16,
    lineHeight: 24,
    textAlign: 'center',
  },
  indicatorRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 20,
  },
  indicator: {
    height: 8,
    borderRadius: 4,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingBottom: 50,
  },
  skipText: {
    fontSize: 15,
    fontWeight: '500',
  },
  nextButton: {
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 14,
  },
  nextButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  startButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
  },
  startButtonText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '700',
  },
});
