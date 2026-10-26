export interface BodyMeasurementView {
  id: string;
  userId: string;
  weight: number | null;
  height: number | null;
  bodyFat: number | null;
  chest: number | null;
  waist: number | null;
  arm: number | null;
  thigh: number | null;
  shoulder: number | null;
  hip: number | null;
  notes: string | null;
  date: string;
  createdAt: Date;
  updatedAt: Date;
}
