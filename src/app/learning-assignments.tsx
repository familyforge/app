import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Modal,
  TextInput,
  Switch,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Stack, useRouter } from "expo-router";
import type { DateTimePickerEvent } from "@react-native-community/datetimepicker";
import {
  ArrowLeft,
  Plus,
  BookOpen,
  Check,
  X,
  ChevronDown,
  Trash2,
  Edit2,
  Clock,
  Users,
  Star,
} from "lucide-react-native";
// Only import DateTimePicker on native platforms
const DateTimePicker = Platform.OS !== "web" 
  ? require("@react-native-community/datetimepicker").default 
  : null;
import Animated, { FadeInDown, FadeInUp } from "react-native-reanimated";
import { cn } from "../lib/cn";
import { useAppStore } from "../lib/state/app-store";
import {
  useLearningStore,
  LEARNING_CATEGORIES,
  LearningCategory,
  LearningTask,
} from "../lib/state/learning-store";

const DAYS_OF_WEEK = [
  { value: 0, label: "Sun", short: "S" },
  { value: 1, label: "Mon", short: "M" },
  { value: 2, label: "Tue", short: "T" },
  { value: 3, label: "Wed", short: "W" },
  { value: 4, label: "Thu", short: "T" },
  { value: 5, label: "Fri", short: "F" },
  { value: 6, label: "Sat", short: "S" },
];

