/*
Simple Javascript undo and redo.
https://www.mystorybook.com/books/new/
https://www.shutterstock.com/editor/
http://wickeditor.com/wick-editor/
https://github.com/ArthurClemens/Javascript-Undo-Manager
https://codepen.io/sheko_elanteko/pen/mRbMVY
https://www.jqueryscript.net/demo/Simple-WYSIWYG-Math-Editor-With-jQuery-Mathquill-matheditor-js/
https://inspera.atlassian.net/wiki/spaces/KB/pages/62062830/MathQuill+symbols
*/


;(function() {

	'use strict';

    function removeFromTo(array, from, to) {
        array.splice(from,
            !to ||
            1 + to - from + (!(to < 0 ^ from >= 0) && (to < 0 || -1) * array.length));
        return array.length;
    }

    var UndoManager = function() {

        var commands = [],
            index = -1,
            limit = 0,
            isExecuting = false,
            callback,
            
            // functions
            execute;

        execute = function(command, action) {
            if (!command || typeof command[action] !== "function") {
                return this;
            }
            isExecuting = true;

            command[action]();

            isExecuting = false;
            return this;
        };

        return {

            /*
            Add a command to the queue.
            */
            add: function (command) {
                if (isExecuting) {
                    return this;
                }
                // if we are here after having called undo,
                // invalidate items higher on the stack
                commands.splice(index + 1, commands.length - index);

                commands.push(command);
                
                // if limit is set, remove items from the start
                if (limit && commands.length > limit) {
                    removeFromTo(commands, 0, -(limit+1));
                }
                
                // set the current index to the end
                index = commands.length - 1;
                if (callback) {
                    callback();
                }
                return this;
            },

            /*
            Pass a function to be called on undo and redo actions.
            */
            setCallback: function (callbackFunc) {
                callback = callbackFunc;
            },

            /*
            Perform undo: call the undo function at the current index and decrease the index by 1.
            */
            undo: function () {
                var command = commands[index];
                if (!command) {
                    return this;
                }
                execute(command, "undo");
                index -= 1;
                if (callback) {
                    callback();
                }
                return this;
            },

            /*
            Perform redo: call the redo function at the next index and increase the index by 1.
            */
            redo: function () {
                var command = commands[index + 1];
                if (!command) {
                    return this;
                }
                execute(command, "redo");
                index += 1;
                if (callback) {
                    callback();
                }
                return this;
            },

            /*
            Clears the memory, losing all stored states. Reset the index.
            */
            clear: function () {
                var prev_size = commands.length;

                commands = [];
                index = -1;

                if (callback && (prev_size > 0)) {
                    callback();
                }
            },

            hasUndo: function () {
                return index !== -1;
            },

            hasRedo: function () {
                return index < (commands.length - 1);
            },

            getCommands: function () {
                return commands;
            },

            getIndex: function() {
                return index;
            },
            
            setLimit: function (l) {
                limit = l;
            }
        };
    };

	if (typeof define === 'function' && typeof define.amd === 'object' && define.amd) {
		// AMD. Register as an anonymous module.
		define(function() {
			return UndoManager;
		});
	} else if (typeof module !== 'undefined' && module.exports) {
		module.exports = UndoManager;
	} else {
		window.UndoManager = UndoManager;
	}

}());


var keysPressed = [];
var ctrlCode = 17;
function LumenCanvas (settings) {
	this.defaultSettings = {
		selector : "",
		spellcheck: false,
		showEditToolbar : true,// it will show bring/send object backward/forward
		width : undefined,
		height : 548,
		gridDistance: 50,
		defaultBackgroundColor : "#fff",
		defaultFillColor : "#797777",
		defaultBorderColor : "#000",
		showPalette: true,
		showGridButton: false,
		enableGridByDefault: false,
		watermarkImage: undefined,
		watermarkImageOpacity:0.5,
		defaultPalette: [
			["#000","#444","#666","#999","#ccc","#eee","#f3f3f3","#fff"],
			["#f00","#f90","#ff0","#0f0","#0ff","#00f","#90f","#f0f"],
			["#f4cccc","#fce5cd","#fff2cc","#d9ead3","#d0e0e3","#cfe2f3","#d9d2e9","#ead1dc"],
			["#ea9999","#f9cb9c","#ffe599","#b6d7a8","#a2c4c9","#9fc5e8","#b4a7d6","#d5a6bd"],
			["#e06666","#f6b26b","#ffd966","#93c47d","#76a5af","#6fa8dc","#8e7cc3","#c27ba0"],
			["#c00","#e69138","#f1c232","#6aa84f","#45818e","#3d85c6","#674ea7","#a64d79"],
			["#900","#b45f06","#bf9000","#38761d","#134f5c","#0b5394","#351c75","#741b47"],
			["#600","#783f04","#7f6000","#274e13","#0c343d","#073763","#20124d","#4c1130"]
		],
		paletteMaxSelectionSize: 4,
		defaultActiveTool: "Pencil",// other values : Polygon Line Rectangle Ellipse Text Pan
		defaultPencilThickness: 6,// integer value from 1 to 30
		clearAllOverwrite: undefined, /// this to overrite the clear method with a custom message. If you use this you should call ClearAll like : canvas.ClearAll();
	};
	$.extend( this.defaultSettings, settings );
	if(this.defaultSettings.width == undefined) this.defaultSettings.width = $(this.defaultSettings.selector).width() - 63;
	this._defaultHeight = this.defaultSettings.height;
	this.gridImagesrc = 'img/grid2.png';
	this._fabricCanvas = undefined;
	this._activeTool = undefined;
	this._thickness = 2;
	this._textStetting = {familty:'Arial',size:16};
	this._lineType = 'solid';
	
	this.l10n = {
		PENCIL: 'Pencil',
		POLYGON: 'Polygon',
		LINE: 'Line',
		RECTANGE: 'Rectangle',
		ELLIPSE: 'Ellipse',
		TEXT: 'Text',
		PAN: 'Pan',
		EYEDROPPER: 'Eyedropper',
		UNDO: 'Undo',
		REDO: 'Redo',
		ZOOM_OUT: 'Zoom out',
		ZOOM_IN: 'Zoom In',
		CLEAR: 'Clear',
		BORDER_TITLE: 'Border',
		BORDER_LABEL: 'border',
		FILL_TITLE: 'Fill & Text Color',
		FILL_LABEL: 'Fill / Text',
		BG_TITLE: 'Background Color',
		BG_LABEL: 'bg',
		CLICK_HERE_TO_DRAG: 'Click here to drag',
		MODE_LABEL: 'Mode',
		LINE_WIDHT_LABEL: 'Line width',
		INSERT_EQUATION: 'Insert Equation',
		COLOR_FILL : 'Fill Bucket',
	};
	this._UndoManager = undefined;
	this.element = $(this.defaultSettings.selector);
	$(this.defaultSettings.selector).data("LumenCanvas", this);
	this.InitCanvas();
}


LumenCanvas.prototype._HideLineEndPoints = function (){
	
	$this._fabricCanvas.remove($this.circle1);
	$this._fabricCanvas.remove($this.circle2);
	$this._fabricCanvas.renderAll();
}
LumenCanvas.prototype._UpdateLineLocation = function (moveX, moveY, lineObject){
	var $this = this;
	if (lineObject.name == "line") {
		//calculate location of line endpoints to update clickable vertexes on screen
		var x1 = lineObject.x1,
			y1 = lineObject.y1,
			x2 = lineObject.x2,
			y2 = lineObject.y2;
		if (x1<x2) { 
			x2 = x2-x1 + moveX;
			x1 = moveX;
		}
		else { 
			x1 = x1-x2 + moveX;
			x2 = moveX;
		}
		
		if (y1<y2) {
			y2 = y2-y1 + moveY;
			y1 = moveY;
		}
		else {
			y1 = y1 - y2 + moveY;
			y2 = moveY;
		}
		var circleRadius = $this.circle1.get("radius");
		$this.circle1.set({
			fill: 'red',
			left: x1-circleRadius, 
			top:  y1-circleRadius
		});
		$this.circle2.set({
			fill: 'red',
			left: x2 -circleRadius, 
			top:  y2 -circleRadius
		});
		
		
		$this.circle1.setCoords();
		$this.circle2.setCoords();
		$this.circle1.line = lineObject;
		$this.circle2.line = lineObject;
		//set the actual line the vertexs are attached to... cause.. ??
		lineObject.set({
			'x1': x1,
			'y1': y1
		});
		lineObject.set({
			'x2': x2,
			'y2': y2
		});
	}
	
	if (lineObject == $this.circle1) {
		//console.log('\t\thead vertex moving');
		$this.circle1.line.set({
			//'x1': lineObject.left,
			//'y1': lineObject.top
			'x1': $this.circle1.getCenterPoint().x,
			'y1': $this.circle1.getCenterPoint().y
		});
		//update location of line so selection box is correct
		$this.circle1.line.setCoords();
	}
	if (lineObject == $this.circle2) {
		//console.log('\t\ttail vertex moving');
		$this.circle2.line.set({
			//'x2': lineObject.left,
			//'y2': lineObject.top
			'x2': $this.circle2.getCenterPoint().x,
			'y2': $this.circle2.getCenterPoint().y
		});
		//update location of line so selection box is correct
		$this.circle2.line.setCoords();
	}
	$this._fabricCanvas.bringToFront($this.circle1);
	$this._fabricCanvas.bringToFront($this.circle2);
	$this._fabricCanvas.renderAll();
}

LumenCanvas.prototype.AddImage = function(imageURL) {
	var $this = this;
    fabric.Image.fromURL(imageURL, function(oImg) {
        var l = 0;//Math.floor(Math.random() * 100);
        var t = 0;//Math.floor(Math.random() * 100);
		var imgWidth = oImg.get("width");
		var imgHeight = oImg.get("height");
		var canvasWidth = $this._fabricCanvas.get("width");
		var canvasHeight = $this._fabricCanvas.get("height");
		var scale = 1;
		if(imgWidth > canvasWidth || imgHeight > canvasHeight){
			scale = Math.min(canvasWidth/imgWidth, canvasHeight/imgHeight) /2;
			oImg.set({scaleY: scale, scaleX: scale });
		} else if(imgWidth > canvasWidth/2 || imgHeight > canvasHeight/2) {
			scale = Math.max(imgWidth/canvasWidth, imgHeight/canvasHeight)/2;
			oImg.set({scaleY: scale, scaleX: scale });
		}
        oImg.set({
			left:l, 
			top:t, 
			centeredRotation: true, 
			selectable: false,
			hasBorders: false,
			hasControls: false
		});
		$this._fabricCanvas.add(oImg);
	});

}
LumenCanvas.prototype._SetWaterMark = function() {
	var $this = this;
	if($this.defaultSettings.watermarkImage != undefined){
		$this._fabricCanvas.width / this.width 
		$this._fabricCanvas.setBackgroundImage($this.defaultSettings.watermarkImage, $this._fabricCanvas.renderAll.bind($this._fabricCanvas) , {
			opacity: $this.defaultSettings.watermarkImageOpacity,
			top:0,
			left:0,
		});
	}
}
/**
 * Inisialize a new instance of LumenCanvas.
 */
