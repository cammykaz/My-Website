//Questions//
// What is instance mode? What is actually happening in JavaScript-speak?
//  - It's problematic to declare everything (including setup, draw) in the "global", window object, context
//  https://developer.mozilla.org/en-US/docs/Web/API/Window
//  - The solution is to create your sketch as an instance of the p5() object.
//  - Namespaces your sketch under a particular variable
//  - Essentially creates individual instances of the p5 library
//  - p5.js instance mode was created before JavaScript ES6
//  - Basically you define a function that is your sketch...
//  - ...and make it an argument for the p5() object instance
//Do I definitely need instance mode?
//  - If you have two sketches, each with their own setup() and draw() functions...
//  - ...and you want to execute them on the same HTML page...
//  - ...then YES, you would need to use instance mode in p5.js to prevent conflicts between the sketches
//  - Another option is to match each p5.js sketch with its own HTML file...
//  - ...and then embed all those HTML files onto an HTML webpage via iframe
//  - ...however the sketches become isolated from eachother
//  - ...and it is much more difficult to share information between sketches.
// What is on-demand global mode?
//   - When you call new p5() without any arguments.
//   - Helpful to control how p5 is loaded on page with other libraries

How should I define the function?...
...declaration, expression, arrow
  - function declaration
        let myp5 = new p5(sketch, 'canvas-id');
        function sketch(p) {
            [P5 SKETCH]
        }
   - function expression
        let sketch = function(p) {
            [P5 SKETCH]
        }
        let myp5 = new p5(sketch);
   - arrow syntax
        //https://github.com/processing/p5.js/wiki/p5.js-overview#instantiation--namespace
        const s = ( p ) => {
            [P5 SKETCH]
        }
        let myp5 = new p5(s);

How should I instantiate the object?
        //https://p5js.org/examples/instance-mode-instantiation.html
        let sketch = function(p) {
            [P5 SKETCH]
        }
        let myp5 = new p5(sketch);

        //https://github.com/processing/p5.js/issues/392
        //https://gist.github.com/lmccart/253c4df01ff09ea5ddb4
        var s1 = function(p) {
            [P5 SKETCH]
        }
        new p5(s1);

Anonymous instance mode?
        //https://github.com/processing/p5.js/wiki/Global-and-instance-mode
        let myp5 = new p5(( p ) => { // Anonymous Instance
            [P5 SKETCH]
        });

        // chatGPT
        let mySketch = new p5(function(p) { // Anonymous Instance
            [P5 SKETCH]
        });

How should I declare variables? (var, let, const)
        //https://www.youtube.com/watch?v=Su792jEauZg
        var sketch = function (p) {
            [P5 SKETCH]
        }
        var myp5 = new p5(sketch);


Naming conventions?     
        ChatGPT
        Both the object instance and the sketch function...
        ...need to be unique for each sketch you create.
            let p5instance0 = new p5(first_sketch);
            let p5instance1 = new p5(second_sketch);

        var borderlights = function (p) { //template to make versions of sketch
            [P5 SKETCH]
        }
        var p5instance0 = new p5(borderlights); //decide to make the sketches


        var todolist = function (p) { //template to make versions of sketch
            [P5 SKETCH]
        }
        var p5instance1 = new p5(todolist); //decide to make the sketches





//More Instance Mode Links
https://forum.processing.org/two/discussion/13348/drawing-functions-in-instance-mode.html
