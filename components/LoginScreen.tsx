import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Platform,
  Image,
} from 'react-native';
import { useAuthStore } from '../store/useAuthStore';

export default function LoginScreen() {
  const { signInWithGoogle, signInWithKakao, signInWithApple, isLoading } = useAuthStore();

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4A90D9" />
        <Text style={styles.loadingText}>로그인 중...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* 앱 로고 & 소개 */}
      <View style={styles.heroSection}>
        <View style={styles.logoBox}>
          <Text style={styles.logoEmoji}>🎓</Text>
        </View>
        <Text style={styles.appName}>어대갈까</Text>
        <Text style={styles.appTagline}>수능 점수로 알아보는 나의 합격 가능성</Text>
        <View style={styles.featureList}>
          <FeatureRow icon="✅" text="4,900+ 학과 커트라인 비교" />
          <FeatureRow icon="📊" text="합격 확률 & 3개년 추이 분석" />
          <FeatureRow icon="⭐" text="관심 대학 저장 & 클라우드 동기화" />
        </View>
      </View>

      {/* 로그인 버튼 */}
      <View style={styles.buttonSection}>
        <Text style={styles.loginTitle}>로그인하고 시작하기</Text>

        {/* Google */}
        <TouchableOpacity style={styles.googleButton} onPress={signInWithGoogle} activeOpacity={0.85}>
          <View style={styles.googleIconCircle}>
            <Text style={styles.googleG}>G</Text>
          </View>
          <Text style={styles.googleText}>Google로 계속하기</Text>
          <View style={styles.buttonArrow} />
        </TouchableOpacity>

        {/* 카카오 */}
        <TouchableOpacity style={styles.kakaoButton} onPress={signInWithKakao} activeOpacity={0.85}>
          <View style={styles.kakaoIconCircle}>
            <Text style={styles.kakaoK}>K</Text>
          </View>
          <Text style={styles.kakaoText}>카카오로 계속하기</Text>
          <View style={styles.buttonArrow} />
        </TouchableOpacity>

        {/* Apple (iOS만) */}
        {Platform.OS === 'ios' && (
          <TouchableOpacity style={styles.appleButton} onPress={signInWithApple} activeOpacity={0.85}>
            <Text style={styles.appleIcon}></Text>
            <Text style={styles.appleText}>Apple로 계속하기</Text>
            <View style={styles.buttonArrow} />
          </TouchableOpacity>
        )}

        <View style={styles.divider}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>또는</Text>
          <View style={styles.dividerLine} />
        </View>

        <Text style={styles.guestNote}>
          로그인 없이도 점수 입력 및 대학 검색이 가능합니다.{'\n'}
          단, 관심 대학 저장은 로그인이 필요합니다.
        </Text>
      </View>

      <Text style={styles.termsText}>
        로그인 시 서비스 이용약관 및 개인정보처리방침에 동의하게 됩니다
      </Text>
    </View>
  );
}

function FeatureRow({ icon, text }: { icon: string; text: string }) {
  return (
    <View style={styles.featureRow}>
      <Text style={styles.featureIcon}>{icon}</Text>
      <Text style={styles.featureText}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    color: '#888',
  },
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 32,
  },
  heroSection: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  logoBox: {
    width: 80,
    height: 80,
    borderRadius: 20,
    backgroundColor: '#4A90D9',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#4A90D9',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  logoEmoji: {
    fontSize: 36,
  },
  appName: {
    fontSize: 30,
    fontWeight: '800',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  appTagline: {
    fontSize: 15,
    color: '#666',
    marginBottom: 28,
  },
  featureList: {
    width: '100%',
    gap: 10,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
  },
  featureIcon: {
    fontSize: 18,
  },
  featureText: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  buttonSection: {
    gap: 12,
    marginTop: 32,
  },
  loginTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1a1a1a',
    textAlign: 'center',
    marginBottom: 4,
  },
  // Google
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  googleIconCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#E0E0E0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  googleG: {
    fontSize: 14,
    fontWeight: '700',
    color: '#4285F4',
  },
  googleText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
  },
  buttonArrow: {
    width: 6,
    height: 6,
    borderTopWidth: 1.5,
    borderRightWidth: 1.5,
    borderColor: '#ccc',
    transform: [{ rotate: '45deg' }],
  },
  // 카카오
  kakaoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEE500',
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 16,
    shadowColor: '#FEE500',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  kakaoIconCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#391B1B',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  kakaoK: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FEE500',
  },
  kakaoText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: '#391B1B',
  },
  // Apple
  appleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#000',
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  appleIcon: {
    fontSize: 20,
    color: '#fff',
    marginRight: 12,
    lineHeight: 24,
  },
  appleText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginVertical: 4,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E8E8E8',
  },
  dividerText: {
    fontSize: 13,
    color: '#bbb',
  },
  guestNote: {
    fontSize: 13,
    color: '#999',
    textAlign: 'center',
    lineHeight: 20,
  },
  termsText: {
    fontSize: 11,
    color: '#bbb',
    textAlign: 'center',
    lineHeight: 16,
    marginTop: 16,
  },
});
