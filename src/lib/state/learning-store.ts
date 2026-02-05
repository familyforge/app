import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";

// 22 Learning Categories
export type LearningCategory =
  | "words"
  | "maths"
  | "survival_skills"
  | "writing"
  | "english_comprehension"
  | "history"
  | "geography"
  | "physics"
  | "chemistry"
  | "biology"
  | "primary_science"
  | "civic_education"
  | "government"
  | "finance"
  | "current_affairs"
  | "general_knowledge"
  | "economics"
  | "computer"
  | "literature"
  | "music"
  | "french"
  | "agriculture";

export const LEARNING_CATEGORIES: {
  id: LearningCategory;
  label: string;
  emoji: string;
  description: string;
}[] = [
  { id: "words", label: "Word of the Day", emoji: "📚", description: "Learn new vocabulary with meanings and usage" },
  { id: "maths", label: "Mathematics", emoji: "🔢", description: "Practice math skills at your level" },
  { id: "survival_skills", label: "Survival Skills", emoji: "🏕️", description: "Essential life skills for children" },
  { id: "writing", label: "Writing", emoji: "✍️", description: "Practice writing skills" },
  { id: "english_comprehension", label: "English Comprehension", emoji: "📝", description: "Read passages and answer comprehension questions" },
  { id: "history", label: "History", emoji: "🏛️", description: "Learn about historical events" },
  { id: "geography", label: "Geography", emoji: "🌍", description: "Explore the world around you" },
  { id: "physics", label: "Physics", emoji: "⚛️", description: "Understand how the physical world works" },
  { id: "chemistry", label: "Chemistry", emoji: "🧪", description: "Learn about elements and reactions" },
  { id: "biology", label: "Biology", emoji: "🧬", description: "Study living organisms" },
  { id: "primary_science", label: "Primary Science", emoji: "🔬", description: "Basic science for younger learners" },
  { id: "civic_education", label: "Civic Education", emoji: "🏫", description: "Learn about citizenship and society" },
  { id: "government", label: "Government", emoji: "🏛️", description: "Understand how governments work" },
  { id: "finance", label: "Finance", emoji: "💰", description: "Learn money management basics" },
  { id: "current_affairs", label: "Current Affairs", emoji: "📰", description: "Stay updated on world events" },
  { id: "general_knowledge", label: "General Knowledge", emoji: "🧠", description: "Broaden your knowledge base" },
  { id: "economics", label: "Economics", emoji: "📊", description: "Understand economic concepts" },
  { id: "computer", label: "Computer Studies", emoji: "💻", description: "Learn technology and computing" },
  { id: "literature", label: "Literature", emoji: "📜", description: "Explore literary works" },
  { id: "music", label: "Music", emoji: "🎵", description: "Learn music theory and appreciation" },
  { id: "french", label: "French", emoji: "🇫🇷", description: "Practice French language" },
  { id: "agriculture", label: "Agriculture", emoji: "🌾", description: "Learn about farming and agriculture" },
];

// Academic Year (UK-style Year 1-13)
export type AcademicYear = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13;

export const ACADEMIC_YEARS: { value: AcademicYear; label: string; ageRange: string }[] = [
  { value: 1, label: "Year 1", ageRange: "5-6 years" },
  { value: 2, label: "Year 2", ageRange: "6-7 years" },
  { value: 3, label: "Year 3", ageRange: "7-8 years" },
  { value: 4, label: "Year 4", ageRange: "8-9 years" },
  { value: 5, label: "Year 5", ageRange: "9-10 years" },
  { value: 6, label: "Year 6", ageRange: "10-11 years" },
  { value: 7, label: "Year 7", ageRange: "11-12 years" },
  { value: 8, label: "Year 8", ageRange: "12-13 years" },
  { value: 9, label: "Year 9", ageRange: "13-14 years" },
  { value: 10, label: "Year 10", ageRange: "14-15 years" },
  { value: 11, label: "Year 11", ageRange: "15-16 years" },
  { value: 12, label: "Year 12", ageRange: "16-17 years" },
  { value: 13, label: "Year 13", ageRange: "17-18 years" },
];

