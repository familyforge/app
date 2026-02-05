import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Task } from '../types';
import type { Deadline } from '../state/deadlines-store';
import type { LearningTask } from '../state/learning-store';
import type { Routine, NotificationSettings } from '../state/profile-store';

// Notification channels for Android
const NOTIFICATION_CHANNELS = {
  TASK_ALARMS: 'task-alarms',
  ROUTINE_REMINDERS: 'routine-reminders',
  DEADLINE_ALERTS: 'deadline-alerts',
  LEARNING_REMINDERS: 'learning-reminders',
  OVERDUE_ALERTS: 'overdue-alerts',
  MOTIVATION: 'motivation',
};

// Motivational quotes for daily inspiration
const MOTIVATIONAL_QUOTES = [
  "Every day is a new opportunity to be a great parent! 💪",
  "Small steps lead to big achievements. Keep going! 🌟",
  "You're doing amazing! Your effort matters. ❤️",
  "Consistency is key. One task at a time! ✨",
  "Building great habits together, one day at a time! 🎯",
  "Your dedication is inspiring. Keep up the great work! 🏆",
  "Progress, not perfection. You've got this! 💫",
  "Every completed task is a win. Celebrate it! 🎉",
  "Today is a great day to build good habits! 🌈",
  "Family teamwork makes the dream work! 👨‍👩‍👧‍👦",
];

const NOTIFICATION_MAP_KEY = 'notificationMap';

type NotificationMap = Record<string, string>;

const getNotificationMap = async (): Promise<NotificationMap> => {
  const stored = await AsyncStorage.getItem(NOTIFICATION_MAP_KEY);
  if (!stored) return {};
  try {
    return JSON.parse(stored) as NotificationMap;
  } catch {
    return {};
  }
};

const setNotificationMap = async (map: NotificationMap): Promise<void> => {
  await AsyncStorage.setItem(NOTIFICATION_MAP_KEY, JSON.stringify(map));
};

const scheduleNotificationWithKey = async (
  key: string,
  content: Notifications.NotificationContentInput,
  trigger: Notifications.NotificationTriggerInput
): Promise<string | null> => {
  const map = await getNotificationMap();
  if (map[key]) {
    await Notifications.cancelScheduledNotificationAsync(map[key]);
  }

  try {
    const id = await Notifications.scheduleNotificationAsync({
      content,
      trigger,
    });
    map[key] = id;
    await setNotificationMap(map);
    return id;
  } catch {
    return null;
  }
};

const cancelNotificationWithKey = async (key: string): Promise<void> => {
  const map = await getNotificationMap();
  const id = map[key];
  if (!id) return;
  try {
    await Notifications.cancelScheduledNotificationAsync(id);
  } catch {
    // ignore
  }
  delete map[key];
  await setNotificationMap(map);
};

const cancelNotificationsByPrefix = async (prefix: string): Promise<void> => {
  const map = await getNotificationMap();
  const keys = Object.keys(map).filter((k) => k.startsWith(prefix));
  if (keys.length === 0) return;
  await Promise.all(
    keys.map(async (key) => {
      const id = map[key];
      try {
        await Notifications.cancelScheduledNotificationAsync(id);
      } catch {
        // ignore
      }
      delete map[key];
    })
  );
  await setNotificationMap(map);
};

// Configure how notifications appear when app is in foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

// Request notification permissions
export async function requestNotificationPermissions(): Promise<boolean> {
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    console.log('Notification permissions not granted');
    return false;
  }

  // Android requires notification channels
  if (Platform.OS === 'android') {
    // Task alarms - highest priority
    await Notifications.setNotificationChannelAsync(NOTIFICATION_CHANNELS.TASK_ALARMS, {
      name: 'Task Alarms',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      sound: 'default',
      enableLights: true,
      enableVibrate: true,
      showBadge: true,
    });

    // Routine reminders
    await Notifications.setNotificationChannelAsync(NOTIFICATION_CHANNELS.ROUTINE_REMINDERS, {
      name: 'Routine Reminders',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 200, 100, 200],
      sound: 'default',
      enableVibrate: true,
      showBadge: true,
    });

    // Deadline alerts
    await Notifications.setNotificationChannelAsync(NOTIFICATION_CHANNELS.DEADLINE_ALERTS, {
      name: 'Deadline Alerts',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 300, 150, 300],
      sound: 'default',
      enableVibrate: true,
      showBadge: true,
    });

    // Learning reminders
    await Notifications.setNotificationChannelAsync(NOTIFICATION_CHANNELS.LEARNING_REMINDERS, {
      name: 'Learning Reminders',
      importance: Notifications.AndroidImportance.DEFAULT,
      sound: 'default',
      showBadge: true,
    });

    // Overdue alerts
    await Notifications.setNotificationChannelAsync(NOTIFICATION_CHANNELS.OVERDUE_ALERTS, {
      name: 'Overdue Alerts',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 400, 200, 400],
      sound: 'default',
      enableVibrate: true,
      showBadge: true,
    });

    // Motivational
    await Notifications.setNotificationChannelAsync(NOTIFICATION_CHANNELS.MOTIVATION, {
      name: 'Motivational Messages',
      importance: Notifications.AndroidImportance.DEFAULT,
      sound: 'default',
      showBadge: false,
    });
  }

  return true;
}

