import React from 'react';
import { Tabs } from 'expo-router';
import { Text } from 'react-native';
import { useTheme } from '../../lib/theme';

function TabIcon({ name, focused }: { name: string; focused: boolean }) {
  const icons: Record<string, string> = {
    '점수입력': '\u270F\uFE0F',
    '결과': '\uD83C\uDFE0',
    '탐색': '\uD83D\uDD0D',
    '관심대학': focused ? '\u2B50' : '\u2606',
    '프로필': '\uD83D\uDC64',
  };
  return <Text style={{ fontSize: 22 }}>{icons[name] || '\u2022'}</Text>;
}

export default function TabLayout() {
  const { colors } = useTheme();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textTertiary,
        tabBarStyle: {
          backgroundColor: colors.tabBar,
          borderTopColor: colors.tabBarBorder,
          height: 85,
          paddingBottom: 25,
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
        },
        headerStyle: {
          backgroundColor: colors.headerBg,
        },
        headerTitleStyle: {
          fontWeight: '700',
          fontSize: 18,
          color: colors.text,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: '점수 입력',
          headerTitle: '어대갈까',
          tabBarIcon: ({ focused }) => <TabIcon name="점수입력" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="results"
        options={{
          title: '결과',
          headerTitle: '지원 가능 대학',
          tabBarIcon: ({ focused }) => <TabIcon name="결과" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          title: '탐색',
          headerTitle: '대학/학과 탐색',
          tabBarIcon: ({ focused }) => <TabIcon name="탐색" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="favorites"
        options={{
          title: '관심 대학',
          headerTitle: '관심 대학',
          tabBarIcon: ({ focused }) => <TabIcon name="관심대학" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: '프로필',
          headerTitle: '내 정보',
          tabBarIcon: ({ focused }) => <TabIcon name="프로필" focused={focused} />,
        }}
      />
    </Tabs>
  );
}