// Learning Task
export interface LearningTask {
  id: string;
  categoryId: LearningCategory;
  title: string;
  description: string;
  isDefault: boolean;
  isEnabled: boolean;
  points: number;
  hasNegativePoints: boolean; // Only defaults can subtract points if skipped
  frequency: "daily" | "weekly";
  daysOfWeek: number[]; // 0-6 for Sun-Sat
  timeOfDay?: string; // HH:mm
  appliesTo: "all" | "selected";
  selectedChildIds: string[];
  isQuestionBased: boolean;
  questionsPerSession: number;
  createdAt: string;
}

// Learning Question (from admin CSV upload)
export interface LearningQuestion {
  id: string;
  categoryId: LearningCategory;
  academicYear: AcademicYear;
  question: string;
  choices: string[]; // 4 choices
  correctChoiceIndex: number; // 0-3
  explanation: string;
  createdAt: string;
}

// Comprehension Passage with Questions (for English Comprehension category)
export interface ComprehensionPassage {
  id: string;
  academicYear: AcademicYear;
  title: string;
  passage: string; // The reading text
  questions: {
    id: string;
    question: string;
    choices: string[]; // 4 choices
    correctChoiceIndex: number; // 0-3
    explanation: string;
  }[];
  createdAt: string;
}

// Word Entry (for "Word of the Day" category)
export interface WordEntry {
  id: string;
  academicYear: AcademicYear;
  word: string;
  meaning: string;
  partOfSpeech: string; // noun, verb, adjective, etc.
  opposites: string[];
  synonyms: string[];
  context: string;
  examples: string[]; // Up to 5 example sentences
  createdAt: string;
}

// Child's progress on learning tasks
export interface ChildLearningProgress {
  childId: string;
  categoryId: LearningCategory;
  taskId: string;
  date: string; // YYYY-MM-DD
  completed: boolean;
  questionsAnswered: number;
  correctAnswers: number;
  pointsEarned: number;
  goldEarned: number; // Gold points from timed exam
  completedAt?: string;
}

// Exam session result (for Gold scoring)
export interface ExamSession {
  id: string;
  childId: string;
  categoryId: LearningCategory;
  academicYear: AcademicYear;
  date: string;
  questions: {
    questionId: string;
    correct: boolean;
    timeRemaining: number; // Seconds remaining when answered (0-50)
    goldEarned: number; // timeRemaining if correct, 0 if wrong
  }[];
  totalGold: number;
  totalCorrect: number;
  rewardPoints: number; // 1 per correct answer, max 10
  completedAt: string;
}

// Child's all-time Gold totals per subject
export interface ChildGoldTotals {
  childId: string;
  childName: string;
  country: string;
  totals: {
    categoryId: LearningCategory;
    totalGold: number;
    totalSessions: number;
    bestSession: number;
  }[];
}

// Leaderboard entry
export interface LeaderboardEntry {
  rank: number;
  childId: string;
  childName: string;
  country: string;
  totalGold: number;
}

// Exam constants
export const EXAM_CONFIG = {
  QUESTIONS_PER_SESSION: 10,
  SECONDS_PER_QUESTION: 50,
  MAX_GOLD_PER_SESSION: 500, // 50 seconds × 10 questions
  HIGH_SCORE_THRESHOLD: 250, // Above this triggers celebration message
};

// Parent motivational messages - High Score (above 250 Gold)
export const HIGH_SCORE_MESSAGES = [
  "Wow! I am so incredibly proud of you! You're shining brighter every single day!",
  "What an amazing achievement! You've worked so hard and it really shows!",
  "Superstar alert! You've made my heart burst with pride today!",
  "Incredible work! I knew you had it in you – you're absolutely brilliant!",
  "Outstanding! Your dedication is inspiring and I couldn't be happier!",
  "Champions are made of moments like these – and you're a true champion!",
  "Look at you go! Your hard work is paying off in the most wonderful way!",
  "Simply amazing! You've proven that you can achieve anything you set your mind to!",
  "I'm over the moon with how well you've done! Keep reaching for the stars!",
  "Fantastic performance! You're not just learning – you're excelling!",
  "What a brilliant mind you have! I'm so lucky to be your parent!",
  "You've outdone yourself today! I'm beaming with pride!",
  "Excellence in action! You're showing the world what you're made of!",
  "Bravo! Your talent and effort have created something beautiful today!",
  "I'm speechless with joy! You're growing into such a remarkable person!",
  "Top-notch work! You're proof that dreams come true with hard work!",
  "You're on fire! Nothing can stop you when you put your mind to it!",
  "Phenomenal! I always believed in you, and you've proven me right!",
  "You're a shining example of what's possible! So proud of you!",
  "Magnificent! Today you've shown everyone – including yourself – your true potential!",
];

