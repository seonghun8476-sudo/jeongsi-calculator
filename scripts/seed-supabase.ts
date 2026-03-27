/**
 * Supabase 데이터 시드 스크립트
 *
 * 사용법:
 *   npx tsx scripts/seed-supabase.ts
 *
 * 사전 조건:
 *   1. Supabase 프로젝트에 아래 테이블이 생성되어 있어야 합니다.
 *   2. npm install tsx --save-dev (또는 npx tsx 사용)
 *
 * 테이블 생성 SQL은 scripts/create-tables.sql을 참고하세요.
 */

import { createClient } from '@supabase/supabase-js';

// --- Supabase 설정 ---
const SUPABASE_URL = 'https://qyksueckyxpihmmbiyaj.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

if (!SUPABASE_SERVICE_KEY) {
  console.error('❌ SUPABASE_SERVICE_KEY 환경변수가 필요합니다.');
  console.error('   export SUPABASE_SERVICE_KEY="your-service-role-key"');
  console.error('   Supabase Dashboard > Settings > API > service_role key');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// --- 로컬 데이터 임포트 ---
import { universities, departments, cutoffScores, allConversions } from '../data/sampleData';

const BATCH_SIZE = 500;

async function upsertBatch<T extends Record<string, any>>(
  table: string,
  rows: T[],
  label: string
) {
  let inserted = 0;
  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    const batch = rows.slice(i, i + BATCH_SIZE);
    const { error } = await supabase.from(table).upsert(batch, { onConflict: 'id' });
    if (error) {
      console.error(`❌ ${label} batch ${i}~${i + batch.length} 실패:`, error.message);
      throw error;
    }
    inserted += batch.length;
    console.log(`  ${label}: ${inserted}/${rows.length}`);
  }
  return inserted;
}

async function seed() {
  console.log('🌱 Supabase 데이터 시드 시작...\n');

  // 1. 대학 데이터
  console.log(`📚 대학 데이터 (${universities.length}개)`);
  const uniRows = universities.map((u) => ({
    id: u.id,
    name: u.name,
    region: u.region,
    type: u.type,
    logo_url: null,
  }));
  await upsertBatch('universities', uniRows, '대학');

  // 2. 학과 데이터
  console.log(`\n🎓 학과 데이터 (${departments.length}개)`);
  const deptRows = departments.map((d) => ({
    id: d.id,
    university_id: d.universityId,
    name: d.name,
    category: d.category,
  }));
  await upsertBatch('departments', deptRows, '학과');

  // 3. 커트라인 데이터
  console.log(`\n📊 커트라인 데이터 (${cutoffScores.length}개)`);
  const cutoffRows = cutoffScores.map((c) => ({
    id: c.id,
    department_id: c.departmentId,
    year: c.year,
    admission_type: c.admissionType,
    min_standard_score: c.minStandardScore,
    min_percentile: c.minPercentile,
    competition_rate: c.competitionRate,
    avg_standard_score: c.avgStandardScore ?? null,
  }));
  await upsertBatch('cutoff_scores', cutoffRows, '커트라인');

  // 4. 점수 변환 테이블
  console.log(`\n📈 점수 변환 데이터 (${allConversions.length}개)`);
  const convRows = allConversions.map((c, idx) => ({
    id: idx + 1,
    year: c.year,
    subject: c.subject,
    raw_score: c.rawScore,
    standard_score: c.standardScore,
    percentile: c.percentile,
    grade: c.grade,
  }));
  await upsertBatch('score_conversion', convRows, '점수변환');

  console.log('\n✅ 시드 완료!');
  console.log(`   대학: ${universities.length}개`);
  console.log(`   학과: ${departments.length}개`);
  console.log(`   커트라인: ${cutoffScores.length}개`);
  console.log(`   점수변환: ${allConversions.length}개`);
}

seed().catch((e) => {
  console.error('시드 실패:', e);
  process.exit(1);
});
