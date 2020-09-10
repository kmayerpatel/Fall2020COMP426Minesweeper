let MinesweeperView = class {
    constructor(model) {
        this.model = model;
        this.listeners = [];
        this.div = $('<div></div>');

        let minefield = $('<div class="minefield"></div>')
            .css('position', 'relative')
            .css('width', (25*model.width)+"px")
            .css('height', (25*model.height)+"px");

        let cell_click_handler = (e) => {
            let action = 'reveal';
            if (e.shiftKey) {
                action = 'toggleMark';
            } else if (e.altKey) {
                action = 'clear';
            }
            let cell = $(e.target).data('cellmodel');

            this.updateListeners({
                action: action,
                row: cell.row,
                col: cell.col
            });
        };

        for (let r=0; r<model.height; r++) {
            for (let c=0; c<model.width; c++) {
                let cell_view = new CellView(model.minefield[r][c]);
                cell_view.div.on('click', cell_click_handler);
                minefield.append(cell_view.div);
            }
        }
        this.div.append(minefield);
        this.div.append($("<div>Elapsed Time: <span id='elapsed'>0</span> seconds"));

        minefield.on('mousedown', (e) => {e.preventDefault();});

        /*
        minefield.on('click', '.cellview', null, (e) => {
            let action = 'reveal';
            if (e.shiftKey) {
                action = 'toggleMark';
            } else if (e.altKey) {
                action = 'clear';
            }
            let cell = $(e.target).data('cellmodel');

            this.updateListeners({
                action: action,
                row: cell.row,
                col: cell.col
            });
        });
        */

        let timer_handler = () => {
            $('#elapsed').empty().text(this.model.elapsed()/1000.0);
        };

        this.model.addListener((e) => {
            if (e.event == MinesweeperModel.Event.LOSE) {
                clearInterval(timer_handler);
                timer_handler();
                alert("You lose!");
            } else if (e.event == MinesweeperModel.Event.WIN) {
                clearInterval(this.timer_handler);
                timer_handler();
                alert("You won!");
            } else if (e.event == MinesweeperModel.Event.START) {
                setInterval(timer_handler, 200);
            }
        })

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

let CellView = class {
    constructor(cell_model) {
        let left_px = (25 * cell_model.col) + "px";
        let top_px = (25 * cell_model.row) + "px";
        this.div = $('<div></div>')
            .addClass("cellview")
            .data('cellmodel', cell_model)
            .css('left', left_px)
            .css('top', top_px);

        if (cell_model.is_bomb) {
            this.div.addClass('bomb');
        }

        cell_model.addListener(() => this.update());
        this.update();
    }

    update () {
        let c = this.div.data('cellmodel');
        this.div.removeClass('unmarked')
            .removeClass('marked')
            .removeClass('revealed');

        if (c.state == MinesweeperCell.State.UNMARKED) {
            this.div.empty().addClass('unmarked');
        } else if (c.state == MinesweeperCell.State.MARKED) {
            this.div.empty().html("X").addClass('marked');
        } else if (c.state == MinesweeperCell.State.REVEALED) {
            this.div.addClass('revealed');
            if (c.is_bomb) {
                this.div.empty().html("*");
            } else {
                let nbc = c.neighborBombCount();
                this.div.empty();
                if (nbc != 0) {
                    this.div.html(nbc);
                }
            }
        }
    }
}
