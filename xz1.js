    const { vec3 } = glMatrix;

    var canvas;
    var gl;

    var points = [];

    var twist = false;

    var radius = 1.0;

    window.onload = function initTriangles() {
        canvas = document.getElementById("gl-canvas");
        gl = canvas.getContext("webgl2");
        if (!gl) {
            alert("WebGL isn't available");
        }

        // initialise data for Sierpinski gasket
        // first, initialise the corners of the gasket with three points.
        // R=0.6, Theta = 90, 210, -30
        var vertices = [
            radius * Math.cos(90 * Math.PI / 180.0), radius * Math.sin(90 * Math.PI / 180.0), 0,
            radius * Math.cos(210 * Math.PI / 180.0), radius * Math.sin(210 * Math.PI / 180.0), 0,
            radius * Math.cos(-30 * Math.PI / 180.0), radius * Math.sin(-30 * Math.PI / 180.0), 0
        ];

        var u = vec3.fromValues(vertices[0], vertices[1], vertices[2]);
        var v = vec3.fromValues(vertices[3], vertices[4], vertices[5]);
        var w = vec3.fromValues(vertices[6], vertices[7], vertices[8]);

        divideTriangle(u, v, w, 2);

        // configure webgl
        gl.viewport(0, 0, canvas.width, canvas.height);
        gl.clearColor(1.0, 1.0, 1.0, 1.0);

        // load shaders and initialise attribute buffers
        var program = initShaders(gl, "vertex-shader", "fragment-shader");
        gl.useProgram(program);

        // load data into gpu
        var vertexBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(points), gl.STATIC_DRAW);

        // associate out shader variables with data buffer
        var vPosition = gl.getAttribLocation(program, "vPosition");
        gl.vertexAttribPointer(vPosition, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(vPosition);

        // Add event listener to slider
        document.getElementById('angleSlider').addEventListener('input', function () {
            let angle = parseInt(this.value);
            points = [];
            var u = vec3.fromValues(vertices[0], vertices[1], vertices[2]);
            var v = vec3.fromValues(vertices[3], vertices[4], vertices[5]);
            var w = vec3.fromValues(vertices[6], vertices[7], vertices[8]);
            divideTriangle(u, v, w, parseInt(document.getElementById('subdivisionInput').value), angle);
            gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(points), gl.STATIC_DRAW);
            renderTriangles();
        });

        // Add event listener to button
        document.getElementById('applyButton').addEventListener('click', function () {
            let angle = parseInt(document.getElementById('angleSlider').value);
            points = [];
            var u = vec3.fromValues(vertices[0], vertices[1], vertices[2]);
            var v = vec3.fromValues(vertices[3], vertices[4], vertices[5]);
            var w = vec3.fromValues(vertices[6], vertices[7], vertices[8]);
            divideTriangle(u, v, w, parseInt(document.getElementById('subdivisionInput').value), angle);
            gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(points), gl.STATIC_DRAW);
            renderTriangles();
        });

        renderTriangles();
    };

    function tessellaTriangle(a, b, c, w) {
        var a_new = vec3.create();
        var b_new = vec3.create();
        var c_new = vec3.create();

        let d_a = Math.sqrt(a[0] * a[0] + a[1] * a[1]);
        let radian_a = w * Math.PI / 180.0 * d_a;
        vec3.set(a_new, a[0] * Math.cos(radian_a) - a[1] * Math.sin(radian_a),
            a[0] * Math.sin(radian_a) + a[1] * Math.cos(radian_a), 0);

        let d_b = Math.sqrt(b[0] * b[0] + b[1] * b[1]);
        let radian_b = w * Math.PI / 180.0 * d_b;
        vec3.set(b_new, b[0] * Math.cos(radian_b) - b[1] * Math.sin(radian_b),
            b[0] * Math.sin(radian_b) + b[1] * Math.cos(radian_b), 0);

        let d_c = Math.sqrt(c[0] * c[0] + c[1] * c[1]);
        let radian_c = w * Math.PI / 180.0 * d_c;
        vec3.set(c_new, c[0] * Math.cos(radian_c) - c[1] * Math.sin(radian_c),
            c[0] * Math.sin(radian_c) + c[1] * Math.cos(radian_c), 0);

        points.push(a_new[0], a_new[1], a_new[2]);
        points.push(b_new[0], b_new[1], b_new[2]);
        points.push(b_new[0], b_new[1], b_new[2]);
        points.push(c_new[0], c_new[1], c_new[2]);
        points.push(c_new[0], c_new[1], c_new[2]);
        points.push(a_new[0], a_new[1], a_new[2]);
    }

    function divideTriangle(a, b, c, count, w) {
        // check for end of recursion
        if (count == 0) {
            tessellaTriangle(a, b, c, w);
        } else {
            var ab = vec3.create();
            vec3.lerp(ab, a, b, 0.5);
            var bc = vec3.create();
            vec3.lerp(bc, b, c, 0.5);
            var ca = vec3.create();
            vec3.lerp(ca, c, a, 0.5);

            // three new triangles
            divideTriangle(a, ab, ca, count - 1, w);
            divideTriangle(ab, b, bc, count - 1, w);
            divideTriangle(ca, bc, c, count - 1, w);
            divideTriangle(ab, bc, ca, count - 1, w);
        }
    }

    function renderTriangles() {
        gl.clear(gl.COLOR_BUFFER_BIT);
        gl.drawArrays(gl.LINES, 0, points.length / 3);
    }