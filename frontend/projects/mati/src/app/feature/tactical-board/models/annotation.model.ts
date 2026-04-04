export interface Annotation {
  id: string;
  type: 'arrow';
  points: [number, number, number, number];
  color: string;
  strokeWidth: number;
}
