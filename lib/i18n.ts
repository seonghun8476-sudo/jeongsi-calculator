import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform, NativeModules } from 'react-native';

export type Locale = 'ko' | 'en';

const translations: Record<Locale, Record<string, string>> = {
  ko: {
    // 탭
    'tab.score': '점수 입력',
    'tab.results': '결과',
    'tab.favorites': '관심 대학',
    'tab.profile': '프로필',

    // 헤더
    'header.calculator': '어대갈까',
    'header.results': '지원 가능 대학',
    'header.favorites': '관심 대학',
    'header.profile': '내 정보',
    'header.detail': '대학 상세',

    // 점수 입력
    'input.mode': '입력 방식',
    'input.rawScore': '원점수',
    'input.standardScore': '표준점수',
    'input.percentile': '백분위',
    'input.grade': '등급',
    'input.mathElective': '수학 선택과목',
    'input.explorationArea': '탐구 영역',
    'input.socialStudy': '사회탐구',
    'input.science': '과학탐구',
    'input.scoreInput': '점수 입력',
    'input.totalStandard': '환산 표준점수 합',

    // 버튼
    'btn.calculate': '지원 가능 대학 보기',
    'btn.reset': '초기화',
    'btn.share': '공유',
    'btn.compare': '비교',
    'btn.list': '목록',
    'btn.start': '시작하기',
    'btn.next': '다음',
    'btn.skip': '건너뛰기',
    'btn.logout': '로그아웃',

    // 결과
    'result.safe': '안정',
    'result.fit': '적정',
    'result.bold': '소신',
    'result.danger': '위험',
    'result.cutoff': '커트라인',
    'result.myScore': '내 점수',
    'result.gap': '차이',
    'result.competitionRate': '경쟁률',
    'result.all': '전체',
    'result.count': '개 결과',
    'result.empty': '아직 결과가 없습니다',
    'result.emptyHint': '점수 입력 탭에서 수능 점수를 입력하고\n\'지원 가능 대학 보기\'를 눌러주세요',
    'result.search': '대학 또는 학과 검색...',

    // 대학 상세
    'detail.cutoffYear': '학과별 커트라인',
    'detail.trend': '3개년 커트라인 추이',
    'detail.disclaimer': '참고 사항',

    // 관심 대학
    'fav.empty': '관심 대학이 없습니다',
    'fav.emptyHint': '결과 화면에서 별 아이콘을 눌러\n관심 대학을 추가해보세요',

    // 프로필
    'profile.dataSource': '데이터 소스',
    'profile.version': '버전',
    'profile.dataYear': '데이터 기준',
    'profile.appInfo': '앱 정보',

    // 로그인
    'login.title': '어대갈까',
    'login.subtitle': '로그인하면 관심 대학을 클라우드에 저장하고\n여러 기기에서 확인할 수 있어요',
    'login.google': 'Google로 시작하기',
    'login.naver': '네이버로 시작하기 (준비중)',
    'login.kakao': '카카오로 시작하기 (준비중)',
    'login.optional': '로그인 없이도 앱을 사용할 수 있어요',

    // 온보딩
    'onboarding.1.title': '수능 점수 입력',
    'onboarding.1.desc': '원점수, 표준점수, 백분위, 등급\n4가지 방식으로 입력할 수 있어요',
    'onboarding.2.title': '지원 가능 대학 확인',
    'onboarding.2.desc': '내 점수로 지원 가능한 대학과 학과를\n합격 확률과 함께 보여드려요',
    'onboarding.3.title': '3개년 추이 분석',
    'onboarding.3.desc': '최근 3년간 커트라인 변화를\n한눈에 확인할 수 있어요',
    'onboarding.4.title': '관심 대학 관리',
    'onboarding.4.desc': '관심 있는 대학을 저장하고\n로그인하면 여러 기기에서 동기화돼요',
  },
  en: {
    'tab.score': 'Score',
    'tab.results': 'Results',
    'tab.favorites': 'Favorites',
    'tab.profile': 'Profile',

    'header.calculator': 'Where2Uni',
    'header.results': 'Eligible Universities',
    'header.favorites': 'Favorites',
    'header.profile': 'My Info',
    'header.detail': 'University Detail',

    'input.mode': 'Input Mode',
    'input.rawScore': 'Raw Score',
    'input.standardScore': 'Standard Score',
    'input.percentile': 'Percentile',
    'input.grade': 'Grade',
    'input.mathElective': 'Math Elective',
    'input.explorationArea': 'Exploration Area',
    'input.socialStudy': 'Social Studies',
    'input.science': 'Science',
    'input.scoreInput': 'Score Input',
    'input.totalStandard': 'Total Standard Score',

    'btn.calculate': 'Find Universities',
    'btn.reset': 'Reset',
    'btn.share': 'Share',
    'btn.compare': 'Compare',
    'btn.list': 'List',
    'btn.start': 'Get Started',
    'btn.next': 'Next',
    'btn.skip': 'Skip',
    'btn.logout': 'Sign Out',

    'result.safe': 'Safe',
    'result.fit': 'Good Fit',
    'result.bold': 'Reach',
    'result.danger': 'Risky',
    'result.cutoff': 'Cutoff',
    'result.myScore': 'My Score',
    'result.gap': 'Gap',
    'result.competitionRate': 'Competition',
    'result.all': 'All',
    'result.count': ' results',
    'result.empty': 'No results yet',
    'result.emptyHint': 'Enter your CSAT scores in the Score tab\nand tap "Find Universities"',
    'result.search': 'Search university or major...',

    'detail.cutoffYear': 'Cutoff Scores by Department',
    'detail.trend': '3-Year Cutoff Trend',
    'detail.disclaimer': 'Disclaimer',

    'fav.empty': 'No favorites yet',
    'fav.emptyHint': 'Tap the star icon in Results\nto add favorites',

    'profile.dataSource': 'Data Source',
    'profile.version': 'Version',
    'profile.dataYear': 'Data Year',
    'profile.appInfo': 'App Info',

    'login.title': 'Where2Uni',
    'login.subtitle': 'Sign in to save favorites to cloud\nand sync across devices',
    'login.google': 'Continue with Google',
    'login.naver': 'Continue with Naver (Coming Soon)',
    'login.kakao': 'Continue with Kakao (Coming Soon)',
    'login.optional': 'You can use the app without signing in',

    'onboarding.1.title': 'Enter CSAT Scores',
    'onboarding.1.desc': 'Input via raw score, standard score,\npercentile, or grade level',
    'onboarding.2.title': 'Find Universities',
    'onboarding.2.desc': 'See eligible universities and majors\nwith admission probability',
    'onboarding.3.title': '3-Year Trend',
    'onboarding.3.desc': 'Track cutoff score changes\nover the past 3 years',
    'onboarding.4.title': 'Manage Favorites',
    'onboarding.4.desc': 'Save favorite universities and\nsync across devices when signed in',
  },
};

