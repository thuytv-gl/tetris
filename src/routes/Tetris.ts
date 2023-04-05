import type { Cell } from './Tetris.types';
import { sameTens } from './Utils';

const PAD = 4;
const CELL = 40;
const SIZE = CELL - PAD * 2;

/*
  The board
  ---------------------------------------
  0   1   2   3   4   5   6   7   8   9  >> advanced area
  10  11  12  13  14  15  16  17  18  19 >> will not
  20  21  22  23  24  25  26  27  28  29 >> be draw
  30  31  32  33  34  35  36  37  38  39 >> on screen
  40  41  42  43  44  45  46  47  48  49 >> start drawing from here
  50  51  52  53  54  55  56  57  58  59  
  60  61  62  63  64  65  66  67  68  69  
  70  71  72  73  74  75  76  77  78  79  
  80  81  82  83  84  85  86  87  88  89  
  90  91  92  93  94  95  96  97  98  99  
  100 101 102 103 104 105 106 107 108 109 
  110 111 112 113 114 115 116 117 118 119 
  120 121 122 123 124 125 126 127 128 129 
  130 131 132 133 134 135 136 137 138 139 
  140 141 142 143 144 145 146 147 148 149 
  150 151 152 153 154 155 156 157 158 159 
  160 161 162 163 164 165 166 167 168 169 
  170 171 172 173 174 175 176 177 178 179 
  180 181 182 183 184 185 186 187 188 189 
  190 191 192 193 194 195 196 197 198 199 
 */

// TODO: move all shapes up one row
// to prevent shape stack on other shapes
const I_SHAPE = [-26, -16, -6, 4];
const Z_SHAPE = [-6, -5, 3, 4];
const R_Z_SHAPE = [-7, -6, 4, 5];
const T_SHAPE = [-6, 3, 4, 5];
const L_SHAPE = [-5, 3, 4, 5];
const R_L_SHAPE = [-7, 3, 4, 5];
const shapes = [
  I_SHAPE,
  Z_SHAPE,
  R_Z_SHAPE,
  T_SHAPE,
  L_SHAPE,
  R_L_SHAPE,
];

function randomShape() {
  const luckyNumber = Math.floor(Math.random() * shapes.length);
  return [...shapes[luckyNumber]];
}

export default class Tetris {
  private board: Cell[] = [];
  private blen = 0; // board len
  private shape: number[] = I_SHAPE;
  private width = 10;
  private height = 20;

  constructor(
    private canvas: HTMLCanvasElement,
    private ctx: CanvasRenderingContext2D,
  ) {
    this.beforeSetup();
    this.ctx.strokeStyle = 'green';
    this.ctx.fillStyle = 'green';

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

    this.blen = this.board.length - 1;

    this.listenKeyboard();
    this.afterSetup();
    this.loop();
  }

  beforeSetup(){};
  afterSetup(){};

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
      while(this.moveDown());
    },
    ArrowDown: () => {
      this.moveDown();
    },
    ArrowLeft: () => {
      this.moveAside(-1);
    },
    ArrowRight: () => {
      this.moveAside(1);
    },
    ArrowUp: () => {
      this.rotate();
    },
  }

  setFillAll(indices: number[], fill: boolean) {
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
    let i = this.shape.length;
    let updated = 0;
    let prev = [...this.shape];

    this.shape.forEach(id => this.setFill(id, false));
    while (--i >= 0) {
      const id = this.shape[i];
      const next = id + 10;

      if (sameTens(id, this.blen) || this.filled(next)) {
        break;
      }

      this.shape[i] = next;
      updated++;
    }

    const panic = updated !== this.shape.length;
    const toFill = panic ? prev : [...this.shape];
    panic && (this.shape = randomShape())

    toFill.forEach((id) => this.setFill(id, true));

    return !panic;
  }

  moveAside(direction: 1 | -1) {
    let i = this.shape.length;
    let updated = 0;
    let prev = [...this.shape];

    this.shape.forEach(id => this.setFill(id, false));
    while (--i >= 0) {
      const id = this.shape[i];
      const next = id + 1 * direction;

      if (!sameTens(id, next) || this.filled(next)) {
        break;
      }

      this.shape[i] = next;
      updated++;
    }

    const panic = updated !== this.shape.length;
    const toFill = panic ? prev : [...this.shape];

    panic && (this.shape = prev)
    toFill.forEach((id) => this.setFill(id, true));

    return !panic;
  }
   
  rotate() {
    // Ref: https://en.wikipedia.org/wiki/Rotation_matrix
    const origin = 2,
    ox = this.shape[origin] % 10,
    oy = (this.shape[origin] - ox) / 10;
    let i = this.shape.length;
    let shiftX = 0;
    this.setFillAll(this.shape, false);
    while(--i >= 0) {
      const point = this.shape[i],
      x = point % 10, // convert 1d point to 2d coordinate
      y = (point - x) / 10,
      dx = x - ox, // translate origin to "the origin" cell
      dy = y - oy,
      rx = -dy + ox, // rotate point (check Ref) and move back to base
      ry = dx + oy;

      if (rx < shiftX) {
        shiftX = rx;
      } else if (rx > 9) {
        shiftX = rx - 9;
      }

      if (shiftX !== 0) {
        console.log('[shiftX]', shiftX);
      }

      this.shape[i] = 10 * ry + rx; // convert 2d coordinate to 1d point
    }
    this.shape = this.shape.map(i => i - shiftX);
    this.setFillAll(this.shape, true);
  }

  bodyPart(id: number) {
    return this.shape.includes(id);
  }

  drop() {
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
    this.iterBoard((cell) => {
      this.renderCell(cell);
    });

    this.ctx.stroke();
  }

  iterBoard(callback: (cell: Cell, index: number) => void) {
    for (let i = 0; i < this.board.length; i++) {
      callback(this.board[i], i);
    }
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

