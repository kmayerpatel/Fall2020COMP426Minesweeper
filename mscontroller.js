let MinesweeperController = class {
    constructor(model, view) {
        this.model = model;
        this.view = view;

        view.addListener((e) => {
            if (e.action == 'reveal') {
                this.reveal(e.row, e.col, false);
            } else if (e.action == 'toggleMark') {
                this.toggleMark(e.row, e.col);
             } else if (e.action == 'clear') {
                this.clear(e.row, e.col);
            }
        })
    }

    toggleMark(row, col) {
        if (this.model.gameOver()) {
            return;
        } else if (!this.model.gameStarted()) {
            this.model.start();
        }

        let cell = this.model.minefield[row][col];
        if (cell.state != MinesweeperCell.State.REVEALED) {
            if (cell.state == MinesweeperCell.State.MARKED) {
                cell.unmark();
            } else {
                cell.mark();
                this.test_for_win();
            }
        }
    }

    clear(row, col) {
        if (this.model.gameOver()) {
            return;
        } else if (!this.model.gameStarted()) {
            this.model.start();
        }

        let cell = this.model.minefield[row][col];
        if (cell.state == MinesweeperCell.State.REVEALED && (!cell.is_bomb)) {
            let mark_count = 0;
            cell.getNeighbors().forEach((n) => mark_count += (n.state == MinesweeperCell.State.MARKED) ? 1 : 0);
            if (mark_count == cell.neighborBombCount()) {
                cell.getNeighbors().forEach((c) => this.reveal(c.row, c.col, true));
                this.test_for_win();
            }
        }
    }

    reveal(row, col, suppress_win_test) {
        if (this.model.gameOver()) {
            return;
        } else if (!this.model.gameStarted()) {
            this.model.start();
        }

        let cell = this.model.minefield[row][col];
        if (cell.state != MinesweeperCell.State.UNMARKED) {
            // Either already revealed or marked so don't do anything.
            return;
        }

        cell.reveal();
        if (cell.is_bomb) {
            this.model.lose();
            this.model.forAllCells((c) => {
                if (c.is_bomb) {
                    c.reveal();
                }
            });
            return;
        } else {
            if (cell.neighborBombCount() == 0) {
                cell.getNeighbors().forEach((c) => this.reveal(c.row, c.col, true));
            }
        }

        if (!suppress_win_test) {
            this.test_for_win();
        }
    }

    test_for_win() {
        let not_a_win = false;
        this.model.forAllCells((c) => {
            if (c.is_bomb) {
                not_a_win = not_a_win || (c.state != MinesweeperCell.State.MARKED);
            } else {
                not_a_win = not_a_win || (c.state != MinesweeperCell.State.REVEALED);
            }
        });

        if (!not_a_win) {
            this.model.win();
        }
    }
}