export default function LearningAssignmentsScreen() {
  const router = useRouter();
  const children = useAppStore((s) => s.children);
  
  const tasks = useLearningStore((s) => s.tasks);
  const addTask = useLearningStore((s) => s.addTask);
  const updateTask = useLearningStore((s) => s.updateTask);
  const deleteTask = useLearningStore((s) => s.deleteTask);
  const toggleTask = useLearningStore((s) => s.toggleTask);
  
  const [modalVisible, setModalVisible] = useState(false);
  const [categoryDropdownOpen, setCategoryDropdownOpen] = useState(false);
  const [assignDropdownOpen, setAssignDropdownOpen] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [editingTask, setEditingTask] = useState<LearningTask | null>(null);
  
  // Form state
  const [selectedCategory, setSelectedCategory] = useState<LearningCategory>("maths");
  const [taskTitle, setTaskTitle] = useState("");
  const [taskDescription, setTaskDescription] = useState("");
  const [taskPoints, setTaskPoints] = useState("10");
  const [frequency, setFrequency] = useState<"daily" | "weekly">("daily");
  const [selectedDays, setSelectedDays] = useState<number[]>([0, 1, 2, 3, 4, 5, 6]);
  const [appliesTo, setAppliesTo] = useState<"all" | "selected">("all");
  const [selectedChildIds, setSelectedChildIds] = useState<string[]>([]);
  const [isQuestionBased, setIsQuestionBased] = useState(true);
  const [questionsPerSession, setQuestionsPerSession] = useState("10");
  const [timeOfDay, setTimeOfDay] = useState<Date | null>(null);
  
  const resetForm = () => {
    setSelectedCategory("maths");
    setTaskTitle("");
    setTaskDescription("");
    setTaskPoints("10");
    setFrequency("daily");
    setSelectedDays([0, 1, 2, 3, 4, 5, 6]);
    setAppliesTo("all");
    setSelectedChildIds([]);
    setIsQuestionBased(true);
    setQuestionsPerSession("10");
    setTimeOfDay(null);
    setEditingTask(null);
  };
  
  const openAddModal = () => {
    resetForm();
    setModalVisible(true);
  };
  
  const openEditModal = (task: LearningTask) => {
    setEditingTask(task);
    setSelectedCategory(task.categoryId);
    setTaskTitle(task.title);
    setTaskDescription(task.description);
    setTaskPoints(String(task.points));
    setFrequency(task.frequency);
    setSelectedDays(task.daysOfWeek);
    setAppliesTo(task.appliesTo);
    setSelectedChildIds(task.selectedChildIds);
    setIsQuestionBased(task.isQuestionBased);
    setQuestionsPerSession(String(task.questionsPerSession));
    setTimeOfDay(task.timeOfDay ? new Date(`2000-01-01T${task.timeOfDay}:00`) : null);
    setModalVisible(true);
  };
  
  const handleSaveTask = () => {
    const category = LEARNING_CATEGORIES.find((c) => c.id === selectedCategory);
    const title = taskTitle.trim() || category?.label || "Learning Task";
    const description = taskDescription.trim() || category?.description || "";
    
    const taskData = {
      categoryId: selectedCategory,
      title,
      description,
      isDefault: false,
      isEnabled: true,
      points: parseInt(taskPoints) || 10,
      hasNegativePoints: false,
      frequency,
      daysOfWeek: selectedDays,
      timeOfDay: timeOfDay
        ? `${String(timeOfDay.getHours()).padStart(2, "0")}:${String(timeOfDay.getMinutes()).padStart(2, "0")}`
        : undefined,
      appliesTo,
      selectedChildIds: appliesTo === "selected" ? selectedChildIds : [],
      isQuestionBased,
      questionsPerSession: parseInt(questionsPerSession) || 10,
    };
    
    if (editingTask) {
      updateTask(editingTask.id, taskData);
    } else {
      addTask(taskData);
    }
    
    setModalVisible(false);
    resetForm();
  };
  
  const handleDeleteTask = (task: LearningTask) => {
    if (task.isDefault) return;
    deleteTask(task.id);
  };
  
  const toggleDay = (day: number) => {
    setSelectedDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day].sort()
    );
  };
  
  const toggleChildSelection = (childId: string) => {
    setSelectedChildIds((prev) =>
      prev.includes(childId)
        ? prev.filter((id) => id !== childId)
        : [...prev, childId]
    );
  };
  
  const getCategoryInfo = (categoryId: LearningCategory) => {
    return LEARNING_CATEGORIES.find((c) => c.id === categoryId);
  };
  
  const formatDays = (days: number[]) => {
    if (days.length === 7) return "Every day";
    if (days.length === 5 && !days.includes(0) && !days.includes(6)) return "Weekdays";
    if (days.length === 2 && days.includes(0) && days.includes(6)) return "Weekends";
    return days.map((d) => DAYS_OF_WEEK[d].short).join(", ");
  };
  
  // Group tasks by default vs custom
  const defaultTasks = tasks.filter((t) => t.isDefault);
  const customTasks = tasks.filter((t) => !t.isDefault);
  
  return (
    <>
      <Stack.Screen
        options={{
          title: "Learning Assignments",
          headerStyle: { backgroundColor: "#0f172a" },
          headerTintColor: "#fff",
          headerLeft: () => (
            <Pressable onPress={() => router.back()} className="p-2">
              <ArrowLeft size={24} color="white" />
            </Pressable>
          ),
        }}
      />
      
      <SafeAreaView className="flex-1 bg-slate-900" edges={["bottom"]}>
        <ScrollView className="flex-1 px-4 py-4" showsVerticalScrollIndicator={false}>
          {/* Header Info */}
          <Animated.View entering={FadeInDown.duration(500)} className="mb-6">
            <View className="bg-slate-800/50 rounded-2xl p-4 border border-slate-700">
              <View className="flex-row items-center mb-2">
                <BookOpen size={24} color="#8b5cf6" />
                <Text className="text-white text-lg font-semibold ml-2">
                  Learning Tasks
                </Text>
              </View>
              <Text className="text-slate-400 text-sm">
                Set up daily or weekly learning tasks for your children. Default tasks
                (Word of the Day & Maths) award or deduct points based on completion.
              </Text>
            </View>
          </Animated.View>
          
          {/* Default Tasks */}
          <Animated.View entering={FadeInDown.delay(100).duration(500)} className="mb-6">
            <Text className="text-white text-lg font-semibold mb-3">
              Default Tasks
            </Text>
            <Text className="text-amber-400 text-xs mb-3">
              ⚠️ Default tasks will deduct points if not completed daily
            </Text>
            
            {defaultTasks.map((task) => {
              const category = getCategoryInfo(task.categoryId);
              return (
                <View
                  key={task.id}
                  className="bg-slate-800 rounded-xl p-4 mb-3 border border-amber-500/30"
                >
                  <View className="flex-row items-start justify-between">
                    <View className="flex-row items-center flex-1">
                      <Text className="text-2xl mr-3">{category?.emoji}</Text>
                      <View className="flex-1">
                        <Text className="text-white font-semibold">{task.title}</Text>
                        <Text className="text-slate-400 text-sm" numberOfLines={1}>
                          {task.description}
                        </Text>
                      </View>
                    </View>
                    <Switch
                      value={task.isEnabled}
                      onValueChange={() => toggleTask(task.id)}
                      trackColor={{ false: "#475569", true: "#8b5cf6" }}
                      thumbColor={task.isEnabled ? "#fff" : "#94a3b8"}
                    />
                  </View>
                  
                  <View className="flex-row items-center mt-3 pt-3 border-t border-slate-700">
                    <View className="flex-row items-center">
                      <Star size={14} color="#fbbf24" />
                      <Text className="text-amber-400 text-sm ml-1">
                        +{task.points} / -{task.points}
                      </Text>
                    </View>
                    <View className="flex-row items-center ml-4">
                      <Clock size={14} color="#94a3b8" />
                      <Text className="text-slate-400 text-sm ml-1">
                        {formatDays(task.daysOfWeek)}
                      </Text>
                    </View>
                    <View className="flex-row items-center ml-4">
                      <Users size={14} color="#94a3b8" />
                      <Text className="text-slate-400 text-sm ml-1">
                        All children
                      </Text>
                    </View>
                  </View>
                </View>
              );
            })}
          </Animated.View>
          
          {/* Custom Tasks */}
          <Animated.View entering={FadeInDown.delay(200).duration(500)} className="mb-6">
            <View className="flex-row items-center justify-between mb-3">
              <Text className="text-white text-lg font-semibold">
                Custom Tasks
              </Text>
              <Pressable
                className="bg-violet-600 rounded-lg px-3 py-2 flex-row items-center"
                onPress={openAddModal}
              >
                <Plus size={16} color="white" />
                <Text className="text-white text-sm ml-1">Add Task</Text>
              </Pressable>
            </View>
            
            {customTasks.length === 0 ? (
              <View className="bg-slate-800/50 rounded-xl p-6 items-center border border-dashed border-slate-600">
                <BookOpen size={40} color="#475569" />
                <Text className="text-slate-400 mt-3 text-center">
                  No custom learning tasks yet.{"\n"}Add tasks from 22 categories!
                </Text>
              </View>
            ) : (
              customTasks.map((task) => {
                const category = getCategoryInfo(task.categoryId);
                return (
                  <View
                    key={task.id}
                    className="bg-slate-800 rounded-xl p-4 mb-3 border border-slate-700"
                  >
                    <View className="flex-row items-start justify-between">
                      <View className="flex-row items-center flex-1">
                        <Text className="text-2xl mr-3">{category?.emoji}</Text>
                        <View className="flex-1">
                          <Text className="text-white font-semibold">{task.title}</Text>
                          <Text className="text-slate-400 text-sm" numberOfLines={1}>
                            {task.description}
                          </Text>
                        </View>
                      </View>
                      <View className="flex-row items-center">
                        <Pressable
                          className="p-2"
                          onPress={() => openEditModal(task)}
                        >
                          <Edit2 size={18} color="#8b5cf6" />
                        </Pressable>
                        <Pressable
                          className="p-2"
                          onPress={() => handleDeleteTask(task)}
                        >
                          <Trash2 size={18} color="#ef4444" />
                        </Pressable>
                        <Switch
                          value={task.isEnabled}
                          onValueChange={() => toggleTask(task.id)}
                          trackColor={{ false: "#475569", true: "#8b5cf6" }}
                          thumbColor={task.isEnabled ? "#fff" : "#94a3b8"}
                        />
                      </View>
                    </View>
                    
                    <View className="flex-row items-center mt-3 pt-3 border-t border-slate-700 flex-wrap gap-2">
                      <View className="flex-row items-center">
                        <Star size={14} color="#8b5cf6" />
                        <Text className="text-violet-400 text-sm ml-1">
                          +{task.points}
                        </Text>
                      </View>
                      <View className="flex-row items-center">
                        <Clock size={14} color="#94a3b8" />
                        <Text className="text-slate-400 text-sm ml-1">
                          {formatDays(task.daysOfWeek)}
                        </Text>
                      </View>
                      <View className="flex-row items-center">
                        <Users size={14} color="#94a3b8" />
                        <Text className="text-slate-400 text-sm ml-1">
                          {task.appliesTo === "all"
                            ? "All"
                            : `${task.selectedChildIds.length} child(ren)`}
                        </Text>
                      </View>
                      {task.isQuestionBased && (
                        <View className="bg-emerald-500/20 rounded-full px-2 py-0.5">
                          <Text className="text-emerald-400 text-xs">
                            {task.questionsPerSession} questions
                          </Text>
                        </View>
                      )}
                    </View>
                  </View>
                );
              })
            )}
          </Animated.View>
          
          {/* Categories Overview */}
          <Animated.View entering={FadeInDown.delay(300).duration(500)} className="mb-8">
            <Text className="text-white text-lg font-semibold mb-3">
              Available Categories ({LEARNING_CATEGORIES.length})
            </Text>
            <View className="flex-row flex-wrap gap-2">
              {LEARNING_CATEGORIES.map((category) => (
                <Pressable
                  key={category.id}
                  className="bg-slate-800 rounded-lg px-3 py-2 flex-row items-center"
                  onPress={() => {
                    setSelectedCategory(category.id);
                    setTaskTitle(category.label);
                    setTaskDescription(category.description);
                    setModalVisible(true);
                  }}
                >
                  <Text className="mr-1">{category.emoji}</Text>
                  <Text className="text-slate-300 text-sm">{category.label}</Text>
                </Pressable>
              ))}
            </View>
          </Animated.View>
        </ScrollView>
        
        {/* Add/Edit Task Modal */}
        <Modal
          visible={modalVisible}
          animationType="slide"
          presentationStyle="pageSheet"
          onRequestClose={() => setModalVisible(false)}
        >
          <SafeAreaView className="flex-1 bg-slate-900">
            {/* Modal Header */}
            <View className="flex-row items-center justify-between px-4 py-3 border-b border-slate-700">
              <Pressable onPress={() => setModalVisible(false)}>
                <X size={24} color="#94a3b8" />
              </Pressable>
              <Text className="text-white text-lg font-semibold">
                {editingTask ? "Edit Task" : "Add Learning Task"}
              </Text>
              <Pressable onPress={handleSaveTask}>
                <Check size={24} color="#8b5cf6" />
              </Pressable>
            </View>
            
            <ScrollView className="flex-1 px-4 py-4" showsVerticalScrollIndicator={false}>
              {/* Category Selector */}
              <View className="mb-4">
                <Text className="text-slate-400 text-sm mb-2">Category</Text>
                <Pressable
                  className="bg-slate-800 rounded-xl p-4 flex-row items-center justify-between"
                  onPress={() => setCategoryDropdownOpen(!categoryDropdownOpen)}
                >
                  <View className="flex-row items-center">
                    <Text className="text-xl mr-2">
                      {getCategoryInfo(selectedCategory)?.emoji}
                    </Text>
                    <Text className="text-white">
                      {getCategoryInfo(selectedCategory)?.label}
                    </Text>
                  </View>
                  <ChevronDown
                    size={20}
                    color="#94a3b8"
                    style={{ transform: [{ rotate: categoryDropdownOpen ? "180deg" : "0deg" }] }}
                  />
                </Pressable>
                
                {categoryDropdownOpen && (
                  <View className="bg-slate-800 rounded-xl mt-2 max-h-64 overflow-hidden">
                    <ScrollView nestedScrollEnabled>
                      {LEARNING_CATEGORIES.map((category) => (
                        <Pressable
                          key={category.id}
                          className={cn(
                            "flex-row items-center p-3 border-b border-slate-700",
                            selectedCategory === category.id && "bg-violet-600/20"
                          )}
                          onPress={() => {
                            setSelectedCategory(category.id);
                            setTaskTitle(category.label);
                            setTaskDescription(category.description);
                            setCategoryDropdownOpen(false);
                          }}
                        >
                          <Text className="text-xl mr-2">{category.emoji}</Text>
                          <View className="flex-1">
                            <Text className="text-white">{category.label}</Text>
                            <Text className="text-slate-400 text-xs" numberOfLines={1}>
                              {category.description}
                            </Text>
                          </View>
                          {selectedCategory === category.id && (
                            <Check size={18} color="#8b5cf6" />
                          )}
                        </Pressable>
                      ))}
                    </ScrollView>
                  </View>
                )}
              </View>
              
              {/* Title */}
              <View className="mb-4">
                <Text className="text-slate-400 text-sm mb-2">Title</Text>
                <TextInput
                  className="bg-slate-800 rounded-xl p-4 text-white"
                  placeholder="Task title"
                  placeholderTextColor="#64748b"
                  value={taskTitle}
                  onChangeText={setTaskTitle}
                />
              </View>
              
              {/* Description */}
              <View className="mb-4">
                <Text className="text-slate-400 text-sm mb-2">Description</Text>
                <TextInput
                  className="bg-slate-800 rounded-xl p-4 text-white"
                  placeholder="Task description"
                  placeholderTextColor="#64748b"
                  value={taskDescription}
                  onChangeText={setTaskDescription}
                  multiline
                  numberOfLines={3}
                />
              </View>
              
              {/* Points */}
              <View className="mb-4">
                <Text className="text-slate-400 text-sm mb-2">Points per completion</Text>
                <TextInput
                  className="bg-slate-800 rounded-xl p-4 text-white"
                  placeholder="10"
                  placeholderTextColor="#64748b"
                  value={taskPoints}
                  onChangeText={setTaskPoints}
                  keyboardType="number-pad"
                />
              </View>
              
              {/* Frequency */}
              <View className="mb-4">
                <Text className="text-slate-400 text-sm mb-2">Frequency</Text>
                <View className="flex-row gap-2">
                  <Pressable
                    className={cn(
                      "flex-1 py-3 rounded-xl",
                      frequency === "daily" ? "bg-violet-600" : "bg-slate-800"
                    )}
                    onPress={() => setFrequency("daily")}
                  >
                    <Text
                      className={cn(
                        "text-center font-medium",
                        frequency === "daily" ? "text-white" : "text-slate-400"
                      )}
                    >
                      Daily
                    </Text>
                  </Pressable>
                  <Pressable
                    className={cn(
                      "flex-1 py-3 rounded-xl",
                      frequency === "weekly" ? "bg-violet-600" : "bg-slate-800"
                    )}
                    onPress={() => setFrequency("weekly")}
                  >
                    <Text
                      className={cn(
                        "text-center font-medium",
                        frequency === "weekly" ? "text-white" : "text-slate-400"
                      )}
                    >
                      Weekly
                    </Text>
                  </Pressable>
                </View>
              </View>
              
              {/* Days of Week */}
              <View className="mb-4">
                <Text className="text-slate-400 text-sm mb-2">Days</Text>
                <View className="flex-row gap-1">
                  {DAYS_OF_WEEK.map((day) => (
                    <Pressable
                      key={day.value}
                      className={cn(
                        "flex-1 py-3 rounded-lg items-center",
                        selectedDays.includes(day.value)
                          ? "bg-violet-600"
                          : "bg-slate-800"
                      )}
                      onPress={() => toggleDay(day.value)}
                    >
                      <Text
                        className={cn(
                          "text-sm font-medium",
                          selectedDays.includes(day.value)
                            ? "text-white"
                            : "text-slate-400"
                        )}
                      >
                        {day.short}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>
              
              {/* Time of Day */}
              <View className="mb-4">
                <Text className="text-slate-400 text-sm mb-2">Time of day (optional)</Text>
                <Pressable
                  className="bg-slate-800 rounded-xl p-4"
                  onPress={() => setShowTimePicker(true)}
                >
                  <Text className="text-white">
                    {timeOfDay
                      ? timeOfDay.toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                      : "Any time"}
                  </Text>
                </Pressable>
                {showTimePicker && Platform.OS !== "web" && (
                  <DateTimePicker
                    value={timeOfDay || new Date()}
                    mode="time"
                    display={Platform.OS === "ios" ? "spinner" : "default"}
                    onChange={(event: DateTimePickerEvent, date?: Date) => {
                      setShowTimePicker(Platform.OS === "ios");
                      if (date) setTimeOfDay(date);
                    }}
                  />
                )}
              </View>
              
              {/* Assign To */}
              <View className="mb-4">
                <Text className="text-slate-400 text-sm mb-2">Assign to</Text>
                <Pressable
                  className="bg-slate-800 rounded-xl p-4 flex-row items-center justify-between"
                  onPress={() => setAssignDropdownOpen(!assignDropdownOpen)}
                >
                  <Text className="text-white">
                    {appliesTo === "all"
                      ? "All children"
                      : `${selectedChildIds.length} selected`}
                  </Text>
                  <ChevronDown
                    size={20}
                    color="#94a3b8"
                    style={{ transform: [{ rotate: assignDropdownOpen ? "180deg" : "0deg" }] }}
                  />
                </Pressable>
                
                {assignDropdownOpen && (
                  <View className="bg-slate-800 rounded-xl mt-2">
                    <Pressable
                      className={cn(
                        "flex-row items-center justify-between p-3 border-b border-slate-700",
                        appliesTo === "all" && "bg-violet-600/20"
                      )}
                      onPress={() => {
                        setAppliesTo("all");
                        setAssignDropdownOpen(false);
                      }}
                    >
                      <Text className="text-white">All children</Text>
                      {appliesTo === "all" && <Check size={18} color="#8b5cf6" />}
                    </Pressable>
                    
                    <View className="p-3">
                      <Text className="text-slate-400 text-xs mb-2">Or select specific children:</Text>
                      {children.map((child) => (
                        <Pressable
                          key={child.id}
                          className={cn(
                            "flex-row items-center p-2 rounded-lg mb-1",
                            selectedChildIds.includes(child.id) && "bg-violet-600/20"
                          )}
                          onPress={() => {
                            setAppliesTo("selected");
                            toggleChildSelection(child.id);
                          }}
                        >
                          <Text className="text-xl mr-2">{child.avatar}</Text>
                          <Text className="text-white flex-1">{child.name}</Text>
                          {selectedChildIds.includes(child.id) && (
                            <Check size={18} color="#8b5cf6" />
                          )}
                        </Pressable>
                      ))}
                    </View>
                  </View>
                )}
              </View>
              
              {/* Question-based toggle */}
              <View className="mb-4">
                <View className="flex-row items-center justify-between bg-slate-800 rounded-xl p-4">
                  <View className="flex-1">
                    <Text className="text-white font-medium">Question-based</Text>
                    <Text className="text-slate-400 text-sm">
                      Auto-score with multiple choice questions
                    </Text>
                  </View>
                  <Switch
                    value={isQuestionBased}
                    onValueChange={setIsQuestionBased}
                    trackColor={{ false: "#475569", true: "#8b5cf6" }}
                    thumbColor={isQuestionBased ? "#fff" : "#94a3b8"}
                  />
                </View>
              </View>
              
              {/* Questions per session */}
              {isQuestionBased && (
                <View className="mb-6">
                  <Text className="text-slate-400 text-sm mb-2">Questions per session</Text>
                  <TextInput
                    className="bg-slate-800 rounded-xl p-4 text-white"
                    placeholder="10"
                    placeholderTextColor="#64748b"
                    value={questionsPerSession}
                    onChangeText={setQuestionsPerSession}
                    keyboardType="number-pad"
                  />
                </View>
              )}
              
              {!isQuestionBased && (
                <View className="mb-6 bg-amber-500/10 rounded-xl p-4">
                  <Text className="text-amber-400 text-sm">
                    Non-question tasks require parent approval to mark as complete.
                    The child will submit for review and you'll approve it manually.
                  </Text>
                </View>
              )}
            </ScrollView>
          </SafeAreaView>
        </Modal>
      </SafeAreaView>
    </>
  );
}
