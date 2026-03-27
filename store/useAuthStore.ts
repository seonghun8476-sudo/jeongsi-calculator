import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import { makeRedirectUri } from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import * as AppleAuthentication from 'expo-apple-authentication';
import { Platform } from 'react-native';

// 웹 브라우저 세션 자동 종료 설정
WebBrowser.maybeCompleteAuthSession();

export interface UserProfile {
  id: string;
  email: string | null;
  name: string | null;
  avatarUrl: string | null;
  provider: string | null;
}

interface AuthState {
  user: UserProfile | null;
  isLoading: boolean;
  isAuthenticated: boolean;

  // 초기화 (세션 복원)
  initialize: () => Promise<void>;

  // 소셜 로그인
  signInWithGoogle: () => Promise<void>;
  signInWithKakao: () => Promise<void>;
  signInWithApple: () => Promise<void>;

  // 로그아웃
  signOut: () => Promise<void>;
}

function extractProfile(session: any): UserProfile | null {
  const user = session?.user;
  if (!user) return null;

  const meta = user.user_metadata ?? {};
  return {
    id: user.id,
    email: user.email ?? meta.email ?? null,
    name: meta.full_name ?? meta.name ?? meta.preferred_username ?? null,
    avatarUrl: meta.avatar_url ?? meta.picture ?? null,
    provider: user.app_metadata?.provider ?? null,
  };
}

const redirectUri = makeRedirectUri({ preferLocalhost: Platform.OS === 'web' });

async function signInWithOAuth(provider: 'google' | 'kakao' | 'naver') {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: provider === 'naver' ? 'naver' as any :
              provider === 'kakao' ? 'kakao' as any : 'google',
    options: {
      redirectTo: redirectUri,
      skipBrowserRedirect: true,
    },
  });

  if (error) throw error;
  if (!data.url) throw new Error('OAuth URL을 받지 못했습니다');

  // 브라우저에서 OAuth 진행
  const result = await WebBrowser.openAuthSessionAsync(data.url, redirectUri);

  if (result.type === 'success' && result.url) {
    // URL에서 토큰 추출
    const url = new URL(result.url);
    const params = new URLSearchParams(url.hash.substring(1) || url.search.substring(1));
    const accessToken = params.get('access_token');
    const refreshToken = params.get('refresh_token');

    if (accessToken) {
      await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken ?? '',
      });
    }
  }
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoading: true,
  isAuthenticated: false,

  initialize: async () => {
    set({ isLoading: true });
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const profile = extractProfile(session);
      set({
        user: profile,
        isAuthenticated: !!profile,
        isLoading: false,
      });

      // 세션 변경 리스너
      supabase.auth.onAuthStateChange((_event, session) => {
        const profile = extractProfile(session);
        set({
          user: profile,
          isAuthenticated: !!profile,
        });
      });
    } catch {
      set({ isLoading: false });
    }
  },

  signInWithGoogle: async () => {
    set({ isLoading: true });
    try {
      await signInWithOAuth('google');
    } catch (e: any) {
      console.warn('Google 로그인 실패:', e.message);
    } finally {
      set({ isLoading: false });
    }
  },

  signInWithKakao: async () => {
    set({ isLoading: true });
    try {
      await signInWithOAuth('kakao');
    } catch (e: any) {
      console.warn('카카오 로그인 실패:', e.message);
    } finally {
      set({ isLoading: false });
    }
  },

  signInWithApple: async () => {
    if (Platform.OS !== 'ios') return;
    set({ isLoading: true });
    try {
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });
      if (credential.identityToken) {
        const { error } = await supabase.auth.signInWithIdToken({
          provider: 'apple',
          token: credential.identityToken,
        });
        if (error) throw error;
      }
    } catch (e: any) {
      if (e.code !== 'ERR_REQUEST_CANCELED') {
        console.warn('Apple 로그인 실패:', e.message);
      }
    } finally {
      set({ isLoading: false });
    }
  },

  signOut: async () => {
    await supabase.auth.signOut();
    set({ user: null, isAuthenticated: false });
  },
}));
