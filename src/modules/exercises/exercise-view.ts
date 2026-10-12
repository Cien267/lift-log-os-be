import {
  Equipment,
  ExerciseCategory,
  MuscleGroup,
} from '../../common/enums/forge.enums';

/** Hình dạng trả về cho client (khớp interface Exercise của Dexie). */
export interface ExerciseView {
  id: string;
  name: string;
  muscleGroup: MuscleGroup;
  secondaryMuscles: MuscleGroup[];
  equipment: Equipment;
  category: ExerciseCategory;
  aliases: string[];
  guideImage: string | null;
  substituteIds: string[];
  /** true = bài tập tự tạo của user, false = bài tập hệ thống. */
  custom: boolean;
  createdAt: Date;
  updatedAt: Date;
}