// Parent motivational messages - Nearly There (250 or below)
export const NEARLY_THERE_MESSAGES = [
  "I believe in you completely! Every step forward is a step toward greatness!",
  "You're doing better than you think! Keep going – I'm right here cheering you on!",
  "Progress, not perfection! I'm so proud of you for trying your best!",
  "Every expert was once a beginner. You're on your way to amazing things!",
  "Don't give up! Your effort today is building the success of tomorrow!",
  "I see how hard you're working and that makes me incredibly proud!",
  "Remember: mistakes are just lessons in disguise. You're learning so much!",
  "You have so much potential! Keep pushing – your breakthrough is coming!",
  "I'm proud of you for showing up and giving it your all!",
  "Great things take time. Keep at it – you're doing wonderfully!",
  "Your determination inspires me! You're stronger than you know!",
  "Every challenge you face makes you smarter. Keep going!",
  "I love watching you grow and learn. You're doing brilliantly!",
  "Rome wasn't built in a day, and neither is a brilliant mind. You've got this!",
  "You're braver than you believe and smarter than you think!",
  "Keep your chin up! Tomorrow is another chance to shine even brighter!",
  "I'm in your corner, always. You're capable of incredible things!",
  "Success is a journey, not a destination. And you're on the right path!",
  "You're making progress with every single try. That's what matters most!",
  "Never doubt yourself – I never doubt you! You're going to do great things!",
];

// Track which questions/words have been shown to each child
export interface ChildQuestionHistory {
  childId: string;
  questionIds: string[];
  wordIds: string[];
}

// Generate UUID
const generateId = () =>
  "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });

// Default learning tasks
const createDefaultTasks = (): LearningTask[] => [
  {
    id: "default-words",
    categoryId: "words",
    title: "Word of the Day",
    description: "Learn a new word every day with its meaning, synonyms, and usage",
    isDefault: true,
    isEnabled: true,
    points: 10,
    hasNegativePoints: true, // -10 if skipped
    frequency: "daily",
    daysOfWeek: [0, 1, 2, 3, 4, 5, 6], // Every day
    appliesTo: "all",
    selectedChildIds: [],
    isQuestionBased: true,
    questionsPerSession: 1, // 1 word per day
    createdAt: new Date().toISOString(),
  },
  {
    id: "default-maths",
    categoryId: "maths",
    title: "Daily Maths Practice",
    description: "Practice mathematics with questions suited to your academic year",
    isDefault: true,
    isEnabled: true,
    points: 10,
    hasNegativePoints: true, // -10 if skipped
    frequency: "daily",
    daysOfWeek: [0, 1, 2, 3, 4, 5, 6], // Every day
    appliesTo: "all",
    selectedChildIds: [],
    isQuestionBased: true,
    questionsPerSession: 10,
    createdAt: new Date().toISOString(),
  },
];

interface LearningState {
  // Tasks
  tasks: LearningTask[];
  
  // Questions (from admin uploads)
  questions: LearningQuestion[];
  
  // Comprehension Passages (for English Comprehension)
  comprehensionPassages: ComprehensionPassage[];
  
  // Words (for Word of the Day)
  words: WordEntry[];
  
  // Child progress
  progress: ChildLearningProgress[];
  
  // Question history per child
  questionHistory: ChildQuestionHistory[];
  
  // Exam sessions (for Gold scoring)
  examSessions: ExamSession[];
  
