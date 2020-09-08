let MinesweeperModel = class {
    constructor(width, height, bomb_count) {
        this.width = width;
        this.height = height;
        this.bomb_count = bomb_count;

        this.state = MinesweeperModel.State.INITIALIZED;

        let bomb_flags = [];
        for (let i=0; i<(width*height); i++) {
            if (i < bomb_count) {
                bomb_flags.push(true);
            } else {
                bomb_flags.push(false);
            }
        }
        shuffle(bomb_flags);

        this.minefield = [];
        for (let row = 0; row < height; row++) {
            let cellrow = [];
            for (let col = 0; col < width; col++) {
                cellrow.push(new MinesweeperCell(this, row, col, bomb_flags.pop()));
            }
            this.minefield.push(cellrow);
        }

        this.listeners = [];
    }

    addListener(listener) {
        let idx = this.listeners.findIndex((l) => l == listener);
        if (idx == -1) {
            this.listeners.push(listener);
        }
    }

    removeListener(listener) {
        let idx = this.listeners.findIndex((l) => l == listener);
        if (idx != -1) {
            this.listeners.splice(idx, 1);
        }
    }

    updateListeners(event) {
        this.listeners.forEach((l) => l(event));
    }

    start() {
        if (this.state != MinesweeperModel.State.INITIALIZED) {
            // Already started. Ignore.
            return;
        }

        this.start_time = Date.now();
        this.state = MinesweeperModel.State.IN_PROGRESS;

        this.updateListeners({
            game: this,
            event: MinesweeperModel.Event.START
        });
    }

    win() {
        if (this.state != MinesweeperModel.State.IN_PROGRESS) {
            return;
        }

        this.end_time = Date.now();
        this.state = MinesweeperModel.State.WON;

        this.updateListeners({
            game: this,
            event: MinesweeperModel.Event.WIN
        });
    }

    lose() {
        if (this.state != MinesweeperModel.State.IN_PROGRESS) {
            return;
        }

        this.end_time = Date.now();
        this.state = MinesweeperModel.State.LOST;

        this.updateListeners({
            game: this,
            event: MinesweeperModel.Event.LOSE
        });
    }

    elapsed() {
        if (this.state == MinesweeperModel.State.INITIALIZED) {
            return 0;
        } else if (this.state == MinesweeperModel.State.IN_PROGRESS) {
            return Date.now() - this.start_time;
        } else {
            return this.end_time - this.start_time;
        }
    }

    gameStarted() {
        return (this.state == MinesweeperModel.State.IN_PROGRESS);
    }

    gameOver() {
        return ((this.state == MinesweeperModel.State.LOST) ||
            (this.state == MinesweeperModel.State.WON));
    }

    forAllCells(f) {
        this.minefield.forEach((cellrow) => {
            cellrow.forEach((c) => f(c));
        });
    }

    toString() {
        let s = "";

        s += "   ";
        for (let c = 0; c<this.width; c++) {
            if (c < 10) {
                s += " ";
            } else {
                s += (Math.floor(c/10));
            }
        }
        s += "\n";

        s += "   ";
        for (let c = 0; c<this.width; c++) {
            s += (c%10);
        }
        s += "\n";

        s += "   ";
        for (let c = 0; c<this.width; c++) {
            s += "-";
        }
        s += "\n";

        for (let r = 0; r<this.height; r++) {
            s += r.toString().padStart(2) + "|";
            for (let c = 0; c<this.width; c++) {
                let cell = this.minefield[r][c];
                if (cell.state == MinesweeperCell.State.UNMARKED) {
                    s += ".";
                } else if (cell.state == MinesweeperCell.State.MARKED) {
                    s += "x";
                } else {
                    // Must be revealed.
                    if (cell.is_bomb) {
                        s += "*";
                    } else {
                        let nbc = cell.neighborBombCount();
                        s += (nbc == 0) ? " " : nbc;
                    }
                }
            }
            s += "|\n";
        }

        s += "   " + "".padStart(this.width, "-");

        return s;
    }

}

MinesweeperModel.State = {
    INITIALIZED: 0,
    IN_PROGRESS: 1,
    LOST:        2,
    WON:         3
};

MinesweeperModel.Event = {
    START: 0,
    WIN:   1,
    LOSE:  2,
};

let MinesweeperCell = class {
    constructor(model, row, col, is_bomb) {
        this.model = model;
        this.row = row;
        this.col = col;
        this.is_bomb = is_bomb;
        this.state = MinesweeperCell.State.UNMARKED;
        this.listeners = [];
    }

    reveal() {
        if (this.state == MinesweeperCell.State.UNMARKED) {
            this.state = MinesweeperCell.State.REVEALED;
            this.updateListeners(this);
        }
    }

    mark() {
        if (this.state == MinesweeperCell.State.UNMARKED) {
            this.state = MinesweeperCell.State.MARKED;
            this.updateListeners(this);
        }
    }

    unmark() {
        if (this.state == MinesweeperCell.State.MARKED) {
            this.state = MinesweeperCell.State.UNMARKED;
            this.updateListeners(this);
        }
    }

    getNeighbors() {
        if (this.neighbors === undefined) {
            // First time I'm asked, generate the array of neighbors
            // and cache the result.
            this.neighbors = [];
            for (let dr = -1; dr <= 1; dr++) {
                for (let dc = -1; dc <= 1; dc++) {
                    if (dr != 0 || dc != 0) {
                        let nrow = this.row + dr;
                        let ncol = this.col + dc;
                        if (nrow >= 0 && nrow < this.model.height &&
                            ncol >= 0 && ncol < this.model.width) {
                            this.neighbors.push(this.model.minefield[nrow][ncol]);
                        }
                    }
                }
            }
        }
        return this.neighbors;
    }

    neighborBombCount() {
        if (this.nbc === undefined) {
            let count = 0;
            this.getNeighbors().forEach((c) => {
                if (c.is_bomb) {
                    count++;
                }
            });
            this.nbc = count;
        }
        return this.nbc;
    }
    addListener(listener) {
        let idx = this.listeners.findIndex((l) => l == listener);
        if (idx == -1) {
            this.listeners.push(listener);
        }
    }

    removeListener(listener) {
        let idx = this.listeners.findIndex((l) => l == listener);
        if (idx != -1) {
            this.listeners.splice(idx, 1);
        }
    }

    updateListeners(event) {
        this.listeners.forEach((l) => l(event));
    }

}

MinesweeperCell.State = {
    UNMARKED: 0,
    MARKED: 1,
    REVEALED: 2
}

/*
* Randomly shuffle an array
* https://stackoverflow.com/a/2450976/1293256
* @param  {Array} array The array to shuffle
* @return {String}      The first item in the shuffled array
*/
let shuffle = function (array) {

    let currentIndex = array.length;
    let temporaryValue, randomIndex;

    // While there remain elements to shuffle...
    while (0 !== currentIndex) {
        // Pick a remaining element...
        randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex -= 1;

        // And swap it with the current element.
        temporaryValue = array[currentIndex];
        array[currentIndex] = array[randomIndex];
        array[randomIndex] = temporaryValue;
    }

    return array;

};