// Schedule a notification for a task
export async function scheduleTaskNotification(task: Task): Promise<string | null> {
  // Only schedule if task has a start time and is pending
  if (!task.startTime || task.status !== 'pending') {
    return null;
  }

  // Parse the start time
  const [hours, minutes] = task.startTime.split(':').map(Number);
  
  // Get the task date (today if no due date)
  const taskDate = task.dueDate ? new Date(task.dueDate) : new Date();
  
  // Create the trigger time
  const triggerDate = new Date(taskDate);
  triggerDate.setHours(hours, minutes, 0, 0);
  
  // Don't schedule if the time has already passed
  const now = new Date();
  if (triggerDate <= now) return null;

  return await scheduleNotificationWithKey(
    `task-start:${task.id}`,
    {
      title: '⏰ Task Time!',
      body: task.title,
      subtitle: task.description || undefined,
      data: { taskId: task.id },
      sound: true,
      priority: Notifications.AndroidNotificationPriority.MAX,
      categoryIdentifier: 'task-alarm',
    },
    {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date: triggerDate,
    }
  );
}

export async function scheduleOverdueTaskNotification(task: Task): Promise<string | null> {
  if (!task.endTime || task.status !== 'pending') return null;

  const [hours, minutes] = task.endTime.split(':').map(Number);
  const taskDate = task.dueDate ? new Date(task.dueDate) : new Date();
  const triggerDate = new Date(taskDate);
  triggerDate.setHours(hours, minutes, 0, 0);

  const now = new Date();
  if (triggerDate <= now) return null;

  return await scheduleNotificationWithKey(
    `task-overdue:${task.id}`,
    {
      title: '⚠️ Task Overdue',
      body: task.title,
      data: { taskId: task.id },
      sound: true,
      priority: Notifications.AndroidNotificationPriority.HIGH,
    },
    {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date: triggerDate,
    }
  );
}

// Cancel a task notification
export async function cancelTaskNotification(taskId: string): Promise<void> {
  await cancelNotificationWithKey(`task-start:${taskId}`);
  await cancelNotificationWithKey(`task-overdue:${taskId}`);
}

// Cancel all task notifications
export async function cancelAllTaskNotifications(): Promise<void> {
  await cancelNotificationsByPrefix('task-start:');
  await cancelNotificationsByPrefix('task-overdue:');
}

// Get all scheduled notifications (for debugging)
export async function getScheduledNotifications(): Promise<Notifications.NotificationRequest[]> {
  return await Notifications.getAllScheduledNotificationsAsync();
}

// Schedule notifications for multiple tasks
export async function scheduleAllTaskNotifications(tasks: Task[]): Promise<void> {
  // Cancel all existing task notifications first
  await cancelAllTaskNotifications();

  const pendingTasks = tasks.filter((t) => t.status === 'pending');
  for (const task of pendingTasks) {
    if (task.startTime) {
      await scheduleTaskNotification(task);
    }
    if (task.endTime) {
      await scheduleOverdueTaskNotification(task);
    }
  }
}

export async function scheduleRoutineNotifications(routines: Routine[]): Promise<void> {
  await cancelNotificationsByPrefix('routine:');

  const enabled = routines.filter((r) => r.reminderEnabled && r.reminderTime);
  for (const routine of enabled) {
    const [hours, minutes] = routine.reminderTime.split(':').map(Number);
    await scheduleNotificationWithKey(
      `routine:${routine.id}`,
      {
        title: '⏰ Routine Time',
        body: routine.title,
        data: { routineId: routine.id },
        sound: true,
      },
      {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour: hours,
        minute: minutes,
      }
    );
  }
}