LumenCanvas.prototype.InitCanvas = function() {
	var $this = this;
	$this.element.addClass("lumen-canvas");//.text( progress );
	//add the main canvas
	var defaultHtml = '<div class="lumen-drawing with-gui" style="background-color: transparent;">\
		<div id="canvas_container" style="overflow:auto;">\
			<canvas id="canvas">\
				You have a very old browser... (It does not support HTML5 canvas)\
			</canvas>\
		</div>\
	</div>';
	$this.element.append(defaultHtml);
	$this._fabricCanvas = new fabric.Canvas($this.element.find("canvas")[0] , {  
		hoverCursor: 'move',
		defaultCursor: 'default',
		selection: false, 
		backgroundColor : $this.defaultSettings.defaultBackgroundColor,
		preserveObjectStacking  : true,
		targetFindTolerance: 5,
	});
	$this.element.find("#canvas_container").height($this.defaultSettings.height);
	
	$this._SetWaterMark();
	
	$this.circle1 = new fabric.Circle({
		radius: 6,
		fill: 'transparent',
		left: -50,
		top: -50,
		hasControls: false,
		hasBorders: false,
		name: 'line-end-point'
	});
	$this.circle2 = new fabric.Circle({
		radius: 6,
		fill: 'transparent',
		left: -50,
		top: -50,
		hasControls: false,
		hasBorders: false,
		name: 'line-end-point'
	});
	//$this.AddImage("img/lumencanvas.PNG");
	/// for line editing
	$this._fabricCanvas.on('object:moving', function(e) {
	    var activeObject = e.target;
		if(activeObject.name == "line" || activeObject.name == "line-end-point"){
			//make sure we know where the point is referenced to
			move = activeObject.getPointByOrigin('left','top');
			//console.log('left:',move.x,' top:',move.y);
			$this._UpdateLineLocation(move.x, move.y, activeObject);
		}
	});
	if($this.defaultSettings.enableGridByDefault && $this.defaultSettings.showGridButton){
		$this._fabricCanvas.setBackgroundColor({source: this.gridImagesrc, repeat: 'repeat'}, function () {
			$this._fabricCanvas.renderAll();
		});
	}
	
	//$this._fabricCanvas.hoverCursor = 'move';
	$this._fabricCanvas.setHeight($this.defaultSettings.height);
	$this._fabricCanvas.setWidth($this.defaultSettings.width);
	$this.defaultSettings.mode = "add";
	$this._currentShape;
	
	fabric.util.addListener(window,"dblclick", function (e) { 
		$this.ClosePolygon($this);
	});
	fabric.util.addListener(window, 'keydown', function (e) {
		var $this = e.currentTarget.$this;
		var obj = $this._fabricCanvas.getActiveObject();
		if(obj != undefined){
			if (e.keyCode == 37) { /// left
				e.preventDefault();
				obj.left -= 2;
			} else if(e.keyCode == 39) { /// right
				e.preventDefault();
				obj.left += 2;
			} else if (e.keyCode == 38) { /// top
				e.preventDefault();
				obj.top -= 2;
			} else if(e.keyCode == 40) { /// bottom
				e.preventDefault();
				obj.top += 2;
			}
			$this._fabricCanvas.renderAll();
		}
	});
	fabric.util.addListener(window, 'keyup', function (e) {
		var $this = e.currentTarget.$this;
		var bIsCtrlOn = keysPressed.indexOf(ctrlCode) >= 0;
		if (e.keyCode === 27) {
			$this.ClosePolygon($this);
		} else if (e.keyCode === 46) {
			var obj = $this._fabricCanvas.getActiveObject();
			if(obj != undefined){
				$this._fabricCanvas.remove(obj);
				$this._fabricCanvas.renderAll();
			}
		} else if(bIsCtrlOn && e.key == 'z') {
			$this.element.find('.lumen-undo').trigger('click');
		} else if(bIsCtrlOn && e.key == 'y') {
			$this.element.find('.lumen-redo').trigger('click');
		}
	});
	$this._InitToolbar();
	$this._InitKeyboardShortcuts();
	$this._InitColorPickers();
	$this._OnObjectAdded($this);
	$this._OnObjectSelected($this);
	$this._OnCanvasMouseDown($this);
	$this._OnCanvasMouseMove($this);
	$this._OnCanvasMouseUp($this);
	/// enable default tool
	$this.element.find('[title="' + $this.defaultSettings.defaultActiveTool + '"]').trigger("click");
	
}
/**
 * Shortcut for undo, redo & delete.
 */
LumenCanvas.prototype._InitKeyboardShortcuts = function() {
	
	function lumenKeyDown(e) {
		switch(e.type) {
			case "keydown" :
				keysPressed.push(e.keyCode);
				break;
		}
	}
	function lumenKeyUp(e) {
		var idx = keysPressed.indexOf(ctrlCode);
		if (idx >= 0 && e.keyCode == ctrlCode){
			keysPressed = [];
		}
	}
	$(document).off("keydown", lumenKeyDown).on("keydown", lumenKeyDown);
	$(document).off("keyup", lumenKeyUp).on("keyup", lumenKeyUp);
}
/**
 * Inisialize color pickers.
 */
LumenCanvas.prototype._InitColorPickers = function() {
	$this = this;
	$this.element.find("#fillPicker").spectrum({
		color: $this.defaultSettings.defaultFillColor,
		showPalette: $this.defaultSettings.showPalette,
		palette: $this.defaultSettings.defaultPalette,
		maxSelectionSize: $this.defaultSettings.paletteMaxSelectionSize,
		hideAfterPaletteSelect:true,
		showAlpha: true,
		showButtons: false,
		move: function(color) {
			var $this = GetLumenCanvasInstance($(this));
			var obj = $this._fabricCanvas.getActiveObject();
			if(obj != undefined) {// && obj.type == "i-text"){
				if(!obj.get("selectable")){
					return;
				}
				obj.set({fill: color.toHexString()});
				$this._fabricCanvas.renderAll();
			}
			
			var $textarea = $(this).closest( ".lumen-canvas" ).find(".insert-text-container textarea");
			if($textarea.length > 0) $textarea.css("color", color.toHexString());
		},
		change: function(color) {
		}
	});
	$this.element.find("#strokePicker").spectrum({
		color: $this.defaultSettings.defaultBorderColor,
		showPalette: $this.defaultSettings.showPalette,
		palette: $this.defaultSettings.defaultPalette,
		maxSelectionSize: $this.defaultSettings.paletteMaxSelectionSize,
		hideAfterPaletteSelect:true,
		showAlpha: true,
		showButtons: false,
		move: function(color) {
			var $this = GetLumenCanvasInstance($(this));
			$this._fabricCanvas.freeDrawingBrush.color = color.toHexString();
			var obj = $this._fabricCanvas.getActiveObject();
			if(obj != undefined) {// && obj.type == "i-text"){
				if(!obj.get("selectable")){
					return;
				}
				if(typeof obj.triangle != 'undefined'){
					obj.triangle.set({stroke: color.toHexString(),fill: color.toHexString()});
				}
				obj.set({stroke: color.toHexString()});
			}
			$this._fabricCanvas.renderAll();
		},
		change: function(color) {
			
		}
	});
	$this.element.find("#bgPicker").spectrum({
		color: $this.defaultSettings.defaultBackgroundColor,
		showPalette: $this.defaultSettings.showPalette,
		palette: $this.defaultSettings.defaultPalette,
		maxSelectionSize: $this.defaultSettings.paletteMaxSelectionSize,
		hideAfterPaletteSelect:true,
		showButtons: false,
		move: function(color) {
			var $this = GetLumenCanvasInstance($(this));
			$this._fabricCanvas.backgroundColor = color.toHexString(); 
			$this._fabricCanvas.renderAll();
			$this.element.find(".cb-disable").trigger("click");
		}
	});
	$this.element.find('.lumen-zoom-in').on("click touchstart",function(){
		var $this = GetLumenCanvasInstance($(this));
		$this.SetZoom($this, $this._fabricCanvas.getZoom() + 0.1 ) ;
	});
	
	$this.element.find('.lumen-zoom-out').on("click touchstart",function(){
		var $this = GetLumenCanvasInstance($(this));
		$this.SetZoom($this, $this._fabricCanvas.getZoom() - 0.1 ) ;
	}) ;
	
	$this.element.find('.lumen-undo').on("click touchstart",function(){
		var $this = GetLumenCanvasInstance($(this));
		$this.UndoManager().undo();
	}) ;
	$this.element.find('.lumen-redo').on("click touchstart",function(){
		var $this = GetLumenCanvasInstance($(this));
		$this.UndoManager().redo();
	});
	
}
LumenCanvas.prototype.UndoManager = function(){
	var $this = this;
	if($this._UndoManager == undefined){
		
		$this._UndoManager = new UndoManager();
		$this._UndoManager.setCallback(function(){
			
			if($this._UndoManager.hasUndo()){
				$this.element.find('.lumen-undo').removeClass('disabled');
			}else{
				$this.element.find('.lumen-undo').addClass('disabled');
			}
			if($this._UndoManager.hasRedo()){
				$this.element.find('.lumen-redo').removeClass('disabled');
			}else{
				$this.element.find('.lumen-redo').addClass('disabled');
			}
		});
	}
	return $this._UndoManager;
}

/**
 * Get a refrance to the active instance.
 * @param {jquery object} any element inside the canvas
 * @return {object} This returns a refrance to the current instance (this)
 */
function GetLumenCanvasInstance (element){
	if(!(element instanceof jQuery)){element = $(element);}
	if (element.hasClass("lumen-canvas"))  return element.data("LumenCanvas");
	else return element.closest(".lumen-canvas").data("LumenCanvas");
}

LumenCanvas.prototype._SetObjectName = function(shape, shapName){
/// add name attribute to objects
	shape.toObject = (function(toObject) {
		return function() {
			return fabric.util.object.extend(toObject.call(this), {
				name: this.name
			});
		};
	})(shape.toObject);
	shape.name = shapName;
}
/**
 * Add a shap to the canvas.
 * @param {shape} fabric js shap.
 * @param {fjcanvas} fabricjs instance.
 */
LumenCanvas.prototype.AddShape = function(shape, shapName, fjcanvas){
	var $this = this;
	if($this._UndoManager == undefined){
		$this._UndoManager = new UndoManager();
		$this._UndoManager.setCallback(function(){
			
			if($this._UndoManager.hasUndo()){
				$this.element.find('.lumen-undo').removeClass('disabled');
			}else{
				$this.element.find('.lumen-undo').addClass('disabled');
			}
			if($this._UndoManager.hasRedo()){
				$this.element.find('.lumen-redo').removeClass('disabled');
			}else{
				$this.element.find('.lumen-redo').addClass('disabled');
			}
			
		});
	}
	/// Check if canvas height needs to get increased and prevent drawing outside the canvas width.
	if(shape.y1 != undefined && Math.max(shape.y1,shape.y2) > $this.defaultSettings.height ) {
		fjcanvas.setHeight(Math.max(shape.y1,shape.y2) + 20);
		$this.defaultSettings.height = Math.max(shape.y1,shape.y2);
	} else if(shape.top + shape.height > $this.defaultSettings.height) {
		fjcanvas.setHeight(shape.top + shape.height + 20);
		$this.defaultSettings.height = shape.top + shape.height + 20;
	}
	$this._SetObjectName(shape, shapName);
	
	// make undo-able
	fjcanvas.add(shape);
	$this._UndoManager.add({
		undo: function() {
			fjcanvas.remove(shape);
			if(typeof shape.triangle != 'undefined'){
				fjcanvas.remove(shape.triangle);
			}
		},
		redo: function() {
			fjcanvas.add(shape);
			if(typeof shape.triangle != 'undefined'){
				fjcanvas.add(shape.triangle);
			}
		}
	});
	if($this._UndoManager.hasUndo()){
		$this.element.find('.lumen-undo').removeClass('disabled');
	}else{
		$this.element.find('.lumen-undo').addClass('disabled');
	}
	if($this._UndoManager.hasRedo()){
		$this.element.find('.lumen-redo').removeClass('disabled');
	}else{
		$this.element.find('.lumen-redo').addClass('disabled');
	}
	 
	$this._ShowHideControl(false);
}
/**
 * Close plygon active object.
 * @param {$this} a refrance to LumenCanvas 'this'.
 */
