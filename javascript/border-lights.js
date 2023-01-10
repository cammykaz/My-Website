var canvas;

function setup() {
    canvas = createCanvas(windowWidth, document.documentElement.scrollHeight);
    canvas.position(0, 0);
    canvas.style('z-index', '-1');
}

windowResized = function () {
    resizeCanvas(windowWidth, document.documentElement.scrollHeight);
}

function draw() {
    background(175);
}