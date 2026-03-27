/**
 * RevenueCat 결제 연동
 *
 * 설정 순서:
 * 1. https://app.revenuecat.com 에서 프로젝트 생성
 * 2. Apple App Store Connect에서 구독 상품 생성 (monthly, yearly)
 * 3. Google Play Console에서 구독 상품 생성
 * 4. RevenueCat에 App Store / Play Store 연결
 * 5. 아래 API_KEY를 RevenueCat 프로젝트의 Public API Key로 교체
 */

import { Platform } from 'react-native';
import Purchases, {
  PurchasesPackage,
  CustomerInfo,
  LOG_LEVEL,
} from 'react-native-purchases';
import { usePremiumStore } from './premium';

// RevenueCat API Keys
const REVENUECAT_IOS_KEY = 'test_PtdABIRMxzdUxZPyAPhnqSGfbsR';
const REVENUECAT_ANDROID_KEY = 'test_PtdABIRMxzdUxZPyAPhnqSGfbsR';

const PREMIUM_ENTITLEMENT = 'premium';

/**
 * RevenueCat 초기화
 * - 앱 시작 시 한 번 호출
 */
export async function initPurchases(userId?: string): Promise<void> {
  const apiKey = Platform.OS === 'ios' ? REVENUECAT_IOS_KEY : REVENUECAT_ANDROID_KEY;

  if (__DEV__) {
    Purchases.setLogLevel(LOG_LEVEL.DEBUG);
  }

  await Purchases.configure({
    apiKey,
    appUserID: userId ?? null,
  });
}

/**
 * 현재 사용 가능한 구독 상품 조회
 */
export async function getOfferings(): Promise<PurchasesPackage[]> {
  try {
    const offerings = await Purchases.getOfferings();
    if (offerings.current) {
      return offerings.current.availablePackages;
    }
    return [];
  } catch (e) {
    console.warn('오퍼링 조회 실패:', e);
    return [];
  }
}

/**
 * 구독 구매 실행
 */
export async function purchasePackage(pkg: PurchasesPackage): Promise<boolean> {
  try {
    const { customerInfo } = await Purchases.purchasePackage(pkg);
    return checkPremiumStatus(customerInfo);
  } catch (e: any) {
    if (e.userCancelled) {
      return false;
    }
    throw e;
  }
}

/**
 * 구독 복원 (기기 변경 시)
 */
export async function restorePurchases(): Promise<boolean> {
  try {
    const customerInfo = await Purchases.restorePurchases();
    return checkPremiumStatus(customerInfo);
  } catch (e) {
    console.warn('구매 복원 실패:', e);
    return false;
  }
}

/**
 * 프리미엄 상태 확인 및 스토어 업데이트
 */
export function checkPremiumStatus(customerInfo: CustomerInfo): boolean {
  const isPremium = customerInfo.entitlements.active[PREMIUM_ENTITLEMENT] !== undefined;

  if (isPremium) {
    const entitlement = customerInfo.entitlements.active[PREMIUM_ENTITLEMENT];
    const expiresAt = entitlement.expirationDate ?? new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString();
    usePremiumStore.getState().setPremium(expiresAt);
  } else {
    usePremiumStore.getState().setFree();
  }

  return isPremium;
}

/**
 * 현재 고객 정보 조회 및 프리미엄 상태 동기화
 */
export async function syncPremiumStatus(): Promise<boolean> {
  try {
    const customerInfo = await Purchases.getCustomerInfo();
    return checkPremiumStatus(customerInfo);
  } catch (e) {
    console.warn('프리미엄 상태 동기화 실패:', e);
    return false;
  }
}

/**
 * RevenueCat에 사용자 ID 연결 (로그인 시)
 */
export async function loginRevenueCat(userId: string): Promise<void> {
  try {
    await Purchases.logIn(userId);
    await syncPremiumStatus();
  } catch (e) {
    console.warn('RevenueCat 로그인 실패:', e);
  }
}

/**
 * RevenueCat 로그아웃
 */
export async function logoutRevenueCat(): Promise<void> {
  try {
    await Purchases.logOut();
    usePremiumStore.getState().setFree();
  } catch (e) {
    console.warn('RevenueCat 로그아웃 실패:', e);
  }
}

/**
 * RevenueCat UI Paywall 표시
 * react-native-purchases-ui의 빌트인 Paywall 사용
 */
export { default as RevenueCatUI } from 'react-native-purchases-ui';