LumenCanvas.prototype.ClosePolygon = function ($this) {
	if ($this.defaultSettings.mode === 'edit' ){//|| mode === 'add') {
		$this.defaultSettings.mode = 'add';
		var points = $this._currentShape.get('points');
		points.pop();
		$this._fabricCanvas.remove($this._currentShape);
		$this._currentShape = new fabric.Polygon(points, {
			opacity: 1,
			selectable: false,
			hasBorders: true,
			fill: $this.element.find("#fillPicker").spectrum('get').toHexString(),
			stroke: $this.element.find("#strokePicker").spectrum('get').toHexString(),
			strokeWidth: $this._thickness,
		});
		//$this._fabricCanvas.add($this._currentShape);
		$this.AddShape($this._currentShape, "poly", $this._fabricCanvas);
		$this._fabricCanvas.getObjects().forEach(function(entry) {
			if(entry.name == "close-poly"){
				$this._fabricCanvas.remove(entry);
			}
		});
	} else {
		$this.defaultSettings.mode = 'add';
	}
	$this._currentShape = null;
}

/**
 * Inisialize on object added event listner.
 */
LumenCanvas.prototype._OnObjectAdded = function($this) {
	$this._fabricCanvas.on('object:added',function (){
		var $this = GetLumenCanvasInstance(this.upperCanvasEl);
		var objects = $this._fabricCanvas.getObjects();
		if(objects[objects.length-1].type == 'path' || objects[objects.length-1].type == 'group'){
			var shape = objects[objects.length-1];
			shape.set('selectable', false);
			$this.UndoManager().add({
				undo: function() {
					$this._fabricCanvas.remove(shape);
					
				},
				redo: function() {
					$this._fabricCanvas.add(shape);
				}
			});
		}
	});
	$this._fabricCanvas.on('object:added', function(){
		var $this = GetLumenCanvasInstance(this.upperCanvasEl);
		if($this.element.find("#drawing-mode").hasClass("selected")){
			var count = this.getObjects().length;
			if(count > 0){
				$this.element.find('#clear-canvas').removeClass('disabled');
			}else{
				$this.element.find('#clear-canvas').addClass('disabled');
			}	
		}
	});
}
/**
 * Inisialize on object selected event listner.
 */
LumenCanvas.prototype._OnObjectSelected = function($this) {
	function selectionUpdatedHandler (){
		var $this = GetLumenCanvasInstance(this.upperCanvasEl);
		var obj = $this._fabricCanvas.getActiveObject();
		var activeObject = obj;
		if(activeObject.name == "line"){
			//make sure we know where the point is referenced to
			move = activeObject.getPointByOrigin('left','top');
			$this.circle1.set({selectable: true});
			$this.circle2.set({selectable: true});
			$this._HideLineEndPoints();
			$this._fabricCanvas.add($this.circle1);
			$this._fabricCanvas.add($this.circle2);
			$this._UpdateLineLocation(move.x, move.y, activeObject);
		} else {
			if(activeObject.name != "line-end-point") $this._HideLineEndPoints();
		}
		
		if(obj != undefined && !obj.get("selectable")){
			return;
		}
		if(obj != undefined && obj.type == "i-text"){
			$this.ShowTextToolbar();
			$this.element.find('.lumen-text-content').val(obj.get('text'));
			$this.element.find('.lumen-text-toolbar #font-size').val(obj.get('fontSize'));
			$this.element.find('.lumen-text-toolbar #font-family').val(obj.get('fontFamily'));
			$this.ShowEditToolbar();
		} else{
			$this.HideTextToolbar();
			$this.ShowEditToolbar();
		}
		if(obj != undefined && obj.name != "line-end-point"){
			$this.element.find("#fillPicker").spectrum("set",obj.get("fill"));
			$this.element.find("#strokePicker").spectrum("set",obj.get("stroke"));
		}
	}
	$this._fabricCanvas.on('selection:created', selectionUpdatedHandler);
	$this._fabricCanvas.on('selection:updated', selectionUpdatedHandler);
	$this._fabricCanvas.on('selection:cleared', function(){
		var $this = GetLumenCanvasInstance(this.upperCanvasEl);
		$this.HideEditToolbar();
		$this._HideLineEndPoints();
	});
	
}
/**
 * Inisialize on mouse down event listner.
 */
LumenCanvas.prototype._OnCanvasMouseDown = function($this) {
	$this._fabricCanvas.on('mouse:down', function(o){
		var $this = GetLumenCanvasInstance(this.upperCanvasEl);
		if(this.isDrawingMode || typeof $this._activeTool == 'undefined'){
			return;
		}
		//if user entered text and then click on somthing else enable placing text for next time
		if($this._activeTool.name != 'text'){
			$this.defaultSettings.deselectText = true;
		}
		if($this._activeTool.name == 'eyedrop' && $this._activeTool.isActive){
				function rgb2hex(rgb){
				//rgb = rgb.match(/^rgba?[\s+]?\([\s+]?(\d+)[\s+]?,[\s+]?(\d+)[\s+]?,[\s+]?(\d+)[\s+]?/i);
					return (rgb && rgb.length === 4) ? "#" +
						("0" + parseInt(rgb[0],10).toString(16)).slice(-2) +
						("0" + parseInt(rgb[1],10).toString(16)).slice(-2) +
						("0" + parseInt(rgb[2],10).toString(16)).slice(-2) : '';
				}
				var mouse = this.getPointer(o.e);
				var x = parseInt(mouse.x);
				var y = parseInt(mouse.y);
				canvasElement = $this.element.find('canvas:first')[0];
				var ctx = canvasElement.getContext("2d");
				$this.element.find("#fillPicker").spectrum("set",rgb2hex(ctx.getImageData(x, y, 1, 1).data));
		} else if($this._activeTool.name == 'text' && $this._activeTool.isActive){
			var obj = $this._fabricCanvas.getActiveObject();
			var enableDrawing = (obj == undefined || obj.text == undefined);
			if($this.element.find(".insert-text-container").length <= 0 && enableDrawing){//&& obj == undefined){
				console.log(obj);
				this.selection = false;
				this.isDown = true;
				var pointer = this.getPointer(o.e);
				origX = pointer.x;
				origY = pointer.y;
				var pointer = this.getPointer(o.e);
				$this.rect = new fabric.Rect({
					left: origX,
					top: origY,
					originX: 'left',
					originY: 'top',
					width: pointer.x-origX,
					height: pointer.y-origY,
					angle: 0,
					fill: "#fff",
					stroke: "#ccc",
					strokeWidth: 1,
					transparentCorners: false
				});
				this.add($this.rect);
			}
		} else if($this._activeTool.name == 'line' && $this._activeTool.isActive){
			this.selection = false;
			this.isDown = true; 
			var pointer = this.getPointer(o.e);
			var points = [ pointer.x, pointer.y, pointer.x, pointer.y ];
			var lineOptions = {
				strokeWidth: $this._thickness,
				fill: $this.element.find("#fillPicker").spectrum('get').toHexString(),
				stroke: $this.element.find("#strokePicker").spectrum('get').toHexString(),
				originX: 'center',
				originY: 'center',
			};
			if($this._lineType == "dashed"){
				var thickness = [[10,5],[10,5], [12,6], [14,7], [18,7], [22,7], [25,7]];
				lineOptions.strokeDashArray = thickness[$this._thickness];
				
			}
			if($this._lineType == "arrow"){
				line = new fabric.Line(points, {
					strokeWidth: $this._thickness,
					fill: $this.element.find("#fillPicker").spectrum('get').toHexString(),
					stroke: $this.element.find("#strokePicker").spectrum('get').toHexString(),
					originX: 'center',
					originY: 'center'
				});
				centerX = (line.x1 + line.x2) / 2;
				centerY = (line.y1 + line.y2) / 2;
				deltaX = line.left - centerX;
				deltaY = line.top - centerY;
				triangle = new fabric.Triangle({
				  left: line.get('x1') + deltaX,
				  top: line.get('y1') + deltaY,
				  originX: 'center',
				  originY: 'center',
				  hasBorders: false,
				  hasControls: false,
				  lockScalingX: true,
				  lockScalingY: true,
				  lockRotation: true,
				  pointType: 'arrow_start',
				  angle: -45,
				  width: Math.max($this._thickness*4, 8),
				  height: Math.max($this._thickness*4, 8),
				  fill: $this.element.find("#strokePicker").spectrum('get').toHexString()
				});
				this.add(line, triangle);
			} else{
				line = new fabric.Line(points, lineOptions);
				this.add(line);
			}
			line.selectable = true;
			points = [line.x1,line.y1,line.x1,line.y2];
		} else if($this._activeTool.name == 'circle' && $this._activeTool.isActive){
			this.selection = false;
			this.isDown = true;
			var pointer = this.getPointer(o.e);
			origX = pointer.x;
			origY = pointer.y;
			circle = new fabric.Ellipse({
				left: pointer.x,
				top: pointer.y,
				//radius: 1,
				strokeWidth: $this._thickness,
				fill: $this.element.find("#fillPicker").spectrum('get').toHexString(),
				stroke: $this.element.find("#strokePicker").spectrum('get').toHexString(),
				selectable: false,
				originX: 'left',
				originY: 'top',
			});
			this.add(circle);
		} else if($this._activeTool.name == 'rect' && $this._activeTool.isActive){
			this.selection = false;
			this.isDown = true;
			var pointer = this.getPointer(o.e);
			origX = pointer.x;
			origY = pointer.y;
			var pointer = this.getPointer(o.e);
				$this.rect = new fabric.Rect({
					left: origX,
					top: origY,
					originX: 'left',
					originY: 'top',
					width: pointer.x-origX,
					height: pointer.y-origY,
					angle: 0,
					fill: $this.element.find("#fillPicker").spectrum('get').toHexString(),
					stroke: $this.element.find("#strokePicker").spectrum('get').toHexString(),
					strokeWidth: $this._thickness,
					transparentCorners: false,
					/*strokeLineJoin: 'round',
					rx: 10,
					ry: 10*/
				});
				this.add($this.rect);
		} else if($this._activeTool.name == 'polygon' && $this._activeTool.isActive){
			
			this.selection = false;
			this.isDown = true;
			var pointer = this.getPointer(o.e);
			origX = pointer.x;
			origY = pointer.y;
			if ($this.defaultSettings.mode === "add") {
				origLeft = origX;
				origTop = origY;
				var polygon = new fabric.Polygon([{
					x: origX,
					y: origY
				}, {
					x: origX + 1,
					y: origY + 1
				}], {
					originX: 'left',
					originY: 'top',
					left: origX,
					top: origY,
					opacity: 1,
					selectable: false,
					hasBorders: false,
					hasControls: false,
					fill: $this.element.find("#fillPicker").spectrum('get').toHexString(),
					stroke: $this.element.find("#strokePicker").spectrum('get').toHexString(),
					strokeWidth: $this._thickness,
				});
				$this._currentShape = polygon;
				this.add($this._currentShape);
				/// Add closing poly object.
				circleClosing = new fabric.Ellipse({
					left: origX-5,
					top: origY-5,
					rx: 5,
					ry: 5,
					strokeWidth: 1,
					fill: "#0ff",
					stroke: "#000",
					selectable: false,
					originX: 'left',
					originY: 'top',
				});
				$this._SetObjectName(circleClosing, "close-poly");
				this.add(circleClosing);
				$this.defaultSettings.mode = "edit";
				
			} else if ($this.defaultSettings.mode === "edit" && $this._currentShape && $this._currentShape.type === "polygon") {
				/// if click again on close polygon.
				if(o.target != null && o.target.name == "close-poly"){
					$this.ClosePolygon($this);
				} else {
					$this._currentShape.points.push({
						x: origX,
						y: origY
					});
					this.renderAll();
				}
			}
			
		} else{
		
			this.selection = true;
		}
	});
}
/**
 * Inisialize on mouse move event listner.
 */
