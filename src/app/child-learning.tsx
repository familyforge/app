import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StatusBar,
  Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import {
  ArrowLeft,
  BookOpen,
  Check,
  X,
  Star,
  ChevronRight,
  Trophy,
  Clock,
  Sparkles,
  Timer,
  Medal,
  TrendingUp,
} from "lucide-react-native";
import Animated, {
  FadeInDown,
  FadeInUp,
  FadeIn,
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
  runOnJS,
} from "react-native-reanimated";
import { cn } from "../lib/cn";
import { useAppStore } from "../lib/state/app-store";
import {
  useLearningStore,
  LEARNING_CATEGORIES,
  LearningCategory,
  LearningTask,
  LearningQuestion,
  WordEntry,
  ACADEMIC_YEARS,
  AcademicYear,
  EXAM_CONFIG,
  ExamSession,
} from "../lib/state/learning-store";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

type LearningState = "list" | "learning" | "exam" | "summary" | "explanations" | "complete";

interface QuestionState {
  question: LearningQuestion;
  selectedAnswer: number | null;
  isCorrect: boolean | null;
  showExplanation: boolean;
}

// Exam mode question tracking
interface ExamQuestionResult {
  question: LearningQuestion;
  selectedAnswer: number | null;
  isCorrect: boolean;
  timeRemaining: number; // Seconds remaining when answered
  goldEarned: number;
}

interface WordState {
  word: WordEntry;
  answered: boolean;
  isCorrect: boolean | null;
}

