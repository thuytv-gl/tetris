type Cell = {
  x: number;
  y: number;
  fill: boolean;
  cached: boolean;
};

const PAD = 4;
const CELL = 40;
const SIZE = CELL - PAD * 2;

export default class Tetris {
  private board: Cell[][] = [];
  private hlr = 0;
  private md = Math.round(Math.random() * 10);
  private blen = 0;

  constructor(
    private canvas: HTMLCanvasElement,
    private ctx: CanvasRenderingContext2D,
  ) {
    this.ctx.strokeStyle = 'green';
    this.ctx.fillStyle = 'green';
    this.blen = this.setupBoard();
    this.board[this.md].fill = true;

    this.listenKeyboard();
    this.renderBoard();
  }

  listenKeyboard() {
    window.addEventListener('keydown', (evt) => {
      const mdBefore = this.md;
      switch(evt.code) {
        case 'ArrowRight': this.move('right'); break;
        case 'ArrowLeft': this.move('left'); break;
        case 'ArrowUp': this.move('up'); break;
        case 'ArrowDown': this.move('down'); break;
        case 'Space': this.drop(); break;
        default: break;
      }

      if (mdBefore !== this.md) {
        this.setFill(mdBefore, false);
        this.setFill(this.md, true);

        if (this.shouldClearRow(this.md)) {
          this.clearRow(this.md);
        }

        if (this.sameTens(this.md, this.blen) || this.isFillded(this.md + 10)) {
          this.md = Math.round(Math.random() * 10);
          this.setFill(this.md, true);
        }

        this.renderBoard();
      }
    })
  }

  setFill(index: number, fill: boolean) {
    this.board[index].fill = fill;
    this.board[index].cached = false;
  }

  move(direction: 'left' | 'right' | 'up' | 'down') {
    switch(direction) {
      case 'left': {
        if (this.sameTens(this.md, this.md-1)) {
          this.md--;
        }
        break;
      }
      case 'right': {
        if (this.sameTens(this.md, this.md+1)) {
          this.md++;
        }
        break;
      }
      case 'up': {
        if (this.md - 10 > -1) {
          this.md -= 10;
        }
        break;
      }
      case 'down': {
        if (this.md + 10 <= this.blen) {
          this.md += 10;
        }
        break;
      }
      default: break;
    }
  }

  drop() {
    while(!this.sameTens(this.md, this.blen) && !this.isFillded(this.md + 10)) {
      this.md += 10;
    }
  }

  isFillded(index: number) {
    return !!this.board[index] && this.board[index].fill === true;
  }

  shouldClearRow(index: number) {
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
    this.renderBoard();
  }

  renderBoard() {
    this.iterBoard((cell, index) => {
      this.drawCell(cell);
    });

    this.ctx.stroke();
    this.updateHlr();
  }

  updateHlr() {
    this.hlr++;
    this.hlr > 20 && (this.hlr = 0)
  }
}
