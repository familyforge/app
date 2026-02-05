// Pro Parenting App - API Index
// Export all API modules for easy importing

// Supabase client and types
export { supabase, isSupabaseConfigured, getCurrentSession, getCurrentUser } from './supabase';
export type { Database } from './database.types';

// Authentication
export {
  signUp,
  signIn,
  signOut,
  signInAsAdmin,
  getCurrentAuthUser,
  isAuthenticated,
  isAdmin,
  getAccessToken,
  refreshSession,
  resetPassword,
  updatePassword,
  updateProfile,
  onAuthStateChange,
  type AuthUser,
  type SignUpData,
  type SignInData,
  type AuthResult,
} from './auth';

// Auth Context & Hooks
export {
  AuthProvider,
  useAuth,
  useIsAuthenticated,
  useCurrentUser,
  useIsAdmin,
} from './auth-context';

// Type exports for convenience
export type {
  Parent,
  Child,
  Task,
  Reward,
  Exercise,
  Report,
  Settings,
  SyncQueueItem,
  TaskType,
  TaskStatus,
  SubscriptionTier,
  ThemeType,
  UserRole,
  Tables,
  InsertTables,
  UpdateTables,
} from './database.types';

// Children API
export {
  getChildren,
  getChildById,
  createChild,
  updateChild,
  deleteChild,
  type CreateChildInput,
  type UpdateChildInput,
} from './children';

// Tasks API
export {
  getTasksByChild,
  createTask,
  updateTask,
  deleteTask,
  completeTask,
  setTaskStatus,
  type CreateTaskInput,
  type UpdateTaskInput,
} from './tasks';

// Rewards API
export {
  getRewardsByChild,
  createReward,
  updateReward,
  deleteReward,
  redeemReward,
  type CreateRewardInput,
  type UpdateRewardInput,
} from './rewards';

// Exercises API
export {
  getExercisesByChild,
  createExercise,
  updateExercise,
  markExerciseCompleted,
  deleteExercise,
  type CreateExerciseInput,
  type UpdateExerciseInput,
} from './exercises';

// Reports API
export {
  getReportsByChild,
  upsertReport,
  deleteReport,
  type UpsertReportInput,
} from './reports';

// Settings API
export {
  getSettings,
  updateSettings,
  type ParentSettings,
  type UpdateSettingsInput,
} from './settings';

// Sync queue API
export {
  enqueueSyncOperation,
  getPendingSyncOperations,
  markSyncOperationSynced,
  processSyncQueue,
  clearSyncedOperations,
  type QueueSyncInput,
  type SyncResult,
  type SyncOperation,
  type SyncTableName,
} from './sync';

// Profile & Control Center API
export { syncProfileData } from './profile';
export { updateParentPlan } from './subscription';
