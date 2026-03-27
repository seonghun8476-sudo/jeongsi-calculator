import React from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { useScoreStore } from '../store/useScoreStore';
import { ScoreInputMode, Subject } from '../types';
import { useTheme } from '../lib/theme';
import {
  rawToStandard, rawToPercentile, rawToGrade,
  standardToRaw, standardToPercentile, standardToGrade,
  percentileToStandard, percentileToGrade,
  gradeToStandard,
  englishRawToGrade,
} from '../lib/scoreConverter';

const inputModes: ScoreInputMode[] = ['원점수', '표준점수', '백분위', '등급'];

const mathElectives = ['확률과통계', '미적분', '기하'] as const;
const socialStudies = ['생활과윤리', '윤리와사상', '한국지리', '세계지리', '동아시아사', '세계사', '경제', '정치와법', '사회문화'] as const;
const sciences = ['물리학Ⅰ', '화학Ⅰ', '생명과학Ⅰ', '지구과학Ⅰ', '물리학Ⅱ', '화학Ⅱ', '생명과학Ⅱ', '지구과학Ⅱ'] as const;

// 입력 범위 검증
function getMaxValue(mode: ScoreInputMode, subject: Subject): number {
  if (mode === '등급') return 9;
  if (mode === '백분위') return 100;
  if (mode === '원점수') return subject.startsWith('탐구') ? 50 : 100;
  // 표준점수
  if (subject.startsWith('탐구')) return 80;
  return 150;
}

function getMinValue(mode: ScoreInputMode): number {
  if (mode === '등급') return 1;
  return 0;
}

function validateScore(value: number, mode: ScoreInputMode, subject: Subject): boolean {
  if (isNaN(value)) return false;
  return value >= getMinValue(mode) && value <= getMaxValue(mode, subject);
}

// 실시간 변환 정보 생성
function getConversionInfo(value: number | undefined, mode: ScoreInputMode, subject: Subject): string {
  if (value === undefined || isNaN(value)) return '';
  if (subject === '영어') {
    if (mode === '원점수') return `${englishRawToGrade(value)}등급`;
    return '';
  }

  switch (mode) {
    case '원점수':
      return `표준 ${rawToStandard(value, subject)} · 백분위 ${rawToPercentile(value, subject)} · ${Math.round(rawToGrade(value, subject))}등급`;
    case '표준점수':
      return `원점수 ~${standardToRaw(value, subject)} · 백분위 ${standardToPercentile(value, subject)} · ${Math.round(standardToGrade(value, subject))}등급`;
    case '백분위':
      return `표준 ${percentileToStandard(value, subject)} · ${Math.round(percentileToGrade(value, subject))}등급`;
    case '등급':
      return `표준 ~${gradeToStandard(value, subject)}`;
  }
}

