import { View, Text, Pressable } from 'react-native';
import { CheckCircle2, Circle, Star, Clock } from 'lucide-react-native';
import type { Task, TaskCategory } from '../lib/types';

interface TaskCardProps {
  task: Task;
  onComplete?: (id: string) => void;
}

export function TaskCard({ task, onComplete }: TaskCardProps) {
  const getCategoryColor = (category: TaskCategory) => {
    const colors: Record<TaskCategory, string> = {
      chore: '#3b82f6',
      personal_care: '#22d3ee',
      exercise: '#22c55e',
      learning: '#a855f7',
      social: '#ec4899',
      creative: '#f97316',
      other: '#64748b',
    };
    return colors[category];
  };

  const isCompleted = task.status === 'completed';

  return (
    <Pressable
      onPress={() => !isCompleted && onComplete?.(task.id)}
      className={`bg-slate-800/50 rounded-2xl p-4 flex-row items-start border ${
        isCompleted ? 'border-emerald-500/30' : 'border-slate-700/50'
      }`}
    >
      <View className="mr-3 mt-0.5">
        {isCompleted ? (
          <CheckCircle2 size={24} color="#10b981" />
        ) : (
          <Circle size={24} color="#64748b" />
        )}
      </View>
      <View className="flex-1">
        <Text className={`text-lg font-medium ${
          isCompleted ? 'text-slate-500 line-through' : 'text-white'
        }`}>
          {task.title}
        </Text>
        {task.description && (
          <Text className="text-slate-400 text-sm mt-1">{task.description}</Text>
        )}
        <View className="flex-row items-center gap-3 mt-2">
          <View 
            className="px-2 py-1 rounded-full"
            style={{ backgroundColor: `${getCategoryColor(task.category)}20` }}
          >
            <Text style={{ color: getCategoryColor(task.category), fontSize: 12 }}>
              {task.category}
            </Text>
          </View>
          <View className="flex-row items-center gap-1">
            <Star size={14} color="#f59e0b" />
            <Text className="text-amber-400 text-sm">{task.points}</Text>
          </View>
          {task.dueDate && (
            <View className="flex-row items-center gap-1">
              <Clock size={14} color="#64748b" />
              <Text className="text-slate-400 text-sm">
                {new Date(task.dueDate).toLocaleDateString()}
              </Text>
            </View>
          )}
        </View>
      </View>
    </Pressable>
  );
}
