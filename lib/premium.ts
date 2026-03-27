/**
 * 프리미엄 플랜 및 수익화 구조
 *
 * 무료 (Free):
 * - 기본 점수 입력 & 결과 조회
 * - 상위 10개 대학만 표시
 * - 배너 광고 노출
 * - 기본 검색
 *
 * 프리미엄 (Premium) - 월 4,900원 / 연 39,000원:
 * - 전체 대학 결과 무제한
 * - 광고 제거
 * - 3개년 추이 분석
 * - 대학 비교 기능
 * - 반영비율 적용 환산 점수
 * - 클라우드 동기화
 * - 입시 일정 알림
 * - 우선 데이터 업데이트
 */

import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from './supabase';

export type PlanType = 'free' | 'premium';

export interface PremiumPlan {
  id: string;
  name: string;
  price: string;
  period: string;
  features: string[];
}

export const plans: PremiumPlan[] = [
  {
    id: 'monthly',
    name: '월간 구독',
    price: '4,900원',
    period: '/월',
    features: [
      '전체 대학 결과 무제한',
      '광고 제거',
      '3개년 추이 분석',
      '대학 비교 기능',
      '반영비율 환산 점수',
      '클라우드 동기화',
      '입시 일정 알림',
    ],
  },
  {
    id: 'yearly',
    name: '연간 구독',
    price: '39,000원',
    period: '/년',
    features: [
      '월간 대비 33% 할인',
      '모든 프리미엄 기능 포함',
      '우선 데이터 업데이트',
    ],
  },
];

// 무료 사용자 제한
export const FREE_LIMITS = {
  maxResults: 10,          // 결과 최대 표시 수
  showTrend: false,        // 3개년 추이
  showCompare: false,      // 비교 기능
  showWeightedScore: false,// 반영비율 환산
  cloudSync: false,        // 클라우드 동기화
  showAds: true,           // 광고 표시
};

export const PREMIUM_LIMITS = {
  maxResults: Infinity,
  showTrend: true,
  showCompare: true,
  showWeightedScore: true,
  cloudSync: true,
  showAds: false,
};

const PREMIUM_KEY = '@jeongsi_premium';

interface PremiumState {
  plan: PlanType;
  isPremium: boolean;
  limits: typeof FREE_LIMITS;
  expiresAt: string | null;

  loadPlan: () => Promise<void>;
  setPremium: (expiresAt: string) => Promise<void>;
  setFree: () => Promise<void>;
  checkExpiry: () => void;
}

export const usePremiumStore = create<PremiumState>((set, get) => ({
  plan: 'free',
  isPremium: false,
  limits: FREE_LIMITS,
  expiresAt: null,

  loadPlan: async () => {
    try {
      const stored = await AsyncStorage.getItem(PREMIUM_KEY);
      if (stored) {
        const data = JSON.parse(stored);
        const now = new Date();
        const expiry = new Date(data.expiresAt);

        if (expiry > now) {
          set({
            plan: 'premium',
            isPremium: true,
            limits: PREMIUM_LIMITS,
            expiresAt: data.expiresAt,
          });
          return;
        }
      }

      // 로그인 사용자의 경우 Supabase에서 확인
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase
          .from('user_subscriptions')
          .select('*')
          .eq('user_id', user.id)
          .eq('status', 'active')
          .single();

        if (data) {
          const expiresAt = data.expires_at;
          set({
            plan: 'premium',
            isPremium: true,
            limits: PREMIUM_LIMITS,
            expiresAt,
          });
          await AsyncStorage.setItem(PREMIUM_KEY, JSON.stringify({ expiresAt }));
          return;
        }
      }

      set({ plan: 'free', isPremium: false, limits: FREE_LIMITS, expiresAt: null });
    } catch {
      set({ plan: 'free', isPremium: false, limits: FREE_LIMITS, expiresAt: null });
    }
  },

  setPremium: async (expiresAt) => {
    set({
      plan: 'premium',
      isPremium: true,
      limits: PREMIUM_LIMITS,
      expiresAt,
    });
    await AsyncStorage.setItem(PREMIUM_KEY, JSON.stringify({ expiresAt }));
  },

  setFree: async () => {
    set({ plan: 'free', isPremium: false, limits: FREE_LIMITS, expiresAt: null });
    await AsyncStorage.removeItem(PREMIUM_KEY);
  },

  checkExpiry: () => {
    const { expiresAt } = get();
    if (expiresAt && new Date(expiresAt) < new Date()) {
      get().setFree();
    }
  },
}));
