import { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, Pressable, TextInput, Modal, Keyboard, KeyboardAvoidingView, Platform, Switch, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { Plus, X, CheckCircle2, Circle, Clock, Star, Filter, Calendar, ChevronDown, Repeat, Users, Edit3, Trash2, History, ChevronLeft, ChevronRight, Bell } from 'lucide-react-native';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import * as Haptics from 'expo-haptics';
import { useAppStore } from '../../lib/state/app-store';
import { 
  cancelTaskNotification
} from '../../lib/utils/notifications';
import type { TaskCategory, Task } from '../../lib/types';

const CATEGORIES: { id: TaskCategory; label: string; emoji: string }[] = [
  { id: 'chore', label: 'Chore', emoji: '🧹' },
  { id: 'personal_care', label: 'Personal Care', emoji: '🧼' },
  { id: 'exercise', label: 'Exercise', emoji: '🏃' },
  { id: 'learning', label: 'Learning', emoji: '📚' },
  { id: 'social', label: 'Social', emoji: '👋' },
  { id: 'creative', label: 'Creative', emoji: '🎨' },
  { id: 'other', label: 'Other', emoji: '📋' },
];

const RECURRENCE_OPTIONS = [
  { id: 'none', label: 'One-time' },
  { id: 'daily', label: 'Daily' },
  { id: 'weekly', label: 'Weekly' },
  { id: 'monthly', label: 'Monthly' },
];

// Helper to format time for display (HH:mm)
const formatTimeForDisplay = (time: string | null | undefined): string => {
  if (!time) return 'Not set';
  return time;
};

// Helper to check if a date is today
const isToday = (date: Date): boolean => {
  const today = new Date();
  return date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear();
};

// Helper to check if a task should be auto-missed (end time passed)
const shouldAutoMiss = (task: Task): boolean => {
  if (task.status !== 'pending') return false;
  if (!task.endTime) return false;
  
  const now = new Date();
  const taskDate = task.dueDate ? new Date(task.dueDate) : new Date();
  
  // Only auto-miss if task is for today
  if (!isToday(taskDate)) return false;
  
  const [hours, minutes] = task.endTime.split(':').map(Number);
  const endDateTime = new Date(taskDate);
  endDateTime.setHours(hours, minutes, 0, 0);
  
  return now > endDateTime;
};

// Helper to format date for header display
const formatDateHeader = (date: Date): string => {
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  
  if (isToday(date)) return 'Today';
  if (date.getDate() === yesterday.getDate() &&
      date.getMonth() === yesterday.getMonth() &&
      date.getFullYear() === yesterday.getFullYear()) {
    return 'Yesterday';
  }
  
  return date.toLocaleDateString('en-US', { 
    weekday: 'short', 
    month: 'short', 
    day: 'numeric' 
  });
};

export default function TasksScreen() {
  const tasks = useAppStore((s) => s.tasks);
  const children = useAppStore((s) => s.children);
  const addTask = useAppStore((s) => s.addTask);
  const updateTask = useAppStore((s) => s.updateTask);
  const removeTask = useAppStore((s) => s.removeTask);
  const completeTask = useAppStore((s) => s.completeTask);
  const missTask = useAppStore((s) => s.missTask);
  const submitTaskForApproval = useAppStore((s) => s.submitTaskForApproval);
  const approveTask = useAppStore((s) => s.approveTask);
  const rejectTask = useAppStore((s) => s.rejectTask);
  const isChildMode = useAppStore((s) => s.isChildMode);
  
  const [modalVisible, setModalVisible] = useState(false);
  const [filter, setFilter] = useState<'all' | 'pending' | 'completed' | 'missed'>('all');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [points, setPoints] = useState('');
  const [negativePoints, setNegativePoints] = useState('');
  const [category, setCategory] = useState<TaskCategory>('chore');
  const [selectedChildId, setSelectedChildId] = useState<string>('');
  
  // New states for dropdowns and recurring
  const [categoryDropdownOpen, setCategoryDropdownOpen] = useState(false);
  const [assignDropdownOpen, setAssignDropdownOpen] = useState(false);
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurrenceFrequency, setRecurrenceFrequency] = useState<'none' | 'daily' | 'weekly' | 'monthly'>('none');
  const [dueDate, setDueDate] = useState<Date>(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);

  // New states for time pickers
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [endTime, setEndTime] = useState<Date | null>(null);
  const [showStartTimePicker, setShowStartTimePicker] = useState(false);
  const [showEndTimePicker, setShowEndTimePicker] = useState(false);
  
  // Edit mode states
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  
  // Delete confirmation state
  const [deleteConfirmVisible, setDeleteConfirmVisible] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState<Task | null>(null);
  
  // History view state
  const [showHistory, setShowHistory] = useState(false);
  const [historyDate, setHistoryDate] = useState<Date>(new Date());
  const [showHistoryDatePicker, setShowHistoryDatePicker] = useState(false);

  // Auto-miss effect - check for tasks that should be auto-missed
  useEffect(() => {
    const checkAutoMiss = () => {
      tasks.forEach((task) => {
        if (shouldAutoMiss(task)) {
          missTask(task.id);
        }
      });
    };
    
    // Check immediately and then every minute
    checkAutoMiss();
    const interval = setInterval(checkAutoMiss, 60000);
    
    return () => clearInterval(interval);
  }, [tasks, missTask]);

  // Filter tasks - either by today's tasks or history date
  const filteredTasks = tasks.filter((task) => {
    // Date filtering
    const taskDate = task.dueDate ? new Date(task.dueDate) : new Date(task.createdAt);
    const targetDate = showHistory ? historyDate : new Date();
    
    const isSameDay = taskDate.getDate() === targetDate.getDate() &&
      taskDate.getMonth() === targetDate.getMonth() &&
      taskDate.getFullYear() === targetDate.getFullYear();
    
    if (!isSameDay) return false;
    
    // Status filtering
    // "pending_approval" belongs here too: it is still outstanding work, and a
    // task a child has claimed must not disappear from every view while it waits.
    if (filter === 'pending') return task.status === 'pending' || task.status === 'pending_approval';
    if (filter === 'completed') return task.status === 'completed';
    if (filter === 'missed') return task.status === 'skipped';
    return true;
  });

  const handleAddTask = () => {
    if (!title.trim()) return;
    
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    const startTimeStr = startTime 
      ? `${startTime.getHours().toString().padStart(2, '0')}:${startTime.getMinutes().toString().padStart(2, '0')}`
      : null;
    const endTimeStr = endTime 
      ? `${endTime.getHours().toString().padStart(2, '0')}:${endTime.getMinutes().toString().padStart(2, '0')}`
      : null;
    
    if (isEditMode && editingTask) {
      // Update existing task
      updateTask(editingTask.id, {
        title: title.trim(),
        description: description.trim() || undefined,
        points: parseInt(points) || 10,
        negativePoints: parseInt(negativePoints) || 0,
        category,
        childId: selectedChildId || undefined,
        dueDate: dueDate.toISOString(),
        startTime: startTimeStr,
        endTime: endTimeStr,
      });
    } else {
      // Add new task
      addTask({
        title: title.trim(),
        description: description.trim() || undefined,
        points: parseInt(points) || 10,
        negativePoints: parseInt(negativePoints) || 0,
        category,
        childId: selectedChildId || undefined,
        dueDate: dueDate.toISOString(),
        startTime: startTimeStr,
        endTime: endTimeStr,
      });
    }
    
    resetForm();
  };

  const resetForm = () => {
    setModalVisible(false);
    setTitle('');
    setDescription('');
    setPoints('');
    setNegativePoints('');
    setCategory('chore');
    setSelectedChildId('');
    setCategoryDropdownOpen(false);
    setAssignDropdownOpen(false);
    setIsRecurring(false);
    setRecurrenceFrequency('none');
    setDueDate(new Date());
    setShowDatePicker(false);
    setStartTime(null);
    setEndTime(null);
    setShowStartTimePicker(false);
    setShowEndTimePicker(false);
    setEditingTask(null);
    setIsEditMode(false);
  };

  // Open edit modal with task data
  const openEditModal = (task: Task) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setIsEditMode(true);
    setEditingTask(task);
    setTitle(task.title);
    setDescription(task.description || '');
    setPoints(task.points.toString());
    setNegativePoints((task.negativePoints || 0).toString());
    setCategory(task.category);
    setSelectedChildId(task.childId || '');
    setDueDate(task.dueDate ? new Date(task.dueDate) : new Date());
    
    // Parse start time
    if (task.startTime) {
      const [hours, minutes] = task.startTime.split(':').map(Number);
      const startDate = new Date();
      startDate.setHours(hours, minutes, 0, 0);
      setStartTime(startDate);
    } else {
      setStartTime(null);
    }
    
    // Parse end time
    if (task.endTime) {
      const [hours, minutes] = task.endTime.split(':').map(Number);
      const endDate = new Date();
      endDate.setHours(hours, minutes, 0, 0);
      setEndTime(endDate);
    } else {
      setEndTime(null);
    }
    
    setModalVisible(true);
  };

  // Handle delete confirmation
  const handleDeleteTask = (task: Task) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setTaskToDelete(task);
    setDeleteConfirmVisible(true);
  };

  const confirmDelete = async () => {
    if (taskToDelete) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      // Cancel any scheduled notification for this task
      await cancelTaskNotification(taskToDelete.id);
      removeTask(taskToDelete.id);
    }
    setTaskToDelete(null);
    setDeleteConfirmVisible(false);
  };

  const cancelDelete = () => {
    setTaskToDelete(null);
    setDeleteConfirmVisible(false);
  };

  // Handle time changes
  const handleStartTimeChange = (event: DateTimePickerEvent, selectedTime?: Date) => {
    if (Platform.OS === 'android') {
      setShowStartTimePicker(false);
    }
    if (event.type === 'set' && selectedTime) {
      setStartTime(selectedTime);
    }
  };

  const handleEndTimeChange = (event: DateTimePickerEvent, selectedTime?: Date) => {
    if (Platform.OS === 'android') {
      setShowEndTimePicker(false);
    }
    if (event.type === 'set' && selectedTime) {
      setEndTime(selectedTime);
    }
  };

  // History date navigation
  const navigateHistoryDate = (direction: 'prev' | 'next') => {
    const newDate = new Date(historyDate);
    newDate.setDate(newDate.getDate() + (direction === 'next' ? 1 : -1));
    
    // Don't allow navigating past today
    if (newDate <= new Date()) {
      setHistoryDate(newDate);
    }
  };

  const handleHistoryDateChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowHistoryDatePicker(false);
    }
    if (event.type === 'set' && selectedDate) {
      setHistoryDate(selectedDate);
    }
  };

  const handleDateChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
    }
    if (event.type === 'set' && selectedDate) {
      setDueDate(selectedDate);
    }
  };

  const formatDateForDisplay = (date: Date) => {
    return date.toLocaleDateString('en-US', { 
      weekday: 'short', 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const getCategoryInfo = (cat: TaskCategory) => {
    return CATEGORIES.find(c => c.id === cat) || CATEGORIES[0];
  };

  const handleComplete = async (taskId: string) => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    // Cancel the scheduled notification since task is done
    await cancelTaskNotification(taskId);
    completeTask(taskId);
  };

  const handleMissed = async (taskId: string) => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    // Cancel the scheduled notification
    await cancelTaskNotification(taskId);
    missTask(taskId);
  };

  const handleSubmitForApproval = (taskId: string) => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    submitTaskForApproval(taskId);
  };

  const handleApprove = async (taskId: string) => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    // The task is genuinely done now, so drop its reminder.
    await cancelTaskNotification(taskId);
    approveTask(taskId);
  };

  const handleReject = (taskId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    rejectTask(taskId);
  };

  const getCategoryColor = (cat: TaskCategory) => {
    const colors: Record<TaskCategory, string> = {
      chore: 'bg-blue-500',
      personal_care: 'bg-cyan-500',
      exercise: 'bg-green-500',
      learning: 'bg-purple-500',
      social: 'bg-pink-500',
      creative: 'bg-orange-500',
      other: 'bg-slate-500',
    };
    return colors[cat];
  };

  const getCategoryTextColor = (cat: TaskCategory) => {
    const colors: Record<TaskCategory, string> = {
      chore: 'text-blue-400',
      personal_care: 'text-cyan-400',
      exercise: 'text-green-400',
      learning: 'text-purple-400',
      social: 'text-pink-400',
      creative: 'text-orange-400',
      other: 'text-slate-400',
    };
    return colors[cat];
  };

  return (
    <SafeAreaView className="flex-1 bg-slate-900" edges={['top']}>
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View className="px-5 pt-4 pb-4 flex-row items-center justify-between">
          <View>
            <Text className="text-3xl font-bold text-white">Tasks</Text>
            <Text className="text-slate-400 mt-1">
              {showHistory 
                ? formatDateHeader(historyDate)
                : `${tasks.filter(t => t.status === 'pending' || t.status === 'pending_approval').length} pending`
              }
            </Text>
          </View>
          <View className="flex-row gap-2">
            <Pressable
              onPress={() => {
                setShowHistory(!showHistory);
                if (!showHistory) {
                  setHistoryDate(new Date());
                }
              }}
              className={`w-12 h-12 rounded-full items-center justify-center ${
                showHistory ? 'bg-amber-500' : 'bg-slate-700'
              }`}
            >
              <History size={22} color="white" />
            </Pressable>
            <Pressable
              onPress={() => {
                setIsEditMode(false);
                setEditingTask(null);
                setModalVisible(true);
              }}
              className="bg-blue-500 w-12 h-12 rounded-full items-center justify-center"
            >
              <Plus size={24} color="white" />
            </Pressable>
          </View>
        </View>

        {/* History Date Navigation */}
        {showHistory && (
          <View className="px-5 mb-4">
            <View className="flex-row items-center justify-between bg-slate-800 rounded-xl p-3">
              <Pressable
                onPress={() => navigateHistoryDate('prev')}
                className="p-2"
              >
                <ChevronLeft size={24} color="#94a3b8" />
              </Pressable>
              <Pressable
                onPress={() => setShowHistoryDatePicker(true)}
                className="flex-row items-center gap-2"
              >
                <Calendar size={18} color="#f59e0b" />
                <Text className="text-white font-medium">{formatDateHeader(historyDate)}</Text>
              </Pressable>
              <Pressable
                onPress={() => navigateHistoryDate('next')}
                className="p-2"
                disabled={isToday(historyDate)}
              >
                <ChevronRight size={24} color={isToday(historyDate) ? '#475569' : '#94a3b8'} />
              </Pressable>
            </View>
            {showHistoryDatePicker && (
              <View className="mt-2">
                <DateTimePicker
                  value={historyDate}
                  mode="date"
                  display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                  onChange={handleHistoryDateChange}
                  maximumDate={new Date()}
                />
                {Platform.OS === 'ios' && (
                  <Pressable
                    onPress={() => setShowHistoryDatePicker(false)}
                    className="py-2 rounded-xl bg-amber-500/20 mt-2"
                  >
                    <Text className="text-center text-amber-400 font-medium">Done</Text>
                  </Pressable>
                )}
              </View>
            )}
          </View>
        )}

        {/* Filter Tabs */}
        <View className="px-5 mb-4">
          <View className="flex-row bg-slate-800 rounded-xl p-1">
            {(['all', 'pending', 'completed', 'missed'] as const).map((f) => (
              <Pressable
                key={f}
                onPress={() => setFilter(f)}
                className={`flex-1 py-2 rounded-lg items-center ${
                  filter === f ? 'bg-blue-500' : ''
                }`}
              >
                <Text className={filter === f ? 'text-white font-medium' : 'text-slate-400'}>
                  {f.charAt(0).toUpperCase() + f.slice(1)}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Tasks List */}
        <View className="px-5 pb-8">
          {filteredTasks.length > 0 ? (
            <View className="gap-3">
                {filteredTasks.map((task) => (
                <Pressable
                  key={task.id}
                  className={`bg-slate-800/50 rounded-2xl p-4 border ${
                      task.status === 'completed'
                        ? 'border-emerald-500/30'
                        : task.status === 'skipped'
                          ? 'border-rose-500/30'
                          : 'border-slate-700/50'
                  }`}
                >
                  <View className="flex-row items-start">
                    <View className="mr-3 mt-1">
                        {task.status === 'completed' ? (
                        <CheckCircle2 size={24} color="#10b981" />
                        ) : task.status === 'skipped' ? (
                          <Circle size={24} color="#f43f5e" />
                        ) : (
                        <Circle size={24} color="#64748b" />
                      )}
                    </View>
                    <View className="flex-1">
                      <View className="flex-row items-center justify-between">
                        <Text className={`text-lg font-medium flex-1 ${
                            task.status === 'completed'
                              ? 'text-slate-500 line-through'
                              : task.status === 'skipped'
                                ? 'text-rose-300 line-through'
                                : 'text-white'
                        }`}>
                          {task.title}
                        </Text>
                        <View className="flex-row gap-1">
                          <Pressable
                            onPress={() => openEditModal(task)}
                            className="p-2 rounded-lg bg-slate-700/50"
                          >
                            <Edit3 size={16} color="#94a3b8" />
                          </Pressable>
                          <Pressable
                            onPress={() => handleDeleteTask(task)}
                            className="p-2 rounded-lg bg-rose-500/20"
                          >
                            <Trash2 size={16} color="#f87171" />
                          </Pressable>
                        </View>
                      </View>
                      {task.description && (
                        <Text className="text-slate-400 text-sm mt-1">{task.description}</Text>
                      )}
                      
                      {/* Time display */}
                      {(task.startTime || task.endTime) && (
                        <View className="flex-row items-center gap-2 mt-2">
                          <Clock size={14} color="#94a3b8" />
                          <Text className="text-slate-400 text-sm">
                            {task.startTime || '--:--'} - {task.endTime || '--:--'}
                          </Text>
                          {task.status === 'pending' && task.startTime && (
                            <View className="flex-row items-center gap-1 bg-violet-500/20 px-2 py-0.5 rounded">
                              <Bell size={10} color="#a78bfa" />
                              <Text className="text-violet-400 text-xs">Alarm</Text>
                            </View>
                          )}
                          {task.status === 'pending' && task.endTime && shouldAutoMiss(task) && (
                            <View className="bg-rose-500/20 px-2 py-0.5 rounded">
                              <Text className="text-rose-400 text-xs">Overdue</Text>
                            </View>
                          )}
                        </View>
                      )}
                      
                      <View className="flex-row items-center gap-3 mt-2">
                        <View className={`px-2 py-1 rounded-full ${getCategoryColor(task.category)}/20`}>
                          <Text className={`text-xs ${getCategoryColor(task.category).replace('bg-', 'text-').replace('-500', '-400')}`}>
                            {task.category}
                          </Text>
                        </View>
                        <View className="flex-row items-center gap-1">
                          <Star size={14} color="#f59e0b" />
                          <Text className="text-amber-400 text-sm">{task.points}</Text>
                        </View>
                          {(task.negativePoints ?? 0) > 0 && (
                            <View className="flex-row items-center gap-1">
                              <Text className="text-rose-400 text-sm">-{task.negativePoints}</Text>
                            </View>
                          )}
                      </View>
                        {/* CHILD: claim the task. Points are not awarded here --
                            a parent still has to approve. */}
                        {isChildMode && (task.status === 'pending' || task.status === 'skipped') && (
                          <View className="mt-3">
                            <Pressable
                              onPress={() => handleSubmitForApproval(task.id)}
                              className="bg-emerald-500/20 border border-emerald-500/30 rounded-lg py-2.5 items-center"
                            >
                              <Text className="text-emerald-300 font-semibold">I did it! 🎉</Text>
                            </Pressable>
                          </View>
                        )}

                        {/* CHILD: already claimed, waiting on a grown-up. */}
                        {isChildMode && task.status === 'pending_approval' && (
                          <View className="mt-3 bg-amber-500/10 border border-amber-500/30 rounded-lg py-2.5 items-center">
                            <Text className="text-amber-300 font-medium">Waiting for approval ⏳</Text>
                          </View>
                        )}

                        {/* PARENT: approve or send back a child's claim. */}
                        {!isChildMode && task.status === 'pending_approval' && (
                          <View className="mt-3">
                            <Text className="text-amber-300 text-xs mb-2">
                              Your child marked this done — approve to award {task.points} points
                            </Text>
                            <View className="flex-row gap-2">
                              <Pressable
                                onPress={() => handleApprove(task.id)}
                                className="flex-1 bg-emerald-500/20 border border-emerald-500/30 rounded-lg py-2 items-center"
                              >
                                <Text className="text-emerald-300 font-medium">Approve</Text>
                              </Pressable>
                              <Pressable
                                onPress={() => handleReject(task.id)}
                                className="flex-1 bg-slate-600/30 border border-slate-500/40 rounded-lg py-2 items-center"
                              >
                                <Text className="text-slate-300 font-medium">Not yet</Text>
                              </Pressable>
                            </View>
                          </View>
                        )}

                        {/* PARENT: normal completion path, unchanged. */}
                        {!isChildMode && (task.status === 'pending' || task.status === 'skipped') && (
                          <View className="flex-row gap-2 mt-3">
                            <Pressable
                              onPress={() => handleComplete(task.id)}
                              className="flex-1 bg-emerald-500/20 border border-emerald-500/30 rounded-lg py-2 items-center"
                            >
                              <Text className="text-emerald-300 font-medium">
                                {task.status === 'skipped' ? 'Mark Completed' : 'Completed'}
                              </Text>
                            </Pressable>
                            {task.status === 'pending' && (
                              <Pressable
                                onPress={() => handleMissed(task.id)}
                                className="flex-1 bg-rose-500/20 border border-rose-500/30 rounded-lg py-2 items-center"
                              >
                                <Text className="text-rose-300 font-medium">Missed</Text>
                              </Pressable>
                            )}
                          </View>
                        )}
                    </View>
                  </View>
                </Pressable>
              ))}
            </View>
          ) : (
            <View className="bg-slate-800/50 rounded-2xl p-8 items-center border border-slate-700/50">
              <View className="w-20 h-20 rounded-full bg-slate-700 items-center justify-center mb-4">
                <Calendar size={40} color="#64748b" />
              </View>
              <Text className="text-white text-lg font-medium">No tasks yet</Text>
              <Text className="text-slate-400 text-center mt-2">Create your first task to get started</Text>
              <Pressable
                onPress={() => setModalVisible(true)}
                className="mt-4 bg-blue-500 px-6 py-3 rounded-xl"
              >
                <Text className="text-white font-medium">Add Task</Text>
              </Pressable>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Add/Edit Task Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent
        onRequestClose={resetForm}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          className="flex-1"
        >
          <Pressable className="flex-1 bg-black/50 justify-end" onPress={Keyboard.dismiss}>
            <Pressable className="bg-slate-800 rounded-t-3xl p-6 max-h-[85%]" onPress={() => {}}>
            <View className="flex-row items-center justify-between mb-6">
              <Text className="text-xl font-semibold text-white">
                {isEditMode ? 'Edit Task' : 'Add Task'}
              </Text>
              <Pressable onPress={resetForm}>
                <X size={24} color="#94a3b8" />
              </Pressable>
            </View>

            <KeyboardAwareScrollView 
              showsVerticalScrollIndicator={false}
              bottomOffset={50}
              keyboardShouldPersistTaps="handled"
            >
              <View className="gap-4">
                <View>
                  <Text className="text-slate-400 mb-2">Title</Text>
                  <TextInput
                    value={title}
                    onChangeText={setTitle}
                    placeholder="Task title"
                    placeholderTextColor="#64748b"
                    className="bg-slate-700 rounded-xl px-4 py-3 text-white"
                  />
                </View>

                <View>
                  <Text className="text-slate-400 mb-2">Description (optional)</Text>
                  <TextInput
                    value={description}
                    onChangeText={setDescription}
                    placeholder="Task description"
                    placeholderTextColor="#64748b"
                    multiline
                    numberOfLines={3}
                    className="bg-slate-700 rounded-xl px-4 py-3 text-white"
                  />
                </View>

                <View>
                  <Text className="text-slate-400 mb-2">Points</Text>
                  <TextInput
                    value={points}
                    onChangeText={setPoints}
                    placeholder="10"
                    placeholderTextColor="#64748b"
                    keyboardType="numeric"
                    className="bg-slate-700 rounded-xl px-4 py-3 text-white"
                  />
                </View>

                <View>
                  <Text className="text-slate-400 mb-2">Negative points if missed</Text>
                  <TextInput
                    value={negativePoints}
                    onChangeText={setNegativePoints}
                    placeholder="0"
                    placeholderTextColor="#64748b"
                    keyboardType="numeric"
                    className="bg-slate-700 rounded-xl px-4 py-3 text-white"
                  />
                </View>

                {/* Category Dropdown */}
                <View>
                  <Text className="text-slate-400 mb-2">Category</Text>
                  <Pressable
                    onPress={() => {
                      setCategoryDropdownOpen(!categoryDropdownOpen);
                      setAssignDropdownOpen(false);
                    }}
                    className="bg-slate-700 rounded-xl px-4 py-3 flex-row items-center justify-between"
                  >
                    <View className="flex-row items-center">
                      <Text className="text-lg mr-2">{getCategoryInfo(category).emoji}</Text>
                      <Text className="text-white">{getCategoryInfo(category).label}</Text>
                    </View>
                    <ChevronDown 
                      size={20} 
                      color="#94a3b8" 
                      style={{ transform: [{ rotate: categoryDropdownOpen ? '180deg' : '0deg' }] }}
                    />
                  </Pressable>
                  {categoryDropdownOpen && (
                    <View className="bg-slate-700 rounded-xl mt-2 overflow-hidden">
                      {CATEGORIES.map((cat) => (
                        <Pressable
                          key={cat.id}
                          onPress={() => {
                            setCategory(cat.id);
                            setCategoryDropdownOpen(false);
                          }}
                          className={`flex-row items-center px-4 py-3 border-b border-slate-600 ${
                            category === cat.id ? 'bg-blue-500/20' : ''
                          }`}
                        >
                          <Text className="text-lg mr-2">{cat.emoji}</Text>
                          <Text className={category === cat.id ? 'text-blue-400 font-medium' : 'text-white'}>
                            {cat.label}
                          </Text>
                        </Pressable>
                      ))}
                    </View>
                  )}
                </View>

                {/* Assign To Dropdown */}
                <View>
                  <Text className="text-slate-400 mb-2">Assign to</Text>
                  <Pressable
                    onPress={() => {
                      setAssignDropdownOpen(!assignDropdownOpen);
                      setCategoryDropdownOpen(false);
                    }}
                    className="bg-slate-700 rounded-xl px-4 py-3 flex-row items-center justify-between"
                  >
                    <View className="flex-row items-center">
                      <Users size={18} color="#94a3b8" />
                      <Text className="text-white ml-2">
                        {selectedChildId 
                          ? children.find(c => c.id === selectedChildId)?.name || 'Selected child'
                          : 'Family (All children)'
                        }
                      </Text>
                    </View>
                    <ChevronDown 
                      size={20} 
                      color="#94a3b8" 
                      style={{ transform: [{ rotate: assignDropdownOpen ? '180deg' : '0deg' }] }}
                    />
                  </Pressable>
                  {assignDropdownOpen && (
                    <View className="bg-slate-700 rounded-xl mt-2 overflow-hidden">
                      <Pressable
                        onPress={() => {
                          setSelectedChildId('');
                          setAssignDropdownOpen(false);
                        }}
                        className={`flex-row items-center px-4 py-3 border-b border-slate-600 ${
                          !selectedChildId ? 'bg-blue-500/20' : ''
                        }`}
                      >
                        <Text className="text-lg mr-2">👨‍👩‍👧‍👦</Text>
                        <Text className={!selectedChildId ? 'text-blue-400 font-medium' : 'text-white'}>
                          Family (All children)
                        </Text>
                      </Pressable>
                      {children.map((child) => (
                        <Pressable
                          key={child.id}
                          onPress={() => {
                            setSelectedChildId(child.id);
                            setAssignDropdownOpen(false);
                          }}
                          className={`flex-row items-center px-4 py-3 border-b border-slate-600 ${
                            selectedChildId === child.id ? 'bg-blue-500/20' : ''
                          }`}
                        >
                          <Text className="text-lg mr-2">{child.avatar || '👤'}</Text>
                          <Text className={selectedChildId === child.id ? 'text-blue-400 font-medium' : 'text-white'}>
                            {child.name}
                          </Text>
                        </Pressable>
                      ))}
                    </View>
                  )}
                </View>

                {/* Recurring Toggle */}
                <View className="bg-slate-700 rounded-xl px-4 py-3">
                  <View className="flex-row items-center justify-between">
                    <View className="flex-row items-center">
                      <Repeat size={18} color="#94a3b8" />
                      <Text className="text-white ml-2">Recurring Task</Text>
                    </View>
                    <Switch
                      value={isRecurring}
                      onValueChange={(value) => {
                        setIsRecurring(value);
                        if (!value) setRecurrenceFrequency('none');
                        else setRecurrenceFrequency('daily');
                      }}
                      trackColor={{ false: '#475569', true: '#3b82f6' }}
                      thumbColor={isRecurring ? '#fff' : '#94a3b8'}
                    />
                  </View>
                  
                  {isRecurring && (
                    <View className="flex-row gap-2 mt-3 pt-3 border-t border-slate-600">
                      {RECURRENCE_OPTIONS.filter(opt => opt.id !== 'none').map((opt) => (
                        <Pressable
                          key={opt.id}
                          onPress={() => setRecurrenceFrequency(opt.id as typeof recurrenceFrequency)}
                          className={`flex-1 py-2 rounded-lg items-center ${
                            recurrenceFrequency === opt.id ? 'bg-blue-500' : 'bg-slate-600'
                          }`}
                        >
                          <Text className={recurrenceFrequency === opt.id ? 'text-white font-medium' : 'text-slate-400'}>
                            {opt.label}
                          </Text>
                        </Pressable>
                      ))}
                    </View>
                  )}
                </View>

                {/* Due Date Picker (only for non-recurring tasks) */}
                {!isRecurring && (
                  <View>
                    <Text className="text-slate-400 mb-2">Due Date</Text>
                    <Pressable
                      onPress={() => setShowDatePicker(true)}
                      className="bg-slate-700 rounded-xl px-4 py-3 flex-row items-center justify-between"
                    >
                      <View className="flex-row items-center">
                        <Calendar size={18} color="#94a3b8" />
                        <Text className="text-white ml-2">{formatDateForDisplay(dueDate)}</Text>
                      </View>
                      <ChevronDown size={20} color="#94a3b8" />
                    </Pressable>
                    {showDatePicker && (
                      <View>
                        <DateTimePicker
                          value={dueDate}
                          mode="date"
                          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                          onChange={handleDateChange}
                          minimumDate={new Date()}
                        />
                        {Platform.OS === 'ios' && (
                          <Pressable
                            onPress={() => setShowDatePicker(false)}
                            className="py-2 rounded-xl bg-blue-500/20 mt-2"
                          >
                            <Text className="text-center text-blue-400 font-medium">Done</Text>
                          </Pressable>
                        )}
                      </View>
                    )}
                  </View>
                )}

                {/* Start Time Picker */}
                <View>
                  <Text className="text-slate-400 mb-2">Start Time (optional)</Text>
                  <Pressable
                    onPress={() => setShowStartTimePicker(true)}
                    className="bg-slate-700 rounded-xl px-4 py-3 flex-row items-center justify-between"
                  >
                    <View className="flex-row items-center">
                      <Clock size={18} color="#94a3b8" />
                      <Text className="text-white ml-2">
                        {startTime 
                          ? `${startTime.getHours().toString().padStart(2, '0')}:${startTime.getMinutes().toString().padStart(2, '0')}`
                          : 'Not set'
                        }
                      </Text>
                    </View>
                    {startTime && (
                      <Pressable 
                        onPress={() => setStartTime(null)}
                        className="p-1"
                      >
                        <X size={16} color="#94a3b8" />
                      </Pressable>
                    )}
                  </Pressable>
                  {showStartTimePicker && (
                    <View>
                      <DateTimePicker
                        value={startTime || new Date()}
                        mode="time"
                        display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                        onChange={handleStartTimeChange}
                      />
                      {Platform.OS === 'ios' && (
                        <Pressable
                          onPress={() => setShowStartTimePicker(false)}
                          className="py-2 rounded-xl bg-blue-500/20 mt-2"
                        >
                          <Text className="text-center text-blue-400 font-medium">Done</Text>
                        </Pressable>
                      )}
                    </View>
                  )}
                </View>

                {/* End Time Picker */}
                <View>
                  <Text className="text-slate-400 mb-2">End Time (auto-miss if not completed)</Text>
                  <Pressable
                    onPress={() => setShowEndTimePicker(true)}
                    className="bg-slate-700 rounded-xl px-4 py-3 flex-row items-center justify-between"
                  >
                    <View className="flex-row items-center">
                      <Clock size={18} color={endTime ? '#f59e0b' : '#94a3b8'} />
                      <Text className={endTime ? 'text-amber-400 ml-2' : 'text-white ml-2'}>
                        {endTime 
                          ? `${endTime.getHours().toString().padStart(2, '0')}:${endTime.getMinutes().toString().padStart(2, '0')}`
                          : 'Not set'
                        }
                      </Text>
                    </View>
                    {endTime && (
                      <Pressable 
                        onPress={() => setEndTime(null)}
                        className="p-1"
                      >
                        <X size={16} color="#94a3b8" />
                      </Pressable>
                    )}
                  </Pressable>
                  {showEndTimePicker && (
                    <View>
                      <DateTimePicker
                        value={endTime || new Date()}
                        mode="time"
                        display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                        onChange={handleEndTimeChange}
                      />
                      {Platform.OS === 'ios' && (
                        <Pressable
                          onPress={() => setShowEndTimePicker(false)}
                          className="py-2 rounded-xl bg-amber-500/20 mt-2"
                        >
                          <Text className="text-center text-amber-400 font-medium">Done</Text>
                        </Pressable>
                      )}
                    </View>
                  )}
                </View>

                <Pressable
                  onPress={handleAddTask}
                  className="bg-blue-500 rounded-xl py-4 items-center mt-2"
                >
                  <Text className="text-white font-semibold text-lg">
                    {isEditMode ? 'Save Changes' : 'Add Task'}
                  </Text>
                </Pressable>
              </View>
            </KeyboardAwareScrollView>
            </Pressable>
          </Pressable>
        </KeyboardAvoidingView>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        visible={deleteConfirmVisible}
        animationType="fade"
        transparent
        onRequestClose={cancelDelete}
      >
        <Pressable className="flex-1 bg-black/60 justify-center items-center px-6" onPress={cancelDelete}>
          <View className="bg-slate-800 rounded-2xl p-6 w-full max-w-sm">
            <View className="items-center mb-4">
              <View className="w-16 h-16 rounded-full bg-rose-500/20 items-center justify-center mb-3">
                <Trash2 size={32} color="#f87171" />
              </View>
              <Text className="text-xl font-bold text-white text-center">Delete Task?</Text>
              <Text className="text-slate-400 text-center mt-2">
                Are you sure you want to delete "{taskToDelete?.title}"? This action cannot be undone.
              </Text>
            </View>
            <View className="flex-row gap-3 mt-4">
              <Pressable
                onPress={cancelDelete}
                className="flex-1 bg-slate-700 rounded-xl py-3 items-center"
              >
                <Text className="text-white font-medium">Cancel</Text>
              </Pressable>
              <Pressable
                onPress={confirmDelete}
                className="flex-1 bg-rose-500 rounded-xl py-3 items-center"
              >
                <Text className="text-white font-medium">Delete</Text>
              </Pressable>
            </View>
          </View>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}
