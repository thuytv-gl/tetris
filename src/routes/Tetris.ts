type Cell = {
  x: number;
  y: number;
  size: number;
  fill: boolean;
};

const CELL = 40;

export default class Tetris {
  private board: Cell[] = [];
  private hlr = 0;

  constructor(
    private canvas: HTMLCanvasElement,
    private ctx: CanvasRenderingContext2D,
  ) {}

  setupBoard() {
    const pad = 4;
    const padT2 = pad * 2;
    const rows = this.canvas.height / CELL;
    const cols = this.canvas.width / CELL;

    for (let y = 0; y < rows; y++) {
      if (!this.board[y]) {
        this.board[y] = []
      }
      for (let x = 0; x < cols; x++) {
        this.board[y].push({
          x: x * CELL + pad,
          y: y * CELL + pad,
          size: CELL -padT2,
          fill: false,
        });
      }
    }
  }

  setup() {
    this.setupBoard();
    this.ctx.strokeStyle = 'green';
    this.ctx.fillStyle = 'green';
  }

  clearCanvas() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
  }

  drawCell(cell: Cell, method: 'rect' | 'fill' = 'rect') {
    const renderMethod = method === 'fill' ? this.ctx.fillRect : this.ctx.rect;
    renderMethod.bind(this.ctx)(cell.x, cell.y, cell.size, cell.size);
  }

  iterBoard(callback: (cell: cell, col: number, row: number) => void) {
    for (let i = 0; i < this.board.length; i++) {
      for (let j = 0; j < this.board[i].length; j++) {
        callback(this.board[i][j], j, i);
      }
    }
  }

  loop() {
    this.clearCanvas();
    this.iterBoard((cell) => {
      this.drawCell(cell);
    });

    this.ctx.stroke();
    this.updateHlr();

    setTimeout(() => this.loop(), 300);
  }

  updateHlr() {
    this.hlr++;
    this.hlr > 20 && (this.hlr = 0)
  }
}
