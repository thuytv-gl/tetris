import type { Cell, Shape, ShapeName, Point } from './Tetris.types';
import { Direction } from './Tetris.types';
import {
  Shapes,
  CenterRotation,
  ClockwiseMatrix,
  CounterClockwiseMatrix
} from './Config';
import { sameTens, getRandomShape, clone, dot, translate } from './Utils';

const PAD = 4;
const CELL = 40;
const SIZE = CELL - PAD * 2;

export default class Tetris {
  private board: Cell[] = [];
  private shapeName: ShapeName = getRandomShape();
  private shapeData: Shape = clone(Shapes[this.shapeName]);
  private width = 10;
  private height = 20;
  private boardLen = this.width * this.height - 1;

  constructor(
    private _canvas: HTMLCanvasElement,
    private ctx: CanvasRenderingContext2D,
  ) {
    this.ctx.strokeStyle = 'green';
    this.ctx.fillStyle = 'green';
    this.makeBoard();
    this.listenKeyboard();
    this.setFillBulk(this.shapeData, true);
    this.loop();
  }

  populateRandomShape() {
    this.shapeName = getRandomShape();
    this.shapeData = clone(Shapes[this.shapeName]);
  }

  makeBoard() {
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        this.board.push({
          x: x * CELL + PAD,
          y: y * CELL + PAD,
          fill: false,
          cached: false,
        });
      }
    }

  }

  listenKeyboard() {
    window.addEventListener('keydown', (evt) => {
      type KeymapKey = keyof typeof this.keymap;
      type KeydownHandlerKey = keyof typeof this.keydownHandlers;
      const key = this.keymap[evt.code as KeymapKey] ?? evt.code;
      const handler = this.keydownHandlers[key as KeydownHandlerKey];
      if (typeof handler === 'function') {
        handler();
        this.renderBoard();
      }
    })
  }

  keymap = {
    KeyJ: 'ArrowDown',
    KeyK: 'ArrowUp',
    KeyH: 'ArrowLeft',
    KeyL: 'ArrowRight',
  }

  keydownHandlers = {
    Space: () => {
      /** drop */
      while(this.moveDown());
    },
    ArrowDown: () => {
      this.moveDown();
    },
    ArrowLeft: () => {
      this.moveAside(Direction.LEFT);
    },
    ArrowRight: () => {
      this.moveAside(Direction.RIGHT);
    },
    ArrowUp: () => {
      const matrix = Math.random() > 0.5 ? ClockwiseMatrix : CounterClockwiseMatrix;
      this.rotate(matrix);
    },
  }

  setFillBulk(indices: number[], fill: boolean) {
    for (let i = 0; i < indices.length; i++) {
      this.setFill(indices[i], fill);
    }
  }

  setFill(index: number, fill: boolean) {
    const item = this.board[index];
    if (item && item.fill !== fill) {
      item.fill = fill;
      item.cached = false;
    }
  }

  moveDown() {
    let i = this.shapeData.length;
    let updated = 0;
    const prev = clone(this.shapeData);

    this.shapeData.forEach(id => this.setFill(id, false));
    while (--i >= 0) {
      const id = this.shapeData[i];
      const next = id + this.width;

      if (sameTens(id, this.boardLen) || this.filled(next)) {
        break;
      }

      this.shapeData[i] = next;
      updated++;
    }

    const panic = updated !== this.shapeData.length;
    const toFill = panic ? prev : this.shapeData;
    panic && (this.populateRandomShape());

    toFill.forEach((id) => this.setFill(id, true));

    return !panic;
  }

  moveAside(direction: Direction) {
    let i = this.shapeData.length;
    let updated = 0;
    let prev = clone(this.shapeData);

    this.shapeData.forEach(id => this.setFill(id, false));
    while (--i >= 0) {
      const id = this.shapeData[i];
      const next = id + 1 * direction;

      if (!sameTens(id, next) || this.filled(next)) {
        break;
      }

      this.shapeData[i] = next;
      updated++;
    }

    const panic = updated !== this.shapeData.length;
    const toFill = panic ? prev : this.shapeData;

    panic && (this.shapeData = prev);
    toFill.forEach((id) => this.setFill(id, true));

    return !panic;
  }

  to2dCordinate(point: number): Point {
    return [
      /* x */point % this.width,
      /* y */Math.floor(point / this.width)
    ];
  }

  to1dPoint(point: Point) {
    return this.width * point[1] + point[0];
  }

  rotate(matrix: number[][]) {
    // Ref:https://en.wikipedia.org/wiki/Rotation_matrix#In_two_dimensions 
    const origin = this.to2dCordinate(this.shapeData[CenterRotation]);
    let i = this.shapeData.length, panic = false;
    const prev = clone(this.shapeData);
    this.setFillBulk(this.shapeData, false);
    while(--i >= 0) {
      let point = this.to2dCordinate(this.shapeData[i]);
      point = translate(point, origin);
      const rotated = [
        dot(matrix[0], point as number[]),
        dot(matrix[1], point as number[])
      ] as Point;

      const translated = translate(rotated, origin, -1);

      const touchedSideWall = translated[0] < 0 || translated[0] > this.width - 1;
      if (touchedSideWall) {
        panic = true; break;
      }

      const next = this.to1dPoint(translated);
      if (this.filled(next)) {
        panic = true; break;
      }

      this.shapeData[i] = next;
    }

    if (panic) {
      this.shapeData = prev as Shape;
    }
    this.setFillBulk(this.shapeData, true);
  }

  filled(index: number) {
    return !!this.board[index] && this.board[index].fill === true;
  }

  shouldClearRow(index: number) {
    if (index < 0) {
      return false;
    }

    let fillCount = 0;
    let i = Math.floor(index/10) * 10;
    let max = i + 10;
    while (i < max) {
      this.board[i].fill && (fillCount++);
      i++;
    }

    return fillCount === 10;
  }

  clearRow(index: number) {
    if (index < 0) {
      return;
    }

    let i = Math.floor(index/10) * 10;
    let max = i + 10;
    while (i < max) {
      this.setFill(i, false);
      i++;
    }
  }

  loop() {
    // setInterval(() => {
      this.renderBoard();
      this.moveDown();
    // }, 250)
  }

  renderBoard() {
    let i = this.board.length;
    while(--i >= 0) {
      this.renderCell(this.board[i]);
    }
    this.ctx.stroke();
  }

  renderCell(cell: Cell) {
    if (!cell.cached) {
      this.ctx.clearRect(cell.x, cell.y, SIZE, SIZE);
      if (cell.fill) {
        this.ctx.fillRect(cell.x, cell.y, SIZE, SIZE);
      } else {
        this.ctx.rect(cell.x, cell.y, SIZE, SIZE);
      }
      cell.cached = true;
    }
  }
}

