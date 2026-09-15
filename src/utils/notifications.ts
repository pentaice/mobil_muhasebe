import { Capacitor } from '@capacitor/core';
import { LocalNotifications, LocalNotificationSchema } from '@capacitor/local-notifications';
import { NotificationSettings } from './storage';
import { TranslationKeys } from '../i18n/translations';

export const REMINDER_CHANNEL_ID = 'cebim_reminders';
export const NOTIFICATION_IDS = {
  DAILY_MAIN: 1001,
  DAILY_SECONDARY: 1002,
  TEST: 9999,
} as const;

/**
 * Android 8.0+ (API 26+) requires a notification channel.
 * Sets up a high-importance channel with sound, vibration, and banner presentation.
 */
export async function initNotificationChannel(): Promise<void> {
  if (!Capacitor.isNativePlatform()) return;

  try {
    await LocalNotifications.createChannel({
      id: REMINDER_CHANNEL_ID,
      name: 'Cebim Hatırlatıcıları',
      description: 'Harcama ve bütçe takip hatırlatıcı bildirimleri',
      importance: 4, // IMPORTANCE_HIGH (Shows banner, plays sound)
      visibility: 1, // VISIBILITY_PUBLIC
      vibration: true,
      lights: true,
      lightColor: '#10b981',
    });
  } catch (err) {
    console.warn('Error creating notification channel:', err);
  }
}

/**
 * Checks and requests notification permissions across native and web platforms.
 */
export async function requestNotificationPermission(): Promise<boolean> {
  if (Capacitor.isNativePlatform()) {
    try {
      const check = await LocalNotifications.checkPermissions();
      if (check.display === 'granted') {
        return true;
      }
      const req = await LocalNotifications.requestPermissions();
      return req.display === 'granted';
    } catch (err) {
      console.error('Failed to request native notification permissions:', err);
      return false;
    }
  }

  // Web fallback (PWA / Browser)
  if ('Notification' in window) {
    try {
      const perm = await Notification.requestPermission();
      return perm === 'granted';
    } catch (err) {
      console.error('Failed to request web notification permissions:', err);
      return false;
    }
  }

  return false;
}

/**
 * Checks current notification permission without prompting the user.
 */
export async function hasNotificationPermission(): Promise<boolean> {
  if (Capacitor.isNativePlatform()) {
    try {
      const check = await LocalNotifications.checkPermissions();
      return check.display === 'granted';
    } catch {
      return false;
    }
  }

  if ('Notification' in window) {
    return Notification.permission === 'granted';
  }

  return false;
}

/**
 * Sends an immediate test notification (fires 1 second later).
 * Uses a safe 32-bit integer ID to prevent Android crashes.
 */
export async function sendTestNotification(
  title: string,
  body: string
): Promise<boolean> {
  if (Capacitor.isNativePlatform()) {
    try {
      await initNotificationChannel();
      await LocalNotifications.schedule({
        notifications: [
          {
            id: NOTIFICATION_IDS.TEST,
            title,
            body,
            channelId: REMINDER_CHANNEL_ID,
            smallIcon: 'ic_stat_notification',
            iconColor: '#10b981',
            schedule: {
              at: new Date(Date.now() + 1000),
              allowWhileIdle: true,
            },
          },
        ],
      });
      return true;
    } catch (err) {
      console.error('Failed to schedule native test notification:', err);
      return false;
    }
  }

  if ('Notification' in window && Notification.permission === 'granted') {
    try {
      new Notification(title, {
        body,
        icon: '/icons/icon-192x192.png',
      });
      return true;
    } catch (err) {
      console.error('Failed to send web test notification:', err);
      return false;
    }
  }

  return false;
}

/**
 * Synchronizes native OS AlarmManager reminders according to current settings.
 * Cancels old alarms and registers new recurring alarms that work even when the app is closed.
 */
