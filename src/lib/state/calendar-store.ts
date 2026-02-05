import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { nanoid } from "nanoid/non-secure";

export type EventCategory =
  | "school"
  | "activity"
  | "appointment"
  | "family"
  | "birthday"
  | "holiday"
  | "other";

export type RecurrenceType = "none" | "daily" | "weekly" | "monthly" | "yearly";

export interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  category: EventCategory;
  color: string;

  // Timing
  date: string; // YYYY-MM-DD
  startTime?: string; // HH:mm
  endTime?: string; // HH:mm
  allDay: boolean;

  // Recurrence
  recurrence: RecurrenceType;
  recurrenceEndDate?: string;

  // Assignment
  childIds?: string[]; // Which children this event is for
  isFamily: boolean; // If true, applies to whole family

  // Metadata
  createdAt: string;
  createdBy?: string;
  reminder?: number; // Minutes before
}

export const EVENT_CATEGORIES: Record<EventCategory, { label: string; color: string; emoji: string }> = {
  school: { label: "School", color: "#3b82f6", emoji: "🏫" },
  activity: { label: "Activity", color: "#10b981", emoji: "⚽" },
  appointment: { label: "Appointment", color: "#f59e0b", emoji: "🏥" },
  family: { label: "Family", color: "#8b5cf6", emoji: "👨‍👩‍👧‍👦" },
  birthday: { label: "Birthday", color: "#ec4899", emoji: "🎂" },
  holiday: { label: "Holiday", color: "#ef4444", emoji: "🎉" },
  other: { label: "Other", color: "#6b7280", emoji: "📅" },
};

interface CalendarState {
  events: CalendarEvent[];
  selectedDate: string;
  viewMode: "month" | "week" | "year";

  // Actions
  addEvent: (event: Omit<CalendarEvent, "id" | "createdAt">) => CalendarEvent;
  updateEvent: (id: string, updates: Partial<CalendarEvent>) => void;
  removeEvent: (id: string) => void;
  setSelectedDate: (date: string) => void;
  setViewMode: (mode: "month" | "week" | "year") => void;

  // Queries
  getEventsForDate: (date: string) => CalendarEvent[];
  getEventsForMonth: (year: number, month: number) => CalendarEvent[];
  getEventsForChild: (childId: string) => CalendarEvent[];
  getUpcomingEvents: (days?: number) => CalendarEvent[];

  resetStore: () => void;
}

const getToday = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
};

const initialState = {
  events: [],
  selectedDate: getToday(),
  viewMode: "month" as const,
};

export const useCalendarStore = create<CalendarState>()(
  persist(
    (set, get) => ({
      ...initialState,

      addEvent: (eventData) => {
        const newEvent: CalendarEvent = {
          id: nanoid(),
          ...eventData,
          createdAt: new Date().toISOString(),
        };
        set((state) => ({
          events: [...state.events, newEvent],
        }));
        return newEvent;
      },

      updateEvent: (id, updates) => {
        set((state) => ({
          events: state.events.map((e) =>
            e.id === id ? { ...e, ...updates } : e
          ),
        }));
      },

      removeEvent: (id) => {
        set((state) => ({
          events: state.events.filter((e) => e.id !== id),
        }));
      },

      setSelectedDate: (date) => {
        set({ selectedDate: date });
      },

      setViewMode: (mode) => {
        set({ viewMode: mode });
      },

      getEventsForDate: (date) => {
        const { events } = get();
        return events.filter((e) => {
          // Direct match
          if (e.date === date) return true;

          // Check recurrence
          if (e.recurrence === "none") return false;

          const eventDate = new Date(e.date);
          const targetDate = new Date(date);

          // Check if target is before event start
          if (targetDate < eventDate) return false;

          // Check if past recurrence end
          if (e.recurrenceEndDate && targetDate > new Date(e.recurrenceEndDate)) return false;

          switch (e.recurrence) {
            case "daily":
              return true;
            case "weekly":
              return eventDate.getDay() === targetDate.getDay();
            case "monthly":
              return eventDate.getDate() === targetDate.getDate();
            case "yearly":
              return (
                eventDate.getMonth() === targetDate.getMonth() &&
                eventDate.getDate() === targetDate.getDate()
              );
            default:
              return false;
          }
        });
      },

      getEventsForMonth: (year, month) => {
        const { events } = get();
        return events.filter((e) => {
          const eventDate = new Date(e.date);
          return eventDate.getFullYear() === year && eventDate.getMonth() === month;
        });
      },

      getEventsForChild: (childId) => {
        const { events } = get();
        return events.filter(
          (e) => e.isFamily || (e.childIds && e.childIds.includes(childId))
        );
      },

      getUpcomingEvents: (days = 7) => {
        const { events } = get();
        const now = new Date();
        const endDate = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);

        return events
          .filter((e) => {
            const eventDate = new Date(e.date);
            return eventDate >= now && eventDate <= endDate;
          })
          .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      },

      resetStore: () => {
        set(initialState);
      },
    }),
    {
      name: "calendar-store",
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);

// Helper to generate month dates
export const generateMonthDates = (year: number, month: number) => {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startPadding = firstDay.getDay(); // Days from previous month to show
  const totalDays = lastDay.getDate();

  const dates: { date: string; isCurrentMonth: boolean; isToday: boolean }[] = [];

  // Previous month padding
  const prevMonth = month === 0 ? 11 : month - 1;
  const prevYear = month === 0 ? year - 1 : year;
  const prevMonthLastDay = new Date(prevYear, prevMonth + 1, 0).getDate();

  for (let i = startPadding - 1; i >= 0; i--) {
    const day = prevMonthLastDay - i;
    dates.push({
      date: `${prevYear}-${String(prevMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`,
      isCurrentMonth: false,
      isToday: false,
    });
  }

  // Current month
  const today = getToday();
  for (let day = 1; day <= totalDays; day++) {
    const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    dates.push({
      date: dateStr,
      isCurrentMonth: true,
      isToday: dateStr === today,
    });
  }

  // Next month padding (fill to 42 cells for 6 rows)
  const remaining = 42 - dates.length;
  const nextMonth = month === 11 ? 0 : month + 1;
  const nextYear = month === 11 ? year + 1 : year;

  for (let day = 1; day <= remaining; day++) {
    dates.push({
      date: `${nextYear}-${String(nextMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`,
      isCurrentMonth: false,
      isToday: false,
    });
  }

  return dates;
};

export const formatDateDisplay = (dateStr: string) => {
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

export const getMonthName = (month: number) => {
  return new Date(2024, month, 1).toLocaleDateString("en-US", { month: "long" });
};