LumenCanvas.prototype._OnCanvasMouseMove = function($this) {
	function calcArrowAngle(x1, y1, x2, y2) {
		var angle = 0, x, y;
		x = (x2 - x1);
		y = (y2 - y1);
		if (x === 0) {
		  angle = (y === 0) ? 0 : (y > 0) ? Math.PI / 2 : Math.PI * 3 / 2;
		} else if (y === 0) {
		  angle = (x > 0) ? 0 : Math.PI;
		} else {
		  angle = (x < 0) ? Math.atan(y / x) + Math.PI : (y < 0) ? Math.atan(y / x) + (2 * Math.PI) : Math.atan(y / x);
		}
		return (angle * 180 / Math.PI + 90);
	}
	$this._fabricCanvas.on('mouse:move', function(o){
		var $this = GetLumenCanvasInstance(this.upperCanvasEl);
		var pointer = this.getPointer(o.e);
		if(pointer.x > $this.defaultSettings.width) pointer.x = $this.defaultSettings.width - 5;
		if(pointer.x < 0) pointer.x = 0;
		if(this.isDrawingMode || typeof $this._activeTool == 'undefined') return;
		if($this._activeTool.name == 'colorfill' || $this._activeTool.name == 'eyedrop') {
			
			var offset = 20;
			if($this._activeTool.name == 'eyedrop') offset = 15;
			$this.mouseIcon.set({ left: pointer.x - offset, top: pointer.y - offset }).setCoords();/// -20 becuase the width/height of the icon is 20*20
			this.renderAll();
		} else if($this._activeTool.name == 'line' && $this._activeTool.isActive && typeof line != 'undefined'){
			if (!this.isDown) return;
			if($this._lineType == "arrow"){
				line.set({
				  x2: pointer.x,
				  y2: pointer.y
				});
				triangle.set({
				  'left': pointer.x + deltaX,
				  'top': pointer.y + deltaY,
				  'angle': calcArrowAngle(line.x1, line.y1, line.x2, line.y2)
				});
			}else{
				line.set({ x2: pointer.x, y2: pointer.y });
			}
			this.renderAll();
		}else if($this._activeTool.name == 'circle' && $this._activeTool.isActive && typeof circle != 'undefined'){
			if (!this.isDown) return;
			var rx = Math.abs(origX - pointer.x)/2;
			var ry = Math.abs(origY - pointer.y)/2;
			circle.set({ rx: rx, ry: ry});
			if(origX>pointer.x){
				circle.set({originX: 'right' });
			} else {
				circle.set({originX: 'left' });
			}
			if(origY>pointer.y){
				circle.set({originY: 'bottom'  });
			} else {
				circle.set({originY: 'top'  });
			}
			this.renderAll();
		} else if($this._activeTool.name == 'text' && $this._activeTool.isActive && typeof $this.rect != 'undefined'){
			if (!this.isDown) return;
			if(origX>pointer.x){
				$this.rect.set({ left: (pointer.x) });
			}
			if(origY>pointer.y){
				$this.rect.set({ top: (pointer.y) });
			}
			$this.rect.set({ width: Math.abs(origX - pointer.x) });
			$this.rect.set({ height: Math.abs(origY - pointer.y) });
			this.renderAll();
		} else if($this._activeTool.name == 'rect' && $this._activeTool.isActive && typeof $this.rect != 'undefined'){
			if (!this.isDown) return;
			if(origX>pointer.x){
				$this.rect.set({ left: (pointer.x) });
			}
			if(origY>pointer.y){
				$this.rect.set({ top: (pointer.y) });
			}
			$this.rect.set({ width: Math.abs(origX - pointer.x) });
			$this.rect.set({ height: Math.abs(origY - pointer.y) });
			this.renderAll();
		}else if($this._activeTool.name == 'polygon' && $this._activeTool.isActive){
			if (!this.isDown) return;
			var pos = this.getPointer(o.e);
			if ($this.defaultSettings.mode === "edit" && $this._currentShape) {
				var points = $this._currentShape.get("points");
				points.pop();
				points.push({
					x: pos.x,
					y: pos.y
				});
				this.remove($this._currentShape);
				$this._currentShape = new fabric.Polygon(points, {
					originX: 'left',
					originY: 'top',
					opacity: 1,
					selectable: false,
					hasBorders: false,
					hasControls: false,
					fill: $this.element.find("#fillPicker").spectrum('get').toHexString(),
					stroke: $this.element.find("#strokePicker").spectrum('get').toHexString(),
					strokeWidth: $this._thickness,
				});
				this.add($this._currentShape);
				
				$this._fabricCanvas.getObjects().forEach(function(entry) {
					if(entry.name == "close-poly"){ 
						$this._fabricCanvas.bringForward(entry);
					}
				});
			}
		}
	});
}
/**
 * Inisialize on mouse up event listner.
 */
LumenCanvas.prototype._OnCanvasMouseUp = function($this) {
	$this._fabricCanvas.on('mouse:up', function(o){
		var $this = GetLumenCanvasInstance(this.upperCanvasEl);
		$drawingCanvas = $(this.upperCanvasEl).closest( ".lumen-canvas" );
		if(this.isDrawingMode || typeof $this._activeTool == 'undefined'){
			  return;
		}
		if($this._activeTool.name == 'colorfill' && o.target != null) {
			var colorHexValue = $this.element.find("#fillPicker").spectrum('get').toHexString();
			if(o.target.name == "line"){
				o.target.set({
					stroke: colorHexValue,
					fill: colorHexValue,
				});
				if(o.target.triangle != undefined) {
					o.target.triangle.set({
						stroke: colorHexValue,
						fill: colorHexValue,
					});
				}
			} else{
				o.target.set({fill: colorHexValue});
			}
			$this._fabricCanvas.renderAll();
		} else if($this._activeTool.name == 'line' && $this._activeTool.isActive){
			var points = [ line.get('x1'), line.get('y1'), line.get('x2'), line.get('y2') ];
			var lineOptions = {
				strokeWidth: $this._thickness,
				fill: $this.element.find("#fillPicker").spectrum('get').toHexString(),
				stroke: $this.element.find("#strokePicker").spectrum('get').toHexString(),
				originX: 'center',
				originY: 'center',
				perPixelTargetFind: true,
			};
			if($this._lineType == "dashed"){
				lineOptions.strokeDashArray = line.strokeDashArray;
			}
			var line2 = new fabric.Line(points, lineOptions);
			this.isDown = false;
			if($this._lineType == "arrow"){
				line2.triangle = triangle;
				line2.set({
					lockScalingX: true,
					lockScalingY: true,
					lockRotation: true,
				});
				line2.on('moving', function () {
					var oldCenterX = (this.x1 + this.x2) / 2,
						oldCenterY = (this.y1 + this.y2) / 2,
						deltaX = this.left - oldCenterX,
						deltaY = this.top - oldCenterY;

					this.triangle.set({
						'left': this.x2 + deltaX,
						'top': this.y2 + deltaY
					}).setCoords();

					this.set({
						'x1': this.x1 + deltaX,
						'y1': this.y1 + deltaY,
						'x2': this.x2 + deltaX,
						'y2': this.y2 + deltaY
					});

					this.set({
						'left': (this.x1 + this.x2) / 2,
						'top': (this.y1 + this.y2) / 2
					});
				});
			}			
			this.remove(line);
			$this.AddShape(line2, "line",this);
		} else if($this._activeTool.name == 'circle' && $this._activeTool.isActive){
			circle2 = new fabric.Ellipse({
			  left: circle.get('left'),
			  top: circle.get('top'),
			  rx: circle.get('rx'),
			  ry: circle.get('ry'),
			  strokeWidth: $this._thickness,
			  fill: $this.element.find("#fillPicker").spectrum('get').toHexString(),
			  stroke: $this.element.find("#strokePicker").spectrum('get').toHexString(),
			  selectable: false,
			  originX: circle.get('originX'), originY: circle.get('originY')
			});
			this.remove(circle);
			this.isDown = false;
			$this.AddShape(circle2, "circle",this);
		} else if($this._activeTool.name == 'text' && $this._activeTool.isActive){
			var obj = $this._fabricCanvas.getActiveObject();
			if($this.element.find(".insert-text-container").length <= 0) {
				var enableDrawing = (obj == undefined || obj.text == undefined);
				if(enableDrawing){
					var leftCoordinate = $this.rect.get('left'),
						topCoordinate = $this.rect.get('top'),
						textWidth = Math.max($this.rect.get('width'), 150),
						textHeight = Math.max($this.rect.get('height'), 40),
						fontSize = $this._textStetting.size,
						fontFamily = $this._textStetting.family,
						fontColor = $this.element.find("#fillPicker").spectrum('get').toHexString();
					
					var zoomLevel = $this._fabricCanvas.getZoom();
					if(zoomLevel != 1 ){
						leftCoordinate *= zoomLevel;
						topCoordinate *= zoomLevel;
						textWidth *= zoomLevel;
						textHeight *= zoomLevel;
						fontSize *= zoomLevel;
					}
					$drawingCanvas.find('.canvas-container').append('<div class="insert-text-container" style="top: ' + topCoordinate + 'px;left: ' + leftCoordinate + 'px;"><div class="move-cursor">' + $this.l10n['CLICK_HERE_TO_DRAG'] + '</div><textarea spellcheck="' + $this.defaultSettings.spellcheck + '" style="width:' + textWidth +'px;height: ' + textHeight + 'px;font-size:' + fontSize + 'px;font-family:' + fontFamily + ';color: ' + fontColor + ';" ></textarea></div>');
					
					this.remove($this.rect);
					$drawingCanvas.find( ".insert-text-container" ).draggable({ handle: ".move-cursor", containment: $drawingCanvas.find(".canvas-container") });
					$drawingCanvas.find( ".insert-text-container" ).resizable({
						containment: $drawingCanvas.find(".canvas-container"),
						resize: function( event, ui ) {
							$(ui.element).find("textarea").css({width : ui.size.width + "px", height: ui.size.height + "px"})
						}
					});
					$drawingCanvas.find(".insert-text-container textarea").on("keyup", function(){
						checkMulti($(this));
					});
					function checkMulti($element) {
						var multi = true;
						var elementWidth = $element.width();
						var elementHeight = $element.height();
						$element.addClass('nowrap');
						if($element[0].scrollWidth > elementWidth)
							$element.width( ($element[0].scrollWidth + 10) + "px");
						if($element[0].scrollHeight > elementHeight)
							$element.height( ($element[0].scrollHeight + 5) + "px");
						$element.removeClass('nowrap');
					}
				}
			} else {
				/// remove the text area and add text object
				var $textarea = $drawingCanvas.find('.canvas-container textarea');
				var $textContainer = $drawingCanvas.find('.canvas-container .insert-text-container');
				var textVal = $textarea.val().trim();
				if(textVal != "") {
					var zoomLevel = $this._fabricCanvas.getZoom();
					fbtext = new fabric.IText(textVal,{
						width: $textContainer.width() / zoomLevel,
						height: $textContainer.height() / zoomLevel,
						left: $textContainer.position().left / zoomLevel,
						top: $textContainer.position().top / zoomLevel,
						textAlign: 'left',
						fill: $this.element.find("#fillPicker").spectrum('get').toHexString(),
						radius: 50,
						fontSize: $this._textStetting.size * zoomLevel,
						spacing: 20,
						fontFamily: $this._textStetting.family
					});
					fbtext.selectable = true;
					$this.AddShape(fbtext, "text",this);
					this.renderAll();
					this.setActiveObject(fbtext);
					$textContainer.remove();
				} else {
					var $textContainer = $drawingCanvas.find('.canvas-container .insert-text-container');
					$textContainer.remove();
				}
				
			}
		} else if($this._activeTool.name == 'rect' && $this._activeTool.isActive){
			rect2 = new fabric.Rect({ 
			  left: $this.rect.get('left'),
			  top: $this.rect.get('top'),
			  originX: 'left',
			  originY: 'top',
			  width: $this.rect.get('width'),
			  height: $this.rect.get('height'),
			  angle: 0,
			  fill: $this.element.find("#fillPicker").spectrum('get').toHexString(),
			  stroke: $this.element.find("#strokePicker").spectrum('get').toHexString(),
			  strokeWidth: $this._thickness,
			  transparentCorners: false
			});
			this.remove($this.rect);
			this.isDown = false;
			$this.AddShape(rect2, "rectangle",this);
		} else if($this._activeTool.name == 'polygon' && $this._activeTool.isActive){
			
		}
		var count = this.getObjects().length;
		if(count > 0){
			$this.element.find('#clear-canvas').removeClass('disabled');
		}else{
			$this.element.find('#clear-canvas').addClass('disabled');
		}
	});
}
/**
 * Hide edit toolbar when object deselected.
 */
