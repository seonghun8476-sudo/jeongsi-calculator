import { create } from 'zustand';
import { University, Department, CutoffScore, ScoreConversionRow, AdmissionWeight } from '../types';
import { fetchAllData, DBUniversity, DBDepartment, DBCutoffScore, DBScoreConversion, DBAdmissionWeight } from '../lib/supabase';
import {
  universities as localUniversities,
  departments as localDepartments,
  cutoffScores as localCutoffs,
  allConversions as localConversions,
} from '../data/sampleData';

interface DataState {
  universities: University[];
  departments: Department[];
  cutoffScores: CutoffScore[];
  conversions: ScoreConversionRow[];
  weights: AdmissionWeight[];

  isLoading: boolean;
  error: string | null;
  dataSource: 'local' | 'supabase';

  loadData: () => Promise<void>;
  getWeight: (universityId: string, category: string) => AdmissionWeight | undefined;
}

function mapUniversity(db: DBUniversity): University {
  return { id: db.id, name: db.name, region: db.region, type: db.type, logoUrl: db.logo_url ?? undefined };
}

function mapDepartment(db: DBDepartment, uniName: string): Department {
  return {
    id: db.id, universityId: db.university_id, universityName: uniName,
    name: db.name, category: db.category,
    admissionGroup: db.admission_group ?? undefined,
  };
}

function mapCutoff(db: DBCutoffScore): CutoffScore {
  return {
    id: db.id, departmentId: db.department_id, year: db.year, admissionType: '정시',
    minStandardScore: Number(db.min_standard_score), minPercentile: Number(db.min_percentile),
    competitionRate: Number(db.competition_rate), avgStandardScore: db.avg_standard_score ? Number(db.avg_standard_score) : undefined,
  };
}

function mapConversion(db: DBScoreConversion): ScoreConversionRow {
  return { year: db.year, subject: db.subject, rawScore: db.raw_score, standardScore: db.standard_score, percentile: Number(db.percentile), grade: db.grade };
}

function mapWeight(db: DBAdmissionWeight): AdmissionWeight {
  const defaultBonus: Record<number, number> = { 1: 100, 2: 96, 3: 90, 4: 80, 5: 60, 6: 40, 7: 20, 8: 10, 9: 0 };
  let bonus = defaultBonus;
  if (db.english_grade_bonus) {
    bonus = {};
    for (const [k, v] of Object.entries(db.english_grade_bonus)) {
      bonus[Number(k)] = Number(v);
    }
  }
  return {
    universityId: db.university_id,
    category: db.category,
    koreanWeight: Number(db.korean_weight),
    mathWeight: Number(db.math_weight),
    englishWeight: Number(db.english_weight),
    explorationWeight: Number(db.exploration_weight),
    englishGradeBonus: bonus,
  };
}

// 기본 반영비율 (균등)
const defaultWeight: AdmissionWeight = {
  universityId: '', category: '',
  koreanWeight: 33.3, mathWeight: 33.3, englishWeight: 0, explorationWeight: 33.4,
  englishGradeBonus: { 1: 100, 2: 96, 3: 90, 4: 80, 5: 60, 6: 40, 7: 20, 8: 10, 9: 0 },
};

export const useDataStore = create<DataState>((set, get) => ({
  universities: localUniversities,
  departments: localDepartments,
  cutoffScores: localCutoffs,
  conversions: localConversions,
  weights: [],
  isLoading: false,
  error: null,
  dataSource: 'local',

  loadData: async () => {
    set({ isLoading: true, error: null });
    try {
      const data = await fetchAllData();
      const universities = data.universities.map(mapUniversity);
      const uniNameMap = new Map(universities.map((u) => [u.id, u.name]));
      const departments = (data.departments as DBDepartment[]).map((d) => mapDepartment(d, uniNameMap.get(d.university_id) ?? ''));
      const cutoffScores = data.cutoffs.map(mapCutoff);
      const conversions = data.conversions.map(mapConversion);
      const weights = data.weights.map(mapWeight);

      set({ universities, departments, cutoffScores, conversions, weights, isLoading: false, dataSource: 'supabase' });
    } catch (err: any) {
      console.warn('Supabase 로드 실패, 로컬 데이터 사용:', err.message);
      set({
        universities: localUniversities, departments: localDepartments,
        cutoffScores: localCutoffs, conversions: localConversions, weights: [],
        isLoading: false, error: err.message, dataSource: 'local',
      });
    }
  },

  getWeight: (universityId, category) => {
    const w = get().weights.find((w) => w.universityId === universityId && w.category === category);
    return w ?? defaultWeight;
  },
}));
