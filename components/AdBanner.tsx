import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { usePremiumStore } from '../lib/premium';
import { useTheme } from '../lib/theme';
import { useRouter } from 'expo-router';

/**
 * 배너 광고 컴포넌트
 * - 무료 사용자: 광고 표시 (현재는 플레이스홀더, 실제 앱에서 AdMob으로 교체)
 * - 프리미엄 사용자: 표시 안 함
 */
export default function AdBanner() {
  const { isPremium } = usePremiumStore();
  const { colors } = useTheme();
  const router = useRouter();

  if (isPremium) return null;

  return (
    <TouchableOpacity
      style={[styles.container, { backgroundColor: colors.card, borderTopColor: colors.border }]}
      onPress={() => router.push('/premium')}
      activeOpacity={0.8}
    >
      <View style={styles.adPlaceholder}>
        <Text style={[styles.adLabel, { color: colors.textTertiary }]}>AD</Text>
        <Text style={[styles.adText, { color: colors.textSecondary }]}>
          프리미엄으로 업그레이드하면 광고가 사라집니다
        </Text>
      </View>
      <View style={[styles.upgradeButton, { backgroundColor: colors.primary }]}>
        <Text style={styles.upgradeText}>업그레이드</Text>
      </View>
    </TouchableOpacity>
  );
}

/**
 * 기능 잠금 오버레이
 * - 프리미엄 기능에 접근 시 표시
 */
export function PremiumGate({ feature, children }: { feature: string; children: React.ReactNode }) {
  const { isPremium } = usePremiumStore();
  const { colors } = useTheme();
  const router = useRouter();

  if (isPremium) return <>{children}</>;

  return (
    <View style={styles.gateContainer}>
      <View style={[styles.gateOverlay, { backgroundColor: colors.background }]}>
        <Text style={styles.lockIcon}>{'\uD83D\uDD12'}</Text>
        <Text style={[styles.gateTitle, { color: colors.text }]}>프리미엄 기능</Text>
        <Text style={[styles.gateDesc, { color: colors.textSecondary }]}>
          {feature} 기능은 프리미엄 구독이 필요합니다
        </Text>
        <TouchableOpacity
          style={[styles.gateButton, { backgroundColor: colors.primary }]}
          onPress={() => router.push('/premium')}
        >
          <Text style={styles.gateButtonText}>프리미엄 시작하기</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderTopWidth: 1,
    gap: 12,
  },
  adPlaceholder: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  adLabel: {
    fontSize: 10,
    fontWeight: '800',
    borderWidth: 1,
    borderColor: '#ccc',
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 3,
  },
  adText: {
    fontSize: 12,
    flex: 1,
  },
  upgradeButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  upgradeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  gateContainer: {
    flex: 1,
  },
  gateOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  lockIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  gateTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 8,
  },
  gateDesc: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  gateButton: {
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 14,
  },
  gateButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});