  // Actions - Tasks
  addTask: (task: Omit<LearningTask, "id" | "createdAt">) => void;
  updateTask: (id: string, updates: Partial<LearningTask>) => void;
  deleteTask: (id: string) => void;
  toggleTask: (id: string) => void;
  
  // Actions - Progress
  recordProgress: (progress: Omit<ChildLearningProgress, "completedAt">) => void;
  getTodayProgress: (childId: string, categoryId: LearningCategory, taskId: string) => ChildLearningProgress | undefined;
  getChildProgress: (childId: string) => ChildLearningProgress[];
  
  // Actions - Exam Sessions (Gold scoring)
  recordExamSession: (session: Omit<ExamSession, "id">) => void;
  getChildExamSessions: (childId: string, categoryId?: LearningCategory) => ExamSession[];
  getChildGoldTotal: (childId: string, categoryId: LearningCategory) => number;
  getChildAllTimeGold: (childId: string) => { categoryId: LearningCategory; totalGold: number; sessions: number }[];
  
  // Actions - Leaderboards
  getCountryLeaderboard: (categoryId: LearningCategory, country: string, childrenData: { id: string; name: string; country: string }[]) => LeaderboardEntry[];
  getWorldwideLeaderboard: (categoryId: LearningCategory, childrenData: { id: string; name: string; country: string }[]) => LeaderboardEntry[];
  getChildRank: (childId: string, categoryId: LearningCategory, leaderboard: LeaderboardEntry[]) => number | null;
  
  // Actions - Parent Messages
  getParentMessage: (goldScore: number, parentName: "Mummy" | "Daddy") => string;
  
  // Actions - Questions
  addQuestions: (questions: LearningQuestion[]) => void;
  updateQuestion: (id: string, updates: Partial<LearningQuestion>) => void;
  deleteQuestion: (id: string) => void;
  deleteQuestionsByDate: (date: string) => void; // Delete all questions from a specific date
  getRandomQuestions: (categoryId: LearningCategory, academicYear: AcademicYear, childId: string, count: number) => LearningQuestion[];
  markQuestionUsed: (childId: string, questionId: string) => void;
  hasSystemQuestions: (categoryId: LearningCategory) => boolean;
  
  // Actions - Comprehension Passages
  addComprehensionPassages: (passages: ComprehensionPassage[]) => void;
  updatePassage: (id: string, updates: Partial<ComprehensionPassage>) => void;
  deletePassage: (id: string) => void;
  deletePassagesByDate: (date: string) => void;
  getRandomPassage: (academicYear: AcademicYear, childId: string) => ComprehensionPassage | undefined;
  
  // Actions - Words
  addWords: (words: WordEntry[]) => void;
  updateWord: (id: string, updates: Partial<WordEntry>) => void;
  deleteWord: (id: string) => void;
  deleteWordsByDate: (date: string) => void;
  getRandomWord: (academicYear: AcademicYear, childId: string) => WordEntry | undefined;
  markWordUsed: (childId: string, wordId: string) => void;
  
  // Actions - Child Tasks
  getTasksForChild: (childId: string) => LearningTask[];
  getPendingTasksForChild: (childId: string) => LearningTask[];
  getAllAssignedSubjects: (childId: string) => LearningCategory[];
  
  // Actions - Utility
  resetStore: () => void;
}

const initialState = {
  tasks: createDefaultTasks(),
  questions: [],
  comprehensionPassages: [],
  words: [],
  progress: [],
  questionHistory: [],
  examSessions: [],
};

