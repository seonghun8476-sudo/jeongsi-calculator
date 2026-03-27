import { ScoreConversionRow, Subject } from '../types';
import {
  koreanConversion,
  mathConversion,
  explorationConversion,
  englishGradeTable,
} from '../data/sampleData';

/**
 * 과목에 맞는 변환 테이블 반환
 */
function getConversionTable(subject: Subject): ScoreConversionRow[] {
  switch (subject) {
    case '국어':
      return koreanConversion;
    case '수학':
      return mathConversion;
    case '탐구1':
    case '탐구2':
      return explorationConversion;
    default:
      return [];
  }
}

/**
 * 두 변환 행 사이에서 선형 보간
 */
function interpolate(
  value: number,
  fromKey: keyof ScoreConversionRow,
  toKey: keyof ScoreConversionRow,
  table: ScoreConversionRow[]
): number {
  // 테이블은 rawScore 내림차순 정렬되어 있음
  const sorted = [...table].sort(
    (a, b) => (b[fromKey] as number) - (a[fromKey] as number)
  );

  // 범위 밖 처리
  if (value >= (sorted[0][fromKey] as number)) {
    return sorted[0][toKey] as number;
  }
  if (value <= (sorted[sorted.length - 1][fromKey] as number)) {
    return sorted[sorted.length - 1][toKey] as number;
  }

  // 보간
  for (let i = 0; i < sorted.length - 1; i++) {
    const upper = sorted[i][fromKey] as number;
    const lower = sorted[i + 1][fromKey] as number;

    if (value <= upper && value >= lower) {
      const ratio = (value - lower) / (upper - lower);
      const upperVal = sorted[i][toKey] as number;
      const lowerVal = sorted[i + 1][toKey] as number;
      return Math.round(lowerVal + ratio * (upperVal - lowerVal));
    }
  }

  return sorted[sorted.length - 1][toKey] as number;
}

/**
 * 원점수 → 표준점수
 */
export function rawToStandard(rawScore: number, subject: Subject): number {
  if (subject === '영어') return 0; // 영어는 절대평가
  const table = getConversionTable(subject);
  return interpolate(rawScore, 'rawScore', 'standardScore', table);
}

/**
 * 원점수 → 백분위
 */
export function rawToPercentile(rawScore: number, subject: Subject): number {
  if (subject === '영어') return 0;
  const table = getConversionTable(subject);
  return interpolate(rawScore, 'rawScore', 'percentile', table);
}

/**
 * 원점수 → 등급
 */
export function rawToGrade(rawScore: number, subject: Subject): number {
  if (subject === '영어') {
    for (const row of englishGradeTable) {
      if (rawScore >= row.minRawScore) return row.grade;
    }
    return 9;
  }
  const table = getConversionTable(subject);
  return interpolate(rawScore, 'rawScore', 'grade', table);
}

/**
 * 표준점수 → 원점수
 */
export function standardToRaw(standardScore: number, subject: Subject): number {
  if (subject === '영어') return 0;
  const table = getConversionTable(subject);
  return interpolate(standardScore, 'standardScore', 'rawScore', table);
}

/**
 * 표준점수 → 백분위
 */
export function standardToPercentile(standardScore: number, subject: Subject): number {
  if (subject === '영어') return 0;
  const table = getConversionTable(subject);
  return interpolate(standardScore, 'standardScore', 'percentile', table);
}

/**
 * 표준점수 → 등급
 */
export function standardToGrade(standardScore: number, subject: Subject): number {
  if (subject === '영어') return 0;
  const table = getConversionTable(subject);
  return interpolate(standardScore, 'standardScore', 'grade', table);
}

/**
 * 백분위 → 표준점수
 */
export function percentileToStandard(percentile: number, subject: Subject): number {
  if (subject === '영어') return 0;
  const table = getConversionTable(subject);
  return interpolate(percentile, 'percentile', 'standardScore', table);
}

/**
 * 백분위 → 등급
 */
export function percentileToGrade(percentile: number, subject: Subject): number {
  if (subject === '영어') return 0;
  const table = getConversionTable(subject);
  return interpolate(percentile, 'percentile', 'grade', table);
}

/**
 * 등급 → 표준점수 (등급 중간값 기준)
 */
export function gradeToStandard(grade: number, subject: Subject): number {
  if (subject === '영어') return 0;
  const table = getConversionTable(subject);

  // 해당 등급의 행 찾기
  const rows = table.filter((r) => r.grade === Math.round(grade));
  if (rows.length === 0) {
    // 가장 가까운 등급 찾기
    const closest = table.reduce((prev, curr) =>
      Math.abs(curr.grade - grade) < Math.abs(prev.grade - grade) ? curr : prev
    );
    return closest.standardScore;
  }

  // 해당 등급의 중간값
  const avg =
    rows.reduce((sum, r) => sum + r.standardScore, 0) / rows.length;
  return Math.round(avg);
}

/**
 * 영어 원점수 → 등급
 */
export function englishRawToGrade(rawScore: number): number {
  for (const row of englishGradeTable) {
    if (rawScore >= row.minRawScore) return row.grade;
  }
  return 9;
}

/**
 * 전체 점수를 표준점수 합으로 변환 (커트라인 비교용)
 * 국어 + 수학 + 탐구1 + 탐구2의 표준점수 합
 * (영어는 등급으로 별도 처리)
 */
export function calculateTotalStandardScore(scores: {
  korean?: { standardScore?: number; rawScore?: number; percentile?: number; grade?: number };
  math?: { standardScore?: number; rawScore?: number; percentile?: number; grade?: number };
  exploration1?: { standardScore?: number; rawScore?: number; percentile?: number; grade?: number };
  exploration2?: { standardScore?: number; rawScore?: number; percentile?: number; grade?: number };
}): number {
  let total = 0;

  const getStandard = (
    data: { standardScore?: number; rawScore?: number; percentile?: number; grade?: number } | undefined,
    subject: Subject
  ): number => {
    if (!data) return 0;
    if (data.standardScore) return data.standardScore;
    if (data.rawScore) return rawToStandard(data.rawScore, subject);
    if (data.percentile) return percentileToStandard(data.percentile, subject);
    if (data.grade) return gradeToStandard(data.grade, subject);
    return 0;
  };

  total += getStandard(scores.korean, '국어');
  total += getStandard(scores.math, '수학');
  total += getStandard(scores.exploration1, '탐구1');
  total += getStandard(scores.exploration2, '탐구2');

  return total;
}
