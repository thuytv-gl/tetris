import type { Cell, Shape, ShapeName, Point } from './Tetris.types';
import { Direction } from './Tetris.types';
import {
    Shapes,
    CenterRotation,
    ClockwiseMatrix,
} from './Config';
import { isOnSameLine, getRandomShape, clone, dot, translate } from './Utils';

const PAD = 1;
const CELL = 40;
const SIZE = CELL - PAD * 2;

export default class Tetris {
    private board: Cell[] = [];
    private shapeName: ShapeName = getRandomShape();
    private shapeData: Shape = clone(Shapes[this.shapeName]);
    private width = 10;
    private height = 20;
    private boardLen = this.width * this.height - 1;
    beforeClear(){}
    afterClear(){}

    constructor(
        private _canvas: HTMLCanvasElement,
        private ctx: CanvasRenderingContext2D,
    ) {
        this.init();
        this.listenKeyboard();
        this.gameloop();
    }

    init() {
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

        this.setFillBulk(this.shapeData, true);
    }
    
    listenKeyboard() {
        window.addEventListener('keydown', (evt) => {
            type KeymapKey = keyof typeof this.keymap;
            type KeydownHandlerKey = keyof typeof this.keydownHandlers;
            const key = this.keymap[evt.code as KeymapKey] ?? evt.code;
            const handler = this.keydownHandlers[key as KeydownHandlerKey];
            if (typeof handler === 'function') {
                handler();
                this.render();
            }
        });
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
            // O shape doesn't rotate
            if (this.shapeName === "O_SHAPE") {
                return;
            }
            this.rotate(ClockwiseMatrix);
        },
    }

    gameloop() {
        this.render();
        this.moveDown();
        setTimeout(() => this.gameloop(), 300);
    }


    setShapeData(next: Shape) {
        this.shapeData = next;
    }

    populateNextShape() {
        this.clearFulfilledRows();
        this.shapeName = getRandomShape();
        this.setShapeData(clone(Shapes[this.shapeName]))
        this.setFillBulk(this.shapeData, true);
        this.render();
    }

    setFillBulk(indexes: number[], fill: boolean) {
        for (let i = 0; i < indexes.length; i++) {
            this.setFill(indexes[i], fill);
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

        this.setFillBulk(this.shapeData, false);
        while (--i >= 0) {
            const id = this.shapeData[i];
            const next = id + this.width;

            if (isOnSameLine(id, this.boardLen) || this.filled(next)) {
                break;
            }

            this.shapeData[i] = next;
            updated++;
        }

        const panic = updated !== this.shapeData.length;
        const toFill = panic ? prev : this.shapeData;

        this.setFillBulk(toFill, true);
        panic && (this.populateNextShape());

        return !panic;
    }

    moveAside(direction: Direction) {
        let i = this.shapeData.length;
        let updated = 0;
        let prev = clone(this.shapeData);

        this.setFillBulk(this.shapeData, false);
        while (--i >= 0) {
            const id = this.shapeData[i];
            const next = id + 1 * direction;

            if (!isOnSameLine(id, next) || this.filled(next)) {
                break;
            }

            this.shapeData[i] = next;
            updated++;
        }

        const panic = updated !== this.shapeData.length;

        if (panic) {
            this.setShapeData(prev);
        }

        this.setFillBulk(this.shapeData, true);

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

    isOutOfBound(point: Point): boolean {
        return point[0] < 0 || point[0] > this.width - 1 || point[1] < 0;
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
            if (this.isOutOfBound(translated)) {
                panic = true; break;
            }
            const next = this.to1dPoint(translated);
            if (this.filled(next)) {
                panic = true; break;
            }

            this.shapeData[i] = next;
        }

        if (panic) {
            this.setShapeData(prev);
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

        let shouldClear = true;

        let i = Math.floor(index/10) * 10;
        const max = i + this.width;
        while (i < max) {
            if (!this.filled(i)) {
                shouldClear = false;
                break;
            }
            i++;
        }

        return shouldClear;
    }

    dropUpperRows(index: number) {
        this.beforeClear();
        if (index < 0) {
            return;
        }

        let i = Math.floor(index/10) * 10;
        let max = i + 10;
        while (i < max) {
            this.setFill(i, this.filled(i-10));
            i++;
        }

        this.afterClear();
    }

    clearGaps(index: number) {
        let i = Math.floor(index/10) * 10;
        let max = i + 10;
        while (i < max) {
            this.setFill(i, this.filled(i-10));
            i++;
        }
    }

    clearFulfilledRows() {
        let i = this.boardLen;
        let clearCount = 0;
        while(i >= 0) {
            if (this.shouldClearRow(i)) {
                clearCount++;
                for (let j = i; j >= 0; j -= 10) {
                    this.dropUpperRows(j);
                }
                if (clearCount === 4) {
                    // maxium number of rows that can be clear in one drop
                    break;
                }
            } else {
                i -= 10;
            }
        }
    }

    render() {
        let i = this.board.length;
        while(--i >= 0) {
            this.renderCell(this.board[i]);
        }
    }

    renderCell(cell: Cell) {
        if (!cell.cached) {
            this.ctx.save();
            this.ctx.clearRect(cell.x, cell.y, SIZE, SIZE);
            if (cell.fill) {
                this.ctx.fillStyle = '#0db300';
                this.ctx.fillRect(cell.x, cell.y, SIZE, SIZE);
            } else {
                this.ctx.fillStyle = '#000000';
                this.ctx.fillRect(cell.x, cell.y, SIZE, SIZE);
            }
            this.ctx.stroke();
            this.ctx.restore();
            cell.cached = true;
        }
    }
}