LumenCanvas.prototype.HideEditToolbar = function(){
	var $this = this;
	$this.element.find('.lumen-options .active-object-tools').html('');
}
/**
 * Show edit toolbar when pan tool is selected.
 */
LumenCanvas.prototype.ShowEditToolbar = function(){
	var $this = this;
	if($this.defaultSettings.showEditToolbar){
		var currentSelectedThickness = $this._thickness;
		var optionsHtml = '<div class="lumen-edit-toolbar">\
						<div class="lumen-edit-button lumen-send-back" title="Send backwards"><img src="img/back-to-front.png" style=""></div>\
						<div class="lumen-edit-button lumen-bring-front" title="Bring forward"><img src="img/back-to-front.png" style=""></div>\
						<div class="lumen-edit-button lumen-send-back-multi" title="Send back one step"><img src="img/back-to-front.png" style=""></div>\
						<div class="lumen-edit-button lumen-bring-front-multi" title="Bring front one step"><img src="img/back-to-front.png" style=""></div>\
						<div class="lumen-edit-button lumen-trash" title="Delete selected object"><img src="img/trash.png" style=""></div>\
					</div>';
		$this.element.find('.lumen-options .active-object-tools').append(optionsHtml);
		$this.element.find('.lumen-edit-toolbar .lumen-send-back').on("click touchstart",function() {
			var $this = GetLumenCanvasInstance($(this));
			var obj = $this._fabricCanvas.getActiveObject();
			if(obj != undefined){// && obj.type == "i-text"){
				if(obj.name == "line"){
					$this._fabricCanvas.sendToBack($this.circle1);
					$this._fabricCanvas.sendToBack($this.circle2);
				}
				$this._fabricCanvas.sendToBack(obj);
				if(typeof obj.triangle != 'undefined'){
					$this._fabricCanvas.sendToBack(obj.triangle);
				}
				$this._fabricCanvas.renderAll();
			}
		});
		$this.element.find('.lumen-edit-toolbar .lumen-bring-front').on("click touchstart",function() {
			var $this = GetLumenCanvasInstance($(this));
			var obj = $this._fabricCanvas.getActiveObject();
			if(obj != undefined){// && obj.type == "i-text"){
				
				$this._fabricCanvas.bringToFront(obj);
				if(obj.name == "line"){
					$this._fabricCanvas.bringToFront($this.circle1);
					$this._fabricCanvas.bringToFront($this.circle2);
				}
				if(typeof obj.triangle != 'undefined'){
					$this._fabricCanvas.bringToFront(obj.triangle);
				}
				$this._fabricCanvas.renderAll();
			}
		});
		$this.element.find('.lumen-edit-toolbar .lumen-send-back-multi').on("click touchstart",function() {
			var $this = GetLumenCanvasInstance($(this));
			var obj = $this._fabricCanvas.getActiveObject();
			if(obj != undefined){// && obj.type == "i-text"){
				
				/*if(obj.name == "line"){
					$this._fabricCanvas.sendBackwards($this.circle1);
					$this._fabricCanvas.sendBackwards($this.circle2);
				}*/
				$this._fabricCanvas.sendBackwards(obj);
				if(typeof obj.triangle != 'undefined'){
					$this._fabricCanvas.sendBackwards(obj.triangle);
				}
				$this._fabricCanvas.renderAll();
			}
		});
		$this.element.find('.lumen-edit-toolbar .lumen-bring-front-multi').on("click touchstart",function() {
			var $this = GetLumenCanvasInstance($(this));
			var obj = $this._fabricCanvas.getActiveObject();
			if(obj != undefined){// && obj.type == "i-text"){
				
				$this._fabricCanvas.bringForward(obj);
				if(obj.name == "line"){
					$this._fabricCanvas.bringToFront($this.circle1);
					$this._fabricCanvas.bringToFront($this.circle2);
				}
				if(typeof obj.triangle != 'undefined'){
					$this._fabricCanvas.bringForward(obj.triangle);
				}
				$this._fabricCanvas.renderAll();
			}
		});
		$this.element.find('.lumen-edit-toolbar .lumen-trash').on("click touchstart",function() {
			var $this = GetLumenCanvasInstance($(this));
			var obj = $this._fabricCanvas.getActiveObject();
			if(obj != undefined){// && obj.type == "i-text"){
				//special case for arrow
				if(typeof obj.triangle != 'undefined'){
					$this._fabricCanvas.remove(obj.triangle);
				}
				
				$this._fabricCanvas.remove(obj);
				
			}
		});
	}
}	
/**
 * Show text toolbar when text tool is selected.
 */
LumenCanvas.prototype.ShowTextToolbar = function(){
	var $this = this;
	var currentSelectedThickness = $this._thickness;
	var optionsHtml = '<div class="lumen-text-toolbar">\
					<label>Font Size :\
					<select id="font-size">\
						<option value="8">8</option>\
						<option value="10">10</option>\
						<option value="12">12</option>\
						<option value="16">16</option>\
						<option value="20" selected>20</option>\
						<option value="24">24</option>\
						<option value="28">28</option>\
						<option value="32">32</option>\
						<option value="36">36</option>\
						<option value="48">48</option>\
					</select>\
				</label>\
				<label>Font Family :\
				<select id="font-family" >\
					   <optgroup label="Sans Serif" >\
						  <option value="Arial"  selected>Arial</option>\
						  <option value="Arial Black" >Arial Black</option>\
						  <option value="Arial Narrow" >Arial Narrow</option>\
						  <option value="Gill Sans" >Gill Sans</option>\
						  <option value="Helvetica" >Helvetica</option>\
						  <option value="Impact" >Impact</option>\
						  <option value="Tahoma" >Tahoma</option>\
						  <option value="Trebuchet MS">Trebuchet MS</option>\
						  <option value="Verdana" >Verdana</option>\
					   </optgroup>\
					   <optgroup label="Serif" >\
						  <option value="Baskerville" >Baskerville</option>\
						  <option value="Garamond" >Garamond</option>\
						  <option value="Georgia" >Georgia</option>\
						  <option value="Hoefler Text" >Hoefler Text</option>\
						  <option value="Lucida Bright" >Lucida Bright</option>\
						  <option value="Palatino" >Palatino</option>\
						  <option value="Times New Roman" >Times New Roman</option>\
					   </optgroup>\
					   <optgroup label="Monospace" >\
						  <option value="Consolas/Monaco" >Consolas/Monaco</option>\
						  <option value="Courier New" >Courier New</option>\
						  <option value="Lucida Sans Typewriter" >Lucida Sans Typewriter</option>\
					   </optgroup>\
					   <optgroup label="Other" >\
						  <option value="Copperplate" >Copperplate</option>\
						  <option value="Papyrus" >Papyrus</option>\
						  <option value="Script" >Script</option>\
					   </optgroup>\
					</select>\
				  </label>\
				</div>';
				
				/*<select id="font-family">\
						<option value="arial" selected>Arial</option>\
						<option value="helvetica">Helvetica</option>\
						<option value="myriad pro">Myriad Pro</option>\
						<option value="delicious">Delicious</option>\
						<option value="verdana">Verdana</option>\
						<option value="georgia">Georgia</option>\
						<option value="courier">Courier</option>\
						<option value="comic sans ms">Comic Sans MS</option>\
						<option value="impact">Impact</option>\
						<option value="monaco">Monaco</option>\
						<option value="optima">Optima</option>\
						<option value="hoefler text">Hoefler Text</option>\
						<option value="plaster">Plaster</option>\
						<option value="engagement">Engagement</option>\
					</select>*/
	
	$this.element.find('.lumen-options .active-object-tools').html(optionsHtml);
	$this._textStetting = {
		family : $this.element.find('.lumen-text-toolbar #font-family').val(),
		size : $this.element.find('.lumen-text-toolbar #font-size').val()
	};
	
	$this.element.find('.lumen-text-toolbar #font-family').change(function() {
		var $this = GetLumenCanvasInstance($(this));
		var $textarea = $(this).closest( ".lumen-canvas" ).find(".insert-text-container textarea");
		$textarea.css("font-family", $(this).val());
		$this._textStetting.family = $(this).val();
		if($textarea.length == 0) {
			var obj = $this._fabricCanvas.getActiveObject();
			if(obj != undefined && obj.type == "i-text"){
				obj.set({fontFamily : $(this).val()});
				$this._fabricCanvas.renderAll();
			}
		}
	});
	$this.element.find('.lumen-text-toolbar #font-size').change(function() {
		var $this = GetLumenCanvasInstance($(this));
		var $textarea = $(this).closest( ".lumen-canvas" ).find(".insert-text-container textarea");
		$textarea.css("font-size", $(this).val() + "px");
		$this._textStetting.size = $(this).val();
		if($textarea.length == 0) {
			var obj = $this._fabricCanvas.getActiveObject();
			if(obj != undefined && obj.type == "i-text"){
				obj.set({fontSize : $(this).val()});
				$this._fabricCanvas.renderAll();
			}
		}
	});
	$this.element.find('.lumen-text-toolbar .lumen-text-content').keyup(function() {
		var $this = GetLumenCanvasInstance($(this));
		var obj = $this._fabricCanvas.getActiveObject();
		if(obj != undefined && obj.type == "i-text"){
			obj.setText($(this).val());
			$this._fabricCanvas.renderAll();
		}
	});
}
/**
 * Hide text toolbar when other tool rather than text is selected.
 */
LumenCanvas.prototype.HideTextToolbar = function(){
	var $this = this;
	$this.element.find('.lumen-options .active-object-tools').html('');
}
LumenCanvas.prototype._ShowHideControl = function(bShowControl){
	var $this = this;
	$this._fabricCanvas.getObjects().forEach(function(entry) {
		if(bShowControl && entry.name == "line"){
			entry.set({
				selectable: bShowControl,
			});
		} else if(bShowControl && entry.name == "line-end-point"){debugger;
			entry.set({
				selectable: bShowControl,
			});
		} else{
			entry.set({
				selectable: bShowControl,
				hasBorders: bShowControl,
				hasControls: bShowControl,
			});
		}
		if(bShowControl){
			entry.set({
				borderColor: '#d1d4da',
				cornerColor: '#43b9d3',
				cornerStyle: 'circle',
				cornerSize: 10,
				transparentCorners: false
			});
		}
	});
}
/**
 * Hide text toolbar when other tool rather than text is selected.
 */
