import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '../lib/theme';
import { plans, usePremiumStore } from '../lib/premium';
import { getOfferings, purchasePackage, restorePurchases } from '../lib/purchases';
import type { PurchasesPackage } from 'react-native-purchases';

export default function PremiumScreen() {
  const router = useRouter();
  const [packages, setPackages] = useState<PurchasesPackage[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    getOfferings().then(setPackages).catch(console.warn);
  }, []);
  const { colors } = useTheme();
  const { isPremium, expiresAt } = usePremiumStore();

  const handlePurchase = async (planId: string) => {
    // RevenueCat 패키지가 있으면 실제 결제
    const pkg = packages.find(p =>
      planId === 'yearly' ? p.packageType === 'ANNUAL' : p.packageType === 'MONTHLY'
    );

    if (pkg) {
      setLoading(true);
      try {
        const success = await purchasePackage(pkg);
        if (success) {
          Alert.alert('완료', '프리미엄이 활성화되었습니다!');
          router.back();
        }
      } catch (e: any) {
        Alert.alert('구매 실패', e.message);
      } finally {
        setLoading(false);
      }
      return;
    }

    // RevenueCat 패키지를 불러오지 못한 경우
    Alert.alert(
      '구독 불가',
      '현재 구독 상품을 불러올 수 없습니다.\n잠시 후 다시 시도해주세요.',
      [{ text: '확인' }]
    );
  };

  const handleRestore = async () => {
    setLoading(true);
    try {
      const success = await restorePurchases();
      Alert.alert(success ? '복원 완료' : '복원 실패', success ? '프리미엄이 복원되었습니다.' : '활성 구독을 찾을 수 없습니다.');
    } catch {
      Alert.alert('오류', '구매 복원에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  if (isPremium) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.activeCard, { backgroundColor: colors.card }]}>
          <Text style={styles.activeIcon}>{'\u2728'}</Text>
          <Text style={[styles.activeTitle, { color: colors.text }]}>프리미엄 활성화됨</Text>
          <Text style={[styles.activeExpiry, { color: colors.textSecondary }]}>
            만료일: {expiresAt ? new Date(expiresAt).toLocaleDateString('ko-KR') : '-'}
          </Text>
          <Text style={[styles.activeDesc, { color: colors.textTertiary }]}>
            모든 프리미엄 기능을 이용할 수 있습니다
          </Text>
        </View>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={[styles.backButtonText, { color: colors.primary }]}>돌아가기</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* 헤더 */}
      <View style={styles.header}>
        <Text style={styles.headerIcon}>{'\uD83D\uDE80'}</Text>
        <Text style={[styles.headerTitle, { color: colors.text }]}>프리미엄으로 업그레이드</Text>
        <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
          더 정확한 분석, 더 많은 기능으로{'\n'}합격 가능성을 높이세요
        </Text>
      </View>

      {/* 무료 vs 프리미엄 비교 */}
      <View style={[styles.compareSection, { backgroundColor: colors.card }]}>
        <View style={styles.compareHeader}>
          <Text style={[styles.compareHeaderText, { color: colors.textTertiary, flex: 2 }]}>기능</Text>
          <Text style={[styles.compareHeaderText, { color: colors.textTertiary, flex: 1, textAlign: 'center' }]}>무료</Text>
          <Text style={[styles.compareHeaderText, { color: colors.primary, flex: 1, textAlign: 'center', fontWeight: '700' }]}>프리미엄</Text>
        </View>
        {[
          { feature: '결과 조회', free: '10개', premium: '무제한' },
          { feature: '광고', free: '있음', premium: '없음' },
          { feature: '3개년 추이', free: '\u2715', premium: '\u2713' },
          { feature: '대학 비교', free: '\u2715', premium: '\u2713' },
          { feature: '반영비율 환산', free: '\u2715', premium: '\u2713' },
          { feature: '클라우드 동기화', free: '\u2715', premium: '\u2713' },
          { feature: '입시 알림', free: '\u2715', premium: '\u2713' },
        ].map((row, i) => (
          <View key={i} style={[styles.compareRow, { borderBottomColor: colors.border }]}>
            <Text style={[styles.featureText, { color: colors.text, flex: 2 }]}>{row.feature}</Text>
            <Text style={[styles.freeText, { flex: 1, textAlign: 'center' }]}>{row.free}</Text>
            <Text style={[styles.premiumText, { color: colors.primary, flex: 1, textAlign: 'center' }]}>{row.premium}</Text>
          </View>
        ))}
      </View>

      {/* 플랜 카드 */}
      {plans.map((plan) => (
        <TouchableOpacity
          key={plan.id}
          style={[styles.planCard, {
            backgroundColor: colors.card,
            borderColor: plan.id === 'yearly' ? colors.primary : colors.border,
            borderWidth: plan.id === 'yearly' ? 2 : 1,
          }]}
          onPress={() => handlePurchase(plan.id)}
        >
          {plan.id === 'yearly' && (
            <View style={[styles.bestBadge, { backgroundColor: colors.primary }]}>
              <Text style={styles.bestBadgeText}>BEST</Text>
            </View>
          )}
          <Text style={[styles.planName, { color: colors.text }]}>{plan.name}</Text>
          <View style={styles.priceRow}>
            <Text style={[styles.planPrice, { color: colors.primary }]}>{plan.price}</Text>
            <Text style={[styles.planPeriod, { color: colors.textTertiary }]}>{plan.period}</Text>
          </View>
          {plan.id === 'yearly' && (
            <Text style={[styles.savingText, { color: colors.positive }]}>월 3,250원 (33% 할인)</Text>
          )}
        </TouchableOpacity>
      ))}

      {/* 안내 */}
      <Text style={[styles.disclaimer, { color: colors.textTertiary }]}>
        {'\u2022'} 구독은 앱스토어/플레이스토어를 통해 결제됩니다{'\n'}
        {'\u2022'} 구독 기간 종료 24시간 전 자동 갱신됩니다{'\n'}
        {'\u2022'} 설정에서 언제든 구독을 취소할 수 있습니다{'\n'}
        {'\u2022'} 7일 무료 체험 후 요금이 부과됩니다
      </Text>

      {loading && <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 16 }} />}

      <TouchableOpacity onPress={handleRestore}>
        <Text style={[styles.restoreText, { color: colors.primary }]}>이전 구매 복원</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => router.back()}>
        <Text style={[styles.skipText, { color: colors.textTertiary }]}>나중에 할게요</Text>
      </TouchableOpacity>

      <View style={{ height: 50 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 24,
  },
  headerIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '800',
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
  },
  compareSection: {
    marginHorizontal: 16,
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
  },
  compareHeader: {
    flexDirection: 'row',
    paddingBottom: 10,
    marginBottom: 4,
  },
  compareHeaderText: {
    fontSize: 13,
    fontWeight: '600',
  },
  compareRow: {
    flexDirection: 'row',
    paddingVertical: 10,
    borderBottomWidth: 1,
    alignItems: 'center',
  },
  featureText: {
    fontSize: 14,
  },
  freeText: {
    fontSize: 13,
    color: '#999',
  },
  premiumText: {
    fontSize: 13,
    fontWeight: '700',
  },
  planCard: {
    marginHorizontal: 16,
    borderRadius: 16,
    padding: 20,
    marginBottom: 12,
    position: 'relative',
  },
  bestBadge: {
    position: 'absolute',
    top: -10,
    right: 16,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  bestBadgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '800',
  },
  planName: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  planPrice: {
    fontSize: 28,
    fontWeight: '800',
  },
  planPeriod: {
    fontSize: 14,
  },
  savingText: {
    fontSize: 13,
    fontWeight: '600',
    marginTop: 4,
  },
  disclaimer: {
    fontSize: 12,
    lineHeight: 20,
    paddingHorizontal: 20,
    marginTop: 8,
  },
  restoreText: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: 20,
    fontWeight: '600',
  },
  skipText: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: 12,
  },
  activeCard: {
    margin: 16,
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
  },
  activeIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  activeTitle: {
    fontSize: 22,
    fontWeight: '800',
    marginBottom: 8,
  },
  activeExpiry: {
    fontSize: 14,
    marginBottom: 4,
  },
  activeDesc: {
    fontSize: 13,
  },
  backButton: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  backButtonText: {
    fontSize: 15,
    fontWeight: '600',
  },
});
