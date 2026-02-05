/// <reference types="nativewind/types" />

import { useState, useMemo } from "react";
import {
  Modal,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
  Switch,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";
import { Stack, useRouter } from "expo-router";
import DateTimePicker, { DateTimePickerEvent } from "@react-native-community/datetimepicker";
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  X,
  Check,
  Trash2,
  Calendar,
  Clock,
  Users,
  Repeat,
} from "lucide-react-native";
import {
  useCalendarStore,
  CalendarEvent,
  EventCategory,
  RecurrenceType,
  EVENT_CATEGORIES,
  generateMonthDates,
  getMonthName,
  formatDateDisplay,
} from "../lib/state/calendar-store";
import { useAppStore } from "../lib/state/app-store";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const RECURRENCE_OPTIONS: { label: string; value: RecurrenceType }[] = [
  { label: "Does not repeat", value: "none" },
  { label: "Daily", value: "daily" },
  { label: "Weekly", value: "weekly" },
  { label: "Monthly", value: "monthly" },
  { label: "Yearly", value: "yearly" },
];

export default function FamilyCalendarScreen() {
  const router = useRouter();

  const events = useCalendarStore((state) => state.events);
  const selectedDate = useCalendarStore((state) => state.selectedDate);
  const setSelectedDate = useCalendarStore((state) => state.setSelectedDate);
  const addEvent = useCalendarStore((state) => state.addEvent);
  const updateEvent = useCalendarStore((state) => state.updateEvent);
  const removeEvent = useCalendarStore((state) => state.removeEvent);
  const getEventsForDate = useCalendarStore((state) => state.getEventsForDate);

  const children = useAppStore((state) => state.children);
  const activeChildren = useMemo(
    () => children.filter((c) => !c.archived),
    [children]
  );

  // Current month view
  const [currentYear, setCurrentYear] = useState(() => new Date().getFullYear());
  const [currentMonth, setCurrentMonth] = useState(() => new Date().getMonth());

  // Modal states
  const [eventModalOpen, setEventModalOpen] = useState(false);
  const [editingEventId, setEditingEventId] = useState<string | null>(null);

  // Form states
  const [eventTitle, setEventTitle] = useState("");
  const [eventDescription, setEventDescription] = useState("");
  const [eventCategory, setEventCategory] = useState<EventCategory>("other");
  const [eventDateObj, setEventDateObj] = useState<Date>(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [eventStartTimeObj, setEventStartTimeObj] = useState<Date>(new Date(2026, 0, 1, 9, 0));
  const [eventEndTimeObj, setEventEndTimeObj] = useState<Date>(new Date(2026, 0, 1, 10, 0));
  const [showStartTimePicker, setShowStartTimePicker] = useState(false);
  const [showEndTimePicker, setShowEndTimePicker] = useState(false);
  const [eventAllDay, setEventAllDay] = useState(false);
  const [eventRecurrence, setEventRecurrence] = useState<RecurrenceType>("none");
  const [eventIsFamily, setEventIsFamily] = useState(true);
  const [eventChildIds, setEventChildIds] = useState<string[]>([]);

  // Helper functions for date/time conversion
  const formatDateForStorage = (date: Date) => {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
  };

  const formatTimeForStorage = (date: Date) => {
    return `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
  };

  const formatDateForDisplay = (date: Date) => {
    return date.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" });
  };

  const formatTimeForDisplay = (date: Date) => {
    return date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  };

  const parseDateString = (dateStr: string): Date => {
    const [year, month, day] = dateStr.split("-").map(Number);
    return new Date(year, month - 1, day);
  };

  const parseTimeString = (timeStr: string): Date => {
    const [hours, minutes] = timeStr.split(":").map(Number);
    const date = new Date(2026, 0, 1, hours, minutes);
    return date;
  };

  const monthDates = useMemo(
    () => generateMonthDates(currentYear, currentMonth),
    [currentYear, currentMonth]
  );

  const selectedDateEvents = useMemo(
    () => getEventsForDate(selectedDate),
    [selectedDate, events, getEventsForDate]
  );

  const goToPrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const goToNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  const goToToday = () => {
    const now = new Date();
    setCurrentYear(now.getFullYear());
    setCurrentMonth(now.getMonth());
    const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
    setSelectedDate(today);
  };

  const openAddModal = () => {
    setEditingEventId(null);
    setEventTitle("");
    setEventDescription("");
    setEventCategory("other");
    setEventDateObj(parseDateString(selectedDate));
    setEventStartTimeObj(new Date(2026, 0, 1, 9, 0));
    setEventEndTimeObj(new Date(2026, 0, 1, 10, 0));
    setEventAllDay(false);
    setEventRecurrence("none");
    setEventIsFamily(true);
    setEventChildIds([]);
    setEventModalOpen(true);
  };

  const openEditModal = (event: CalendarEvent) => {
    setEditingEventId(event.id);
    setEventTitle(event.title);
    setEventDescription(event.description || "");
    setEventCategory(event.category);
    setEventDateObj(parseDateString(event.date));
    setEventStartTimeObj(event.startTime ? parseTimeString(event.startTime) : new Date(2026, 0, 1, 9, 0));
    setEventEndTimeObj(event.endTime ? parseTimeString(event.endTime) : new Date(2026, 0, 1, 10, 0));
    setEventAllDay(event.allDay);
    setEventRecurrence(event.recurrence);
    setEventIsFamily(event.isFamily);
    setEventChildIds(event.childIds || []);
    setEventModalOpen(true);
  };

  const handleSave = () => {
    if (!eventTitle.trim()) return;

    const categoryInfo = EVENT_CATEGORIES[eventCategory];
    const eventData = {
      title: eventTitle.trim(),
      description: eventDescription.trim() || undefined,
      category: eventCategory,
      color: categoryInfo.color,
      date: formatDateForStorage(eventDateObj),
      startTime: eventAllDay ? undefined : formatTimeForStorage(eventStartTimeObj),
      endTime: eventAllDay ? undefined : formatTimeForStorage(eventEndTimeObj),
      allDay: eventAllDay,
      recurrence: eventRecurrence,
      isFamily: eventIsFamily,
      childIds: eventIsFamily ? undefined : eventChildIds,
    };

    if (editingEventId) {
      updateEvent(editingEventId, eventData);
    } else {
      addEvent(eventData);
    }
    setEventModalOpen(false);
  };

  const handleDelete = () => {
    if (editingEventId) {
      removeEvent(editingEventId);
      setEventModalOpen(false);
    }
  };

  const toggleChildSelection = (childId: string) => {
    setEventChildIds((prev) =>
      prev.includes(childId)
        ? prev.filter((id) => id !== childId)
        : [...prev, childId]
    );
  };

  const getEventsForDateCell = (date: string) => {
    return events.filter((e) => e.date === date);
  };

  return (
    <SafeAreaView className="flex-1 bg-slate-950" edges={["top"]}>
      <Stack.Screen
        options={{
          title: "Family Calendar",
          headerShown: false,
        }}
      />

      {/* Header */}
      <View className="flex-row items-center justify-between px-5 py-4 border-b border-slate-800">
        <Pressable
          onPress={() => router.back()}
          className="h-10 w-10 rounded-full bg-slate-800 items-center justify-center"
        >
          <ChevronLeft size={24} color="#fff" />
        </Pressable>
        <View className="flex-row items-center gap-2">
          <Calendar size={20} color="#3b82f6" />
          <Text className="text-xl font-bold text-white">Family Calendar</Text>
        </View>
        <Pressable
          onPress={openAddModal}
          className="h-10 w-10 rounded-full bg-blue-500/20 items-center justify-center"
        >
          <Plus size={24} color="#3b82f6" />
        </Pressable>
      </View>

      <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 40 }}>
        {/* Month Navigation */}
        <View className="px-5 py-4">
          <View className="flex-row items-center justify-between">
            <Pressable
              onPress={goToPrevMonth}
              className="h-10 w-10 rounded-full bg-slate-800 items-center justify-center"
            >
              <ChevronLeft size={20} color="#94a3b8" />
            </Pressable>
            <Pressable onPress={goToToday}>
              <Text className="text-xl font-bold text-white">
                {getMonthName(currentMonth)} {currentYear}
              </Text>
            </Pressable>
            <Pressable
              onPress={goToNextMonth}
              className="h-10 w-10 rounded-full bg-slate-800 items-center justify-center"
            >
              <ChevronRight size={20} color="#94a3b8" />
            </Pressable>
          </View>
        </View>

        {/* Calendar Grid */}
        <View className="px-3">
          {/* Weekday Headers */}
          <View className="flex-row mb-2">
            {WEEKDAYS.map((day) => (
              <View key={day} className="flex-1 items-center py-2">
                <Text className="text-xs text-slate-400 font-medium">{day}</Text>
              </View>
            ))}
          </View>

          {/* Date Grid */}
          <View className="flex-row flex-wrap">
            {monthDates.map((dateInfo, index) => {
              const dateEvents = getEventsForDateCell(dateInfo.date);
              const isSelected = dateInfo.date === selectedDate;
              const dayNumber = parseInt(dateInfo.date.split("-")[2]);

              return (
                <Pressable
                  key={index}
                  onPress={() => setSelectedDate(dateInfo.date)}
                  className={`w-[14.28%] aspect-square p-1`}
                >
                  <View
                    className={`flex-1 rounded-xl items-center justify-center ${
                      isSelected
                        ? "bg-blue-500"
                        : dateInfo.isToday
                        ? "bg-slate-800 border border-blue-500"
                        : "bg-transparent"
                    }`}
                  >
                    <Text
                      className={`text-sm font-medium ${
                        isSelected
                          ? "text-white"
                          : dateInfo.isCurrentMonth
                          ? dateInfo.isToday
                            ? "text-blue-400"
                            : "text-white"
                          : "text-slate-600"
                      }`}
                    >
                      {dayNumber}
                    </Text>
                    {/* Event Indicators */}
                    {dateEvents.length > 0 && (
                      <View className="flex-row gap-0.5 mt-1">
                        {dateEvents.slice(0, 3).map((event, i) => (
                          <View
                            key={i}
                            className="h-1.5 w-1.5 rounded-full"
                            style={{ backgroundColor: event.color }}
                          />
                        ))}
                      </View>
                    )}
                  </View>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* Selected Date Events */}
        <View className="px-5 mt-6">
          <View className="flex-row items-center justify-between mb-3">
            <Text className="text-lg font-semibold text-white">
              {formatDateDisplay(selectedDate)}
            </Text>
            <Pressable
              onPress={openAddModal}
              className="flex-row items-center gap-1 px-3 py-1.5 rounded-full bg-blue-500/20"
            >
              <Plus size={14} color="#3b82f6" />
              <Text className="text-sm text-blue-400 font-medium">Add</Text>
            </Pressable>
          </View>

          {selectedDateEvents.length === 0 ? (
            <View className="rounded-2xl border border-slate-800 border-dashed p-6 items-center">
              <Calendar size={24} color="#64748b" />
              <Text className="text-slate-400 text-center mt-2">
                No events on this day
              </Text>
            </View>
          ) : (
            <View className="gap-3">
              {selectedDateEvents.map((event) => {
                const categoryInfo = EVENT_CATEGORIES[event.category];
                return (
                  <Pressable
                    key={event.id}
                    onPress={() => openEditModal(event)}
                    className="rounded-2xl border border-slate-800 bg-slate-900 overflow-hidden"
                  >
                    <View
                      className="h-1"
                      style={{ backgroundColor: event.color }}
                    />
                    <View className="p-4">
                      <View className="flex-row items-start justify-between">
                        <View className="flex-1">
                          <View className="flex-row items-center gap-2 mb-1">
                            <Text className="text-lg">{categoryInfo.emoji}</Text>
                            <Text className="text-base font-medium text-white">
                              {event.title}
                            </Text>
                          </View>
                          {event.description && (
                            <Text className="text-sm text-slate-400 mb-2">
                              {event.description}
                            </Text>
                          )}
                          <View className="flex-row items-center gap-3">
                            {!event.allDay && event.startTime && (
                              <View className="flex-row items-center gap-1">
                                <Clock size={12} color="#64748b" />
                                <Text className="text-xs text-slate-400">
                                  {event.startTime}
                                  {event.endTime ? ` - ${event.endTime}` : ""}
                                </Text>
                              </View>
                            )}
                            {event.allDay && (
                              <Text className="text-xs text-slate-400">All day</Text>
                            )}
                            {event.recurrence !== "none" && (
                              <View className="flex-row items-center gap-1">
                                <Repeat size={12} color="#64748b" />
                                <Text className="text-xs text-slate-400 capitalize">
                                  {event.recurrence}
                                </Text>
                              </View>
                            )}
                            {event.isFamily && (
                              <View className="flex-row items-center gap-1">
                                <Users size={12} color="#8b5cf6" />
                                <Text className="text-xs text-purple-400">Family</Text>
                              </View>
                            )}
                          </View>
                        </View>
                      </View>
                    </View>
                  </Pressable>
                );
              })}
            </View>
          )}
        </View>

        {/* Quick Categories */}
        <View className="px-5 mt-6">
          <Text className="text-lg font-semibold text-white mb-3">Categories</Text>
          <View className="flex-row flex-wrap gap-2">
            {(Object.entries(EVENT_CATEGORIES) as [EventCategory, typeof EVENT_CATEGORIES["school"]][]).map(
              ([key, info]) => (
                <View
                  key={key}
                  className="flex-row items-center gap-2 px-3 py-2 rounded-full"
                  style={{ backgroundColor: `${info.color}20` }}
                >
                  <Text>{info.emoji}</Text>
                  <Text style={{ color: info.color }} className="text-sm font-medium">
                    {info.label}
                  </Text>
                </View>
              )
            )}
          </View>
        </View>
      </ScrollView>

      {/* Add/Edit Event Modal */}
      <Modal visible={eventModalOpen} animationType="slide" transparent>
        <View className="flex-1 justify-end bg-black/60">
          <View className="bg-slate-900 rounded-t-3xl border-t border-slate-800 max-h-[90%]">
            {/* Modal Header */}
            <View className="flex-row items-center justify-between p-5 border-b border-slate-800">
              <Pressable onPress={() => setEventModalOpen(false)}>
                <X size={24} color="#94a3b8" />
              </Pressable>
              <Text className="text-lg font-semibold text-white">
                {editingEventId ? "Edit Event" : "New Event"}
              </Text>
              <Pressable onPress={handleSave} disabled={!eventTitle.trim()}>
                <Check size={24} color={eventTitle.trim() ? "#10b981" : "#475569"} />
              </Pressable>
            </View>

            <KeyboardAwareScrollView 
              className="px-5 py-6"
              bottomOffset={50}
              keyboardShouldPersistTaps="handled"
            >
              {/* Title */}
              <Text className="text-sm font-medium text-slate-400 mb-2">Title</Text>
              <TextInput
                value={eventTitle}
                onChangeText={setEventTitle}
                placeholder="Event title"
                placeholderTextColor="#64748b"
                className="bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white mb-4"
              />

              {/* Description */}
              <Text className="text-sm font-medium text-slate-400 mb-2">Description</Text>
              <TextInput
                value={eventDescription}
                onChangeText={setEventDescription}
                placeholder="Optional description"
                placeholderTextColor="#64748b"
                multiline
                numberOfLines={3}
                textAlignVertical="top"
                className="bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white mb-4 min-h-[80px]"
              />

              {/* Category */}
              <Text className="text-sm font-medium text-slate-400 mb-2">Category</Text>
              <View className="flex-row flex-wrap gap-2 mb-4">
                {(Object.entries(EVENT_CATEGORIES) as [EventCategory, typeof EVENT_CATEGORIES["school"]][]).map(
                  ([key, info]) => {
                    const isSelected = eventCategory === key;
                    return (
                      <Pressable
                        key={key}
                        onPress={() => setEventCategory(key)}
                        className={`flex-row items-center gap-2 px-3 py-2 rounded-full border ${
                          isSelected
                            ? "border-blue-500 bg-blue-500/20"
                            : "border-slate-700 bg-slate-800"
                        }`}
                      >
                        <Text>{info.emoji}</Text>
                        <Text
                          className={`text-sm ${
                            isSelected ? "text-blue-400" : "text-slate-400"
                          }`}
                        >
                          {info.label}
                        </Text>
                      </Pressable>
                    );
                  }
                )}
              </View>

              {/* Date Picker */}
              <Text className="text-sm font-medium text-slate-400 mb-2">Date</Text>
              <Pressable
                onPress={() => setShowDatePicker(true)}
                className="bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 flex-row items-center justify-between mb-4"
              >
                <Text className="text-white">{formatDateForDisplay(eventDateObj)}</Text>
                <Calendar size={18} color="#64748b" />
              </Pressable>
              {showDatePicker && (
                <DateTimePicker
                  value={eventDateObj}
                  mode="date"
                  display={Platform.OS === "ios" ? "spinner" : "default"}
                  onChange={(event: DateTimePickerEvent, date?: Date) => {
                    if (Platform.OS === "android") setShowDatePicker(false);
                    if (event.type === "set" && date) setEventDateObj(date);
                  }}
                />
              )}
              {Platform.OS === "ios" && showDatePicker && (
                <Pressable
                  onPress={() => setShowDatePicker(false)}
                  className="py-2 rounded-xl bg-blue-500/20 mb-4"
                >
                  <Text className="text-center text-blue-400 font-medium">Done</Text>
                </Pressable>
              )}

              {/* All Day Toggle */}
              <View className="flex-row items-center justify-between mb-4">
                <Text className="text-white">All day event</Text>
                <Switch
                  value={eventAllDay}
                  onValueChange={setEventAllDay}
                  trackColor={{ false: "#475569", true: "#3b82f6" }}
                  thumbColor="#fff"
                />
              </View>

              {/* Time Pickers (if not all day) */}
              {!eventAllDay && (
                <View className="flex-row gap-3 mb-4">
                  <View className="flex-1">
                    <Text className="text-sm font-medium text-slate-400 mb-2">Start Time</Text>
                    <Pressable
                      onPress={() => setShowStartTimePicker(true)}
                      className="bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 flex-row items-center justify-between"
                    >
                      <Text className="text-white">{formatTimeForDisplay(eventStartTimeObj)}</Text>
                      <Clock size={18} color="#64748b" />
                    </Pressable>
                    {showStartTimePicker && (
                      <DateTimePicker
                        value={eventStartTimeObj}
                        mode="time"
                        display={Platform.OS === "ios" ? "spinner" : "default"}
                        onChange={(event: DateTimePickerEvent, date?: Date) => {
                          if (Platform.OS === "android") setShowStartTimePicker(false);
                          if (event.type === "set" && date) setEventStartTimeObj(date);
                        }}
                      />
                    )}
                    {Platform.OS === "ios" && showStartTimePicker && (
                      <Pressable
                        onPress={() => setShowStartTimePicker(false)}
                        className="py-2 rounded-xl bg-blue-500/20 mt-2"
                      >
                        <Text className="text-center text-blue-400 font-medium">Done</Text>
                      </Pressable>
                    )}
                  </View>
                  <View className="flex-1">
                    <Text className="text-sm font-medium text-slate-400 mb-2">End Time</Text>
                    <Pressable
                      onPress={() => setShowEndTimePicker(true)}
                      className="bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 flex-row items-center justify-between"
                    >
                      <Text className="text-white">{formatTimeForDisplay(eventEndTimeObj)}</Text>
                      <Clock size={18} color="#64748b" />
                    </Pressable>
                    {showEndTimePicker && (
                      <DateTimePicker
                        value={eventEndTimeObj}
                        mode="time"
                        display={Platform.OS === "ios" ? "spinner" : "default"}
                        onChange={(event: DateTimePickerEvent, date?: Date) => {
                          if (Platform.OS === "android") setShowEndTimePicker(false);
                          if (event.type === "set" && date) setEventEndTimeObj(date);
                        }}
                      />
                    )}
                    {Platform.OS === "ios" && showEndTimePicker && (
                      <Pressable
                        onPress={() => setShowEndTimePicker(false)}
                        className="py-2 rounded-xl bg-blue-500/20 mt-2"
                      >
                        <Text className="text-center text-blue-400 font-medium">Done</Text>
                      </Pressable>
                    )}
                  </View>
                </View>
              )}

              {/* Recurrence */}
              <Text className="text-sm font-medium text-slate-400 mb-2">Repeat</Text>
              <View className="flex-row flex-wrap gap-2 mb-4">
                {RECURRENCE_OPTIONS.map((option) => {
                  const isSelected = eventRecurrence === option.value;
                  return (
                    <Pressable
                      key={option.value}
                      onPress={() => setEventRecurrence(option.value)}
                      className={`px-3 py-2 rounded-xl border ${
                        isSelected
                          ? "border-blue-500 bg-blue-500/20"
                          : "border-slate-700 bg-slate-800"
                      }`}
                    >
                      <Text
                        className={`text-sm ${
                          isSelected ? "text-blue-400" : "text-slate-400"
                        }`}
                      >
                        {option.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              {/* Family Event Toggle */}
              <View className="flex-row items-center justify-between mb-4">
                <Text className="text-white">Family event (applies to everyone)</Text>
                <Switch
                  value={eventIsFamily}
                  onValueChange={setEventIsFamily}
                  trackColor={{ false: "#475569", true: "#8b5cf6" }}
                  thumbColor="#fff"
                />
              </View>

              {/* Child Selection */}
              {!eventIsFamily && activeChildren.length > 0 && (
                <>
                  <Text className="text-sm font-medium text-slate-400 mb-2">
                    Which children?
                  </Text>
                  <View className="gap-2 mb-4">
                    {activeChildren.map((child) => {
                      const isSelected = eventChildIds.includes(child.id);
                      return (
                        <Pressable
                          key={child.id}
                          onPress={() => toggleChildSelection(child.id)}
                          className={`flex-row items-center p-3 rounded-xl border ${
                            isSelected
                              ? "border-emerald-500 bg-emerald-500/10"
                              : "border-slate-700 bg-slate-800"
                          }`}
                        >
                          <View
                            className={`h-5 w-5 rounded border-2 items-center justify-center mr-3 ${
                              isSelected
                                ? "border-emerald-500 bg-emerald-500"
                                : "border-slate-600"
                            }`}
                          >
                            {isSelected && <Check size={12} color="#fff" />}
                          </View>
                          <Text className="text-white">{child.name}</Text>
                        </Pressable>
                      );
                    })}
                  </View>
                </>
              )}

              {/* Delete Button */}
              {editingEventId && (
                <Pressable
                  onPress={handleDelete}
                  className="flex-row items-center justify-center gap-2 py-3 rounded-xl border border-red-500/30 bg-red-500/10 mt-4"
                >
                  <Trash2 size={16} color="#ef4444" />
                  <Text className="text-red-400 font-medium">Delete Event</Text>
                </Pressable>
              )}
            </KeyboardAwareScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