LumenCanvas.prototype._InitToolbar = function() {
	var $this = this;
	
	var toolbarHtml = '<div class="lumen-picker">\
				<div class="lumen-picker-contents" >\
					<div id="drawing-mode" class="lumen-pick-tool toolbar-button thin-button " style="background-image:url(img/pencil.png);" title="' + this.l10n["PENCIL"] + '" ></div>\
					<div class="lumen-pick-tool toolbar-button thin-button" style="background-image:url(img/polygon.png);" title="' + this.l10n["POLYGON"] + '" ></div>\
					<div class="lumen-pick-tool toolbar-button thin-button" style="background-image:url(img/line.png);" title="' + this.l10n["LINE"] + '" ></div>\
					<div class="lumen-pick-tool toolbar-button thin-button" style="background-image:url(img/rectangle.png);" title="' + this.l10n["RECTANGE"] + '" ></div>\
					<div class="lumen-pick-tool toolbar-button thin-button" style="background-image:url(img/ellipse.png);" title="' + this.l10n["ELLIPSE"] + '" ></div>\
					<div class="lumen-pick-tool toolbar-button thin-button" style="background-image:url(img/text.png);" title="' + this.l10n["TEXT"] + '" ></div>\
					<div class="lumen-pick-tool toolbar-button thin-button" style="background-image:url(img/pan.png);" title="' + this.l10n["PAN"] + '" ></div>\
					<div id="eyedrop" class="lumen-pick-tool toolbar-button thin-button" style="background-image:url(img/eyedropper.png);" title="' + this.l10n["EYEDROPPER"] + '" ></div>\
					<div style="position:static;bottom:0;left:0;right:0;" >\
						<div class="lumen-undo-redo" >\
							<div class="lumen-undo toolbar-button thin-button disabled" title="' + this.l10n["UNDO"] + '" style="background-image:url(img/undo.png);" ></div>\
							<div class="lumen-redo toolbar-button thin-button disabled" title="' + this.l10n["REDO"] + '" style="background-image:url(img/redo.png);" ></div>\
						</div>\
						<div class="lumen-zoom" >\
							<div id="zoomOut" class="lumen-zoom-out toolbar-button thin-button" title="' + this.l10n["ZOOM_OUT"] + '" style="background-image:url(img/zoom-out.png);" ></div>\
							<div id="zoomIn" class="lumen-zoom-in toolbar-button thin-button" title="' + this.l10n["ZOOM_IN"] + '" style="background-image:url(img/zoom-in.png);" ></div>\
						</div>\
						<div class="lumen-others" >\
							<!--div id="insert-equation" class="lumen-insert-equation toolbar-button thin-button" title="' + this.l10n["INSERT_EQUATION"] + '" style="background-image:url(img/summation.png);"></div-->\
							\
							<div id="color-fill" class="lumen-color-fill toolbar-button thin-button" title="' + this.l10n["COLOR_FILL"] + '" style="background-image:url(img/color-fill.png);"></div>\
						</div>\
						<div id="clear-canvas" class="lc-clear toolbar-button fat-button disabled" >' + this.l10n["CLEAR"] + '</div>\
						<div class="lumen-color-pickers" >\
						<div title="' + this.l10n["BORDER_TITLE"] + '" class="color-well" style="float:left;text-align:center;" >\
							<label >' + this.l10n["BORDER_LABEL"] + '</label><br >\
							<div class=""  >\
								<input id="strokePicker" class="lumen-color-picker-input" type="text"  />\
							</div>\
						</div>\
						<div title="' + this.l10n["FILL_TITLE"] + '"  class="color-well" style="float:left;text-align:center;" >\
							<label >' + this.l10n["FILL_LABEL"] + '</label>\
							<br >\
							<div class=""  >\
								<input id="fillPicker" class="lumen-color-picker-input" type="text"  />\
							</div>\
						</div>\
						<div title="' + this.l10n["BG_TITLE"] + '" class="color-well" style="float:left;text-align:center;" >\
							<label >' + this.l10n["BG_LABEL"] + '</label>\
							<br >\
							<div class=""  >\
								<input id="bgPicker" class="lumen-color-picker-input" type="text"  />\
							</div>\
						</div>\
						</div>\
					</div>\
				</div>\
			</div>';
			
		toolbarHtml += '<div class="lumen-options horz-toolbar">\
							<div class="active-object-tools">\
							</div>';
		if($this.defaultSettings.showGridButton){
			toolbarHtml += '<div class="field switch grid-switch">\
								<label style="margin-right: 8px;font-size: 16px;">Grid </label>\
								<label class="cb-enable ' + ($this.defaultSettings.enableGridByDefault?"selected": "") +'"><span>On</span></label>\
								<label class="cb-disable ' + (!$this.defaultSettings.enableGridByDefault?"selected": "") +'"><span>Off</span></label>\
								<input type="checkbox" id="checkbox" class="checkbox" name="grid" />\
							</div>';
		}
							
		toolbarHtml += '<div class="lumen-zoom">\
							<div id="zoomOut" class="lumen-zoom-out toolbar-button thin-button" title="Zoom out" style="background-image:url(img/zoom-out.png);"></div>\
							<div class="zoom-level-label">100%</div>\
							<div id="zoomIn" class="lumen-zoom-in toolbar-button thin-button" title="Zoom In" style="background-image:url(img/zoom-in.png);width: 25px;height: 25px;float: left;"></div>\
						</div>\
					</div>';
	$this.element.append(toolbarHtml);
	$this.element.find('[title="Text"]').on("click touchstart",function() {
		var $this = GetLumenCanvasInstance($(this));
		$this.defaultSettings.deselectText = true;
		shapeName = "text";
		$this._DisableAllObjectsSelection ();
		$this._SetActiveTool(shapeName);
		$(this).addClass('selected');
		//$this._HideFreeDrawingToolbar();
		$this.ShowTextToolbar();
		$this._fabricCanvas.isDrawingMode = false;
	});
	//line drawing
	$this.element.find('[title="Line"]').on("click touchstart",function() {
		var $this = GetLumenCanvasInstance($(this));
		shapeName = "line";
		$this._DisableAllObjectsSelection ();
		$this._SetActiveTool(shapeName);
		$(this).addClass('selected');
		$this._ShowThicknessToolbar();
		$this._fabricCanvas.isDrawingMode = false;
	});
	//Ellipse drawing
	$this.element.find('[title="Ellipse"]').on("click touchstart",function() {
		var $this = GetLumenCanvasInstance($(this));
		shapeName = "circle";
		$this._DisableAllObjectsSelection ();
		$this._SetActiveTool(shapeName);
		$(this).addClass('selected');
		$this._ShowThicknessToolbar();
		$this._fabricCanvas.isDrawingMode = false;
	});
	//Rectangle drawing
	$this.element.find('[title="Rectangle"]').on("click touchstart",function() {
		var $this = GetLumenCanvasInstance($(this));
		shapeName = "rect";
		$this._DisableAllObjectsSelection ();
		$this._SetActiveTool(shapeName);
		$(this).addClass('selected');
		$this._ShowThicknessToolbar();
		$this._fabricCanvas.isDrawingMode = false;
		
	});
	
	//Polygon drawing
	$this.element.find('[title="Polygon"]').on("click touchstart",function() {
		var $this = GetLumenCanvasInstance($(this));
		shapeName = "polygon";
		$this._DisableAllObjectsSelection ();
		$this._SetActiveTool(shapeName);
		$(this).addClass('selected');
		$this._ShowThicknessToolbar();
		$this._fabricCanvas.isDrawingMode = false;
		
	});
	
	$this.element.find('[title="Eyedropper"]').on("click touchstart",function() {
		var $this = GetLumenCanvasInstance($(this));
		shapeName = "eyedrop";
		$this._DisableAllObjectsSelection ();
		$this._SetActiveTool(shapeName);
		$(this).addClass('selected');
		$this._HideFreeDrawingToolbar();
		$this._fabricCanvas.isDrawingMode = false;
		
	});
	
	//clear drawing
	$this.element.find('#clear-canvas').on("click touchstart",function() {
		var $this = GetLumenCanvasInstance($(this));
		if(typeof $this.defaultSettings.clearAllOverwrite == 'function'){
			$this.defaultSettings.clearAllOverwrite($this);
		} else {
			$this.ClearAll($(this));
		}		
	});
	//Pan moving tool
	$this.element.find('[title="Pan"]').on("click touchstart",function() {
		var $this = GetLumenCanvasInstance($(this));
		shapeName = "pan";
		$this._SetActiveTool(shapeName);
		$(this).addClass('selected');
		$this._fabricCanvas.selection = true;
		
		$this._ShowHideControl(true);
		$this._HideFreeDrawingToolbar();
		$this._fabricCanvas.isDrawingMode = false;
	});
	// Insert an equation
	$this.element.find('.lumen-insert-equation').on("click touchstart",function(){
		var $this = GetLumenCanvasInstance($(this));
		shapeName = "equation";
		$this._SetActiveTool(shapeName);
		$(this).addClass('selected');
		$this.ShowEquationEditor();
	});
	// Color fill
	$this.element.find('.lumen-color-fill').on("click touchstart",function(){
		var $this = GetLumenCanvasInstance($(this));
		shapeName = "colorfill";
		$this._SetActiveTool(shapeName);
		$(this).addClass('selected');
		$this._HideFreeDrawingToolbar();
		$this._fabricCanvas.isDrawingMode = false;
		
	});
	//free drawing tool
	$this.element.find('#drawing-mode').on("click touchstart",function() {
		var $this = GetLumenCanvasInstance($(this));
		$this._DisableAllObjectsSelection ();
		$this._SetActiveTool('free_drawing');
		$this._EnableFreeHandDrawing();
		$(this).addClass('selected');
	});
	/// Checkbox handler
	$this.element.find(".cb-enable").on("click touchstart",function(){
		var parent = $(this).parents('.switch');
		$('.cb-disable',parent).removeClass('selected');
		$(this).addClass('selected');
		$('.checkbox',parent).prop('checked', true);
		//----
		var $this = GetLumenCanvasInstance($(this));
		
		var isChecked = $('.checkbox',parent).prop("checked");
		if(isChecked) {
			$this._fabricCanvas.setBackgroundColor({source: $this.gridImagesrc, repeat: 'repeat'}, function () {
				$this._fabricCanvas.renderAll();
			});
		} else {
			$this._fabricCanvas.backgroundColor = $this.element.find("#bgPicker").spectrum('get').toHexString();
			$this._fabricCanvas.renderAll();
		}
	});
	$this.element.find(".cb-disable").on("click touchstart",function(){
		var parent = $(this).parents('.switch');
		$('.cb-enable',parent).removeClass('selected');
		$(this).addClass('selected');
		$('.checkbox',parent).prop('checked', false);
		//----
		var $this = GetLumenCanvasInstance($(this));
		
		var isChecked = $('.checkbox',parent).prop("checked");
		if(isChecked) {
			$this._fabricCanvas.setBackgroundColor({source: $this.gridImagesrc, repeat: 'repeat'}, function () {
				$this._fabricCanvas.renderAll();
			});
		} else {
			$this._fabricCanvas.backgroundColor = $this.element.find("#bgPicker").spectrum('get').toHexString();
			$this._fabricCanvas.renderAll();
		}
	});
}
/**
 * Hide pencil toolbar when other tool rather than pencil is selected.
 */
LumenCanvas.prototype._HideFreeDrawingToolbar = function(){
	this.element.find('.lumen-options .active-object-tools').html('');
}

/**
 * Clear drawing area but keep the background color.
 */
LumenCanvas.prototype.ClearAll = function($clearButton) {
	var $this = this;
	if($clearButton != undefined) {
		if(confirm("Are you sure you would like to clear?")){
			$this._fabricCanvas._activeObject = null;
			$this._fabricCanvas.clear();
			$clearButton.addClass('disabled');
		}
	} else {
		$this._fabricCanvas._activeObject = null;
		$this._fabricCanvas.clear();
		$this.element.find('#clear-canvas').addClass('disabled');
	}
	$this._fabricCanvas.setHeight($this._defaultHeight);
	$this.defaultSettings.height = $this._defaultHeight;
	$this.element.find(".cb-enable").trigger('click');
	$this._SetWaterMark();
	$this._fabricCanvas.backgroundColor = $this.element.find("#bgPicker").spectrum('get').toHexString(); 
	$this._fabricCanvas.renderAll();
}
/**
 * Returns a json object that represents the drawing area.
 */
LumenCanvas.prototype.GetJSON = function(){
	return $this._fabricCanvas.toObject();
}
/**
 * Returns stringified json object that represents the drawing area.
 */
LumenCanvas.prototype.GetDataString = function(){
	return JSON.stringify($this._fabricCanvas.toObject());
}
/**
 * Returns an SVG object that represents the drawing area.
 */
LumenCanvas.prototype.GetSVG = function(){
	return $this._fabricCanvas.toSVG();
}
/**
 *  Set the drawing area to the passed object.
 * @param {json} fabric js JSON object.
 */
