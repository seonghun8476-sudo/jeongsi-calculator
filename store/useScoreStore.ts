import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { fetchCloudFavorites, addCloudFavorite, removeCloudFavorite } from '../lib/supabase';
import { supabase } from '../lib/supabase';
import {
  ScoreInputMode,
  MathElective,
  ExplorationArea,
  ExplorationSubject,
  SubjectScore,
  ResultItem,
  FilterOptions,
  SortOption,
} from '../types';
import { calculateTotalStandardScore, englishRawToGrade } from '../lib/scoreConverter';
import { getResults, filterResults, sortResults } from '../lib/calculator';
import { useDataStore } from './useDataStore';

const FAVORITES_KEY = '@jeongsi_favorites';

interface ScoreState {
  inputMode: ScoreInputMode;
  setInputMode: (mode: ScoreInputMode) => void;

  mathElective: MathElective;
  setMathElective: (elective: MathElective) => void;
  explorationArea: ExplorationArea;
  setExplorationArea: (area: ExplorationArea) => void;
  exploration1Subject: ExplorationSubject;
  setExploration1Subject: (subject: ExplorationSubject) => void;
  exploration2Subject: ExplorationSubject;
  setExploration2Subject: (subject: ExplorationSubject) => void;

  koreanScore: Partial<SubjectScore>;
  mathScore: Partial<SubjectScore>;
  englishScore: Partial<SubjectScore>;
  exploration1Score: Partial<SubjectScore>;
  exploration2Score: Partial<SubjectScore>;

  setKoreanScore: (score: Partial<SubjectScore>) => void;
  setMathScore: (score: Partial<SubjectScore>) => void;
  setEnglishScore: (score: Partial<SubjectScore>) => void;
  setExploration1Score: (score: Partial<SubjectScore>) => void;
  setExploration2Score: (score: Partial<SubjectScore>) => void;

  totalStandardScore: number;
  englishGrade: number;
  calculateTotal: () => void;

  results: ResultItem[];
  filteredResults: ResultItem[];
  calculateResults: () => void;

  filters: FilterOptions;
  sortOption: SortOption;
  setFilters: (filters: FilterOptions) => void;
  setSortOption: (option: SortOption) => void;
  applyFiltersAndSort: () => void;

  favorites: string[];
  toggleFavorite: (departmentId: string) => void;
  loadFavorites: () => Promise<void>;

  resetScores: () => void;
}

const initialFilters: FilterOptions = {
  regions: [],
  categories: [],
  universityTypes: [],
  admissionGroups: [],
};

