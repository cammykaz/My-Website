let toDoList = function (p) { //template to make versions of sketch

    p.hx = 630;
    p.hy = 80;
    
    p.setup = function () {

//        p.canvas = p.createCanvas(p.windowWidth, p.windowHeight);
        p.canvas = p.createCanvas(300,360);
        p.canvas.position(550, 100);
        p.canvas.style('z-index', '-1');
        
        p.frameRate(10);
        
        p.h2 = p.createElement('h2', 'My To-Dos');
        //p.h2.position(630, 80);
        
        p.background(240);
    }
    
//    p.windowResized = function () {
//        p.resizeCanvas(p.windowWidth, p.windowHeight);
//    }

    p.draw = function () {
//        p.fill(p.random(110,270),p.random(100,200),p.random(150,210));
//        p.ellipse (200,200,200,200);
        
//        p.x = p.windowWidth - 300;
        p.x = 0;
        p.y = 0;
        p.ts = 14;
        p.lineheight = p.ts * 2.5;
        p.pw = p.width*.75; //paper width
        p.ph = p.height*.75; //paper height
        p.b0 = '• c̶r̶e̶a̶t̶e̶ ̶s̶e̶c̶o̶n̶d̶ ̶s̶k̶e̶t̶c̶h̶, ̶u̶s̶i̶n̶g̶ ̶i̶n̶s̶t̶a̶n̶c̶e̶ ̶m̶o̶d̶e̶';
        
        //Oscillate to-do list H2 title
        p.h2.position(p.hx,p.hy);
        p.hx = p.hx + p.random(-1,1);
        
        //Check that loop is working
        console.log(p.random(-5,5));
            
        //Displace below to-do list to center of canvas
        p.translate((p.width-p.pw)/2,(p.height-p.ph)/2);
        
        //Paper
        p.stroke(100);
        p.strokeWeight(2);
        p.fill(238, 238, 228);
        p.rectMode(p.CORNER);
        p.rect(p.x, p.y, p.pw, p.ph);

        //Text
        p.push();
        p.translate(6,7);
            //p5 text function
            p.textSize(p.ts);
            p.strokeWeight(0);
            p.fill(0);

            //list
            p.text(p.b0, p.x, p.y, p.pw, p.ph);
            p.text('• c̶r̶e̶a̶t̶e̶ ̶t̶o̶-̶d̶o̶ ̶l̶i̶s̶t̶', p.x, p.y + (p.lineheight*1.4), p.pw, p.ph);
            p.text('• make personalized font', p.x, p.y + (p.lineheight * 2.4), p.pw, p.ph);
            //to-do's
            p.text('• layout items in css grid', p.x, p.y + (p.lineheight * 3.4), p.pw, p.ph);
            p.text('• make piano (hello-p5-song)', p.x, p.y + (p.lineheight * 4.4), p.pw, p.ph);
            p.text('• add playable filters (like koala)', p.x, p.y + (p.lineheight * 5.4), p.pw, p.ph);
        p.pop();
        
        //p.noloop();
    }
}
let p5instance2 = new p5(toDoList); //decide to make the sketches
