import { useFonts } from 'expo-font';
import { Stack, useRouter } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useState } from 'react';
import { StatusBar } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useDataStore } from '../store/useDataStore';
import { useScoreStore } from '../store/useScoreStore';
import { useAuthStore } from '../store/useAuthStore';

export { ErrorBoundary } from 'expo-router';

const ONBOARDING_KEY = '@jeongsi_onboarding_done';

export const unstable_settings = {
  initialRouteName: '(tabs)',
};

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });
  const loadData = useDataStore((s) => s.loadData);
  const loadFavorites = useScoreStore((s) => s.loadFavorites);
  const initAuth = useAuthStore((s) => s.initialize);
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded) {
      (async () => {
        await loadData();
        loadFavorites();
        initAuth();

        // 온보딩 체크
        const seen = await AsyncStorage.getItem(ONBOARDING_KEY);
        setReady(true);
        SplashScreen.hideAsync();
        if (seen !== 'true') {
          // 약간의 딜레이 후 온보딩으로 이동 (라우터 준비 대기)
          setTimeout(() => router.replace('/onboarding'), 100);
        }
      })();
    }
  }, [loaded]);

  if (!loaded || !ready) {
    return null;
  }

  return (
    <>
      <StatusBar barStyle="dark-content" backgroundColor="#F8F9FA" />
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="onboarding" options={{ headerShown: false, gestureEnabled: false }} />
        <Stack.Screen
          name="premium"
          options={{
            title: '프리미엄',
            presentation: 'modal',
            headerTintColor: '#4A90D9',
            headerStyle: { backgroundColor: '#F8F9FA' },
          }}
        />
        <Stack.Screen
          name="university/[id]"
          options={{
            title: '대학 상세',
            headerBackTitle: '뒤로',
            headerTintColor: '#4A90D9',
            headerStyle: { backgroundColor: '#F8F9FA' },
          }}
        />
      </Stack>
    </>
  );
}
