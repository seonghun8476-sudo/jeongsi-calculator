import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  Alert,
} from 'react-native';
import { useAuthStore } from '../../store/useAuthStore';
import LoginScreen from '../../components/LoginScreen';
import { useDataStore } from '../../store/useDataStore';
import { useI18n, Locale } from '../../lib/i18n';

export default function ProfileScreen() {
  const { user, isAuthenticated, signOut } = useAuthStore();
  const dataSource = useDataStore((s) => s.dataSource);
  const { locale, setLocale } = useI18n();

  if (!isAuthenticated) {
    return <LoginScreen />;
  }

  const handleSignOut = () => {
    Alert.alert(
      '로그아웃',
      '정말 로그아웃하시겠습니까?',
      [
        { text: '취소', style: 'cancel' },
        { text: '로그아웃', style: 'destructive', onPress: signOut },
      ]
    );
  };

  return (
    <View style={styles.container}>
      {/* 프로필 카드 */}
      <View style={styles.profileCard}>
        {user?.avatarUrl ? (
          <Image source={{ uri: user.avatarUrl }} style={styles.avatar} />
        ) : (
          <View style={styles.avatarPlaceholder}>
            <Text style={styles.avatarText}>
              {user?.name?.charAt(0) ?? '?'}
            </Text>
          </View>
        )}
        <Text style={styles.userName}>{user?.name ?? '사용자'}</Text>
        <Text style={styles.userEmail}>{user?.email ?? ''}</Text>
        <View style={styles.providerBadge}>
          <Text style={styles.providerText}>
            {user?.provider === 'google' ? 'Google' :
             user?.provider === 'kakao' ? '카카오' :
             user?.provider === 'naver' ? '네이버' : user?.provider} 계정
          </Text>
        </View>
      </View>

      {/* 앱 정보 */}
      <View style={styles.infoSection}>
        <Text style={styles.infoTitle}>앱 정보</Text>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>데이터 소스</Text>
          <Text style={styles.infoValue}>
            {dataSource === 'supabase' ? 'Supabase (온라인)' : '로컬 데이터'}
          </Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>버전</Text>
          <Text style={styles.infoValue}>1.0.0</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>데이터 기준</Text>
          <Text style={styles.infoValue}>2025학년도 정시</Text>
        </View>
      </View>

      {/* 언어 설정 */}
      <View style={styles.infoSection}>
        <Text style={styles.infoTitle}>언어 / Language</Text>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          {(['ko', 'en'] as Locale[]).map((l) => (
            <TouchableOpacity
              key={l}
              style={[styles.langButton, locale === l && styles.langButtonActive]}
              onPress={() => setLocale(l)}
            >
              <Text style={[styles.langText, locale === l && styles.langTextActive]}>
                {l === 'ko' ? '한국어' : 'English'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* 로그아웃 */}
      <TouchableOpacity style={styles.logoutButton} onPress={handleSignOut}>
        <Text style={styles.logoutText}>로그아웃</Text>
      </TouchableOpacity>

      <Text style={styles.disclaimer}>
        커트라인 데이터는 참고용이며{'\n'}실제 합격선과 다를 수 있습니다
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
    paddingHorizontal: 16,
    paddingTop: 20,
  },
  profileCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    marginBottom: 16,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    marginBottom: 12,
  },
  avatarPlaceholder: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#4A90D9',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatarText: {
    fontSize: 28,
    fontWeight: '700',
    color: '#fff',
  },
  userName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  userEmail: {
    fontSize: 14,
    color: '#888',
    marginTop: 4,
  },
  providerBadge: {
    marginTop: 8,
    backgroundColor: '#F0F0F0',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  providerText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  infoSection: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  infoTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#333',
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  infoLabel: {
    fontSize: 14,
    color: '#666',
  },
  infoValue: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  langButton: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F0F0F0',
  },
  langButtonActive: {
    backgroundColor: '#4A90D9',
  },
  langText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  langTextActive: {
    color: '#fff',
  },
  logoutButton: {
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  logoutText: {
    fontSize: 15,
    color: '#C62828',
    fontWeight: '600',
  },
  disclaimer: {
    textAlign: 'center',
    fontSize: 12,
    color: '#bbb',
    marginTop: 24,
    lineHeight: 18,
  },
});
