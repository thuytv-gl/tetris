type Cell = {
  x: number;
  y: number;
  fill: boolean;
  cached: boolean;
};

const PAD = 4;
const CELL = 40;
const SIZE = CELL - PAD * 2;

/*
  The board
  ---------------------------------------
  -40 -39 -38 -37 -36 -35 -34 -33 -32 -31 
  -30 -29 -28 -27 -26 -25 -24 -23 -22 -21 
  -20 -19 -18 -17 -16 -15 -14 -13 -12 -11 
  -10 -9  -8  -7  -6  -5  -4  -3  -2  -1  
  0   1   2   3   4   5   6   7   8   9   
  10  11  12  13  14  15  16  17  18  19  
  20  21  22  23  24  25  26  27  28  29  
  30  31  32  33  34  35  36  37  38  39  
  40  41  42  43  44  45  46  47  48  49  
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

const I_SHAPE = [-26, -16, -6, 4];
const Z_SHAPE = [-6, -5, 3, 4];
const R_Z_SHAPE = [-7, -6, 4, 5];
const T_SHAPE = [-6, 3, 4, 5];
const L_SHAPE = [-5, 3, 4, 5];
const R_L_SHAPE = [-7, 3, 4, 5];
const HEAD_POSISION = 3;

export default class Tetris {
  private board: Cell[][] = [];
  private md = Math.round(Math.random() * 10);
  private blen = 0; // board len
  private currentShape: number[] = T_SHAPE;

  constructor(
    private canvas: HTMLCanvasElement,
    private ctx: CanvasRenderingContext2D,
  ) {
    this.ctx.strokeStyle = 'green';
    this.ctx.fillStyle = 'green';
    this.blen = this.setupBoard();

    this.listenKeyboard();
    this.renderBoard();
  }

  listenKeyboard() {
    window.addEventListener('keydown', (evt) => this.nextState(() => {
      switch(evt.code) {
        case 'Space': {
          for (let i = this.currentShape.length-1; i > -1; i--) {
            this.currentShape[i] = this.drop(this.currentShape[i]);
          }
          console.log(this.currentShape)
          break;
        }
        default: break;
      }
    }))
  }

  nextState(action: () => void) {
    const prev = [...this.currentShape];
    action();
    const curn = this.currentShape;
    for (const i of prev) {
      if (!curn.includes(i)) {
        this.setFill(i, false);
      }
    }

    for (const i of curn) {
      this.setFill(i, true);
      if (this.shouldClearRow(i)) {
        this.clearRow(i);
      }
    }
  }

  setFill(index: number, fill: boolean) {
    const item = this.board[index];
    if (item && item.fill !== fill) {
      item.fill = fill;
      item.cached = false;
    }
  }

  move(direction: 'left' | 'right' | 'up' | 'down', index: number) {
    switch(direction) {
      case 'left': {
        if (this.sameTens(index, index-1)) {
          index--
        }
        break;
      }
      case 'right': {
        if (this.sameTens(index, index+1)) {
          index++;
        }
        break;
      }
      case 'up': {
        if (index - 10 > -1) {
          index -= 10;
        }
        break;
      }
      case 'down': {
        if (index + 10 <= this.blen) {
          index += 10;
        }
        break;
      }
      default: break;
    }

    return index;
  }

  drop(i: number) {
    while(
      !this.sameTens(i, this.blen)
      && !this.isFillded(i + 10)
    ) {
      i += 10;
    }

    return i;
  }

  isFillded(index: number) {
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

  /*
   * compare the tens of given numbers
   * e.g: n1 = 123, n2 = 234
   * n1 tens = 12
   * n2 tens = 23
   * => result false
   */
  sameTens(n1: number, n2: number) {
    return Math.floor(n1/10) === Math.floor(n2/10);
  }

  setupBoard() {
    const rows = this.canvas.height / CELL;
    const cols = this.canvas.width / CELL;

    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        this.board.push({
          x: x * CELL + PAD,
          y: y * CELL + PAD,
          fill: false,
        });
      }
    }

    return this.board.length - 1;
  }

  clearCanvas() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
  }

  drawCell(cell: Cell) {
    if (!cell.cached) {
      this.ctx.clearRect(cell.x, cell.y, SIZE, SIZE);
      const renderMethod = cell.fill ? this.ctx.fillRect : this.ctx.rect;
      renderMethod.bind(this.ctx)(cell.x, cell.y, SIZE, SIZE);
      cell.cached = true;
    }
  }

  iterBoard(callback: (cell: cell, index: number) => void) {
    for (let i = 0; i < this.board.length; i++) {
      callback(this.board[i], i);
    }
  }

  loop() {
    setInterval(() => this.nextState(() => {
      this.renderBoard();
      this.fallShape();
    }), 400);
  }

  fallShape() {
    for (let i = 0; i < this.currentShape.length; i++) {
      this.currentShape[i] = this.move('down', this.currentShape[i]);
    }
  }

  renderBoard() {
    this.iterBoard((cell, index) => {
      this.drawCell(cell);
    });

    this.ctx.stroke();
  }
}
