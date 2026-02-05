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
  Clock,
  Sun,
  Moon,
  School,
  X,
  Check,
  Trash2,
  Edit3,
  CheckCircle2,
} from "lucide-react-native";
import {
  Routine,
  RoutineType,
  createRoutine,
  useProfileStore,
} from "../lib/state/profile-store";

const ROUTINE_TYPES: { label: string; value: RoutineType; icon: any; color: string }[] = [
  { label: "Morning", value: "morning", icon: Sun, color: "#f59e0b" },
  { label: "After School", value: "after_school", icon: School, color: "#3b82f6" },
  { label: "Bedtime", value: "bedtime", icon: Moon, color: "#8b5cf6" },
];

export default function MyRoutinesScreen() {
  const router = useRouter();

  const routines = useProfileStore((state) => state.routines);
  const addRoutine = useProfileStore((state) => state.addRoutine);
  const updateRoutine = useProfileStore((state) => state.updateRoutine);
  const removeRoutine = useProfileStore((state) => state.removeRoutine);
  const logRoutineComplete = useProfileStore((state) => state.logRoutineComplete);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingRoutineId, setEditingRoutineId] = useState<string | null>(null);
  const [routineType, setRoutineType] = useState<RoutineType>("morning");
  const [routineTitle, setRoutineTitle] = useState("");
  const [routineSteps, setRoutineSteps] = useState("");
  const [routineTimeObj, setRoutineTimeObj] = useState<Date>(new Date(2026, 0, 1, 7, 0));
  const [showTimePicker, setShowTimePicker] = useState(false);

  // Helper functions for time conversion
  const formatTimeForStorage = (date: Date) => {
    return `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
  };

  const formatTimeForDisplay = (date: Date) => {
    return date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  };

  const parseTimeString = (timeStr: string): Date => {
    const [hours, minutes] = timeStr.split(":").map(Number);
    return new Date(2026, 0, 1, hours, minutes);
  };

  const getDefaultTimeForType = (type: RoutineType): Date => {
    switch (type) {
      case "morning": return new Date(2026, 0, 1, 7, 0);
      case "after_school": return new Date(2026, 0, 1, 15, 0);
      case "bedtime": return new Date(2026, 0, 1, 20, 0);
      default: return new Date(2026, 0, 1, 7, 0);
    }
  };

  const groupedRoutines = useMemo(() => {
    const groups: Record<RoutineType, Routine[]> = {
      morning: [],
      after_school: [],
      bedtime: [],
    };
    routines.forEach((r) => {
      if (groups[r.type]) {
        groups[r.type].push(r);
      }
    });
    return groups;
  }, [routines]);

  const openAddModal = (type: RoutineType) => {
    setEditingRoutineId(null);
    setRoutineType(type);
    setRoutineTitle("");
    setRoutineSteps("");
    setRoutineTimeObj(getDefaultTimeForType(type));
    setModalOpen(true);
  };

  const openEditModal = (routine: Routine) => {
    setEditingRoutineId(routine.id);
    setRoutineType(routine.type);
    setRoutineTitle(routine.title);
    setRoutineSteps(routine.steps.join("\n"));
    setRoutineTimeObj(parseTimeString(routine.time));
    setModalOpen(true);
  };

  const handleSave = () => {
    const steps = routineSteps
      .split("\n")
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    if (!routineTitle.trim()) return;

    if (editingRoutineId) {
      updateRoutine(editingRoutineId, {
        title: routineTitle.trim(),
        type: routineType,
        steps,
        time: formatTimeForStorage(routineTimeObj),
      });
    } else {
      const newRoutine = createRoutine({
        title: routineTitle.trim(),
        type: routineType,
        steps,
        time: formatTimeForStorage(routineTimeObj),
      });
      addRoutine(newRoutine);
    }
    setModalOpen(false);
  };

  const handleDelete = () => {
    if (editingRoutineId) {
      removeRoutine(editingRoutineId);
      setModalOpen(false);
    }
  };

  const getRoutineTypeInfo = (type: RoutineType) => {
    return ROUTINE_TYPES.find((t) => t.value === type) || ROUTINE_TYPES[0];
  };

  return (
    <SafeAreaView className="flex-1 bg-slate-950" edges={["top"]}>
      <Stack.Screen
        options={{
          title: "My Routines",
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
        <Text className="text-xl font-bold text-white">My Routines</Text>
        <View className="w-10" />
      </View>

      <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 40 }}>
        {/* Introduction */}
        <View className="px-5 pt-6 pb-4">
          <Text className="text-slate-400 text-sm leading-relaxed">
            Create routines to help your family stay organized. Set up morning, after-school, and bedtime routines with step-by-step tasks.
          </Text>
        </View>

        {/* Routine Sections */}
        {ROUTINE_TYPES.map((typeInfo) => {
          const IconComponent = typeInfo.icon;
          const typeRoutines = groupedRoutines[typeInfo.value];

          return (
            <View key={typeInfo.value} className="px-5 mb-6">
              {/* Section Header */}
              <View className="flex-row items-center justify-between mb-3">
                <View className="flex-row items-center gap-2">
                  <View
                    className="h-8 w-8 rounded-full items-center justify-center"
                    style={{ backgroundColor: `${typeInfo.color}20` }}
                  >
                    <IconComponent size={16} color={typeInfo.color} />
                  </View>
                  <Text className="text-lg font-semibold text-white">
                    {typeInfo.label} Routines
                  </Text>
                </View>
                <Pressable
                  onPress={() => openAddModal(typeInfo.value)}
                  className="flex-row items-center gap-1 px-3 py-1.5 rounded-full"
                  style={{ backgroundColor: `${typeInfo.color}20` }}
                >
                  <Plus size={14} color={typeInfo.color} />
                  <Text style={{ color: typeInfo.color }} className="text-sm font-medium">
                    Add
                  </Text>
                </Pressable>
              </View>

              {/* Routines List */}
              {typeRoutines.length === 0 ? (
                <View className="rounded-2xl border border-slate-800 border-dashed p-6 items-center">
                  <Text className="text-slate-500 text-sm">
                    No {typeInfo.label.toLowerCase()} routines yet
                  </Text>
                  <Pressable
                    onPress={() => openAddModal(typeInfo.value)}
                    className="mt-3 px-4 py-2 rounded-full bg-slate-800"
                  >
                    <Text className="text-slate-300 text-sm">Create your first</Text>
                  </Pressable>
                </View>
              ) : (
                <View className="gap-3">
                  {typeRoutines.map((routine) => (
                    <View
                      key={routine.id}
                      className="rounded-2xl border border-slate-800 bg-slate-900 overflow-hidden"
                    >
                      {/* Routine Header */}
                      <View className="flex-row items-center justify-between p-4 border-b border-slate-800">
                        <View className="flex-1">
                          <Text className="text-base font-medium text-white">
                            {routine.title}
                          </Text>
                          <View className="flex-row items-center gap-2 mt-1">
                            <Clock size={12} color="#64748b" />
                            <Text className="text-xs text-slate-400">{routine.time}</Text>
                          </View>
                        </View>
                        <View className="flex-row items-center gap-2">
                          <Pressable
                            onPress={() => openEditModal(routine)}
                            className="h-8 w-8 rounded-full bg-slate-800 items-center justify-center"
                          >
                            <Edit3 size={14} color="#94a3b8" />
                          </Pressable>
                          <Pressable
                            onPress={() => logRoutineComplete(routine.id)}
                            className="h-8 w-8 rounded-full items-center justify-center"
                            style={{ backgroundColor: `${typeInfo.color}20` }}
                          >
                            <CheckCircle2 size={14} color={typeInfo.color} />
                          </Pressable>
                        </View>
                      </View>

                      {/* Routine Steps */}
                      {routine.steps.length > 0 && (
                        <View className="p-4">
                          {routine.steps.map((step, index) => (
                            <View key={index} className="flex-row items-start gap-3 mb-2">
                              <View className="h-5 w-5 rounded-full bg-slate-800 items-center justify-center mt-0.5">
                                <Text className="text-xs text-slate-400">{index + 1}</Text>
                              </View>
                              <Text className="text-sm text-slate-300 flex-1">{step}</Text>
                            </View>
                          ))}
                        </View>
                      )}

                      {/* Completion Count */}
                      {routine.completedCount > 0 && (
                        <View className="px-4 pb-4">
                          <Text className="text-xs text-slate-500">
                            Completed {routine.completedCount} times
                          </Text>
                        </View>
                      )}
                    </View>
                  ))}
                </View>
              )}
            </View>
          );
        })}
      </ScrollView>

      {/* Add/Edit Modal */}
      <Modal visible={modalOpen} animationType="slide" transparent>
        <View className="flex-1 justify-end bg-black/60">
          <View className="bg-slate-900 rounded-t-3xl border-t border-slate-800">
            {/* Modal Header */}
            <View className="flex-row items-center justify-between p-5 border-b border-slate-800">
              <Pressable onPress={() => setModalOpen(false)}>
                <X size={24} color="#94a3b8" />
              </Pressable>
              <Text className="text-lg font-semibold text-white">
                {editingRoutineId ? "Edit Routine" : "New Routine"}
              </Text>
              <Pressable onPress={handleSave} disabled={!routineTitle.trim()}>
                <Check size={24} color={routineTitle.trim() ? "#10b981" : "#475569"} />
              </Pressable>
            </View>

            <KeyboardAwareScrollView 
              className="max-h-96 px-5 py-4"
              bottomOffset={50}
              keyboardShouldPersistTaps="handled"
            >
              {/* Routine Type Selection */}
              <Text className="text-sm font-medium text-slate-400 mb-2">Type</Text>
              <View className="flex-row gap-2 mb-4">
                {ROUTINE_TYPES.map((t) => {
                  const IconComp = t.icon;
                  const isSelected = routineType === t.value;
                  return (
                    <Pressable
                      key={t.value}
                      onPress={() => setRoutineType(t.value)}
                      className={`flex-1 flex-row items-center justify-center gap-2 py-3 rounded-xl border ${
                        isSelected
                          ? "border-emerald-500 bg-emerald-500/10"
                          : "border-slate-700 bg-slate-800"
                      }`}
                    >
                      <IconComp size={16} color={isSelected ? "#10b981" : "#94a3b8"} />
                      <Text
                        className={`text-sm font-medium ${
                          isSelected ? "text-emerald-400" : "text-slate-400"
                        }`}
                      >
                        {t.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              {/* Title */}
              <Text className="text-sm font-medium text-slate-400 mb-2">Title</Text>
              <TextInput
                value={routineTitle}
                onChangeText={setRoutineTitle}
                placeholder="e.g., Morning Wake Up"
                placeholderTextColor="#64748b"
                className="bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white mb-4"
              />

              {/* Time Picker */}
              <Text className="text-sm font-medium text-slate-400 mb-2">Time</Text>
              <Pressable
                onPress={() => setShowTimePicker(true)}
                className="bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 flex-row items-center justify-between mb-4"
              >
                <Text className="text-white">{formatTimeForDisplay(routineTimeObj)}</Text>
                <Clock size={18} color="#64748b" />
              </Pressable>
              {showTimePicker && (
                <DateTimePicker
                  value={routineTimeObj}
                  mode="time"
                  display={Platform.OS === "ios" ? "spinner" : "default"}
                  onChange={(event: DateTimePickerEvent, date?: Date) => {
                    if (Platform.OS === "android") setShowTimePicker(false);
                    if (event.type === "set" && date) setRoutineTimeObj(date);
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

              {/* Steps */}
              <Text className="text-sm font-medium text-slate-400 mb-2">
                Steps (one per line)
              </Text>
              <TextInput
                value={routineSteps}
                onChangeText={setRoutineSteps}
                placeholder={"Wake up\nBrush teeth\nGet dressed\nEat breakfast"}
                placeholderTextColor="#64748b"
                multiline
                numberOfLines={6}
                textAlignVertical="top"
                className="bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white mb-4 min-h-[120px]"
              />

              {/* Delete Button */}
              {editingRoutineId && (
                <Pressable
                  onPress={handleDelete}
                  className="flex-row items-center justify-center gap-2 py-3 rounded-xl border border-red-500/30 bg-red-500/10 mb-4"
                >
                  <Trash2 size={16} color="#ef4444" />
                  <Text className="text-red-400 font-medium">Delete Routine</Text>
                </Pressable>
              )}
            </KeyboardAwareScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
