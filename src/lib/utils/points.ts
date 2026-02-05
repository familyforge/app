// Points calculation utilities
import type { Task, Exercise } from "../types";

/**
 * Calculate total points earned from completed tasks
 */
export function calculateTaskPoints(tasks: Task[]): number {
  return tasks.reduce((total, task) => {
    if (task.status === 'completed') {
      return total + task.points;
    }
    return total;
  }, 0);
}

/**
 * Calculate total negative points from incomplete tasks
 */
export function calculateNegativePoints(tasks: Task[]): number {
  return tasks.reduce((total, task) => {
    if (task.status !== 'completed' && task.dueDate && new Date(task.dueDate) < new Date()) {
      return total + (task.negativePoints || 0);
    }
    return total;
  }, 0);
}

/**
 * Calculate points from completed exercises
 */
export function calculateExercisePoints(exercises: Exercise[]): number {
  return exercises.reduce((total, exercise) => {
    if (exercise.completed && exercise.marked) {
      const correctAnswers = exercise.questions.filter((q) => q.correct).length;
      return total + correctAnswers * exercise.pointsPerQuestion;
    }
    return total;
  }, 0);
}

/**
 * Calculate net points (earned - negative)
 */
export function calculateNetPoints(tasks: Task[], exercises: Exercise[]): number {
  const taskPoints = calculateTaskPoints(tasks);
  const exercisePoints = calculateExercisePoints(exercises);
  const negativePoints = calculateNegativePoints(tasks);
  return taskPoints + exercisePoints - negativePoints;
}

/**
 * Convert points to currency value
 */
export function pointsToCurrency(points: number, rate: number = 0.01): number {
  return Math.max(0, points * rate);
}

/**
 * Format points as display string
 */
export function formatPoints(points: number): string {
  if (points >= 1000) {
    return `${(points / 1000).toFixed(1)}k`;
  }
  return points.toString();
}