export const useScoreStore = create<ScoreState>((set, get) => ({
  inputMode: '표준점수',
  setInputMode: (mode) => set({ inputMode: mode }),

  mathElective: '미적분',
  setMathElective: (elective) => set({ mathElective: elective }),
  explorationArea: '사회탐구',
  setExplorationArea: (area) => set({ explorationArea: area }),
  exploration1Subject: '생활과윤리',
  setExploration1Subject: (subject) => set({ exploration1Subject: subject }),
  exploration2Subject: '사회문화',
  setExploration2Subject: (subject) => set({ exploration2Subject: subject }),

  koreanScore: {},
  mathScore: {},
  englishScore: {},
  exploration1Score: {},
  exploration2Score: {},

  setKoreanScore: (score) => set({ koreanScore: score }),
  setMathScore: (score) => set({ mathScore: score }),
  setEnglishScore: (score) => set({ englishScore: score }),
  setExploration1Score: (score) => set({ exploration1Score: score }),
  setExploration2Score: (score) => set({ exploration2Score: score }),

  totalStandardScore: 0,
  englishGrade: 0,

  calculateTotal: () => {
    const state = get();
    const total = calculateTotalStandardScore({
      korean: state.koreanScore,
      math: state.mathScore,
      exploration1: state.exploration1Score,
      exploration2: state.exploration2Score,
    });

    let engGrade = 0;
    if (state.englishScore.grade) {
      engGrade = state.englishScore.grade;
    } else if (state.englishScore.rawScore) {
      engGrade = englishRawToGrade(state.englishScore.rawScore);
    }

    set({ totalStandardScore: total, englishGrade: engGrade });
  },

  results: [],
  filteredResults: [],

  calculateResults: () => {
    const state = get();
    state.calculateTotal();
    const updatedState = get();

    const dataState = useDataStore.getState();

    // 개별 과목 표준점수 추출
    const getStd = (score: any, subject: any) => {
      if (score?.standardScore) return score.standardScore;
      if (score?.rawScore) {
        const { rawToStandard } = require('../lib/scoreConverter');
        return rawToStandard(score.rawScore, subject);
      }
      if (score?.percentile) {
        const { percentileToStandard } = require('../lib/scoreConverter');
        return percentileToStandard(score.percentile, subject);
      }
      if (score?.grade) {
        const { gradeToStandard } = require('../lib/scoreConverter');
        return gradeToStandard(score.grade, subject);
      }
      return 0;
    };

    const subjectScores = {
      korean: getStd(updatedState.koreanScore, '국어'),
      math: getStd(updatedState.mathScore, '수학'),
      exploration1: getStd(updatedState.exploration1Score, '탐구1'),
      exploration2: getStd(updatedState.exploration2Score, '탐구2'),
    };

    // 커트라인이 단순 표준점수 합산 기준이므로 환산 없이 비교
    const results = getResults(
      updatedState.totalStandardScore,
      updatedState.englishGrade,
      dataState.universities,
      dataState.departments,
      dataState.cutoffScores
    );
    set({ results, filteredResults: sortResults(results, updatedState.sortOption) });
  },

  filters: initialFilters,
  sortOption: 'chance',
  setFilters: (filters) => {
    set({ filters });
    get().applyFiltersAndSort();
  },
  setSortOption: (option) => {
    set({ sortOption: option });
    get().applyFiltersAndSort();
  },
  applyFiltersAndSort: () => {
    const state = get();
    const filtered = filterResults(state.results, state.filters);
    const sorted = sortResults(filtered, state.sortOption);
    set({ filteredResults: sorted });
  },

  favorites: [],
  toggleFavorite: (departmentId) => {
    const state = get();
    const exists = state.favorites.includes(departmentId);
    const newFavorites = exists
      ? state.favorites.filter((id) => id !== departmentId)
      : [...state.favorites, departmentId];
    set({ favorites: newFavorites });
    // 로컬 저장
    AsyncStorage.setItem(FAVORITES_KEY, JSON.stringify(newFavorites)).catch(console.warn);
    // 클라우드 동기화 (로그인 시)
    if (exists) {
      removeCloudFavorite(departmentId).catch(console.warn);
    } else {
      addCloudFavorite(departmentId).catch(console.warn);
    }
  },
  loadFavorites: async () => {
    try {
      // 1. 로컬에서 먼저 로드
      const stored = await AsyncStorage.getItem(FAVORITES_KEY);
      if (stored) {
        set({ favorites: JSON.parse(stored) });
      }

      // 2. 로그인 상태면 클라우드에서 병합
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const cloudFavs = await fetchCloudFavorites();
        if (cloudFavs.length > 0) {
          const localFavs: string[] = stored ? JSON.parse(stored) : [];
          // 로컬 + 클라우드 병합 (중복 제거)
          const merged = [...new Set([...localFavs, ...cloudFavs])];
          set({ favorites: merged });
          AsyncStorage.setItem(FAVORITES_KEY, JSON.stringify(merged)).catch(console.warn);
        }
      }
    } catch (e) {
      console.warn('관심 대학 로드 실패:', e);
    }
  },

  resetScores: () =>
    set({
      koreanScore: {},
      mathScore: {},
      englishScore: {},
      exploration1Score: {},
      exploration2Score: {},
      totalStandardScore: 0,
      englishGrade: 0,
      results: [],
      filteredResults: [],
    }),
}));