export default function ChildLearningScreen() {
  const router = useRouter();
  const children = useAppStore((s) => s.children);
  const selectedChildId = useAppStore((s) => s.selectedChildId);
  
  const getPendingTasksForChild = useLearningStore((s) => s.getPendingTasksForChild);
  const getRandomQuestions = useLearningStore((s) => s.getRandomQuestions);
  const getRandomWord = useLearningStore((s) => s.getRandomWord);
  const markQuestionUsed = useLearningStore((s) => s.markQuestionUsed);
  const markWordUsed = useLearningStore((s) => s.markWordUsed);
  const recordProgress = useLearningStore((s) => s.recordProgress);
  const recordExamSession = useLearningStore((s) => s.recordExamSession);
  const getParentMessage = useLearningStore((s) => s.getParentMessage);
  const hasSystemQuestions = useLearningStore((s) => s.hasSystemQuestions);
  const getTodayProgress = useLearningStore((s) => s.getTodayProgress);
  
  const child = children.find((c) => c.id === selectedChildId);
  const academicYear = (child?.academicYear || 3) as AcademicYear; // Default to Year 3
  
  const [learningState, setLearningState] = useState<LearningState>("list");
  const [activeTask, setActiveTask] = useState<LearningTask | null>(null);
  const [questions, setQuestions] = useState<QuestionState[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [word, setWord] = useState<WordState | null>(null);
  const [totalCorrect, setTotalCorrect] = useState(0);
  const [totalAnswered, setTotalAnswered] = useState(0);
  
  // Exam mode state
  const [isExamMode, setIsExamMode] = useState(false);
  const [examResults, setExamResults] = useState<ExamQuestionResult[]>([]);
  const [timeRemaining, setTimeRemaining] = useState(EXAM_CONFIG.SECONDS_PER_QUESTION);
  const [totalGold, setTotalGold] = useState(0);
  const [showParentMessage, setShowParentMessage] = useState(false);
  const [parentMessage, setParentMessage] = useState("");
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  
  // Animation values
  const correctAnimation = useSharedValue(0);
  const wrongAnimation = useSharedValue(0);
  const timerAnimation = useSharedValue(1);
  
  const pendingTasks = selectedChildId ? getPendingTasksForChild(selectedChildId) : [];
  
  const getCategoryInfo = (categoryId: LearningCategory) => {
    return LEARNING_CATEGORIES.find((c) => c.id === categoryId);
  };
  
  // Check if task should use exam mode (10 questions, system-marked)
  const shouldUseExamMode = (task: LearningTask) => {
    return (
      task.isQuestionBased &&
      task.questionsPerSession === EXAM_CONFIG.QUESTIONS_PER_SESSION &&
      hasSystemQuestions(task.categoryId)
    );
  };
  
  // Timer effect for exam mode
  useEffect(() => {
    if (isExamMode && learningState === "exam" && timeRemaining > 0) {
      timerRef.current = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev <= 1) {
            // Time's up - auto-submit as wrong
            handleExamTimeout();
            return EXAM_CONFIG.SECONDS_PER_QUESTION;
          }
          return prev - 1;
        });
      }, 1000);
      
      return () => {
        if (timerRef.current) clearInterval(timerRef.current);
      };
    }
  }, [isExamMode, learningState, currentQuestionIndex]);
  
  // Update timer animation
  useEffect(() => {
    if (isExamMode) {
      timerAnimation.value = withTiming(timeRemaining / EXAM_CONFIG.SECONDS_PER_QUESTION, { duration: 300 });
    }
  }, [timeRemaining]);
  
  const handleExamTimeout = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    
    // Record as wrong answer with 0 gold
    const currentQ = questions[currentQuestionIndex];
    const result: ExamQuestionResult = {
      question: currentQ.question,
      selectedAnswer: null,
      isCorrect: false,
      timeRemaining: 0,
      goldEarned: 0,
    };
    
    setExamResults((prev) => [...prev, result]);
    markQuestionUsed(selectedChildId!, currentQ.question.id);
    
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex((prev) => prev + 1);
      setTimeRemaining(EXAM_CONFIG.SECONDS_PER_QUESTION);
    } else {
      finishExam([...examResults, result]);
    }
  }, [currentQuestionIndex, questions, examResults, selectedChildId]);
  
  const startTask = (task: LearningTask) => {
    setActiveTask(task);
    setTotalCorrect(0);
    setTotalAnswered(0);
    setExamResults([]);
    setTotalGold(0);
    setShowParentMessage(false);
    
    if (task.categoryId === "words") {
      // Word of the day task
      setIsExamMode(false);
      const randomWord = getRandomWord(academicYear, selectedChildId!);
      if (randomWord) {
        setWord({ word: randomWord, answered: false, isCorrect: null });
        setLearningState("learning");
      } else {
        // No words available
        alert("No words available for your academic year. Please ask a parent to add more content.");
      }
    } else if (task.isQuestionBased) {
      // Question-based task
      const randomQuestions = getRandomQuestions(
        task.categoryId,
        academicYear,
        selectedChildId!,
        task.questionsPerSession
      );
      
      if (randomQuestions.length === 0) {
        alert("No questions available for this category and academic year. Please ask a parent to add more content.");
        return;
      }
      
      setQuestions(
        randomQuestions.map((q) => ({
          question: q,
          selectedAnswer: null,
          isCorrect: null,
          showExplanation: false,
        }))
      );
      setCurrentQuestionIndex(0);
      
      // Check if should use exam mode (10 questions with system answers)
      if (shouldUseExamMode(task)) {
        setIsExamMode(true);
        setTimeRemaining(EXAM_CONFIG.SECONDS_PER_QUESTION);
        setLearningState("exam");
      } else {
        setIsExamMode(false);
        setLearningState("learning");
      }
    } else {
      // Non-question based task - show completion submission
      setIsExamMode(false);
      setLearningState("learning");
    }
  };
  
  // Exam mode answer handler
  const handleExamAnswer = (answerIndex: number) => {
    if (timerRef.current) clearInterval(timerRef.current);
    
    const currentQ = questions[currentQuestionIndex];
    const isCorrect = answerIndex === currentQ.question.correctChoiceIndex;
    const goldEarned = isCorrect ? timeRemaining : 0;
    
    const result: ExamQuestionResult = {
      question: currentQ.question,
      selectedAnswer: answerIndex,
      isCorrect,
      timeRemaining,
      goldEarned,
    };
    
    const newResults = [...examResults, result];
    setExamResults(newResults);
    markQuestionUsed(selectedChildId!, currentQ.question.id);
    
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex((prev) => prev + 1);
      setTimeRemaining(EXAM_CONFIG.SECONDS_PER_QUESTION);
    } else {
      finishExam(newResults);
    }
  };
  
  const finishExam = (results: ExamQuestionResult[]) => {
    if (timerRef.current) clearInterval(timerRef.current);
    
    const totalGoldEarned = results.reduce((sum, r) => sum + r.goldEarned, 0);
    const correctCount = results.filter((r) => r.isCorrect).length;
    const rewardPoints = correctCount; // 1 point per correct answer
    
    setTotalGold(totalGoldEarned);
    setTotalCorrect(correctCount);
    setTotalAnswered(results.length);
    
    // Record exam session
    recordExamSession({
      childId: selectedChildId!,
      categoryId: activeTask!.categoryId,
      academicYear,
      date: new Date().toISOString().split("T")[0],
      questions: results.map((r) => ({
        questionId: r.question.id,
        correct: r.isCorrect,
        timeRemaining: r.timeRemaining,
        goldEarned: r.goldEarned,
      })),
      totalGold: totalGoldEarned,
      totalCorrect: correctCount,
      rewardPoints,
      completedAt: new Date().toISOString(),
    });
    
    // Record progress
    recordProgress({
      childId: selectedChildId!,
      categoryId: activeTask!.categoryId,
      taskId: activeTask!.id,
      date: new Date().toISOString().split("T")[0],
      completed: true,
      questionsAnswered: results.length,
      correctAnswers: correctCount,
      pointsEarned: rewardPoints,
      goldEarned: totalGoldEarned,
    });
    
    setLearningState("summary");
    
    // Show parent message after 60 seconds
    setTimeout(() => {
      // Determine parent name (Mummy or Daddy based on account creator)
      // For now default to random, can be enhanced with profile data
      const parentName = Math.random() > 0.5 ? "Mummy" : "Daddy";
      const message = getParentMessage(totalGoldEarned, parentName as "Mummy" | "Daddy");
      setParentMessage(message);
      setShowParentMessage(true);
    }, 60000); // 60 seconds
  };
  
  const handleAnswerSelect = (answerIndex: number) => {
    if (questions[currentQuestionIndex].selectedAnswer !== null) return;
    
    const isCorrect = answerIndex === questions[currentQuestionIndex].question.correctChoiceIndex;
    
    setQuestions((prev) =>
      prev.map((q, i) =>
        i === currentQuestionIndex
          ? { ...q, selectedAnswer: answerIndex, isCorrect, showExplanation: true }
          : q
      )
    );
    
    setTotalAnswered((prev) => prev + 1);
    if (isCorrect) {
      setTotalCorrect((prev) => prev + 1);
      correctAnimation.value = withSequence(
        withTiming(1, { duration: 200 }),
        withTiming(0, { duration: 200 })
      );
    } else {
      wrongAnimation.value = withSequence(
        withTiming(1, { duration: 200 }),
        withTiming(0, { duration: 200 })
      );
    }
    
    // Mark question as used
    markQuestionUsed(selectedChildId!, questions[currentQuestionIndex].question.id);
  };
  
  const handleWordAnswer = (correct: boolean) => {
    if (!word || word.answered) return;
    
    setWord((prev) => prev ? { ...prev, answered: true, isCorrect: correct } : null);
    setTotalAnswered(1);
    if (correct) {
      setTotalCorrect(1);
      correctAnimation.value = withSequence(
        withTiming(1, { duration: 200 }),
        withTiming(0, { duration: 200 })
      );
    } else {
      wrongAnimation.value = withSequence(
        withTiming(1, { duration: 200 }),
        withTiming(0, { duration: 200 })
      );
    }
    
    markWordUsed(selectedChildId!, word.word.id);
  };
  
  const nextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex((prev) => prev + 1);
    } else {
      completeTask();
    }
  };
  
  const completeTask = () => {
    if (!activeTask || !selectedChildId) return;
    
    const pointsEarned = Math.round(
      (totalCorrect / Math.max(totalAnswered, 1)) * activeTask.points
    );
    
    recordProgress({
      childId: selectedChildId,
      categoryId: activeTask.categoryId,
      taskId: activeTask.id,
      date: new Date().toISOString().split('T')[0],
      completed: true,
      questionsAnswered: totalAnswered,
      correctAnswers: totalCorrect,
      pointsEarned,
      goldEarned: 0, // Non-exam mode doesn't earn gold
    });
    
    setLearningState("complete");
  };
  
  const submitNonQuestionTask = () => {
    if (!activeTask || !selectedChildId) return;
    
    // For non-question tasks, record as pending parent approval
    recordProgress({
      childId: selectedChildId,
      categoryId: activeTask.categoryId,
      taskId: activeTask.id,
      date: new Date().toISOString().split('T')[0],
      completed: false, // Pending approval
      questionsAnswered: 0,
      correctAnswers: 0,
      pointsEarned: 0,
      goldEarned: 0,
    });
    
    setLearningState("complete");
  };
  
  const resetAndGoBack = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setLearningState("list");
    setActiveTask(null);
    setQuestions([]);
    setCurrentQuestionIndex(0);
    setWord(null);
    setTotalCorrect(0);
    setTotalAnswered(0);
    setIsExamMode(false);
    setExamResults([]);
    setTotalGold(0);
    setTimeRemaining(EXAM_CONFIG.SECONDS_PER_QUESTION);
    setShowParentMessage(false);
  };
  
  const correctAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: 1 + correctAnimation.value * 0.2 }],
    opacity: 1 - correctAnimation.value * 0.3,
  }));
  
  const wrongAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: 1 + wrongAnimation.value * 0.1 }],
  }));
  
  // Task List View
  if (learningState === "list") {
    return (
      <View className="flex-1 bg-gradient-to-b from-indigo-600 to-purple-700">
        <StatusBar barStyle="light-content" />
        <SafeAreaView className="flex-1">
          {/* Header */}
          <View className="px-6 pt-4 pb-4 flex-row items-center">
            <Pressable
              className="bg-white/20 p-2 rounded-full mr-3"
              onPress={() => router.back()}
            >
              <ArrowLeft size={24} color="white" />
            </Pressable>
            <View>
              <Text className="text-white text-2xl font-bold">My Learning</Text>
              <Text className="text-white/70">
                {pendingTasks.length} task{pendingTasks.length !== 1 ? "s" : ""} today
              </Text>
            </View>
          </View>
          
          <ScrollView className="flex-1 px-6" showsVerticalScrollIndicator={false}>
            {pendingTasks.length === 0 ? (
              <Animated.View
                entering={FadeIn.duration(500)}
                className="bg-white/20 rounded-3xl p-8 items-center mt-8"
              >
                <Trophy size={64} color="#fbbf24" />
                <Text className="text-white text-xl font-bold mt-4">
                  All Done! 🎉
                </Text>
                <Text className="text-white/70 text-center mt-2">
                  You've completed all your learning tasks for today. Great job!
                </Text>
              </Animated.View>
            ) : (
              pendingTasks.map((task, index) => {
                const category = getCategoryInfo(task.categoryId);
                return (
                  <Animated.View
                    key={task.id}
                    entering={FadeInUp.delay(index * 100).duration(500)}
                  >
                    <Pressable
                      className="bg-white/20 backdrop-blur-lg rounded-2xl p-4 mb-3 flex-row items-center"
                      onPress={() => startTask(task)}
                    >
                      <View className="bg-white/30 w-14 h-14 rounded-xl items-center justify-center">
                        <Text className="text-3xl">{category?.emoji}</Text>
                      </View>
                      <View className="flex-1 ml-4">
                        <Text className="text-white font-semibold text-lg">
                          {task.title}
                        </Text>
                        <Text className="text-white/70 text-sm" numberOfLines={1}>
                          {task.description}
                        </Text>
                        <View className="flex-row items-center mt-1">
                          <Star size={14} color="#fbbf24" fill="#fbbf24" />
                          <Text className="text-amber-300 text-sm ml-1">
                            +{task.points} points
                          </Text>
                          {task.isQuestionBased && (
                            <Text className="text-white/50 text-sm ml-2">
                              • {task.questionsPerSession} questions
                            </Text>
                          )}
                        </View>
                      </View>
                      <ChevronRight size={24} color="white" />
                    </Pressable>
                  </Animated.View>
                );
              })
            )}
          </ScrollView>
        </SafeAreaView>
      </View>
    );
  }
  
  // EXAM MODE VIEW - Timed questions with Gold scoring
  if (learningState === "exam" && isExamMode && questions.length > 0) {
    const currentQ = questions[currentQuestionIndex];
    const progress = ((currentQuestionIndex + 1) / questions.length) * 100;
    const timerPercent = (timeRemaining / EXAM_CONFIG.SECONDS_PER_QUESTION) * 100;
    const timerColor = timeRemaining > 20 ? "#22c55e" : timeRemaining > 10 ? "#f59e0b" : "#ef4444";
    
    return (
      <View className="flex-1 bg-slate-900">
        <StatusBar barStyle="light-content" />
        <SafeAreaView className="flex-1">
          {/* Header with timer */}
          <View className="px-6 pt-4 pb-2">
            <View className="flex-row items-center justify-between mb-3">
              <View className="flex-row items-center">
                <Text className="text-white font-semibold">
                  {currentQuestionIndex + 1} / {questions.length}
                </Text>
              </View>
              
              {/* Timer */}
              <View className="flex-row items-center bg-slate-800 rounded-full px-4 py-2">
                <Timer size={18} color={timerColor} />
                <Text style={{ color: timerColor }} className="ml-2 font-bold text-lg">
                  {timeRemaining}s
                </Text>
              </View>
              
              <View className="flex-row items-center">
                <Medal size={16} color="#fbbf24" />
                <Text className="text-amber-400 ml-1 font-bold">
                  {examResults.reduce((sum, r) => sum + r.goldEarned, 0)}
                </Text>
              </View>
            </View>
            
            {/* Timer progress bar */}
            <View className="h-2 bg-slate-700 rounded-full overflow-hidden mb-2">
              <View
                className="h-full rounded-full transition-all"
                style={{ width: `${timerPercent}%`, backgroundColor: timerColor }}
              />
            </View>
            
            {/* Question progress bar */}
            <View className="h-1 bg-slate-700 rounded-full overflow-hidden">
              <View
                className="h-full bg-violet-500 rounded-full"
                style={{ width: `${progress}%` }}
              />
            </View>
          </View>
          
          <ScrollView
            className="flex-1 px-6 py-4"
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ flexGrow: 1 }}
          >
            {/* Question */}
            <Animated.View
              entering={FadeInDown.duration(300)}
              className="bg-slate-800 rounded-2xl p-6 mb-6"
            >
              <Text className="text-white text-xl font-medium leading-7">
                {currentQ.question.question}
              </Text>
            </Animated.View>
            
            {/* Choices - No feedback in exam mode */}
            <View className="space-y-3">
              {currentQ.question.choices.map((choice, index) => (
                <Animated.View
                  key={index}
                  entering={FadeInUp.delay(index * 80).duration(300)}
                >
                  <Pressable
                    className="bg-slate-800 rounded-xl p-4 border-2 border-slate-700 flex-row items-center mb-3 active:border-violet-500 active:bg-slate-700"
                    onPress={() => handleExamAnswer(index)}
                  >
                    <View className="w-8 h-8 rounded-full bg-slate-700 items-center justify-center mr-3">
                      <Text className="text-white font-bold">
                        {String.fromCharCode(65 + index)}
                      </Text>
                    </View>
                    <Text className="flex-1 text-white text-base">{choice}</Text>
                  </Pressable>
                </Animated.View>
              ))}
            </View>
            
            {/* Gold hint */}
            <View className="mt-6 p-4 bg-amber-500/10 rounded-xl flex-row items-center">
              <Medal size={20} color="#fbbf24" />
              <Text className="text-amber-300 ml-2 text-sm">
                Answer correctly to earn {timeRemaining} Gold!
              </Text>
            </View>
          </ScrollView>
        </SafeAreaView>
      </View>
    );
  }
  
  // SUMMARY VIEW - After exam completion
  if (learningState === "summary" && isExamMode) {
    const rewardPoints = totalCorrect; // 1 per correct answer
    
    return (
      <View className="flex-1 bg-gradient-to-b from-violet-600 to-purple-700">
        <StatusBar barStyle="light-content" />
        <SafeAreaView className="flex-1">
          <ScrollView
            className="flex-1 px-6 py-4"
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ flexGrow: 1 }}
          >
            {/* Bravo Header */}
            <Animated.View
              entering={FadeInDown.duration(600)}
              className="items-center pt-6"
            >
              <Text className="text-6xl mb-4">🏆</Text>
              <Text className="text-white text-3xl font-bold">
                BRAVO {child?.name?.toUpperCase()}!
              </Text>
            </Animated.View>
            
            {/* Score Summary */}
            <Animated.View
              entering={FadeInUp.delay(200).duration(500)}
              className="bg-white/20 backdrop-blur-lg rounded-3xl p-6 mt-6"
            >
              <Text className="text-white/90 text-center text-lg mb-4">
                You have earned
              </Text>
              
              <View className="flex-row justify-center items-center gap-8">
                <View className="items-center">
                  <View className="flex-row items-center">
                    <Star size={28} color="#fbbf24" fill="#fbbf24" />
                    <Text className="text-amber-300 text-4xl font-bold ml-2">
                      {rewardPoints}
                    </Text>
                  </View>
                  <Text className="text-white/70 text-sm mt-1">Reward points</Text>
                </View>
                
                <View className="items-center">
                  <View className="flex-row items-center">
                    <Medal size={28} color="#fbbf24" />
                    <Text className="text-amber-300 text-4xl font-bold ml-2">
                      {totalGold}
                    </Text>
                  </View>
                  <Text className="text-white/70 text-sm mt-1">Gold points</Text>
                </View>
              </View>
              
              <View className="mt-6 pt-4 border-t border-white/20">
                <Text className="text-white text-center text-xl font-semibold">
                  You scored {totalCorrect}/{totalAnswered}
                </Text>
              </View>
            </Animated.View>
            
            {/* Breakdown */}
            <Animated.View
              entering={FadeInUp.delay(400).duration(500)}
              className="bg-white/10 rounded-2xl mt-4 overflow-hidden"
            >
              <View className="p-4 border-b border-white/20">
                <Text className="text-white font-semibold text-lg">Breakdown</Text>
              </View>
              {examResults.map((result, index) => (
                <View
                  key={index}
                  className="flex-row items-center justify-between p-4 border-b border-white/10"
                >
                  <View className="flex-row items-center flex-1">
                    <View
                      className={cn(
                        "w-8 h-8 rounded-full items-center justify-center mr-3",
                        result.isCorrect ? "bg-emerald-500" : "bg-red-500"
                      )}
                    >
                      {result.isCorrect ? (
                        <Check size={16} color="white" />
                      ) : (
                        <X size={16} color="white" />
                      )}
                    </View>
                    <Text className="text-white/80 text-sm" numberOfLines={1}>
                      Q{index + 1}
                    </Text>
                  </View>
                  <View className="flex-row items-center">
                    <Medal size={16} color={result.goldEarned > 0 ? "#fbbf24" : "#64748b"} />
                    <Text
                      className={cn(
                        "ml-1 font-semibold",
                        result.goldEarned > 0 ? "text-amber-300" : "text-slate-500"
                      )}
                    >
                      +{result.goldEarned}
                    </Text>
                  </View>
                </View>
              ))}
            </Animated.View>
            
            {/* Motivational Message */}
            <Animated.View
              entering={FadeInUp.delay(600).duration(500)}
              className="bg-white/10 rounded-2xl p-4 mt-4"
            >
              <Text className="text-white/90 text-center">
                {totalGold > EXAM_CONFIG.HIGH_SCORE_THRESHOLD
                  ? "🌟 Outstanding performance! You're a star! 🌟"
                  : "💪 Great effort! Keep practicing to improve! 💪"}
              </Text>
            </Animated.View>
            
            {/* Parent Message (shows after 60 seconds) */}
            {showParentMessage && (
              <Animated.View
                entering={FadeIn.duration(500)}
                className="bg-pink-500/20 rounded-2xl p-4 mt-4 border border-pink-400/30"
              >
                <Text className="text-white/60 text-xs mb-2">Message from home 💌</Text>
                <Text className="text-white leading-6">{parentMessage}</Text>
              </Animated.View>
            )}
            
            {/* Action Buttons */}
            <View className="mt-6 space-y-3">
              <Pressable
                className="bg-white/20 rounded-xl py-4 items-center"
                onPress={() => setLearningState("explanations")}
              >
                <Text className="text-white font-semibold">View Explanations</Text>
              </Pressable>
              
              <Pressable
                className="bg-amber-500/80 rounded-xl py-4 flex-row items-center justify-center mt-3"
                onPress={() => router.push(`/leaderboard?categoryId=${activeTask?.categoryId}`)}
              >
                <Trophy size={20} color="white" />
                <Text className="text-white font-semibold ml-2">View Leaderboard</Text>
              </Pressable>
              
              <Pressable
                className="bg-white rounded-xl py-4 items-center mt-3"
                onPress={resetAndGoBack}
              >
                <Text className="text-violet-700 font-bold text-lg">Continue</Text>
              </Pressable>
            </View>
            
            {/* Coming Soon Features */}
            <View className="mt-6 mb-8">
              <View className="flex-row gap-3">
                <View className="flex-1 bg-white/5 rounded-xl p-3 items-center">
                  <TrendingUp size={20} color="#64748b" />
                  <Text className="text-slate-500 text-xs mt-1">Learn more</Text>
                  <Text className="text-slate-600 text-xs">Coming Soon</Text>
                </View>
                <View className="flex-1 bg-white/5 rounded-xl p-3 items-center">
                  <BookOpen size={20} color="#64748b" />
                  <Text className="text-slate-500 text-xs mt-1">Enter Class</Text>
                  <Text className="text-slate-600 text-xs">Coming Soon</Text>
                </View>
              </View>
            </View>
          </ScrollView>
        </SafeAreaView>
      </View>
    );
  }
  
  // EXPLANATIONS VIEW - After exam
  if (learningState === "explanations" && isExamMode) {
    return (
      <View className="flex-1 bg-slate-900">
        <StatusBar barStyle="light-content" />
        <SafeAreaView className="flex-1">
          {/* Header */}
          <View className="px-6 pt-4 pb-2 flex-row items-center justify-between">
            <Pressable
              className="bg-slate-800 p-2 rounded-full"
              onPress={() => setLearningState("summary")}
            >
              <ArrowLeft size={20} color="white" />
            </Pressable>
            <Text className="text-white font-bold text-lg">Explanations</Text>
            <View className="w-10" />
          </View>
          
          <ScrollView
            className="flex-1 px-6 py-4"
            showsVerticalScrollIndicator={false}
          >
            {examResults.map((result, index) => (
              <Animated.View
                key={index}
                entering={FadeInUp.delay(index * 100).duration(400)}
                className="bg-slate-800 rounded-2xl p-4 mb-4"
              >
                <View className="flex-row items-start mb-3">
                  <View
                    className={cn(
                      "w-8 h-8 rounded-full items-center justify-center mr-3",
                      result.isCorrect ? "bg-emerald-500" : "bg-red-500"
                    )}
                  >
                    <Text className="text-white font-bold">{index + 1}</Text>
                  </View>
                  <Text className="text-white flex-1">{result.question.question}</Text>
                </View>
                
                {/* Correct Answer */}
                <View className="bg-emerald-500/20 rounded-xl p-3 mb-3">
                  <Text className="text-emerald-400 text-sm font-medium mb-1">
                    Correct Answer:
                  </Text>
                  <Text className="text-white">
                    {result.question.choices[result.question.correctChoiceIndex]}
                  </Text>
                </View>
                
                {/* User's Answer if wrong */}
                {!result.isCorrect && result.selectedAnswer !== null && (
                  <View className="bg-red-500/20 rounded-xl p-3 mb-3">
                    <Text className="text-red-400 text-sm font-medium mb-1">
                      Your Answer:
                    </Text>
                    <Text className="text-white">
                      {result.question.choices[result.selectedAnswer]}
                    </Text>
                  </View>
                )}
                
                {/* Explanation */}
                <View className="bg-slate-700/50 rounded-xl p-3">
                  <Text className="text-slate-400 text-sm font-medium mb-1">
                    💡 Explanation:
                  </Text>
                  <Text className="text-slate-300">{result.question.explanation}</Text>
                </View>
              </Animated.View>
            ))}
          </ScrollView>
        </SafeAreaView>
      </View>
    );
  }
  
  // Learning View - Question-based (non-exam mode)
  if (learningState === "learning" && activeTask?.isQuestionBased && questions.length > 0) {
    const currentQuestion = questions[currentQuestionIndex];
    const progress = ((currentQuestionIndex + 1) / questions.length) * 100;
    
    return (
      <View className="flex-1 bg-slate-900">
        <StatusBar barStyle="light-content" />
        <SafeAreaView className="flex-1">
          {/* Header with progress */}
          <View className="px-6 pt-4 pb-2">
            <View className="flex-row items-center justify-between mb-3">
              <Pressable
                className="bg-slate-800 p-2 rounded-full"
                onPress={resetAndGoBack}
              >
                <X size={20} color="white" />
              </Pressable>
              <Text className="text-white font-semibold">
                {currentQuestionIndex + 1} / {questions.length}
              </Text>
              <View className="flex-row items-center">
                <Star size={16} color="#fbbf24" fill="#fbbf24" />
                <Text className="text-amber-400 ml-1">{totalCorrect}</Text>
              </View>
            </View>
            
            {/* Progress bar */}
            <View className="h-2 bg-slate-700 rounded-full overflow-hidden">
              <Animated.View
                className="h-full bg-violet-500 rounded-full"
                style={{ width: `${progress}%` }}
              />
            </View>
          </View>
          
          <ScrollView
            className="flex-1 px-6 py-4"
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ flexGrow: 1 }}
          >
            {/* Question */}
            <Animated.View
              entering={FadeInDown.duration(500)}
              className="bg-slate-800 rounded-2xl p-6 mb-6"
            >
              <Text className="text-white text-xl font-medium leading-7">
                {currentQuestion.question.question}
              </Text>
            </Animated.View>
            
            {/* Choices */}
            <View className="space-y-3">
              {currentQuestion.question.choices.map((choice, index) => {
                const isSelected = currentQuestion.selectedAnswer === index;
                const isCorrect = index === currentQuestion.question.correctChoiceIndex;
                const showResult = currentQuestion.selectedAnswer !== null;
                
                let bgColor = "bg-slate-800";
                let borderColor = "border-slate-700";
                let textColor = "text-white";
                
                if (showResult) {
                  if (isCorrect) {
                    bgColor = "bg-emerald-500/20";
                    borderColor = "border-emerald-500";
                    textColor = "text-emerald-400";
                  } else if (isSelected && !isCorrect) {
                    bgColor = "bg-red-500/20";
                    borderColor = "border-red-500";
                    textColor = "text-red-400";
                  }
                }
                
                return (
                  <Animated.View
                    key={index}
                    entering={FadeInUp.delay(index * 100).duration(400)}
                    style={isSelected && !currentQuestion.isCorrect ? wrongAnimatedStyle : undefined}
                  >
                    <Pressable
                      className={cn(
                        "rounded-xl p-4 border-2 flex-row items-center mb-3",
                        bgColor,
                        borderColor
                      )}
                      onPress={() => handleAnswerSelect(index)}
                      disabled={showResult}
                    >
                      <View
                        className={cn(
                          "w-8 h-8 rounded-full items-center justify-center mr-3",
                          showResult && isCorrect
                            ? "bg-emerald-500"
                            : showResult && isSelected
                            ? "bg-red-500"
                            : "bg-slate-700"
                        )}
                      >
                        {showResult && isCorrect ? (
                          <Check size={16} color="white" />
                        ) : showResult && isSelected ? (
                          <X size={16} color="white" />
                        ) : (
                          <Text className="text-white font-bold">
                            {String.fromCharCode(65 + index)}
                          </Text>
                        )}
                      </View>
                      <Text className={cn("flex-1 text-base", textColor)}>
                        {choice}
                      </Text>
                    </Pressable>
                  </Animated.View>
                );
              })}
            </View>
            
            {/* Explanation */}
            {currentQuestion.showExplanation && (
              <Animated.View
                entering={FadeIn.duration(300)}
                className={cn(
                  "rounded-xl p-4 mt-4",
                  currentQuestion.isCorrect ? "bg-emerald-500/20" : "bg-amber-500/20"
                )}
              >
                <Text
                  className={cn(
                    "font-semibold mb-1",
                    currentQuestion.isCorrect ? "text-emerald-400" : "text-amber-400"
                  )}
                >
                  {currentQuestion.isCorrect ? "🎉 Correct!" : "💡 Not quite!"}
                </Text>
                <Text className="text-slate-300">
                  {currentQuestion.question.explanation}
                </Text>
              </Animated.View>
            )}
          </ScrollView>
          
          {/* Next Button */}
          {currentQuestion.selectedAnswer !== null && (
            <Animated.View entering={FadeIn.duration(300)} className="px-6 pb-4">
              <Pressable
                className="bg-violet-600 rounded-xl py-4 items-center"
                onPress={nextQuestion}
              >
                <Text className="text-white font-bold text-lg">
                  {currentQuestionIndex < questions.length - 1
                    ? "Next Question"
                    : "See Results"}
                </Text>
              </Pressable>
            </Animated.View>
          )}
        </SafeAreaView>
      </View>
    );
  }
  
  // Learning View - Word of the Day
  if (learningState === "learning" && activeTask?.categoryId === "words" && word) {
    return (
      <View className="flex-1 bg-gradient-to-b from-emerald-600 to-teal-700">
        <StatusBar barStyle="light-content" />
        <SafeAreaView className="flex-1">
          {/* Header */}
          <View className="px-6 pt-4 pb-2 flex-row items-center justify-between">
            <Pressable
              className="bg-white/20 p-2 rounded-full"
              onPress={resetAndGoBack}
            >
              <X size={20} color="white" />
            </Pressable>
            <Text className="text-white font-bold text-lg">Word of the Day</Text>
            <View className="w-10" />
          </View>
          
          <ScrollView
            className="flex-1 px-6 py-4"
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ flexGrow: 1 }}
          >
            {/* Word Card */}
            <Animated.View
              entering={FadeInDown.duration(600)}
              className="bg-white/20 backdrop-blur-lg rounded-3xl p-6 items-center"
            >
              <Text className="text-6xl mb-4">📚</Text>
              <Text className="text-white text-4xl font-bold text-center">
                {word.word.word}
              </Text>
              <View className="bg-white/20 rounded-full px-4 py-1 mt-2">
                <Text className="text-white/80 text-sm">
                  {word.word.partOfSpeech}
                </Text>
              </View>
            </Animated.View>
            
            {/* Meaning */}
            <Animated.View
              entering={FadeInUp.delay(200).duration(500)}
              className="mt-6"
            >
              <Text className="text-white/70 text-sm mb-1">Meaning</Text>
              <View className="bg-white/10 rounded-xl p-4">
                <Text className="text-white text-lg">{word.word.meaning}</Text>
              </View>
            </Animated.View>
            
            {/* Context */}
            <Animated.View
              entering={FadeInUp.delay(300).duration(500)}
              className="mt-4"
            >
              <Text className="text-white/70 text-sm mb-1">Context</Text>
              <View className="bg-white/10 rounded-xl p-4">
                <Text className="text-white">{word.word.context}</Text>
              </View>
            </Animated.View>
            
            {/* Examples */}
            {word.word.examples.length > 0 && (
              <Animated.View
                entering={FadeInUp.delay(400).duration(500)}
                className="mt-4"
              >
                <Text className="text-white/70 text-sm mb-1">Examples</Text>
                <View className="bg-white/10 rounded-xl p-4">
                  {word.word.examples.map((example, i) => (
                    <Text key={i} className="text-white mb-1">
                      • {example}
                    </Text>
                  ))}
                </View>
              </Animated.View>
            )}
            
            {/* Synonyms & Opposites */}
            <Animated.View
              entering={FadeInUp.delay(500).duration(500)}
              className="flex-row gap-3 mt-4"
            >
              {word.word.synonyms.length > 0 && (
                <View className="flex-1 bg-white/10 rounded-xl p-3">
                  <Text className="text-white/70 text-xs mb-1">Synonyms</Text>
                  <Text className="text-emerald-300 text-sm">
                    {word.word.synonyms.join(", ")}
                  </Text>
                </View>
              )}
              {word.word.opposites.length > 0 && (
                <View className="flex-1 bg-white/10 rounded-xl p-3">
                  <Text className="text-white/70 text-xs mb-1">Opposites</Text>
                  <Text className="text-rose-300 text-sm">
                    {word.word.opposites.join(", ")}
                  </Text>
                </View>
              )}
            </Animated.View>
          </ScrollView>
          
          {/* I learned it button */}
          {!word.answered && (
            <Animated.View entering={FadeIn.delay(600).duration(300)} className="px-6 pb-4">
              <Pressable
                className="bg-white rounded-xl py-4 items-center"
                onPress={() => handleWordAnswer(true)}
              >
                <Text className="text-emerald-700 font-bold text-lg">
                  I learned this word! ✨
                </Text>
              </Pressable>
            </Animated.View>
          )}
          
          {word.answered && (
            <Animated.View entering={FadeIn.duration(300)} className="px-6 pb-4">
              <View className="bg-white/20 rounded-xl p-4 items-center mb-3">
                <Text className="text-white text-lg font-bold">
                  🎉 +{activeTask?.points || 10} points!
                </Text>
              </View>
              <Pressable
                className="bg-white rounded-xl py-4 items-center"
                onPress={completeTask}
              >
                <Text className="text-emerald-700 font-bold text-lg">
                  Continue
                </Text>
              </Pressable>
            </Animated.View>
          )}
        </SafeAreaView>
      </View>
    );
  }
  
  // Learning View - Non-question task
  if (learningState === "learning" && activeTask && !activeTask.isQuestionBased) {
    const category = getCategoryInfo(activeTask.categoryId);
    
    return (
      <View className="flex-1 bg-slate-900">
        <StatusBar barStyle="light-content" />
        <SafeAreaView className="flex-1">
          {/* Header */}
          <View className="px-6 pt-4 pb-2 flex-row items-center justify-between">
            <Pressable
              className="bg-slate-800 p-2 rounded-full"
              onPress={resetAndGoBack}
            >
              <X size={20} color="white" />
            </Pressable>
            <Text className="text-white font-bold text-lg">{activeTask.title}</Text>
            <View className="w-10" />
          </View>
          
          <View className="flex-1 px-6 py-4 justify-center items-center">
            <Text className="text-6xl mb-6">{category?.emoji}</Text>
            <Text className="text-white text-2xl font-bold text-center mb-2">
              {activeTask.title}
            </Text>
            <Text className="text-slate-400 text-center mb-8 px-4">
              {activeTask.description}
            </Text>
            
            <View className="bg-amber-500/20 rounded-xl p-4 mb-8">
              <Text className="text-amber-400 text-center">
                Complete this activity and ask a parent to verify your work!
              </Text>
            </View>
            
            <Pressable
              className="bg-violet-600 rounded-xl py-4 px-8 items-center"
              onPress={submitNonQuestionTask}
            >
              <Text className="text-white font-bold text-lg">
                I've completed this!
              </Text>
            </Pressable>
          </View>
        </SafeAreaView>
      </View>
    );
  }
  
  // Completion View
  if (learningState === "complete") {
    const score = totalAnswered > 0 ? Math.round((totalCorrect / totalAnswered) * 100) : 100;
    const pointsEarned = Math.round((totalCorrect / Math.max(totalAnswered, 1)) * (activeTask?.points || 10));
    
    return (
      <View className="flex-1 bg-gradient-to-b from-violet-600 to-purple-700">
        <StatusBar barStyle="light-content" />
        <SafeAreaView className="flex-1 justify-center items-center px-6">
          <Animated.View
            entering={FadeInDown.duration(600)}
            className="items-center"
          >
            <View className="bg-white/20 w-32 h-32 rounded-full items-center justify-center mb-6">
              <Trophy size={64} color="#fbbf24" />
            </View>
            
            <Text className="text-white text-3xl font-bold mb-2">
              {score >= 80 ? "Amazing! 🎉" : score >= 50 ? "Good job! 👍" : "Keep trying! 💪"}
            </Text>
            
            {totalAnswered > 0 && (
              <Text className="text-white/70 text-lg mb-6">
                You got {totalCorrect} out of {totalAnswered} correct
              </Text>
            )}
            
            <View className="bg-white/20 rounded-2xl p-6 items-center mb-8">
              <View className="flex-row items-center">
                <Star size={32} color="#fbbf24" fill="#fbbf24" />
                <Text className="text-amber-300 text-4xl font-bold ml-2">
                  +{pointsEarned}
                </Text>
              </View>
              <Text className="text-white/70 mt-1">Points earned</Text>
            </View>
            
            <Pressable
              className="bg-white rounded-xl py-4 px-12"
              onPress={resetAndGoBack}
            >
              <Text className="text-violet-700 font-bold text-lg">
                Continue
              </Text>
            </Pressable>
          </Animated.View>
        </SafeAreaView>
      </View>
    );
  }
  
  // Fallback loading state
  return (
    <View className="flex-1 bg-slate-900 justify-center items-center">
      <Sparkles size={48} color="#8b5cf6" />
      <Text className="text-white mt-4">Loading...</Text>
    </View>
  );
}
