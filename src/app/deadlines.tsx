/// <reference types="nativewind/types" />

import { useState, useMemo } from "react";
import {
  Modal,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";
import { Stack, useRouter } from "expo-router";
import DateTimePicker, { DateTimePickerEvent } from "@react-native-community/datetimepicker";
import {
  ChevronLeft,
  Plus,
  X,
  Check,
  Trash2,
  AlertCircle,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Calendar,
} from "lucide-react-native";
import {
  useDeadlinesStore,
  Deadline,
  DeadlineCategory,
  DeadlinePriority,
  DEADLINE_CATEGORIES,
  DEADLINE_PRIORITIES,
  getDaysUntil,
  formatDueDate,
  getUrgencyColor,
} from "../lib/state/deadlines-store";
import { useAppStore } from "../lib/state/app-store";

export default function DeadlinesScreen() {
  const router = useRouter();

  const deadlines = useDeadlinesStore((state) => state.deadlines);
  const addDeadline = useDeadlinesStore((state) => state.addDeadline);
  const updateDeadline = useDeadlinesStore((state) => state.updateDeadline);
  const removeDeadline = useDeadlinesStore((state) => state.removeDeadline);
  const completeDeadline = useDeadlinesStore((state) => state.completeDeadline);
  const uncompleteDeadline = useDeadlinesStore((state) => state.uncompleteDeadline);
  const getOverdueDeadlines = useDeadlinesStore((state) => state.getOverdueDeadlines);
  const getUpcomingDeadlines = useDeadlinesStore((state) => state.getUpcomingDeadlines);

  const children = useAppStore((state) => state.children);
  const activeChildren = useMemo(
    () => children.filter((c) => !c.archived),
    [children]
  );

  const [showCompleted, setShowCompleted] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingDeadlineId, setEditingDeadlineId] = useState<string | null>(null);

  // Form states
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<DeadlineCategory>("other");
  const [priority, setPriority] = useState<DeadlinePriority>("medium");
  const [dueDateObj, setDueDateObj] = useState<Date>(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [dueTimeObj, setDueTimeObj] = useState<Date | null>(null);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [childIds, setChildIds] = useState<string[]>([]);

  // Helper functions for date/time conversion
  const formatDateForStorage = (date: Date) => {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
  };

  const formatTimeForStorage = (date: Date | null) => {
    if (!date) return undefined;
    return `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
  };

  const formatDateForDisplay = (date: Date) => {
    return date.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" });
  };

  const formatTimeForDisplayPicker = (date: Date | null) => {
    if (!date) return "Add time (optional)";
    return date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  };

  const parseDateString = (dateStr: string): Date => {
    const [year, month, day] = dateStr.split("-").map(Number);
    return new Date(year, month - 1, day);
  };

  const parseTimeString = (timeStr: string | undefined): Date | null => {
    if (!timeStr) return null;
    const [hours, minutes] = timeStr.split(":").map(Number);
    return new Date(2026, 0, 1, hours, minutes);
  };

  const overdueDeadlines = useMemo(() => getOverdueDeadlines(), [deadlines]);
  const upcomingDeadlines = useMemo(() => getUpcomingDeadlines(30), [deadlines]);
  const completedDeadlines = useMemo(
    () => deadlines.filter((d) => d.isCompleted),
    [deadlines]
  );

  const openAddModal = () => {
    setEditingDeadlineId(null);
    setTitle("");
    setDescription("");
    setCategory("other");
    setPriority("medium");
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    setDueDateObj(tomorrow);
    setDueTimeObj(null);
    setChildIds([]);
    setModalOpen(true);
  };

  const openEditModal = (deadline: Deadline) => {
    setEditingDeadlineId(deadline.id);
    setTitle(deadline.title);
    setDescription(deadline.description || "");
    setCategory(deadline.category);
    setPriority(deadline.priority);
    setDueDateObj(parseDateString(deadline.dueDate));
    setDueTimeObj(parseTimeString(deadline.dueTime));
    setChildIds(deadline.childIds || []);
    setModalOpen(true);
  };

  const handleSave = () => {
    if (!title.trim()) return;

    const deadlineData = {
      title: title.trim(),
      description: description.trim() || undefined,
      category,
      priority,
      dueDate: formatDateForStorage(dueDateObj),
      dueTime: formatTimeForStorage(dueTimeObj),
      childIds: childIds.length > 0 ? childIds : undefined,
    };

    if (editingDeadlineId) {
      updateDeadline(editingDeadlineId, deadlineData);
    } else {
      addDeadline(deadlineData);
    }
    setModalOpen(false);
  };

  const handleDelete = () => {
    if (editingDeadlineId) {
      removeDeadline(editingDeadlineId);
      setModalOpen(false);
    }
  };

  const toggleChildSelection = (childId: string) => {
    setChildIds((prev) =>
      prev.includes(childId)
        ? prev.filter((id) => id !== childId)
        : [...prev, childId]
    );
  };

  const renderDeadlineItem = (deadline: Deadline) => {
    const categoryInfo = DEADLINE_CATEGORIES[deadline.category];
    const priorityInfo = DEADLINE_PRIORITIES[deadline.priority];
    const urgencyColor = getUrgencyColor(deadline.dueDate, deadline.isCompleted);
    const daysUntil = getDaysUntil(deadline.dueDate);
    const isOverdue = daysUntil < 0 && !deadline.isCompleted;

    return (
      <Pressable
        key={deadline.id}
        onPress={() => openEditModal(deadline)}
        className={`rounded-2xl border bg-slate-900 overflow-hidden ${
          isOverdue ? "border-red-500/50" : "border-slate-800"
        }`}
      >
        {/* Priority Bar */}
        <View
          className="h-1"
          style={{ backgroundColor: priorityInfo.color }}
        />
        
        <View className="p-4">
          <View className="flex-row items-start">
            {/* Complete Button */}
            <Pressable
              onPress={() =>
                deadline.isCompleted
                  ? uncompleteDeadline(deadline.id)
                  : completeDeadline(deadline.id)
              }
              className={`h-6 w-6 rounded-full border-2 items-center justify-center mr-3 mt-0.5 ${
                deadline.isCompleted
                  ? "border-emerald-500 bg-emerald-500"
                  : "border-slate-600"
              }`}
            >
              {deadline.isCompleted && <Check size={14} color="#fff" />}
            </Pressable>

            <View className="flex-1">
              <View className="flex-row items-center gap-2 mb-1">
                <Text className="text-lg">{categoryInfo.emoji}</Text>
                <Text
                  className={`text-base font-medium flex-1 ${
                    deadline.isCompleted ? "text-slate-500 line-through" : "text-white"
                  }`}
                >
                  {deadline.title}
                </Text>
              </View>

              {deadline.description && (
                <Text
                  className={`text-sm mb-2 ${
                    deadline.isCompleted ? "text-slate-600" : "text-slate-400"
                  }`}
                >
                  {deadline.description}
                </Text>
              )}

              <View className="flex-row items-center flex-wrap gap-2">
                {/* Due Date */}
                <View
                  className="flex-row items-center gap-1 px-2 py-1 rounded"
                  style={{ backgroundColor: `${urgencyColor}20` }}
                >
                  <Clock size={12} color={urgencyColor} />
                  <Text style={{ color: urgencyColor }} className="text-xs font-medium">
                    {formatDueDate(deadline.dueDate)}
                  </Text>
                </View>

                {/* Category */}
                <View
                  className="px-2 py-1 rounded"
                  style={{ backgroundColor: `${categoryInfo.color}20` }}
                >
                  <Text style={{ color: categoryInfo.color }} className="text-xs">
                    {categoryInfo.label}
                  </Text>
                </View>

                {/* Priority Badge for High/Urgent */}
                {(deadline.priority === "high" || deadline.priority === "urgent") && (
                  <View
                    className="px-2 py-1 rounded"
                    style={{ backgroundColor: `${priorityInfo.color}20` }}
                  >
                    <Text style={{ color: priorityInfo.color }} className="text-xs font-medium">
                      {priorityInfo.label}
                    </Text>
                  </View>
                )}
              </View>
            </View>
          </View>
        </View>
      </Pressable>
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-slate-950" edges={["top"]}>
      <Stack.Screen
        options={{
          title: "Deadlines",
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
          <AlertCircle size={20} color="#ef4444" />
          <Text className="text-xl font-bold text-white">Deadlines</Text>
        </View>
        <Pressable
          onPress={openAddModal}
          className="h-10 w-10 rounded-full bg-red-500/20 items-center justify-center"
        >
          <Plus size={24} color="#ef4444" />
        </Pressable>
      </View>

      <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 40 }}>
        {/* Stats Overview */}
        <View className="px-5 pt-6">
          <View className="flex-row gap-3 mb-6">
            <View className="flex-1 rounded-2xl border border-red-500/30 bg-red-500/10 p-4">
              <View className="flex-row items-center gap-2 mb-1">
                <AlertTriangle size={16} color="#ef4444" />
                <Text className="text-xs text-red-400">Overdue</Text>
              </View>
              <Text className="text-2xl font-bold text-white">{overdueDeadlines.length}</Text>
            </View>
            <View className="flex-1 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4">
              <View className="flex-row items-center gap-2 mb-1">
                <Clock size={16} color="#f59e0b" />
                <Text className="text-xs text-amber-400">Upcoming</Text>
              </View>
              <Text className="text-2xl font-bold text-white">{upcomingDeadlines.length}</Text>
            </View>
            <View className="flex-1 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4">
              <View className="flex-row items-center gap-2 mb-1">
                <CheckCircle2 size={16} color="#10b981" />
                <Text className="text-xs text-emerald-400">Done</Text>
              </View>
              <Text className="text-2xl font-bold text-white">{completedDeadlines.length}</Text>
            </View>
          </View>
        </View>

        {/* Overdue Section */}
        {overdueDeadlines.length > 0 && (
          <View className="px-5 mb-6">
            <View className="flex-row items-center gap-2 mb-3">
              <AlertTriangle size={18} color="#ef4444" />
              <Text className="text-lg font-semibold text-red-400">Overdue</Text>
            </View>
            <View className="gap-3">
              {overdueDeadlines.map(renderDeadlineItem)}
            </View>
          </View>
        )}

        {/* Upcoming Section */}
        <View className="px-5 mb-6">
          <View className="flex-row items-center justify-between mb-3">
            <Text className="text-lg font-semibold text-white">Upcoming</Text>
            <Pressable
              onPress={openAddModal}
              className="flex-row items-center gap-1 px-3 py-1.5 rounded-full bg-red-500/20"
            >
              <Plus size={14} color="#ef4444" />
              <Text className="text-sm text-red-400 font-medium">Add</Text>
            </Pressable>
          </View>

          {upcomingDeadlines.length === 0 ? (
            <View className="rounded-2xl border border-slate-800 border-dashed p-6 items-center">
              <CheckCircle2 size={32} color="#10b981" />
              <Text className="text-emerald-400 text-center mt-2 font-medium">
                All caught up!
              </Text>
              <Text className="text-slate-500 text-center mt-1 text-sm">
                No upcoming deadlines
              </Text>
            </View>
          ) : (
            <View className="gap-3">
              {upcomingDeadlines.map(renderDeadlineItem)}
            </View>
          )}
        </View>

        {/* Completed Section */}
        {completedDeadlines.length > 0 && (
          <View className="px-5">
            <Pressable
              onPress={() => setShowCompleted(!showCompleted)}
              className="flex-row items-center justify-between mb-3"
            >
              <Text className="text-lg font-semibold text-white">
                Completed ({completedDeadlines.length})
              </Text>
              <Text className="text-sm text-slate-400">
                {showCompleted ? "Hide" : "Show"}
              </Text>
            </Pressable>

            {showCompleted && (
              <View className="gap-3">
                {completedDeadlines.map(renderDeadlineItem)}
              </View>
            )}
          </View>
        )}
      </ScrollView>

      {/* Add/Edit Modal */}
      <Modal visible={modalOpen} animationType="slide" transparent>
        <View className="flex-1 justify-end bg-black/60">
          <View className="bg-slate-900 rounded-t-3xl border-t border-slate-800 max-h-[90%]">
            {/* Modal Header */}
            <View className="flex-row items-center justify-between p-5 border-b border-slate-800">
              <Pressable onPress={() => setModalOpen(false)}>
                <X size={24} color="#94a3b8" />
              </Pressable>
              <Text className="text-lg font-semibold text-white">
                {editingDeadlineId ? "Edit Deadline" : "New Deadline"}
              </Text>
              <Pressable onPress={handleSave} disabled={!title.trim()}>
                <Check
                  size={24}
                  color={title.trim() ? "#10b981" : "#475569"}
                />
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
                value={title}
                onChangeText={setTitle}
                placeholder="e.g., School registration"
                placeholderTextColor="#64748b"
                className="bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white mb-4"
              />

              {/* Description */}
              <Text className="text-sm font-medium text-slate-400 mb-2">
                Description (optional)
              </Text>
              <TextInput
                value={description}
                onChangeText={setDescription}
                placeholder="Additional details"
                placeholderTextColor="#64748b"
                multiline
                numberOfLines={2}
                textAlignVertical="top"
                className="bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white mb-4"
              />

              {/* Category */}
              <Text className="text-sm font-medium text-slate-400 mb-2">Category</Text>
              <View className="flex-row flex-wrap gap-2 mb-4">
                {(Object.entries(DEADLINE_CATEGORIES) as [DeadlineCategory, typeof DEADLINE_CATEGORIES["school"]][]).map(
                  ([key, info]) => {
                    const isSelected = category === key;
                    return (
                      <Pressable
                        key={key}
                        onPress={() => setCategory(key)}
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

              {/* Priority */}
              <Text className="text-sm font-medium text-slate-400 mb-2">Priority</Text>
              <View className="flex-row gap-2 mb-4">
                {(Object.entries(DEADLINE_PRIORITIES) as [DeadlinePriority, typeof DEADLINE_PRIORITIES["low"]][]).map(
                  ([key, info]) => {
                    const isSelected = priority === key;
                    return (
                      <Pressable
                        key={key}
                        onPress={() => setPriority(key)}
                        className={`flex-1 py-2 rounded-xl border items-center ${
                          isSelected
                            ? `border-${info.color} bg-opacity-20`
                            : "border-slate-700 bg-slate-800"
                        }`}
                        style={
                          isSelected
                            ? { borderColor: info.color, backgroundColor: `${info.color}20` }
                            : undefined
                        }
                      >
                        <Text
                          className={`text-sm font-medium ${
                            isSelected ? "" : "text-slate-400"
                          }`}
                          style={isSelected ? { color: info.color } : undefined}
                        >
                          {info.label}
                        </Text>
                      </Pressable>
                    );
                  }
                )}
              </View>

              {/* Due Date Picker */}
              <Text className="text-sm font-medium text-slate-400 mb-2">Due Date</Text>
              <Pressable
                onPress={() => setShowDatePicker(true)}
                className="bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 flex-row items-center justify-between mb-4"
              >
                <Text className="text-white">{formatDateForDisplay(dueDateObj)}</Text>
                <Calendar size={18} color="#64748b" />
              </Pressable>
              {showDatePicker && (
                <DateTimePicker
                  value={dueDateObj}
                  mode="date"
                  display={Platform.OS === "ios" ? "spinner" : "default"}
                  onChange={(event: DateTimePickerEvent, date?: Date) => {
                    if (Platform.OS === "android") setShowDatePicker(false);
                    if (event.type === "set" && date) setDueDateObj(date);
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

              {/* Due Time Picker (optional) */}
              <Text className="text-sm font-medium text-slate-400 mb-2">
                Due Time (optional)
              </Text>
              <Pressable
                onPress={() => {
                  if (!dueTimeObj) setDueTimeObj(new Date(2026, 0, 1, 12, 0));
                  setShowTimePicker(true);
                }}
                className="bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 flex-row items-center justify-between mb-4"
              >
                <Text className={dueTimeObj ? "text-white" : "text-slate-500"}>
                  {formatTimeForDisplayPicker(dueTimeObj)}
                </Text>
                <View className="flex-row items-center gap-2">
                  {dueTimeObj && (
                    <Pressable onPress={() => setDueTimeObj(null)}>
                      <X size={16} color="#ef4444" />
                    </Pressable>
                  )}
                  <Clock size={18} color="#64748b" />
                </View>
              </Pressable>
              {showTimePicker && dueTimeObj && (
                <DateTimePicker
                  value={dueTimeObj}
                  mode="time"
                  display={Platform.OS === "ios" ? "spinner" : "default"}
                  onChange={(event: DateTimePickerEvent, date?: Date) => {
                    if (Platform.OS === "android") setShowTimePicker(false);
                    if (event.type === "set" && date) setDueTimeObj(date);
                  }}
                />
              )}
              {Platform.OS === "ios" && showTimePicker && (
                <Pressable
                  onPress={() => setShowTimePicker(false)}
                  className="py-2 rounded-xl bg-blue-500/20 mb-4"
                >
                  <Text className="text-center text-blue-400 font-medium">Done</Text>
                </Pressable>
              )}

              {/* Child Selection */}
              {activeChildren.length > 0 && (
                <>
                  <Text className="text-sm font-medium text-slate-400 mb-2">
                    For which children? (optional)
                  </Text>
                  <View className="gap-2 mb-4">
                    {activeChildren.map((child) => {
                      const isSelected = childIds.includes(child.id);
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
              {editingDeadlineId && (
                <Pressable
                  onPress={handleDelete}
                  className="flex-row items-center justify-center gap-2 py-3 rounded-xl border border-red-500/30 bg-red-500/10 mt-4"
                >
                  <Trash2 size={16} color="#ef4444" />
                  <Text className="text-red-400 font-medium">Delete Deadline</Text>
                </Pressable>
              )}
            </KeyboardAwareScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