const LOCALE_KEY = '@jeongsi_locale';

interface I18nState {
  locale: Locale;
  t: (key: string) => string;
  setLocale: (locale: Locale) => void;
  loadLocale: () => Promise<void>;
}

function getDeviceLocale(): Locale {
  try {
    const deviceLocale =
      Platform.OS === 'ios'
        ? NativeModules.SettingsManager?.settings?.AppleLocale ||
          NativeModules.SettingsManager?.settings?.AppleLanguages?.[0]
        : NativeModules.I18nManager?.localeIdentifier;
    if (deviceLocale?.startsWith('en')) return 'en';
  } catch {}
  return 'ko';
}

export const useI18n = create<I18nState>((set, get) => ({
  locale: 'ko',

  t: (key: string) => {
    const { locale } = get();
    return translations[locale]?.[key] ?? translations['ko']?.[key] ?? key;
  },

  setLocale: (locale: Locale) => {
    set({ locale });
    AsyncStorage.setItem(LOCALE_KEY, locale).catch(console.warn);
  },

  loadLocale: async () => {
    try {
      const stored = await AsyncStorage.getItem(LOCALE_KEY);
      if (stored === 'ko' || stored === 'en') {
        set({ locale: stored });
      } else {
        set({ locale: getDeviceLocale() });
      }
    } catch {
      set({ locale: 'ko' });
    }
  },
}));
