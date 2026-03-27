import {
  AdmissionChance,
  ResultItem,
  University,
  Department,
  CutoffScore,
  FilterOptions,
  SortOption,
  AdmissionWeight,
} from '../types';

/**
 * 표준점수 합 기준으로 합격 확률 계산
 */
export function calculateChance(
  myScore: number,
  cutoffScore: number
): { chance: AdmissionChance; percent: number } {
  const ratio = myScore / cutoffScore;

  if (ratio >= 1.05) {
    const percent = Math.min(99, 90 + (ratio - 1.05) * 200);
    return { chance: '안정', percent: Math.round(percent) };
  } else if (ratio >= 1.0) {
    const percent = 60 + (ratio - 1.0) * 600;
    return { chance: '적정', percent: Math.round(percent) };
  } else if (ratio >= 0.95) {
    const percent = 30 + (ratio - 0.95) * 600;
    return { chance: '소신', percent: Math.round(percent) };
  } else {
    const percent = Math.max(1, 30 * (ratio / 0.95));
    return { chance: '위험', percent: Math.round(percent) };
  }
}

/**
 * 대학별 반영비율을 적용한 환산 점수 계산
 */
export function calculateWeightedScore(
  scores: { korean: number; math: number; exploration1: number; exploration2: number; englishGrade: number },
  weight: AdmissionWeight
): number {
  const totalWeight = weight.koreanWeight + weight.mathWeight + weight.explorationWeight;
  if (totalWeight === 0) return scores.korean + scores.math + scores.exploration1 + scores.exploration2;

  const koreanWeighted = scores.korean * (weight.koreanWeight / 100);
  const mathWeighted = scores.math * (weight.mathWeight / 100);
  const expWeighted = (scores.exploration1 + scores.exploration2) * (weight.explorationWeight / 100);
  const engBonus = (weight.englishGradeBonus[scores.englishGrade] ?? 0) * (weight.englishWeight / 100);

  return Math.round((koreanWeighted + mathWeighted + expWeighted + engBonus) * (100 / totalWeight));
}

/**
 * 입력 점수 기반 지원 가능 대학/학과 목록 생성
 */
export function getResults(
  myTotalStandardScore: number,
  englishGrade: number,
  universities: University[],
  departments: Department[],
  cutoffScores: CutoffScore[],
  getWeight?: (uniId: string, category: string) => AdmissionWeight | undefined,
  subjectScores?: { korean: number; math: number; exploration1: number; exploration2: number }
): ResultItem[] {
  const results: ResultItem[] = [];

  // Map으로 lookup 최적화 (1,480+ 학과 처리 시 성능 개선)
  const uniMap = new Map(universities.map((u) => [u.id, u]));
  const cutoffByDept = new Map<string, CutoffScore>();
  for (const c of cutoffScores) {
    const existing = cutoffByDept.get(c.departmentId);
    if (!existing || c.year > existing.year) {
      cutoffByDept.set(c.departmentId, c);
    }
  }

  for (const dept of departments) {
    const uni = uniMap.get(dept.universityId);
    if (!uni) continue;

    const latestCutoff = cutoffByDept.get(dept.id);
    if (!latestCutoff) continue;

    // 반영비율이 있으면 환산 점수 계산, 없으면 단순 합산
    let myScore = myTotalStandardScore;
    if (getWeight && subjectScores) {
      const weight = getWeight(uni.id, dept.category);
      if (weight) {
        myScore = calculateWeightedScore(
          { ...subjectScores, englishGrade },
          weight
        );
      }
    }

    const { chance, percent } = calculateChance(myScore, latestCutoff.minStandardScore);

    results.push({
      university: uni,
      department: dept,
      cutoff: latestCutoff,
      chance,
      chancePercent: percent,
      myScore,
      gapFromCutoff: myScore - latestCutoff.minStandardScore,
    });
  }

  return results;
}

/**
 * 필터 적용
 */
export function filterResults(
  results: ResultItem[],
  filters: FilterOptions
): ResultItem[] {
  return results.filter((item) => {
    if (
      filters.regions.length > 0 &&
      !filters.regions.includes(item.university.region)
    ) {
      return false;
    }
    if (
      filters.categories.length > 0 &&
      !filters.categories.includes(item.department.category)
    ) {
      return false;
    }
    if (
      filters.universityTypes.length > 0 &&
      !filters.universityTypes.includes(item.university.type)
    ) {
      return false;
    }
    if (
      filters.admissionGroups.length > 0 &&
      (!item.department.admissionGroup || !filters.admissionGroups.includes(item.department.admissionGroup))
    ) {
      return false;
    }
    if (filters.chanceLevel && item.chance !== filters.chanceLevel) {
      return false;
    }
    return true;
  });
}

/**
 * 정렬 적용
 */
export function sortResults(
  results: ResultItem[],
  sortBy: SortOption
): ResultItem[] {
  const sorted = [...results];

  switch (sortBy) {
    case 'chance':
      sorted.sort((a, b) => b.chancePercent - a.chancePercent);
      break;
    case 'universityName':
      sorted.sort((a, b) =>
        a.university.name.localeCompare(b.university.name, 'ko')
      );
      break;
    case 'cutoffScore':
      sorted.sort(
        (a, b) => b.cutoff.minStandardScore - a.cutoff.minStandardScore
      );
      break;
    case 'competitionRate':
      sorted.sort(
        (a, b) => a.cutoff.competitionRate - b.cutoff.competitionRate
      );
      break;
  }

  return sorted;
}

/**
 * 특정 대학의 학과별 커트라인 목록
 */
export function getUniversityDepartments(
  universityId: string,
  myTotalStandardScore: number,
  universities: University[],
  departments: Department[],
  cutoffScores: CutoffScore[],
  getWeight?: (uniId: string, category: string) => AdmissionWeight | undefined,
  subjectScores?: { korean: number; math: number; exploration1: number; exploration2: number },
  englishGrade?: number
): ResultItem[] {
  const uni = universities.find((u) => u.id === universityId);
  if (!uni) return [];

  const depts = departments.filter((d) => d.universityId === universityId);
  const results: ResultItem[] = [];

  for (const dept of depts) {
    const latestCutoff = cutoffScores
      .filter((c) => c.departmentId === dept.id)
      .sort((a, b) => b.year - a.year)[0];

    if (!latestCutoff) continue;

    let myScore = myTotalStandardScore;
    if (getWeight && subjectScores && englishGrade !== undefined) {
      const weight = getWeight(uni.id, dept.category);
      if (weight) {
        myScore = calculateWeightedScore({ ...subjectScores, englishGrade }, weight);
      }
    }

    const { chance, percent } = calculateChance(myScore, latestCutoff.minStandardScore);

    results.push({
      university: uni, department: dept, cutoff: latestCutoff,
      chance, chancePercent: percent, myScore,
      gapFromCutoff: myScore - latestCutoff.minStandardScore,
    });
  }

  return results.sort((a, b) => b.cutoff.minStandardScore - a.cutoff.minStandardScore);
}