LumenCanvas.prototype.SetJSON = function(json){
	$this._fabricCanvas.loadFromJSON(json);
	$this._fabricCanvas.renderAll();
}
/**
 * Open the drawing in a new tab or return the URL string.
 * @param {options} see below defaultOptions object.
 */
LumenCanvas.prototype.GetDataURL = function(options){
	var defaultOptions = {
		format: 'png',
		left: 0,
		top: 0,
		width: 500,
		height: 350,
		openInNewTab : false
	};
	$.extend( true, defaultOptions, options );
	var dataURL = $this._fabricCanvas.toDataURL(defaultOptions );
	if(defaultOptions.openInNewTab) window.open(dataURL);
	else return dataURL;
}
/**
 *  Set zoom value for the drawing area.
 * @param {$this} a refrance to LumenCanvas instance.
 * @param {val} zoom value. One is the default value.
 */
LumenCanvas.prototype.SetZoom = function($this, val){
	val = Math.round( val * 10 ) / 10;/// round to first decimal.
	if(val < 0.3 || val > 1.4) return;
	$this._fabricCanvas.setZoom(val);
	$this._fabricCanvas.setWidth($this.defaultSettings.width * $this._fabricCanvas.getZoom());
	$this._fabricCanvas.setHeight($this.defaultSettings.height * $this._fabricCanvas.getZoom());
	
	$('.lumen-options.horz-toolbar .zoom-level-label').text(Math.floor($this._fabricCanvas.getZoom()*100) + '%');
}
/**
 *  Disable all selected objects.
 */
LumenCanvas.prototype._DisableAllObjectsSelection = function(){
	var $this = this;
	//$this._fabricCanvas.deactivateAll().renderAll();
	$this._fabricCanvas.getObjects().forEach(function(entry) {
		entry.set('selectable', false);
	});
}

LumenCanvas.prototype._AddSvgCursorToCanvas = function(svgString, offset){
	var $this = this;
	$this._fabricCanvas.hoverCursor = 'none';
	$this._fabricCanvas.defaultCursor = 'none';
	if($this.mouseIcon != undefined){
		$this._fabricCanvas.remove($this.mouseIcon);
		$this.mouseIcon = undefined;
	}
	var path = fabric.loadSVGFromString(svgString,function(objects, options) {
		$this.mouseIcon = fabric.util.groupSVGElements(objects, options);
		$this.mouseIcon.set({ left: offset, top: offset }).setCoords();
		$this._SetObjectName($this.mouseIcon, "mouse-cursor");
		$this._fabricCanvas.add($this.mouseIcon).renderAll();
	});
}
/**
 *  Set active tool.
 * @param {toolName} a string that has one of this values (line, circle, rect, eyedrop, text, pan, polygon, free_drawing).
 */
LumenCanvas.prototype._SetActiveTool = function(toolName){
	var $this = this;
	/// user try to change tool while creating polygon
	if(typeof $this._currentShape != 'undefined' && $this.defaultSettings.mode === 'edit') {
		$this.ClosePolygon($this);
	}
	var thisCanvas = $this._fabricCanvas;
	$this.element.find('.toolbar-button.selected').removeClass('selected');
	if(toolName != "text" && $this.element.find('.insert-text-container').length > 0) {
		var $drawingCanvas = $this.element;
		/// remove the text area and add text object
		var $textarea = $drawingCanvas.find('.canvas-container textarea');
		var $textContainer = $drawingCanvas.find('.canvas-container .insert-text-container');
		var textVal = $textarea.val().trim();
		if(textVal != "") {
			fbtext = new fabric.IText(textVal,{
				width: $textContainer.width(),
				height: $textContainer.height(),
				left: $textContainer.position().left,
				top: $textContainer.position().top,
				textAlign: 'left',
				fill: $this.element.find("#fillPicker").spectrum('get').toHexString(),
				radius: 50,
				fontSize: $this._textStetting.size,
				spacing: 20,
				fontFamily: $this._textStetting.family
			});
			fbtext.selectable = true;
			$this.AddShape(fbtext, "text",thisCanvas);
			thisCanvas.renderAll();
			thisCanvas.setActiveObject(fbtext);
			$textContainer.remove();
		} else {
			var $textContainer = $drawingCanvas.find('.canvas-container .insert-text-container');
			$textContainer.remove();
		}
	}
	var tools = [
		{name:"line",isActive:false},
		{name:"circle",isActive:false},
		{name:"rect",isActive:false},
		{name:"eyedrop",isActive:false},
		{name:"text",isActive:false},
		{name:"pan",isActive:false},
		{name:"polygon",isActive:false},
		{name:"free_drawing",isActive:false},
		{name:"colorfill",isActive:false},
		{name:"equation",isActive:false},
	];	
	for(i=0; i< tools.length;i++){
		if(tools[i].name == toolName){
			tools[i].isActive = true;
			$this._activeTool = tools[i];
		}else{
			tools[i].isActive = false;
		}
	}
	if(toolName != "pan") {
		
		$this._ShowHideControl(false);
		thisCanvas.discardActiveObject();
		thisCanvas.renderAll(); 
	}
	/// rmove any mouse cursor icon
	if(toolName != 'colorfill' && toolName != 'eyedrop'){
		thisCanvas.getObjects().forEach(function(entry) {
			if(entry.name == "mouse-cursor"){
				thisCanvas.remove(entry);
			}
		});
		thisCanvas.renderAll(); 
	}
	/// remove line end points
	$this._HideLineEndPoints();
	$this._fabricCanvas.discardActiveObject().renderAll();
	
	if(toolName == 'colorfill'){
		var svgString = '<svg version="1.1" id="Capa_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" width="20px" height="20px" viewBox="0 0 379.13 379.13" style="enable-background:new 0 0 379.13 379.13;" xml:space="preserve"><g><g><path d="M374.742,329.056c-1.924-6.558-7.188-11.373-15.646-14.315c-4.768-1.656-10.161-2.695-15.886-3.799 c-4.628-0.893-9.412-1.813-13.292-3.007c-0.478-0.146-0.917-0.293-1.319-0.432c0.999-1.021,2.034-2.048,2.904-2.91 c4.104-4.061,8.351-8.261,11.271-13.063c5.422-8.918,4.794-18.369-1.678-25.282c0,0-6.153-6.954-17.972-6.954 c-3.317,0-6.765,0.591-10.24,1.755c0.101-6.3,0.047-12.383-0.16-18.081c-1.074-29.662-5.979-48.147-15.434-58.178 c0.023-22.692-9.021-56.099-24.194-89.363C250.033,44.866,219.626,8.17,200.796,8.17c-1.771,0-3.423,0.345-4.919,1.026 c-0.187,0.084-0.365,0.177-0.572,0.286l-9.3,4.248c-6.788-2.36-20.356-6.799-34.954-10.01C139.834,1.252,130.126,0,122.197,0 c-13.492,0-22.308,3.459-26.953,10.575c-2.41,3.692-4.77,9.95-2.322,18.786c0.493,1.779,1.177,3.634,2.034,5.511 c9.438,20.69,52.658,54.961,100.531,79.715c1.051,0.544,2.262,0.696,3.413,0.433c0.964-0.222,1.953-0.333,2.944-0.333 c5.175,0,9.905,3.039,12.051,7.742c1.47,3.221,1.597,6.819,0.357,10.136c-1.238,3.315-3.693,5.95-6.914,7.419 c-1.742,0.795-3.59,1.197-5.491,1.198c-5.179,0-9.913-3.044-12.062-7.755c-0.462-1.015-0.793-2.079-0.984-3.163 c-0.27-1.536-1.24-2.857-2.624-3.574c-38.121-19.751-73.136-44.636-93.667-66.568c-1.468-1.567-3.772-2.023-5.726-1.132 L6.557,95.586c-1.999,0.912-3.168,3.021-2.882,5.2c1.469,11.192,8.085,51.709,31.55,103.146 c23.463,51.438,49.724,82.994,57.214,91.44c1.458,1.646,3.818,2.146,5.816,1.231l167.184-76.265 c0.206,1.544,0.419,3.117,0.644,4.757c1.438,10.559,3.07,22.524,3.11,32.352c0.028,6.927-0.744,10.773-1.398,12.783l0,0 c-1.97-0.214-4.408-0.619-6.771-1.016c-4.793-0.799-9.747-1.626-14.512-1.626c-11.599,0-17.068,5.341-19.617,9.82 c-5.986,10.531-0.033,23.457,5.82,33.543c-3.291,0.916-7.79,1.701-10.776,2.221c-4.479,0.781-9.108,1.589-13.123,2.859 c-7.511,2.379-12.396,6.464-14.525,12.144c-1.672,4.458-2.248,11.52,4.49,19.839c8.809,10.871,21.499,19.078,37.722,24.396 c13.405,4.396,29.27,6.719,45.876,6.719c16,0,32.021-2.082,46.328-6.021c10.648-2.933,25.358-8.347,34.965-17.488 C367.706,351.784,378.417,341.591,374.742,329.056z M251.675,317.151c1.16-2.648,0.595-5.929-1.736-10.03 c-5.625-9.902-7.554-16.623-5.734-19.977c0.393-0.721,1.583-2.916,7.17-2.916c3.206,0,7.051,0.673,10.775,1.323 c3.615,0.63,7.028,1.229,9.802,1.229c1.474,0,2.625-0.168,3.521-0.517c0.584-0.226,1.116-0.582,1.56-1.041 c9.311-9.688,7.153-36.916,4.148-63.981c-1.055-9.491-2-17.063-0.998-18.579c0.234-0.263,0.46-0.376,0.701-0.349 c8.646,2.771,14.124,18.758,15.837,46.226c0.725,11.605,0.638,22.874,0.438,30.28c-0.046,1.746,0.86,3.366,2.34,4.175 c1.479,0.809,3.268,0.661,4.606-0.376c3.513-2.721,8.796-5.963,14.036-5.965c2.734,0,5.131,0.838,7.325,2.561l0.002,0.002 c3.938,4.407,0.54,9.42-8.058,18.331c-5.881,6.097-8.544,9.329-8.771,12.373c-0.052,0.708,0.053,1.421,0.311,2.08 c2.803,7.205,13.857,9.437,24.549,11.592c8.934,1.804,17.371,3.505,18.674,8.155c0.836,2.988-1.311,6.988-6.562,12.223 c-10.729,10.695-36.628,18.166-62.979,18.166c-28.88,0-52.202-8.737-63.986-23.975c-1.984-2.566-2.688-4.715-2.095-6.381 c1.266-3.537,8.118-4.789,15.375-6.113C242.12,323.806,249.503,322.106,251.675,317.151z M231.327,114.478 c-9.344-20.483-16.378-41.472-19.809-59.101c-1.194-6.131-1.938-11.761-2.206-16.734h0.001c3.582,3.467,7.35,7.719,11.192,12.638 c11.062,14.146,22.303,33.217,31.646,53.697s16.378,41.468,19.809,59.1c1.194,6.127,1.938,11.757,2.206,16.734 c-3.576-3.459-7.343-7.711-11.192-12.638C251.909,154.029,240.669,134.96,231.327,114.478z M107.806,18.772 c0.743-1.138,3.611-3.783,14.187-3.783c6.916,0,15.562,1.127,25.698,3.35c5.588,1.225,11.647,2.791,18.007,4.653l-46.042,21.002 c-5.281-5.665-8.99-10.797-11.022-15.252c-0.538-1.18-0.96-2.318-1.256-3.387C106.604,22.555,106.742,20.401,107.806,18.772z"/></g></svg>';
		$this._AddSvgCursorToCanvas(svgString, -20);
	} else if(toolName == 'eyedrop'){
		var svgString = '<svg version="1.1" id="Layer_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px"\
						 width="15px" height="15px" viewBox="0 0 512 512" enable-background="new 0 0 512 512" xml:space="preserve">\
					<path transform="scale(-2,2)" d="M395.744,186.372l-21.921-21.92l18.031-18.031c16.067,0.467,32.284-5.415,44.548-17.678\
						c23.627-23.626,23.627-61.933,0-85.56c-23.627-23.627-61.934-23.627-85.56,0c-12.264,12.263-18.145,28.48-17.678,44.547\
						l-18.031,18.031l-20.507-20.506c-3.905-3.905-10.236-3.905-14.142,0l-5.657,5.657c-3.904,3.905-3.904,10.237,0,14.142l20.507,20.506\
						L125.629,295.266l-18.385,79.196l77.075-20.506l169.706-169.706l21.92,21.92c3.905,3.904,10.237,3.905,14.143,0l5.657-5.657\
						C399.65,196.609,399.649,190.277,395.744,186.372z M180.007,344.127l-60.813,17.536l15.912-62.438l166.947-166.947l44.901,44.901\
						L180.007,344.127z"/>\
					<g id="_x23_231f20ff">\
						<path transform="scale(-2,2)" d="M107.112,384.223l0.248,0.021c1.957,14.615,10.26,27.208,17.908,39.439c4.291,6.867,8.66,13.767,11.609,21.342\
							c2.541,6.521,3.938,13.727,2.58,20.682c-1.522,8.953-7.023,17.131-14.727,21.936c-6.98,4.472-15.709,6.131-23.833,4.457\
							c-7.605-1.459-14.604-5.787-19.377-11.876c-4.273-5.39-6.746-12.164-7.004-19.028c-0.324-10.53,4.409-20.355,9.609-29.227\
							c6.867-11.694,15.096-22.738,19.866-35.536C105.453,392.488,106.63,388.408,107.112,384.223"/>\
					</g>\
					</svg>';
		$this._AddSvgCursorToCanvas(svgString, -15);
	} else if(toolName == 'pan') {
		$this._fabricCanvas.hoverCursor = 'move';
		$this._fabricCanvas.defaultCursor = 'default';
	} else {
		$this._fabricCanvas.hoverCursor = 'crosshair';
		$this._fabricCanvas.defaultCursor = 'crosshair';//'default';
		if($this.mouseIcon != undefined){
			//$this.mouseIcon.remove();
			$this._fabricCanvas.remove($this.mouseIcon);
			$this.mouseIcon = undefined;
		}
	}
	
}
/**
 *  Show thickness with arrows when line is selected or show border toolbar when rect,circle or polygon is selected.
 */
