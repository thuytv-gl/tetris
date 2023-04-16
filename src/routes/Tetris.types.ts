export type Cell = {
  x: number;
  y: number;
  fill: boolean;
  cached: boolean;
};

export type Shape = [number, number, number, number];
export type ImmuteShape = Readonly<Shape>;

export type ShapeName = 'I_SHAPE'
| 'Z_SHAPE'
| 'S_SHAPE'
| 'T_SHAPE'
| 'L_SHAPE'
| 'J_SHAPE'
| 'O_SHAPE';

export enum Direction {
  LEFT = -1,
  RIGHT = 1,
};

export type Point = [number, number];
