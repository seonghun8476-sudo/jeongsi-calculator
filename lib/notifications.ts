import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';

// 알림 핸들러 설정
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

// 푸시 알림 권한 요청 + 토큰 획득
export async function registerForPushNotifications(): Promise<string | null> {
  if (!Device.isDevice) {
    return null;
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    return null;
  }

  if (Platform.OS === 'android') {
    Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
    });
  }

  const token = (await Notifications.getExpoPushTokenAsync()).data;
  return token;
}

// 입시 일정 로컬 알림 스케줄링
export interface AdmissionSchedule {
  id: string;
  title: string;
  body: string;
  date: Date;
}

// 2025학년도 정시 주요 일정
export const admissionSchedules: AdmissionSchedule[] = [
  {
    id: 'score-release',
    title: '수능 성적 통지',
    body: '2025학년도 수능 성적표가 배부됩니다.',
    date: new Date(2024, 11, 6), // 12월 6일
  },
  {
    id: 'jeongsi-apply-start',
    title: '정시 원서 접수 시작',
    body: '정시 가/나/다군 원서 접수가 시작됩니다.',
    date: new Date(2024, 11, 31), // 12월 31일
  },
  {
    id: 'jeongsi-apply-end',
    title: '정시 원서 접수 마감',
    body: '정시 원서 접수가 마감됩니다. 확인하세요!',
    date: new Date(2025, 0, 3), // 1월 3일
  },
  {
    id: 'jeongsi-result-ga',
    title: '정시 가군 합격자 발표',
    body: '정시 가군 합격자가 발표됩니다.',
    date: new Date(2025, 1, 4), // 2월 4일
  },
  {
    id: 'jeongsi-result-na',
    title: '정시 나군 합격자 발표',
    body: '정시 나군 합격자가 발표됩니다.',
    date: new Date(2025, 1, 10), // 2월 10일
  },
  {
    id: 'jeongsi-result-da',
    title: '정시 다군 합격자 발표',
    body: '정시 다군 합격자가 발표됩니다.',
    date: new Date(2025, 1, 14), // 2월 14일
  },
];

// 로컬 알림 스케줄링
export async function scheduleAdmissionNotifications(): Promise<void> {
  // 기존 알림 취소
  await Notifications.cancelAllScheduledNotificationsAsync();

  const now = new Date();

  for (const schedule of admissionSchedules) {
    // 1일 전 알림
    const reminderDate = new Date(schedule.date);
    reminderDate.setDate(reminderDate.getDate() - 1);

    if (reminderDate > now) {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: `[내일] ${schedule.title}`,
          body: schedule.body,
        },
        trigger: { type: 'date', date: reminderDate } as any,
      });
    }

    // 당일 알림
    if (schedule.date > now) {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: schedule.title,
          body: schedule.body,
        },
        trigger: { type: 'date', date: schedule.date } as any,
      });
    }
  }
}

// 스케줄된 알림 목록 조회
export async function getScheduledNotifications() {
  return Notifications.getAllScheduledNotificationsAsync();
}