LumenCanvas.prototype._ShowThicknessToolbar = function(){
	var $this = this;
	var currentSelectedThickness = $this._thickness;
	var currentLineType = $this._lineType == undefined? 'solid': $this._lineType;
	
	var optionsHtml = '<div class="lumen-thickness-toolbar" >';
	
	if($this.element.find('[title="Line"]').hasClass("selected")){
		optionsHtml += '<div >\
						<div class="square-toolbar-button lumen-line-type ' + (currentLineType=='solid'?'selected':'')+ '" style="float:left;margin:1px;" data-type="solid"><img src="img/line.png"></div>\
						<div class="square-toolbar-button lumen-line-type ' + (currentLineType=='dashed'?'selected':'')+ '" style="float:left;margin:1px;" data-type="dashed"><img src="img/dashed-line.png"></div>\
						<!--div class="square-toolbar-button lumen-line-type ' + (currentLineType=='arrow'?'selected':'')+ '" style="float:left;margin:1px;" data-type="arrow"><img src="img/line-with-arrow.png"></div-->\
					</div>';
	}
	optionsHtml += '<div >\
						<div class="square-toolbar-button lumen-thickness ' + (currentSelectedThickness==1?'selected':'')+ '" data-radius="1">\
							<svg width="30" height="30" version="1.1" >\
								<circle cx="15" cy="15" r="0.5" ></circle>\
							</svg>\
						</div>\
					</div>\
					<div >\
						<div class="square-toolbar-button lumen-thickness ' + (currentSelectedThickness==2?'selected':'')+ '" data-radius="2">\
							<svg width="30" height="30" version="1.1" >\
								<circle cx="15" cy="15" r="1" ></circle>\
							</svg>\
						</div>\
					</div>\
					<div >\
						<div class="square-toolbar-button lumen-thickness ' + (currentSelectedThickness==3?'selected':'')+ '" data-radius="3">\
							<svg width="30" height="30" version="1.1" >\
								<circle cx="15" cy="15" r="2.5" ></circle>\
							</svg>\
						</div>\
					</div>\
					<div >\
						<div class="square-toolbar-button lumen-thickness ' + (currentSelectedThickness==4?'selected':'')+ '" data-radius="4">\
							<svg width="30" height="30" version="1.1" >\
								<circle cx="15" cy="15" r="5" ></circle>\
							</svg>\
						</div>\
					</div>\
					<div >\
						<div class="square-toolbar-button lumen-thickness ' + (currentSelectedThickness==5?'selected':'')+ '" data-radius="5">\
							<svg width="30" height="30" version="1.1" >\
								<circle cx="15" cy="15" r="10" ></circle>\
							</svg>\
						</div>\
					</div>\
					<div >\
						<div class="square-toolbar-button lumen-thickness ' + (currentSelectedThickness==6?'selected':'')+ '" data-radius="6">\
							<svg width="30" height="30" version="1.1" >\
								<circle cx="15" cy="15" r="13" ></circle>\
							</svg>\
						</div>\
					</div>\
				</div>';
	
	$this.element.find('.lumen-options .active-object-tools').html(optionsHtml);
	$this._thickness = this.element.find('.lumen-thickness-toolbar .square-toolbar-button.lumen-thickness.selected').data('radius');
	
	$this.element.find('.lumen-thickness-toolbar').on('click touchstart','.square-toolbar-button.lumen-thickness',function() {
		var $this = GetLumenCanvasInstance($(this));
		$('.square-toolbar-button.lumen-thickness.selected').removeClass('selected');
		$(this).addClass('selected');
		$this._thickness = $(this).data('radius');
	});
	
	$this.element.find('.lumen-thickness-toolbar').on('click touchstart','.square-toolbar-button.lumen-line-type',function() {
		var $this = GetLumenCanvasInstance($(this));
		$('.square-toolbar-button.lumen-line-type.selected').removeClass('selected');
		$(this).addClass('selected');
		$this._lineType = $(this).data('type');
	});
	
}

/**
 *  Enable pan tool and initialize the patterens.
 */
LumenCanvas.prototype._EnableFreeHandDrawing = function(){
	var $this = this;
	var thisCanvas = $this._fabricCanvas;
	$this._ShowFreeDrawingToolbar();
	thisCanvas.isDrawingMode = true;
	thisCanvas.freeDrawingBrush.width = parseInt($this.element.find('#drawing-line-width').val(), 10) || 1;
}
/**
 *  Show free hand drawing when pencil is selected.
 */
LumenCanvas.prototype._ShowFreeDrawingToolbar = function(){
	var $this = this;
	var optionsHtml = '<label for="drawing-line-width">' + this.l10n['MODE_LABEL'] + ' :\
							<select id="drawing-mode-selector">\
							  <option>Pencil</option>\
							  <option>Circle</option>\
							  <option>Spray</option>\
							  <option>Pattern</option>\
							  <option>hline</option>\
							  <option>vline</option>\
							  <option>square</option>\
							  <option>diamond</option>\
							  <option>texture</option>\
							</select>\
							</label>\
							<label for="drawing-line-width">' + this.l10n['LINE_WIDHT_LABEL'] + ' : <input type="range" value="' + $this.defaultSettings.defaultPencilThickness + '" min="1" max="90" id="drawing-line-width" style="position: relative;top: 7px;"> &nbsp;&nbsp;<span class="info">30</span></label>';
	$this.element.find('.lumen-options .active-object-tools').html(optionsHtml);
	$this.element.find('#drawing-mode-selector').change(function() {
		var $this = GetLumenCanvasInstance($(this));
		var thisCanvas = $this._fabricCanvas;
		if (fabric.PatternBrush) {
			var hLinePatternBrush = new fabric.PatternBrush(thisCanvas);
			hLinePatternBrush.getPatternSrc = function() {

				var patternCanvas = fabric.document.createElement('canvas');
				patternCanvas.width = patternCanvas.height = 10;
				var ctx = patternCanvas.getContext('2d');
				ctx.strokeStyle = this.color;
				ctx.lineWidth = 5;
				ctx.beginPath();
				ctx.moveTo(0, 5);
				ctx.lineTo(10, 5);
				ctx.closePath();
				ctx.stroke();
				return patternCanvas;
			};

			var vLinePatternBrush = new fabric.PatternBrush(thisCanvas);
			vLinePatternBrush.getPatternSrc = function() {
				var patternCanvas = fabric.document.createElement('canvas');
				patternCanvas.width = patternCanvas.height = 10;
				var ctx = patternCanvas.getContext('2d');
				ctx.strokeStyle = this.color;
				ctx.lineWidth = 5;
				ctx.beginPath();
				ctx.moveTo(5, 0);
				ctx.lineTo(5, 10);
				ctx.closePath();
				ctx.stroke();
				return patternCanvas;
			};

			var squarePatternBrush = new fabric.PatternBrush(thisCanvas);
			squarePatternBrush.getPatternSrc = function() {
				var squareWidth = 10, squareDistance = 2;
				var patternCanvas = fabric.document.createElement('canvas');
				patternCanvas.width = patternCanvas.height = squareWidth + squareDistance;
				var ctx = patternCanvas.getContext('2d');
				ctx.fillStyle = this.color;
				ctx.fillRect(0, 0, squareWidth, squareWidth);
				return patternCanvas;
			};

			var diamondPatternBrush = new fabric.PatternBrush(thisCanvas);
			diamondPatternBrush.getPatternSrc = function() {
				var squareWidth = 10, squareDistance = 5;
				var patternCanvas = fabric.document.createElement('canvas');
				var rect = new fabric.Rect({
					width: squareWidth,
					height: squareWidth,
					angle: 45,
					fill: this.color
				});
				var canvasWidth = rect.getBoundingRectWidth();
				patternCanvas.width = patternCanvas.height = canvasWidth + squareDistance;
				rect.set({ left: canvasWidth / 2, top: canvasWidth / 2 });
				var ctx = patternCanvas.getContext('2d');
				rect.render(ctx);
				return patternCanvas;
			};
			var img = new Image();
			img.src = 'honey_im_subtle.png';
			var texturePatternBrush = new fabric.PatternBrush(thisCanvas);
			texturePatternBrush.source = img;
		}
		if (this.value === 'hline') {
		  thisCanvas.freeDrawingBrush = hLinePatternBrush;
		}
		else if (this.value === 'vline') {
		  thisCanvas.freeDrawingBrush = vLinePatternBrush ;
		}
		else if (this.value === 'square') {
		  thisCanvas.freeDrawingBrush = squarePatternBrush;
		}
		else if (this.value === 'diamond') {
			
			thisCanvas.freeDrawingBrush = diamondPatternBrush;
		}
		else if (this.value === 'texture') {
		  thisCanvas.freeDrawingBrush = texturePatternBrush;
		}
		else {
		  thisCanvas.freeDrawingBrush = new fabric[this.value + 'Brush'](thisCanvas);
		}
		
		thisCanvas.freeDrawingBrush.width = parseInt($this.element.find('#drawing-line-width').val(), 10) || 1;
		var strockColor = $this.element.find("#strokePicker").spectrum('get').toHexString();
		thisCanvas.freeDrawingBrush.color = strockColor;
			

	});
	//
	this.element.find('#drawing-line-width').change(function() {
		var $this = GetLumenCanvasInstance($(this));
		var thisCanvas = $this._fabricCanvas;
		$(this).parent().find('.info').text($(this).val());
		thisCanvas.freeDrawingBrush.width = parseInt($(this).val(), 10) || 1;
	});
}
	