export const useLearningStore = create<LearningState>()(
  persist(
    (set, get) => ({
      ...initialState,
      
      // Task Actions
      addTask: (taskData) => {
        const task: LearningTask = {
          ...taskData,
          id: generateId(),
          createdAt: new Date().toISOString(),
        };
        set((state) => ({ tasks: [...state.tasks, task] }));
      },
      
      updateTask: (id, updates) => {
        set((state) => ({
          tasks: state.tasks.map((task) =>
            task.id === id ? { ...task, ...updates } : task
          ),
        }));
      },
      
      deleteTask: (id) => {
        // Don't allow deleting default tasks
        const task = get().tasks.find((t) => t.id === id);
        if (task?.isDefault) return;
        
        set((state) => ({
          tasks: state.tasks.filter((task) => task.id !== id),
        }));
      },
      
      toggleTask: (id) => {
        set((state) => ({
          tasks: state.tasks.map((task) =>
            task.id === id ? { ...task, isEnabled: !task.isEnabled } : task
          ),
        }));
      },
      
      // Progress Actions
      recordProgress: (progressData) => {
        const today = new Date().toISOString().split("T")[0];
        const existingIndex = get().progress.findIndex(
          (p) =>
            p.childId === progressData.childId &&
            p.taskId === progressData.taskId &&
            p.date === today
        );
        
        const progress: ChildLearningProgress = {
          ...progressData,
          date: today,
          goldEarned: progressData.goldEarned || 0,
          completedAt: progressData.completed ? new Date().toISOString() : undefined,
        };
        
        if (existingIndex >= 0) {
          set((state) => ({
            progress: state.progress.map((p, i) =>
              i === existingIndex ? progress : p
            ),
          }));
        } else {
          set((state) => ({ progress: [...state.progress, progress] }));
        }
      },
      
      getTodayProgress: (childId, categoryId, taskId) => {
        const today = new Date().toISOString().split("T")[0];
        return get().progress.find(
          (p) =>
            p.childId === childId &&
            p.categoryId === categoryId &&
            p.taskId === taskId &&
            p.date === today
        );
      },
      
      getChildProgress: (childId) => {
        return get().progress.filter((p) => p.childId === childId);
      },
      
      // Question Actions
      addQuestions: (questions) => {
        set((state) => ({
          questions: [...state.questions, ...questions],
        }));
      },
      
      updateQuestion: (id, updates) => {
        set((state) => ({
          questions: state.questions.map((q) =>
            q.id === id ? { ...q, ...updates } : q
          ),
        }));
      },
      
      deleteQuestion: (id) => {
        set((state) => ({
          questions: state.questions.filter((q) => q.id !== id),
        }));
      },
      
      deleteQuestionsByDate: (date) => {
        // Delete all questions created on a specific date (YYYY-MM-DD)
        set((state) => ({
          questions: state.questions.filter((q) => !q.createdAt.startsWith(date)),
        }));
      },
      
      getRandomQuestions: (categoryId, academicYear, childId, count) => {
        const history = get().questionHistory.find((h) => h.childId === childId);
        const usedIds = history?.questionIds || [];
        
        // Get questions for category and academic year that haven't been used
        const availableQuestions = get().questions.filter(
          (q) =>
            q.categoryId === categoryId &&
            q.academicYear === academicYear &&
            !usedIds.includes(q.id)
        );
        
        // If not enough unused questions, reset history for this category
        if (availableQuestions.length < count) {
          const allQuestions = get().questions.filter(
            (q) => q.categoryId === categoryId && q.academicYear === academicYear
          );
          // Shuffle and return
          return allQuestions
            .sort(() => Math.random() - 0.5)
            .slice(0, count);
        }
        
        // Shuffle and return requested count
        return availableQuestions
          .sort(() => Math.random() - 0.5)
          .slice(0, count);
      },
      
      markQuestionUsed: (childId, questionId) => {
        const existingIndex = get().questionHistory.findIndex(
          (h) => h.childId === childId
        );
        
        if (existingIndex >= 0) {
          set((state) => ({
            questionHistory: state.questionHistory.map((h, i) =>
              i === existingIndex
                ? { ...h, questionIds: [...h.questionIds, questionId] }
                : h
            ),
          }));
        } else {
          set((state) => ({
            questionHistory: [
              ...state.questionHistory,
              { childId, questionIds: [questionId], wordIds: [] },
            ],
          }));
        }
      },
      
      hasSystemQuestions: (categoryId) => {
        return get().questions.some((q) => q.categoryId === categoryId);
      },
      
      // Word Actions
      addWords: (words) => {
        set((state) => ({
          words: [...state.words, ...words],
        }));
      },
      
      updateWord: (id, updates) => {
        set((state) => ({
          words: state.words.map((w) =>
            w.id === id ? { ...w, ...updates } : w
          ),
        }));
      },
      
      deleteWord: (id) => {
        set((state) => ({
          words: state.words.filter((w) => w.id !== id),
        }));
      },
      
      deleteWordsByDate: (date) => {
        set((state) => ({
          words: state.words.filter((w) => !w.createdAt.startsWith(date)),
        }));
      },
      
      getRandomWord: (academicYear, childId) => {
        const history = get().questionHistory.find((h) => h.childId === childId);
        const usedIds = history?.wordIds || [];
        
        const availableWords = get().words.filter(
          (w) => w.academicYear === academicYear && !usedIds.includes(w.id)
        );
        
        if (availableWords.length === 0) {
          // Reset - all words used, pick any for this academic year
          const allWords = get().words.filter(
            (w) => w.academicYear === academicYear
          );
          if (allWords.length === 0) return undefined;
          return allWords[Math.floor(Math.random() * allWords.length)];
        }
        
        return availableWords[Math.floor(Math.random() * availableWords.length)];
      },
      
      markWordUsed: (childId, wordId) => {
        const existingIndex = get().questionHistory.findIndex(
          (h) => h.childId === childId
        );
        
        if (existingIndex >= 0) {
          set((state) => ({
            questionHistory: state.questionHistory.map((h, i) =>
              i === existingIndex
                ? { ...h, wordIds: [...h.wordIds, wordId] }
                : h
            ),
          }));
        } else {
          set((state) => ({
            questionHistory: [
              ...state.questionHistory,
              { childId, questionIds: [], wordIds: [wordId] },
            ],
          }));
        }
      },
      
      // Comprehension Passage Actions
      addComprehensionPassages: (passages) => {
        set((state) => ({
          comprehensionPassages: [...state.comprehensionPassages, ...passages],
        }));
      },
      
      updatePassage: (id, updates) => {
        set((state) => ({
          comprehensionPassages: state.comprehensionPassages.map((p) =>
            p.id === id ? { ...p, ...updates } : p
          ),
        }));
      },
      
      deletePassage: (id) => {
        set((state) => ({
          comprehensionPassages: state.comprehensionPassages.filter((p) => p.id !== id),
        }));
      },
      
      deletePassagesByDate: (date) => {
        set((state) => ({
          comprehensionPassages: state.comprehensionPassages.filter((p) => !p.createdAt.startsWith(date)),
        }));
      },
      
      getRandomPassage: (academicYear, childId) => {
        const history = get().questionHistory.find((h) => h.childId === childId);
        const usedIds = history?.questionIds || [];
        
        const availablePassages = get().comprehensionPassages.filter(
          (p) => p.academicYear === academicYear && !usedIds.includes(p.id)
        );
        
        if (availablePassages.length === 0) {
          // Reset - all passages used, pick any for this academic year
          const allPassages = get().comprehensionPassages.filter(
            (p) => p.academicYear === academicYear
          );
          if (allPassages.length === 0) return undefined;
          return allPassages[Math.floor(Math.random() * allPassages.length)];
        }
        
        return availablePassages[Math.floor(Math.random() * availablePassages.length)];
      },
      
      // Exam Session Actions (Gold scoring)
      recordExamSession: (sessionData) => {
        const session: ExamSession = {
          ...sessionData,
          id: generateId(),
        };
        set((state) => ({
          examSessions: [...state.examSessions, session],
        }));
      },
      
      getChildExamSessions: (childId, categoryId) => {
        return get().examSessions.filter(
          (s) =>
            s.childId === childId &&
            (!categoryId || s.categoryId === categoryId)
        );
      },
      
      getChildGoldTotal: (childId, categoryId) => {
        return get()
          .examSessions.filter(
            (s) => s.childId === childId && s.categoryId === categoryId
          )
          .reduce((total, s) => total + s.totalGold, 0);
      },
      
      getChildAllTimeGold: (childId) => {
        const sessions = get().examSessions.filter((s) => s.childId === childId);
        const categoryMap = new Map<LearningCategory, { totalGold: number; sessions: number }>();
        
        sessions.forEach((s) => {
          const existing = categoryMap.get(s.categoryId);
          if (existing) {
            categoryMap.set(s.categoryId, {
              totalGold: existing.totalGold + s.totalGold,
              sessions: existing.sessions + 1,
            });
          } else {
            categoryMap.set(s.categoryId, {
              totalGold: s.totalGold,
              sessions: 1,
            });
          }
        });
        
        return Array.from(categoryMap.entries()).map(([categoryId, data]) => ({
          categoryId,
          ...data,
        }));
      },
      
      // Leaderboard Actions
      getCountryLeaderboard: (categoryId, country, childrenData) => {
        const countryChildren = childrenData.filter((c) => c.country === country);
        const leaderboard: LeaderboardEntry[] = [];
        
        countryChildren.forEach((child) => {
          const totalGold = get().getChildGoldTotal(child.id, categoryId);
          if (totalGold > 0) {
            leaderboard.push({
              rank: 0,
              childId: child.id,
              childName: child.name,
              country: child.country,
              totalGold,
            });
          }
        });
        
        // Sort by gold descending and assign ranks
        leaderboard.sort((a, b) => b.totalGold - a.totalGold);
        leaderboard.forEach((entry, i) => {
          entry.rank = i + 1;
        });
        
        // Return top 100
        return leaderboard.slice(0, 100);
      },
      
      getWorldwideLeaderboard: (categoryId, childrenData) => {
        const leaderboard: LeaderboardEntry[] = [];
        
        childrenData.forEach((child) => {
          const totalGold = get().getChildGoldTotal(child.id, categoryId);
          if (totalGold > 0) {
            leaderboard.push({
              rank: 0,
              childId: child.id,
              childName: child.name,
              country: child.country,
              totalGold,
            });
          }
        });
        
        // Sort by gold descending and assign ranks
        leaderboard.sort((a, b) => b.totalGold - a.totalGold);
        leaderboard.forEach((entry, i) => {
          entry.rank = i + 1;
        });
        
        // Return top 100
        return leaderboard.slice(0, 100);
      },
      
      getChildRank: (childId, categoryId, leaderboard) => {
        const entry = leaderboard.find((e) => e.childId === childId);
        return entry?.rank || null;
      },
      
      // Parent Messages
      getParentMessage: (goldScore, parentName) => {
        const messages = goldScore > EXAM_CONFIG.HIGH_SCORE_THRESHOLD
          ? HIGH_SCORE_MESSAGES
          : NEARLY_THERE_MESSAGES;
        
        const randomMessage = messages[Math.floor(Math.random() * messages.length)];
        return `${randomMessage}\n\nLove,\n${parentName} ❤️`;
      },
      
      // Child Task Actions
      getTasksForChild: (childId) => {
        return get().tasks.filter(
          (task) =>
            task.isEnabled &&
            (task.appliesTo === "all" ||
              task.selectedChildIds.includes(childId))
        );
      },
      
      getPendingTasksForChild: (childId) => {
        const today = new Date().toISOString().split("T")[0];
        const dayOfWeek = new Date().getDay();
        
        return get()
          .getTasksForChild(childId)
          .filter((task) => {
            // Check if task is scheduled for today
            if (!task.daysOfWeek.includes(dayOfWeek)) return false;
            
            // Check if already completed today
            const progress = get().progress.find(
              (p) =>
                p.childId === childId &&
                p.taskId === task.id &&
                p.date === today &&
                p.completed
            );
            
            return !progress;
          });
      },
      
      getAllAssignedSubjects: (childId) => {
        // Get all unique categories ever assigned to this child
        const assignedCategories = new Set<LearningCategory>();
        
        get().tasks.forEach((task) => {
          if (
            task.isEnabled &&
            (task.appliesTo === "all" || task.selectedChildIds.includes(childId))
          ) {
            assignedCategories.add(task.categoryId);
          }
        });
        
        return Array.from(assignedCategories);
      },
      
      resetStore: () => {
        set(initialState);
      },
    }),
    {
      name: "learning-store",
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        tasks: state.tasks,
        questions: state.questions,
        words: state.words,
        progress: state.progress,
        questionHistory: state.questionHistory,
        examSessions: state.examSessions,
      }),
    }
  )
);
