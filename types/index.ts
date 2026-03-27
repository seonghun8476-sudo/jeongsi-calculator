// 수능 과목
export type Subject = '국어' | '수학' | '영어' | '탐구1' | '탐구2';

// 수학 선택과목
export type MathElective = '확률과통계' | '미적분' | '기하';

// 탐구 영역
export type ExplorationArea = '사회탐구' | '과학탐구';

// 탐구 과목
export type SocialStudySubject =
  | '생활과윤리' | '윤리와사상' | '한국지리' | '세계지리'
  | '동아시아사' | '세계사' | '경제' | '정치와법' | '사회문화';

export type ScienceSubject =
  | '물리학Ⅰ' | '화학Ⅰ' | '생명과학Ⅰ' | '지구과학Ⅰ'
  | '물리학Ⅱ' | '화학Ⅱ' | '생명과학Ⅱ' | '지구과학Ⅱ';

export type ExplorationSubject = SocialStudySubject | ScienceSubject;

// 점수 입력 모드
export type ScoreInputMode = '원점수' | '표준점수' | '백분위' | '등급';

// 과목별 점수
export interface SubjectScore {
  subject: Subject;
  subjectName?: string; // 탐구과목의 경우 실제 과목명
  rawScore?: number;       // 원점수
  standardScore?: number;  // 표준점수
  percentile?: number;     // 백분위
  grade?: number;          // 등급 (1~9)
}

// 전체 수능 점수
export interface CSATScores {
  year: number;
  mathElective: MathElective;
  explorationArea: ExplorationArea;
  exploration1Subject: ExplorationSubject;
  exploration2Subject: ExplorationSubject;
  scores: SubjectScore[];
}

// 대학 정보
export interface University {
  id: string;
  name: string;
  region: string;
  type: '국립' | '사립';
  logoUrl?: string;
  admissionUrl?: string;
}

// 정시 모집군
export type AdmissionGroup = '가' | '나' | '다';

// 학과 정보
export interface Department {
  id: string;
  universityId: string;
  universityName: string;
  name: string;
  category: '인문' | '자연' | '예체능' | '의약';
  admissionGroup?: AdmissionGroup;
}

// 커트라인 데이터
export interface CutoffScore {
  id: string;
  departmentId: string;
  year: number;
  admissionType: '정시';
  minStandardScore: number;   // 최저 표준점수 합
  minPercentile: number;      // 최저 백분위 합
  competitionRate: number;    // 경쟁률
  avgStandardScore?: number;  // 합격자 평균 표준점수
}

// 합격 확률 등급
export type AdmissionChance = '안정' | '적정' | '소신' | '위험';

// 결과 항목
export interface ResultItem {
  university: University;
  department: Department;
  cutoff: CutoffScore;
  chance: AdmissionChance;
  chancePercent: number;      // 합격 확률 (%)
  myScore: number;            // 내 환산 점수
  gapFromCutoff: number;      // 커트라인 대비 차이
}

// 점수 변환 테이블 행
export interface ScoreConversionRow {
  year: number;
  subject: string;
  rawScore: number;
  standardScore: number;
  percentile: number;
  grade: number;
}

// 필터 옵션
export interface FilterOptions {
  regions: string[];
  categories: string[];
  universityTypes: string[];
  admissionGroups: AdmissionGroup[];
  chanceLevel?: AdmissionChance;
}

// 정렬 옵션
export type SortOption = 'chance' | 'universityName' | 'cutoffScore' | 'competitionRate';

// 대학별 반영비율
export interface AdmissionWeight {
  universityId: string;
  category: string;
  koreanWeight: number;
  mathWeight: number;
  englishWeight: number;
  explorationWeight: number;
  englishGradeBonus: Record<number, number>;
}