export async function scheduleDeadlineNotifications(deadlines: Deadline[]): Promise<void> {
  await cancelNotificationsByPrefix('deadline:');

  const active = deadlines.filter((d) => !d.isCompleted);
  for (const deadline of active) {
    const [h, m] = (deadline.dueTime || '09:00').split(':').map(Number);
    const dueDate = new Date(deadline.dueDate);
    dueDate.setHours(h, m, 0, 0);

    const oneDayBefore = new Date(dueDate);
    oneDayBefore.setDate(dueDate.getDate() - 1);
    const oneHourBefore = new Date(dueDate);
    oneHourBefore.setHours(dueDate.getHours() - 1);

    const now = new Date();
    if (oneDayBefore > now) {
      await scheduleNotificationWithKey(
        `deadline:1d:${deadline.id}`,
        {
          title: '📅 Deadline Tomorrow',
          body: deadline.title,
          data: { deadlineId: deadline.id },
          sound: true,
        },
        {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date: oneDayBefore,
        }
      );
    }

    if (oneHourBefore > now) {
      await scheduleNotificationWithKey(
        `deadline:1h:${deadline.id}`,
        {
          title: '⏰ Deadline in 1 Hour',
          body: deadline.title,
          data: { deadlineId: deadline.id },
          sound: true,
        },
        {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date: oneHourBefore,
        }
      );
    }
  }
}

export async function scheduleLearningTaskNotifications(tasks: LearningTask[]): Promise<void> {
  await cancelNotificationsByPrefix('learning:');

  const enabled = tasks.filter((t) => t.isEnabled && t.timeOfDay);
  for (const task of enabled) {
    const [hours, minutes] = (task.timeOfDay || '16:00').split(':').map(Number);

    if (task.frequency === 'daily') {
      await scheduleNotificationWithKey(
        `learning:daily:${task.id}`,
        {
          title: '📚 Learning Time',
          body: task.title,
          data: { learningTaskId: task.id },
          sound: true,
        },
        {
          type: Notifications.SchedulableTriggerInputTypes.DAILY,
          hour: hours,
          minute: minutes,
        }
      );
    }

    if (task.frequency === 'weekly') {
      for (const day of task.daysOfWeek) {
        const weekday = day === 0 ? 1 : day + 1; // 0-6 -> 1-7 (Sunday = 1)
        await scheduleNotificationWithKey(
          `learning:weekly:${task.id}:${weekday}`,
          {
            title: '📚 Learning Time',
            body: task.title,
            data: { learningTaskId: task.id },
            sound: true,
          },
          {
            type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
            weekday,
            hour: hours,
            minute: minutes,
          }
        );
      }
    }
  }
}

export async function scheduleMotivationalNotifications(): Promise<void> {
  await cancelNotificationsByPrefix('motivation:');

  const quote = MOTIVATIONAL_QUOTES[Math.floor(Math.random() * MOTIVATIONAL_QUOTES.length)];
  await scheduleNotificationWithKey(
    'motivation:daily',
    {
      title: '💫 Daily Motivation',
      body: quote,
      sound: false,
    },
    {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour: 8,
      minute: 0,
    }
  );
}

export async function scheduleAllNotifications(params: {
  tasks: Task[];
  routines: Routine[];
  deadlines: Deadline[];
  learningTasks: LearningTask[];
  notifications: NotificationSettings;
}): Promise<void> {
  const hasPermission = await requestNotificationPermissions();
  if (!hasPermission) return;

  if (params.notifications.taskReminders) {
    await scheduleAllTaskNotifications(params.tasks);
  } else {
    await cancelAllTaskNotifications();
  }

  if (params.notifications.routineReminders) {
    await scheduleRoutineNotifications(params.routines);
  } else {
    await cancelNotificationsByPrefix('routine:');
  }

  if (params.notifications.urgentAlerts) {
    await scheduleDeadlineNotifications(params.deadlines);
  } else {
    await cancelNotificationsByPrefix('deadline:');
    await cancelNotificationsByPrefix('task-overdue:');
  }

  await scheduleLearningTaskNotifications(params.learningTasks);

  if (params.notifications.motivationalNudges) {
    await scheduleMotivationalNotifications();
  } else {
    await cancelNotificationsByPrefix('motivation:');
  }
}

export async function triggerTestNotification(): Promise<void> {
  const hasPermission = await requestNotificationPermissions();
  if (!hasPermission) return;

  await Notifications.scheduleNotificationAsync({
    content: {
      title: '✅ Test Alert',
      body: 'Your notifications are working.',
      sound: true,
    },
    trigger: { type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL, seconds: 1 },
  });
}

// Add listener for when notification is received
export function addNotificationReceivedListener(
  callback: (notification: Notifications.Notification) => void
): Notifications.EventSubscription {
  return Notifications.addNotificationReceivedListener(callback);
}

// Add listener for when notification is tapped
export function addNotificationResponseListener(
  callback: (response: Notifications.NotificationResponse) => void
): Notifications.EventSubscription {
  return Notifications.addNotificationResponseReceivedListener(callback);
}
