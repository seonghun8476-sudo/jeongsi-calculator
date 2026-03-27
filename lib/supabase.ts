import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://qyksueckyxpihmmbiyaj.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF5a3N1ZWNreXhwaWhtbWJpeWFqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIxMTIyNTgsImV4cCI6MjA4NzY4ODI1OH0.jPGLnn4VJGzpbsSN2PIGu_G5q37awz6k4PIDYqQPVw0';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// DB 타입
export interface DBUniversity {
  id: string;
  name: string;
  region: string;
  type: '국립' | '사립';
  logo_url: string | null;
}

export interface DBDepartment {
  id: string;
  university_id: string;
  name: string;
  category: '인문' | '자연' | '의약' | '예체능';
  admission_group: '가' | '나' | '다' | null;
}

export interface DBCutoffScore {
  id: string;
  department_id: string;
  year: number;
  admission_type: string;
  min_standard_score: number;
  min_percentile: number;
  competition_rate: number;
  avg_standard_score: number | null;
}

export interface DBScoreConversion {
  id: number;
  year: number;
  subject: string;
  raw_score: number;
  standard_score: number;
  percentile: number;
  grade: number;
}

export interface DBAdmissionWeight {
  id: number;
  university_id: string;
  category: string;
  korean_weight: number;
  math_weight: number;
  english_weight: number;
  exploration_weight: number;
  english_grade_bonus: Record<string, number> | null;
}

// 데이터 조회 함수들

export async function fetchUniversities(): Promise<DBUniversity[]> {
  const all: DBUniversity[] = [];
  let from = 0;
  const pageSize = 1000;
  while (true) {
    const { data, error } = await supabase
      .from('universities')
      .select('*')
      .order('name')
      .range(from, from + pageSize - 1);
    if (error) throw error;
    if (!data || data.length === 0) break;
    all.push(...data);
    if (data.length < pageSize) break;
    from += pageSize;
  }
  return all;
}

export async function fetchDepartments(): Promise<(DBDepartment & { universities: { name: string } })[]> {
  const { data, error } = await supabase
    .from('departments')
    .select('*, universities(name)')
    .order('name');
  if (error) throw error;
  return data ?? [];
}

export async function fetchCutoffScores(year?: number): Promise<DBCutoffScore[]> {
  const all: DBCutoffScore[] = [];
  let from = 0;
  const pageSize = 1000;
  while (true) {
    let query = supabase.from('cutoff_scores').select('*');
    if (year) query = query.eq('year', year);
    query = query.order('min_standard_score', { ascending: false }).range(from, from + pageSize - 1);
    const { data, error } = await query;
    if (error) throw error;
    if (!data || data.length === 0) break;
    all.push(...data);
    if (data.length < pageSize) break;
    from += pageSize;
  }
  return all;
}

export async function fetchScoreConversions(year?: number): Promise<DBScoreConversion[]> {
  let query = supabase.from('score_conversion').select('*');
  if (year) query = query.eq('year', year);
  query = query.order('raw_score', { ascending: false });
  const { data, error } = await query;
  if (error) throw error;
  return data ?? [];
}

export async function fetchUniversityWithDepartments(universityId: string) {
  const [uniResult, deptResult] = await Promise.all([
    supabase.from('universities').select('*').eq('id', universityId).single(),
    supabase
      .from('departments')
      .select('*, cutoff_scores(*)')
      .eq('university_id', universityId)
      .order('name'),
  ]);

  if (uniResult.error) throw uniResult.error;
  if (deptResult.error) throw deptResult.error;

  return {
    university: uniResult.data as DBUniversity,
    departments: deptResult.data ?? [],
  };
}

// ==================== 관심대학 클라우드 동기화 ====================

export async function fetchCloudFavorites(): Promise<string[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from('user_favorites')
    .select('department_id')
    .eq('user_id', user.id);

  if (error) throw error;
  return (data ?? []).map((r: any) => r.department_id);
}

export async function addCloudFavorite(departmentId: string): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  await supabase
    .from('user_favorites')
    .upsert({ user_id: user.id, department_id: departmentId }, { onConflict: 'user_id,department_id' });
}

export async function removeCloudFavorite(departmentId: string): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  await supabase
    .from('user_favorites')
    .delete()
    .eq('user_id', user.id)
    .eq('department_id', departmentId);
}

export async function syncFavoritesToCloud(departmentIds: string[]): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  // 기존 삭제 후 전체 재삽입
  await supabase.from('user_favorites').delete().eq('user_id', user.id);

  if (departmentIds.length > 0) {
    const rows = departmentIds.map((id) => ({ user_id: user.id, department_id: id }));
    await supabase.from('user_favorites').insert(rows);
  }
}

// ==================== 데이터 조회 ====================

export async function fetchAdmissionWeights(): Promise<DBAdmissionWeight[]> {
  const { data, error } = await supabase.from('admission_weights').select('*');
  if (error) throw error;
  return data ?? [];
}

// 페이지네이션 헬퍼
async function fetchAllRows<T>(table: string, orderBy: string = 'id'): Promise<T[]> {
  const all: T[] = [];
  let from = 0;
  const pageSize = 1000;
  while (true) {
    const { data, error } = await supabase
      .from(table)
      .select('*')
      .order(orderBy)
      .range(from, from + pageSize - 1);
    if (error) throw error;
    if (!data || data.length === 0) break;
    all.push(...(data as T[]));
    if (data.length < pageSize) break;
    from += pageSize;
  }
  return all;
}

// 전체 데이터를 한 번에 가져오기 (초기 로딩용)
export async function fetchAllData() {
  const [universities, departments, cutoffs, conversions, weights] = await Promise.all([
    fetchAllRows<DBUniversity>('universities', 'name'),
    fetchAllRows<DBDepartment>('departments', 'name'),
    fetchAllRows<DBCutoffScore>('cutoff_scores', 'id'),
    fetchScoreConversions(2025),
    fetchAdmissionWeights(),
  ]);

  return {
    universities,
    departments,
    cutoffs,
    conversions,
    weights,
  };
}
