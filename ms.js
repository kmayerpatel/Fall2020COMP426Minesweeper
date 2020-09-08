let model = null;
let controller = null;
let view = null;

$(document).ready(() => {
    model = new MinesweeperModel(10, 10, 10);
    view = new MinesweeperView(model);
    controller = new MinesweeperController(model, view);

    $('body').empty().append(view.div);
});