export async function syncNotificationSchedule(
  settings: NotificationSettings,
  t: TranslationKeys
): Promise<void> {
  if (!Capacitor.isNativePlatform()) return;

  try {
    // 1. Cancel existing scheduled reminders
    await LocalNotifications.cancel({
      notifications: [
        { id: NOTIFICATION_IDS.DAILY_MAIN },
        { id: NOTIFICATION_IDS.DAILY_SECONDARY },
      ],
    });

    // If disabled, cancellation is all that's required
    if (!settings.enabled) {
      return;
    }

    // Verify permission
    const hasPerm = await hasNotificationPermission();
    if (!hasPerm) {
      console.warn('Notifications enabled in settings, but OS permission is not granted.');
      return;
    }

    await initNotificationChannel();

    const [hStr, mStr] = (settings.time || '20:00').split(':');
    const hour = parseInt(hStr, 10) || 20;
    const minute = parseInt(mStr, 10) || 0;

    const notifTitle = t.reminderNotificationTitle || t.appName || 'Cebim Muhasebe';
    const notifBody = t.reminderNotificationBody || 'Bugünkü harcamalarınızı veya işlemlerinizi kaydettiniz mi?';

    const notificationsToSchedule: LocalNotificationSchema[] = [];

    if (settings.frequency === 'twice_daily') {
      const hour2 = (hour + 12) % 24;

      // 1st reminder
      notificationsToSchedule.push({
        id: NOTIFICATION_IDS.DAILY_MAIN,
        title: notifTitle,
        body: notifBody,
        channelId: REMINDER_CHANNEL_ID,
        smallIcon: 'ic_stat_notification',
        iconColor: '#10b981',
        schedule: {
          on: {
            hour,
            minute,
          },
          allowWhileIdle: true,
        },
      });

      // 2nd reminder (12 hours apart)
      notificationsToSchedule.push({
        id: NOTIFICATION_IDS.DAILY_SECONDARY,
        title: notifTitle,
        body: notifBody,
        channelId: REMINDER_CHANNEL_ID,
        smallIcon: 'ic_stat_notification',
        iconColor: '#10b981',
        schedule: {
          on: {
            hour: hour2,
            minute,
          },
          allowWhileIdle: true,
        },
      });
    } else if (settings.frequency === 'weekly') {
      // Weekly: Fires every Sunday (weekday: 1 in Capacitor ScheduleOn)
      notificationsToSchedule.push({
        id: NOTIFICATION_IDS.DAILY_MAIN,
        title: notifTitle,
        body: notifBody,
        channelId: REMINDER_CHANNEL_ID,
        smallIcon: 'ic_stat_notification',
        iconColor: '#10b981',
        schedule: {
          on: {
            weekday: 1, // Sunday
            hour,
            minute,
          },
          allowWhileIdle: true,
        },
      });
    } else if (settings.frequency === 'monthly') {
      // Monthly: Fires on the 1st of every month
      notificationsToSchedule.push({
        id: NOTIFICATION_IDS.DAILY_MAIN,
        title: notifTitle,
        body: notifBody,
        channelId: REMINDER_CHANNEL_ID,
        smallIcon: 'ic_stat_notification',
        iconColor: '#10b981',
        schedule: {
          on: {
            day: 1,
            hour,
            minute,
          },
          allowWhileIdle: true,
        },
      });
    } else {
      // Default: daily
      notificationsToSchedule.push({
        id: NOTIFICATION_IDS.DAILY_MAIN,
        title: notifTitle,
        body: notifBody,
        channelId: REMINDER_CHANNEL_ID,
        smallIcon: 'ic_stat_notification',
        iconColor: '#10b981',
        schedule: {
          on: {
            hour,
            minute,
          },
          allowWhileIdle: true,
        },
      });
    }

    await LocalNotifications.schedule({
      notifications: notificationsToSchedule,
    });

    console.log(`Successfully scheduled ${notificationsToSchedule.length} local notification(s).`);
  } catch (err) {
    console.error('Error synchronizing notification schedule:', err);
  }
}
