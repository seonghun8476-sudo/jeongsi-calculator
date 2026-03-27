import { useColorScheme } from 'react-native';

export const lightColors = {
  background: '#F8F9FA',
  card: '#FFFFFF',
  text: '#1A1A1A',
  textSecondary: '#666666',
  textTertiary: '#999999',
  border: '#F0F0F0',
  inputBorder: '#E0E0E0',
  inputBg: '#FFFFFF',
  primary: '#4A90D9',
  chipBg: '#FFFFFF',
  chipBorder: '#E0E0E0',
  searchBg: '#F0F0F0',
  tabBar: '#FFFFFF',
  tabBarBorder: '#F0F0F0',
  headerBg: '#F8F9FA',
  // 합격 확률 색상
  safe: '#2E7D32',
  safeBg: '#E8F5E9',
  fit: '#1565C0',
  fitBg: '#E3F2FD',
  bold: '#E65100',
  boldBg: '#FFF3E0',
  danger: '#C62828',
  dangerBg: '#FFEBEE',
  positive: '#2E7D32',
  negative: '#C62828',
};

export const darkColors = {
  background: '#121212',
  card: '#1E1E1E',
  text: '#E8E8E8',
  textSecondary: '#AAAAAA',
  textTertiary: '#777777',
  border: '#2C2C2C',
  inputBorder: '#3A3A3A',
  inputBg: '#2A2A2A',
  primary: '#5B9FE6',
  chipBg: '#2A2A2A',
  chipBorder: '#3A3A3A',
  searchBg: '#2A2A2A',
  tabBar: '#1A1A1A',
  tabBarBorder: '#2C2C2C',
  headerBg: '#121212',
  // 합격 확률 색상
  safe: '#66BB6A',
  safeBg: '#1B3A1B',
  fit: '#64B5F6',
  fitBg: '#1A2A3A',
  bold: '#FFB74D',
  boldBg: '#3A2A1A',
  danger: '#EF5350',
  dangerBg: '#3A1A1A',
  positive: '#66BB6A',
  negative: '#EF5350',
};

export type ThemeColors = typeof lightColors;

export function useTheme(): { colors: ThemeColors; isDark: boolean } {
  // 항상 라이트 모드 사용
  return {
    colors: lightColors,
    isDark: false,
  };
}
