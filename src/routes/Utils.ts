import type { ShapeName, Shape, ImmuteShape, Point } from './Tetris.types';
import { ShapeNames } from './Config';
/*
  * compare the tens of given numbers
  * e.g: n1 = 123, n2 = 234
  * n1 tens = 12
  * n2 tens = 23
  * => result false
  */
export const sameTens = (n1: number, n2: number) => {
  return Math.floor(n1/10) === Math.floor(n2/10);
}


export function getRandomShape(): ShapeName {
  const luckyShape = Math.floor(Math.random() * ShapeNames.length);
  return ShapeNames[luckyShape];
}

export function clone(shape: Shape | ImmuteShape): Shape {
  return shape.slice() as Shape;
}

export function dot(v1: number[], v2: number[]) {
  if (v1.length !== v2.length) {
    throw new Error("Two vector must in the same dimension");
  }

  return v1.reduce((itr, n, i) => itr + n * v2[i], 0);
}
/**
 * @params 1 | -1 factor
 * factor = 1: move toward p2
 * factor = -1: move away from p2
 */
export function translate(p1: Point, p2: Point, factor: 1 | -1 = 1): Point {
  return [p1[0] - p2[0] * factor, p1[1] - p2[1] * factor];
}