export default function ScoreInput() {
  const store = useScoreStore();
  const { colors } = useTheme();

  const getScoreKey = (): 'rawScore' | 'standardScore' | 'percentile' | 'grade' => {
    switch (store.inputMode) {
      case '원점수': return 'rawScore';
      case '표준점수': return 'standardScore';
      case '백분위': return 'percentile';
      case '등급': return 'grade';
    }
  };

  const getPlaceholder = (subject: Subject): string => {
    const max = getMaxValue(store.inputMode, subject);
    const min = getMinValue(store.inputMode);
    return `${min}~${max}`;
  };

  const handleScoreChange = (subject: Subject, value: string) => {
    const numValue = value === '' ? undefined : Number(value);
    const key = getScoreKey();

    // 범위 검증 (빈 값은 허용)
    if (numValue !== undefined && !validateScore(numValue, store.inputMode, subject)) {
      return; // 범위 밖이면 무시
    }

    const scoreUpdate = { [key]: numValue };

    switch (subject) {
      case '국어':
        store.setKoreanScore({ ...store.koreanScore, ...scoreUpdate });
        break;
      case '수학':
        store.setMathScore({ ...store.mathScore, ...scoreUpdate });
        break;
      case '영어':
        if (store.inputMode === '등급' || store.inputMode === '원점수') {
          store.setEnglishScore({ ...store.englishScore, ...scoreUpdate });
        }
        break;
      case '탐구1':
        store.setExploration1Score({ ...store.exploration1Score, ...scoreUpdate });
        break;
      case '탐구2':
        store.setExploration2Score({ ...store.exploration2Score, ...scoreUpdate });
        break;
    }

    // 실시간 총점 업데이트
    setTimeout(() => store.calculateTotal(), 0);
  };

  const getCurrentValue = (subject: Subject): string => {
    const key = getScoreKey();
    let score;
    switch (subject) {
      case '국어': score = store.koreanScore; break;
      case '수학': score = store.mathScore; break;
      case '영어': score = store.englishScore; break;
      case '탐구1': score = store.exploration1Score; break;
      case '탐구2': score = store.exploration2Score; break;
    }
    const val = score?.[key as keyof typeof score];
    return val !== undefined && val !== null ? String(val) : '';
  };

  const getCurrentNumValue = (subject: Subject): number | undefined => {
    const str = getCurrentValue(subject);
    return str === '' ? undefined : Number(str);
  };

  const explorationSubjects = store.explorationArea === '사회탐구' ? socialStudies : sciences;

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]} showsVerticalScrollIndicator={false}>
      {/* 입력 모드 선택 */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>입력 방식</Text>
        <View style={styles.modeRow}>
          {inputModes.map((mode) => (
            <TouchableOpacity
              key={mode}
              style={[styles.modeButton, store.inputMode === mode && styles.modeButtonActive]}
              onPress={() => store.setInputMode(mode)}
            >
              <Text style={[styles.modeText, store.inputMode === mode && styles.modeTextActive]}>
                {mode}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* 수학 선택과목 */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>수학 선택과목</Text>
        <View style={styles.modeRow}>
          {mathElectives.map((elective) => (
            <TouchableOpacity
              key={elective}
              style={[styles.modeButton, store.mathElective === elective && styles.modeButtonActive]}
              onPress={() => store.setMathElective(elective)}
            >
              <Text style={[styles.modeText, store.mathElective === elective && styles.modeTextActive]}>
                {elective}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* 탐구 영역 선택 */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>탐구 영역</Text>
        <View style={styles.modeRow}>
          {(['사회탐구', '과학탐구'] as const).map((area) => (
            <TouchableOpacity
              key={area}
              style={[styles.modeButton, store.explorationArea === area && styles.modeButtonActive]}
              onPress={() => store.setExplorationArea(area)}
            >
              <Text style={[styles.modeText, store.explorationArea === area && styles.modeTextActive]}>
                {area}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* 탐구 과목 선택 */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>탐구 과목</Text>
        <View style={styles.subjectSelectRow}>
          <View style={styles.subjectSelectCol}>
            <Text style={styles.subjectSelectLabel}>탐구 1</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.chipRow}>
                {explorationSubjects.map((sub) => (
                  <TouchableOpacity
                    key={`e1-${sub}`}
                    style={[styles.chip, store.exploration1Subject === sub && styles.chipActive]}
                    onPress={() => store.setExploration1Subject(sub)}
                  >
                    <Text style={[styles.chipText, store.exploration1Subject === sub && styles.chipTextActive]}>
                      {sub}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          </View>
          <View style={styles.subjectSelectCol}>
            <Text style={styles.subjectSelectLabel}>탐구 2</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.chipRow}>
                {explorationSubjects.map((sub) => (
                  <TouchableOpacity
                    key={`e2-${sub}`}
                    style={[styles.chip, store.exploration2Subject === sub && styles.chipActive]}
                    onPress={() => store.setExploration2Subject(sub)}
                  >
                    <Text style={[styles.chipText, store.exploration2Subject === sub && styles.chipTextActive]}>
                      {sub}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          </View>
        </View>
      </View>

      {/* 점수 입력 */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>점수 입력</Text>
        {(['국어', '수학', '영어', '탐구1', '탐구2'] as Subject[]).map((subject) => {
          const isEnglish = subject === '영어';
          const numVal = getCurrentNumValue(subject);
          const conversionInfo = isEnglish ? '' : getConversionInfo(numVal, store.inputMode, subject);

          return (
            <View key={subject} style={styles.inputGroup}>
              <View style={styles.inputRow}>
                <Text style={styles.inputLabel}>
                  {subject === '탐구1' ? store.exploration1Subject :
                   subject === '탐구2' ? store.exploration2Subject : subject}
                </Text>
                {isEnglish ? (
                  <View style={styles.englishGradeRow}>
                    <Text style={styles.englishGradeLabel}>등급</Text>
                    <TextInput
                      style={[styles.englishGradeInput, { borderColor: colors.primary, color: colors.text, backgroundColor: colors.inputBg }]}
                      keyboardType="numeric"
                      placeholder="1~9"
                      placeholderTextColor="#ccc"
                      value={store.englishScore?.grade !== undefined ? String(store.englishScore.grade) : ''}
                      onChangeText={(v) => {
                        const num = v === '' ? undefined : Number(v);
                        if (num !== undefined && (num < 1 || num > 9)) return;
                        store.setEnglishScore({ ...store.englishScore, grade: num });
                        setTimeout(() => store.calculateTotal(), 0);
                      }}
                      maxLength={1}
                    />
                  </View>
                ) : (
                  <TextInput
                    style={styles.input}
                    keyboardType="numeric"
                    placeholder={getPlaceholder(subject)}
                    placeholderTextColor="#ccc"
                    value={getCurrentValue(subject)}
                    onChangeText={(v) => handleScoreChange(subject, v)}
                    maxLength={3}
                  />
                )}
              </View>
              {conversionInfo !== '' && (
                <Text style={styles.conversionText}>{conversionInfo}</Text>
              )}
            </View>
          );
        })}
      </View>

      {/* 총점 표시 */}
      {store.totalStandardScore > 0 && (
        <View style={styles.totalSection}>
          <Text style={styles.totalLabel}>환산 표준점수 합</Text>
          <Text style={styles.totalValue}>{store.totalStandardScore}</Text>
          {store.englishGrade > 0 && (
            <Text style={styles.totalSub}>영어 {store.englishGrade}등급</Text>
          )}
        </View>
      )}

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  section: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#333',
    marginBottom: 8,
  },
  modeRow: {
    flexDirection: 'row',
    gap: 8,
  },
  modeButton: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  modeButtonActive: {
    backgroundColor: '#4A90D9',
    borderColor: '#4A90D9',
  },
  modeText: {
    fontSize: 13,
    color: '#666',
    fontWeight: '500',
  },
  modeTextActive: {
    color: '#fff',
  },
  subjectSelectRow: {
    gap: 12,
  },
  subjectSelectCol: {
    gap: 6,
  },
  subjectSelectLabel: {
    fontSize: 13,
    color: '#666',
    fontWeight: '600',
  },
  chipRow: {
    flexDirection: 'row',
    gap: 6,
  },
  chip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  chipActive: {
    backgroundColor: '#4A90D9',
    borderColor: '#4A90D9',
  },
  chipText: {
    fontSize: 12,
    color: '#666',
  },
  chipTextActive: {
    color: '#fff',
  },
  inputGroup: {
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    paddingVertical: 6,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    flex: 1,
  },
  input: {
    width: 100,
    height: 40,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 10,
    paddingHorizontal: 12,
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    backgroundColor: '#fff',
    textAlign: 'center',
  },
  inputHint: {
    fontSize: 11,
    color: '#999',
    flex: 1,
    textAlign: 'right',
  },
  englishGradeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginLeft: 'auto',
  },
  englishGradeLabel: {
    fontSize: 13,
    color: '#999',
  },
  englishGradeInput: {
    width: 50,
    height: 40,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#4A90D9',
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
    backgroundColor: '#fff',
    textAlign: 'center',
  },
  conversionText: {
    fontSize: 11,
    color: '#4A90D9',
    paddingLeft: 2,
    paddingBottom: 4,
  },
  totalSection: {
    alignItems: 'center',
    paddingVertical: 16,
    marginHorizontal: 16,
    backgroundColor: '#fff',
    borderRadius: 16,
    marginTop: 8,
  },
  totalLabel: {
    fontSize: 13,
    color: '#666',
  },
  totalValue: {
    fontSize: 36,
    fontWeight: '800',
    color: '#4A90D9',
    marginTop: 4,
  },
  totalSub: {
    fontSize: 14,
    color: '#999',
    marginTop: 2,
  },
});
