import { WorkoutLocation } from '../../common/enums/forge.enums';

export interface TemplateExerciseView {
  id: string;
  exerciseId: string;
  position: number;
  targetSets: number;
  targetRepsMin: number | null;
  targetRepsMax: number | null;
  restPreset: number | null;
  supersetGroup: number | null;
}

export interface TemplateView {
  id: string;
  name: string;
  description: string | null;
  location: WorkoutLocation;
  position: number;
  exercises: TemplateExerciseView[];
  createdAt: Date;
  updatedAt: Date;
}
