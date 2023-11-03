let borderLights = function (p) {

    let canvas;

    const beadlong = 33;
    const beadshort = 33;

    let beadxpos = beadlong / 2;
    let beadypos = beadshort / 2;
    let beadxwidth = beadlong;
    let beadyheight = beadshort;

    let beadxstride = beadlong;
    let beadystride = 0;

    let beadamountwidth;
    let beadamountheight;
    let amountofbeads;

    p.setup = function () {
        //p.createCanvas(700, 410);
        canvas = p.createCanvas(p.windowWidth, document.documentElement.scrollHeight);
        canvas.position(0, 0); //absolute positioning
        canvas.style('z-index', '-1');
        p.frameRate(4);

        beadamountwidth = p.windowWidth / beadlong;
        beadamountheight = document.documentElement.scrollHeight / beadlong;
        amountofbeads = (beadamountwidth * 2) + (beadamountheight * 2) - 4;
    }

    p.windowResized = function () {
        p.resizeCanvas(p.windowWidth, document.documentElement.scrollHeight);
    }

    p.draw = function () {
        p.stroke(0);
        p.strokeWeight(1);

        for (let i = 0; i < amountofbeads; i++) {
            p.fill(p.random(110, 270), p.random(100, 200), p.random(150, 210));
            p.ellipse(beadxpos, beadypos, beadxwidth, beadyheight);

            beadxpos += beadxstride; //movement along x-axis
            beadypos += beadystride; //movement along y-axis

            if (beadxpos > p.windowWidth - beadshort) { //turn south
                beadxpos = p.windowWidth - beadshort / 2; //keep on border
                beadxwidth = beadshort; //adjust orientation of shape
                beadyheight = beadlong; //adjust oreientation of shape
                beadxstride = 0; //
                beadystride = beadlong;
            }

            if (beadypos > document.documentElement.scrollHeight - beadshort / 2) { //turn west
                beadypos = document.documentElement.scrollHeight - beadshort / 2;
                beadxwidth = beadlong;
                beadyheight = beadshort;
                beadxstride = beadlong * -1;
                beadystride = 0;
            }

            if (beadxpos < 0 + beadshort / 2) { //turn north
                beadxpos = beadshort / 2;
                beadxwidth = beadshort;
                beadyheight = beadlong;
                beadxstride = 0;
                beadystride = beadlong * -1;
            }

            if (beadypos < 0 + beadshort / 2) { //turn east
                //complete = true;
                beadypos = beadshort / 2;
                beadxwidth = beadlong;
                beadyheight = beadshort;
                beadxstride = beadlong;
                beadystride = 0;
            }
        }
        p.noLoop();
    }
}
let p5instance1 = new p5(borderLights);