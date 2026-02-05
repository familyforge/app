import { View, Text } from 'react-native';
import { BarChart3 } from 'lucide-react-native';

interface ChartData {
  day: string;
  tasks: number;
  points: number;
}

interface ChartCardProps {
  title: string;
  data: ChartData[];
}

export function ChartCard({ title, data }: ChartCardProps) {
  const maxTasks = Math.max(...data.map((d) => d.tasks), 1);

  return (
    <View className="bg-slate-800/50 rounded-2xl p-5 border border-slate-700/50">
      {/* Header */}
      <View className="flex-row items-center gap-2 mb-6">
        <BarChart3 color="#3b82f6" size={20} />
        <Text className="text-lg font-semibold text-white">{title}</Text>
      </View>

      {/* Simple bar chart */}
      <View className="flex-row items-end justify-between h-32 gap-2">
        {data.map((item, index) => {
          const height = (item.tasks / maxTasks) * 100;
          return (
            <View key={index} className="flex-1 items-center">
              <View
                className="w-full bg-blue-500 rounded-t-lg"
                style={{ height: `${Math.max(height, 8)}%` }}
              />
              <Text className="text-slate-400 text-xs mt-2">{item.day}</Text>
            </View>
          );
        })}
      </View>

      {/* Legend */}
      <View className="flex-row justify-center gap-6 mt-4 pt-4 border-t border-slate-700/50">
        <View className="flex-row items-center gap-2">
          <View className="w-3 h-3 bg-blue-500 rounded-full" />
          <Text className="text-slate-400 text-sm">Tasks Completed</Text>
        </View>
      </View>
    </View>
  );
}
