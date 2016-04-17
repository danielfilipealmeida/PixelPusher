/*jshint node:true */
/*global require*/

//browserify -t [ babelify ] index.js -o build/build.js

var React       = require('react'),
    ReactDOM    = require('react-dom'),
    $           = require('jquery');


/**
    The App Controller
*/
var PIXELPUSHER = {};
PIXELPUSHER.controller = (function () {
    "use strict";

    var width   = 32,
        height  = 32,
        zoom    = 32,
        context = null;

    var putPixel = function (position, color) {

    };

    return {
        getHeight   : function () { return height; },
        getWidth    : function () { return width; },
        getZoom     : function () { return zoom; },
        getContext  : function () { return context; },
        putPixel    : putPixel
    };
}());


/**
    The MiniMap React Class for displaying a zoomed out version of the bitmap
*/
var MiniMap = React.createClass({
    updateWithImage: function() {
        console.log("updating mini map");
    },
    render: function () {
        "use strict";
        return (
            <div class="miniMap" id="miniMapDiv">
                <canvas id="miniMapCanvas"></canvas>
            </div>
        )
    }
});


var Tools = React.createClass({
    render: function () {
        "use strict";
        return (
            <div class="tools" id="toolsMapDiv">
                this are the tools
            </div>
        )
    }
});

var ColorSwatches = React.createClass({
    render: function () {
        "use strict";
        return (
            <div class="colorSwatches" id="colorSwatchesDiv">
                this are the color swatches
            </div>
        )
    }
});


/**
    Displays the left column with all the tools and information
*/
var ControlColumn = React.createClass({
    render: function (){
        "use strict";
        return(
            <div class="controlColumn" id='controlColumnDiv'>
                <h1>PIXELPUSHER!</h1>
                <MiniMap />
                <Tools />
                <ColorSwatches />
            </div>
        )
    }
});


/**
    The Drawing Area implementation
*/
var DrawingCanvas = React.createClass({
    getInitialState: function () {
        "use strict";

        return {
            data: {
                width:              PIXELPUSHER.controller.getWidth(),
                height:             PIXELPUSHER.controller.getHeight(),
                zoom:               PIXELPUSHER.controller.getZoom(),
                mouseDown:          false,
                color:              {r:128, g:128, b:128, a:255},
                context:            null,
                offscreenContext:   null,
                offscreenCanvas:    null,
                canvas:             null
            }
        }
    },
    componentDidMount: function () {
        "use strict";
        var canvas,
            myContext,
            offscreenCanvas,
            offscreenContext,
            mouseEventsAssignmentData;

        canvas = document.getElementById("myCanvas");
        this.state.data.canvas = canvas;
        canvas.width    = this.state.data.width * this.state.data.zoom;
        canvas.height   = this.state.data.height * this.state.data.zoom;

        myContext = canvas.getContext('2d', {antialias: false, depth:false});
        myContext.imageSmoothingEnabled = false;

        offscreenCanvas         = document.createElement('canvas');
        offscreenCanvas.width   = this.state.data.width;
        offscreenCanvas.height  = this.state.data.height;

        offscreenContext    = offscreenCanvas.getContext('2d', {antialias: false, depth:false});

        this.state.data.context             = myContext;
        this.state.data.offscreenContext    = offscreenContext;
        this.state.data.offscreenCanvas     = canvas;

        mouseEventsAssignmentData = [
            {
                'event':    'mousedown',
                'callback': this.handleMouseDown
            },
            {
                'event':    'mouseup',
                'callback': this.handleMouseUp
            },
            {
                'event':    'mousemove',
                'callback': this.handleMouseMove
            },
            {
                'event':    'mouseout',
                'callback': this.handleMouseUp
            },
        ];
        mouseEventsAssignmentData.forEach(function(eventConfig, index) {
            canvas.addEventListener(eventConfig.event, eventConfig.callback, false);
        });
    },
    handleMouseDown : function (event) {
        "use strict";

        this.state.data.mouseDown = true;
        this.putPixelWithEventData(event);
    },
    handleMouseUp : function (event) {
        "use strict";
        this.state.data.mouseDown = false;
    },
    handleMouseMove : function (event) {
        "use strict";
        if (this.state.data.mouseDown == false) return;

        this.putPixelWithEventData(event);
    },
    calculateMousePositionInCanvas : function (event) {
        "use strict";
        var point,
            scrollTop,
            scrollLeft,
            canvasDiv;

        point = {
            x: 0,
            y: 0
        };

        canvasDiv   = document.getElementById('canvasDiv');
        scrollTop   = canvasDiv.scrollTop;
        scrollLeft  = canvasDiv.scrollLeft;

        point.x = event.clientX - this.state.data.canvas.offsetLeft + scrollLeft; // adicionar o que foi scrollado
        point.y = event.clientY - this.state.data.canvas.offsetTop + scrollTop;

        return point;
    },
    calculateMousePositionInImage : function (inputPoint){
        "use strict";

        var outputPoint = {
            x: 0,
            y: 0
        };

        outputPoint.x = Math.floor(inputPoint.x / this.state.data.zoom);
        outputPoint.y = Math.floor(inputPoint.y / this.state.data.zoom);

        return outputPoint;
    },
    putPixelWithEventData: function (event) {
        "use strict";
        var positionInCanvas,
            positionInImage,
            context;

        positionInCanvas    = this.calculateMousePositionInCanvas(event);
        positionInImage     = this.calculateMousePositionInImage(positionInCanvas);
        context             = this.state.data.offscreenContext;

        this.putPixel(positionInImage, context, this.state.data.color);
        this.drawOffscreenContext();
    },
    putPixel: function (point, context, color) {
        var pixelImageData;

        pixelImageData          = context.createImageData(1,1);
        pixelImageData.data[0]  = color.r;
        pixelImageData.data[1]  = color.g;
        pixelImageData.data[2]  = color.b;
        pixelImageData.data[3]  = color.a;

        context.putImageData(pixelImageData, point.x, point.y);
    },
    drawOffscreenContext: function () {
        var image,
            tmpCanvas,
            tmpContext;

        image = this.state.data.offscreenContext.getImageData(
            0,
            0,
            this.state.data.width,
            this.state.data.height
        );

        tmpCanvas           = document.createElement('canvas');
        tmpCanvas.width     = image.width;
        tmpCanvas.height    = image.height;

        tmpContext  = tmpCanvas.getContext('2d', {antialias: false, depth:false});
        tmpContext.imageSmoothingEnabled  = false;
        tmpContext.putImageData(image, 0, 0);

        this.state.data.context.imageSmoothingEnabled = false;
        this.state.data.context.drawImage(
            tmpCanvas,
            0,
            0,
            Number(image.width * this.state.data.zoom),
            Number(image.height * this.state.data.zoom)
        );

        //MiniMap.updateWithImage(image);

    },
    drawOffscreenContext_old: function () {
        var image,
            tmpCanvas,
            tmpContext;

        image = this.state.data.offscreenContext.getImageData(
            0,
            0,
            this.state.data.width,
            this.state.data.height
        );

        this.state.data.context.putImageData(image,
            0,
            0);
    },
    render: function() {
        return (
            <div class="drawingCanvas" id="canvasDiv">
                <canvas id="myCanvas"></canvas>
            </div>
        )
    }
});



ReactDOM.render(
    <div id="enclosingDiv">
        <ControlColumn />
        <DrawingCanvas />
    </div>,
  document.getElementById('app')
);
