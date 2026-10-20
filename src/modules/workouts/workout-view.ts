import { WorkoutLocation } from '../../common/enums/forge.enums';

export interface WorkoutSetView {
  id: string;
  weight: number;
  reps: number;
  durationMin: number | null;
  rir: number | null;
  rpe: number | null;
  restTime: number | null;
  completed: boolean;
  isWarmup: boolean;
  notes: string | null;
  performedAt: Date;
}

export interface WorkoutExerciseView {
  id: string;
  exerciseId: string;
  /** Tên bài tập tại thời điểm đọc (kể cả bài đã bị xóa mềm), để hiển thị lịch sử. */
  exerciseName: string;
  position: number;
  restPreset: number | null;
  notes: string | null;
  supersetGroup: number | null;
  targetSets: number | null;
  sets: WorkoutSetView[];
}

export interface WorkoutSummary {
  id: string;
  name: string | null;
  date: string;
  startTime: Date;
  endTime: Date | null;
  durationSec: number | null;
  location: WorkoutLocation;
  templateId: string | null;
  mood: number | null;
  energyLevel: number | null;
  totalVolume: number;
  totalCardioMin: number;
  estimatedCalories: number | null;
  exerciseCount: number;
  setCount: number;
  completedSetCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface WorkoutView {
  id: string;
  name: string | null;
  date: string;
  startTime: Date;
  endTime: Date | null;
  durationSec: number | null;
  location: WorkoutLocation;
  templateId: string | null;
  notes: string | null;
  mood: number | null;
  energyLevel: number | null;
  totalVolume: number;
  totalCardioMin: number;
  estimatedCalories: number | null;
  insight: Record<string, unknown> | null;
  exercises: WorkoutExerciseView[];
  createdAt: Date;
  updatedAt: Date;
}

export interface LastPerformanceView {
  /** null nếu chưa có buổi tập đã kết thúc nào có bài này. */
  workout: { id: string; date: string; startTime: Date } | null;
  /** Các set không phải khởi động của buổi đó (kể cả chưa hoàn thành), theo thứ tự tập. */
  sets: WorkoutSetView[];
}
