/*
Simple Javascript undo and redo.
https://github.com/ArthurClemens/Javascript-Undo-Manager
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

/*
//canvas translate
var point = new fabric.Point(-20, -140);
$this.defaultSettings.fabricCanvas.absolutePan(point);

*/
function LumenCanvas (settings) {
	this.defaultSettings = {
		selector : "",
		value: 0,
		fabricCanvas: undefined,
		activeTool : undefined,
		drawingLineWidth : 2,
		thickness : 2,
		textStetting: {familty:'Arial',size:16},
		lineType : 'solid',
		spellcheck: false,
		showEditToolbar : true,
		width : window.innerWidth-100,
		height : 548,
	}
	this._UndoManager = undefined;
	$.extend( this.defaultSettings, settings );
	this.element = $(this.defaultSettings.selector);
	$(this.defaultSettings.selector).data("LumenCanvas", this);
	this.InitCanvas();
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

/**
 * Add a shap to the canvas.
 * @param {shape} fabric js shap.
 * @param {fjcanvas} fabricjs instance.
 */
LumenCanvas.prototype.AddShape = function(shape, fjcanvas){
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
	
	fjcanvas.getObjects().forEach(function(entry) {
		entry.set({
			selectable: false,
			hasBorders: false,
			hasControls: false,
			//editable: false,
		});
	});
}
/**
 * Close plygon active object.
 * @param {$this} a refrance to LumenCanvas 'this'.
 */
LumenCanvas.prototype.ClosePolygon = function ($this) {
	if ($this.defaultSettings.mode === 'edit' ){//|| mode === 'add') {
		$this.defaultSettings.mode = 'add';
		var points = currentShape.get('points');
		points.pop();
		$this.defaultSettings.fabricCanvas.remove(currentShape);
		currentShape = new fabric.Polygon(points, {
			opacity: 1,
			selectable: false,
			hasBorders: true,
			fill: $this.element.find("#fillPicker").spectrum('get').toHexString(),
			stroke: $this.element.find("#strokePicker").spectrum('get').toHexString(),
			strokeWidth: $this.defaultSettings.thickness,
		});
		//$this.defaultSettings.fabricCanvas.add(currentShape);
		$this.AddShape(currentShape, $this.defaultSettings.fabricCanvas);
		
	} else {
		$this.defaultSettings.mode = 'add';
	}
	currentShape = null;
}
/**
 * Inisialize a new instance of LumenCanvas.
 */
LumenCanvas.prototype.InitCanvas = function() {
	var $this = this;
	//var progress = $this.defaultSettings.value + "%";
	$this.element.addClass("lumen-canvas");//.text( progress );
	//add the main canvas
	var defaultHtml = '<div class="lumen-drawing with-gui" style="background-color: transparent;">\
		<div id="canvas_container">\
			<canvas id="canvas">\
				You have a very old browser... (It does not support HTML5 canvas)\
			</canvas>\
		</div>\
	</div>';
	$this.element.append(defaultHtml);
	$this.defaultSettings.fabricCanvas = new fabric.Canvas($this.element.find("canvas")[0] , {  hoverCursor: 'pointer', selection: false, backgroundColor : "#fff" });
	$this.defaultSettings.fabricCanvas.setHeight($this.defaultSettings.height);
	$this.defaultSettings.fabricCanvas.setWidth($this.defaultSettings.width);
	$this.defaultSettings.mode = "add";
	var currentShape;
	fabric.util.addListener(window,"dblclick", function (e) { 
		
		$this.ClosePolygon($this);
	});
	fabric.util.addListener(window, 'keyup', function (e) {
		if (e.keyCode === 27) {
			var $this = GetLumenCanvasInstance(e.target);
			$this.ClosePolygon($this);
		}
	});
	$this._InitToolbar();
	$this._InitColorPickers();
	$this._OnObjectAdded($this);
	$this._OnObjectSelected($this);
	$this._OnCanvasMouseDown($this);
	$this._OnCanvasMouseMove($this);
	$this._OnCanvasMouseUp($this);
}
/**
 * Inisialize on object added event listner.
 */
LumenCanvas.prototype._OnObjectAdded = function($this) {
	$this.defaultSettings.fabricCanvas.on('object:added',function (){
		var $this = GetLumenCanvasInstance(this.upperCanvasEl);
		var objects = $this.defaultSettings.fabricCanvas.getObjects();
		if(objects[objects.length-1].type == 'path' || objects[objects.length-1].type == 'group'){
			var shape = objects[objects.length-1];
			shape.set('selectable', false);
			$this.UndoManager().add({
				undo: function() {
					$this.defaultSettings.fabricCanvas.remove(shape);
					
				},
				redo: function() {
					$this.defaultSettings.fabricCanvas.add(shape);
				}
			});
		}
	});
	$this.defaultSettings.fabricCanvas.on('object:added', function(){
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
	$this.defaultSettings.fabricCanvas.on('object:selected', function(){
		var $this = GetLumenCanvasInstance(this.upperCanvasEl);
		var obj = $this.defaultSettings.fabricCanvas.getActiveObject();
		if(obj != undefined && !obj.get("selectable")){
			return;
		}
		if(obj != undefined && obj.type == "i-text"){
			$this.ShowTextToolbar();
			$this.element.find('.lumen-text-content').val(obj.getText());
			$this.element.find('.lumen-text-toolbar #font-size').val(obj.get('fontSize'));
			$this.element.find('.lumen-text-toolbar #font-family').val(obj.get('fontFamily'));
			$this.ShowEditToolbar();
		}else{
			$this.HideTextToolbar();
			$this.ShowEditToolbar();
		}
		if(obj != undefined){
			$this.element.find("#fillPicker").spectrum("set",obj.getFill());
			$this.element.find("#strokePicker").spectrum("set",obj.getStroke());
		}
	});
	
}
/**
 * Inisialize on mouse down event listner.
 */
LumenCanvas.prototype._OnCanvasMouseDown = function($this) {
	$this.defaultSettings.fabricCanvas.on('mouse:down', function(o){
		var $this = GetLumenCanvasInstance(this.upperCanvasEl);
		if(this.isDrawingMode || typeof $this.defaultSettings.activeTool == 'undefined'){
			return;
		}
		//if user entered text and then click on somthing else enable placing text for next time
		if($this.defaultSettings.activeTool.name != 'text'){
			$this.defaultSettings.deselectText = true;
		}
		if($this.defaultSettings.activeTool.name == 'eyedrop' && $this.defaultSettings.activeTool.isActive){
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
		} else if($this.defaultSettings.activeTool.name == 'text' && $this.defaultSettings.activeTool.isActive){
			var obj = $this.defaultSettings.fabricCanvas.getActiveObject();
			if($(".insert-text-container").length <= 0 && obj == undefined){
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
		} else if($this.defaultSettings.activeTool.name == 'line' && $this.defaultSettings.activeTool.isActive){
			this.selection = false;
			this.isDown = true; 
			var pointer = this.getPointer(o.e);
			var points = [ pointer.x, pointer.y, pointer.x, pointer.y ];
			var lineOptions = {
				strokeWidth: $this.defaultSettings.thickness,
				fill: $this.element.find("#fillPicker").spectrum('get').toHexString(),
				stroke: $this.element.find("#strokePicker").spectrum('get').toHexString(),
				originX: 'center',
				originY: 'center',
			};
			if($this.defaultSettings.lineType == "dashed"){
				var thickness = [[10,5],[10,5], [12,6], [14,7], [18,7], [22,7], [25,7]];
				lineOptions.strokeDashArray = thickness[$this.defaultSettings.thickness];
				
			}
			if($this.defaultSettings.lineType == "arrow"){
				line = new fabric.Line(points, {
					strokeWidth: $this.defaultSettings.thickness,
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
				  width: Math.max($this.defaultSettings.thickness*4, 8),
				  height: Math.max($this.defaultSettings.thickness*4, 8),
				  fill: $this.element.find("#strokePicker").spectrum('get').toHexString()
				});
				this.add(line, triangle);
			} else{
				line = new fabric.Line(points, lineOptions);
				this.add(line);
			}
			line.selectable = true;
			points = [line.x1,line.y1,line.x1,line.y2];
		} else if($this.defaultSettings.activeTool.name == 'circle' && $this.defaultSettings.activeTool.isActive){
			this.selection = false;
			this.isDown = true;
			var pointer = this.getPointer(o.e);
			origX = pointer.x;
			origY = pointer.y;
			circle = new fabric.Ellipse({
				left: pointer.x,
				top: pointer.y,
				//radius: 1,
				strokeWidth: $this.defaultSettings.thickness,
				fill: $this.element.find("#fillPicker").spectrum('get').toHexString(),
				stroke: $this.element.find("#strokePicker").spectrum('get').toHexString(),
				selectable: false,
				originX: 'left',
				originY: 'top',
			});
			this.add(circle);
		} else if($this.defaultSettings.activeTool.name == 'rect' && $this.defaultSettings.activeTool.isActive){
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
					strokeWidth: $this.defaultSettings.thickness,
					transparentCorners: false
				});
				this.add($this.rect);
		} else if($this.defaultSettings.activeTool.name == 'polygon' && $this.defaultSettings.activeTool.isActive){
			
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
					strokeWidth: $this.defaultSettings.thickness,
				});
				currentShape = polygon;
				this.add(currentShape);
				$this.defaultSettings.mode = "edit";
			} else if ($this.defaultSettings.mode === "edit" && currentShape && currentShape.type === "polygon") {
				
				currentShape.points.push({
					x: origX,
					y: origY
				});
				this.renderAll();
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
		var angle = 0,
		  x, y;

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
	$this.defaultSettings.fabricCanvas.on('mouse:move', function(o){
		var $this = GetLumenCanvasInstance(this.upperCanvasEl);
		if(this.isDrawingMode || typeof $this.defaultSettings.activeTool == 'undefined'){
			return;
		}
		if($this.defaultSettings.activeTool.name == 'line' && $this.defaultSettings.activeTool.isActive && typeof line != 'undefined'){
			if (!this.isDown) return;
			var pointer = this.getPointer(o.e);
			
			if($this.defaultSettings.lineType == "arrow"){
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
		}else if($this.defaultSettings.activeTool.name == 'circle' && $this.defaultSettings.activeTool.isActive && typeof circle != 'undefined'){
			if (!this.isDown) return;
			var pointer = this.getPointer(o.e);
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
		} else if($this.defaultSettings.activeTool.name == 'text' && $this.defaultSettings.activeTool.isActive && typeof $this.rect != 'undefined'){
			if (!this.isDown) return;
			var pointer = this.getPointer(o.e);
			if(origX>pointer.x){
				$this.rect.set({ left: (pointer.x) });
			}
			if(origY>pointer.y){
				$this.rect.set({ top: (pointer.y) });
			}
			$this.rect.set({ width: Math.abs(origX - pointer.x) });
			$this.rect.set({ height: Math.abs(origY - pointer.y) });
			this.renderAll();
		} else if($this.defaultSettings.activeTool.name == 'rect' && $this.defaultSettings.activeTool.isActive && typeof $this.rect != 'undefined'){
			if (!this.isDown) return;
			var pointer = this.getPointer(o.e);
			if(origX>pointer.x){
				$this.rect.set({ left: (pointer.x) });
			}
			if(origY>pointer.y){
				$this.rect.set({ top: (pointer.y) });
			}
			$this.rect.set({ width: Math.abs(origX - pointer.x) });
			$this.rect.set({ height: Math.abs(origY - pointer.y) });
			this.renderAll();
		}else if($this.defaultSettings.activeTool.name == 'polygon' && $this.defaultSettings.activeTool.isActive){
			if (!this.isDown) return;
			var pos = this.getPointer(o.e);
			if ($this.defaultSettings.mode === "edit" && currentShape) {
				var points = currentShape.get("points");
				points.pop();
				points.push({
					x: pos.x,
					y: pos.y
				});
				this.remove(currentShape);
				currentShape = new fabric.Polygon(points, {
					originX: 'left',
					originY: 'top',
					opacity: 1,
					selectable: false,
					hasBorders: false,
					hasControls: false,
					fill: $this.element.find("#fillPicker").spectrum('get').toHexString(),
					stroke: $this.element.find("#strokePicker").spectrum('get').toHexString(),
					strokeWidth: $this.defaultSettings.thickness,
				});
				this.add(currentShape);
			}
		}
	});
}
/**
 * Inisialize on mouse up event listner.
 */
LumenCanvas.prototype._OnCanvasMouseUp = function($this) {
	$this.defaultSettings.fabricCanvas.on('mouse:up', function(o){ 
		var $this = GetLumenCanvasInstance(this.upperCanvasEl);
		$drawingCanvas = $(this.upperCanvasEl).closest( ".drawing-canvas" );
		if(this.isDrawingMode || typeof $this.defaultSettings.activeTool == 'undefined'){
			  return;
		}
		if($this.defaultSettings.activeTool.name == 'line' && $this.defaultSettings.activeTool.isActive){
			var points = [ line.get('x1'), line.get('y1'), line.get('x2'), line.get('y2') ];
			var lineOptions = {
				strokeWidth: $this.defaultSettings.thickness,
				fill: $this.element.find("#fillPicker").spectrum('get').toHexString(),
				stroke: $this.element.find("#strokePicker").spectrum('get').toHexString(),
				originX: 'center',
				originY: 'center',
			};
			if($this.defaultSettings.lineType == "dashed"){
				lineOptions.strokeDashArray = line.strokeDashArray;
			}
			var line2 = new fabric.Line(points, lineOptions);
			this.isDown = false;
			if($this.defaultSettings.lineType == "arrow"){
				line2.triangle = triangle;
				line2.set({
					lockScalingX: true,
					lockScalingY: true,
					lockRotation: true,
				});
				/*object:added — fired after object has been added
				object:modified — fired after object is modified (moved, scaled, rotated)
				object:moving — fired continuously during object movement
				object:over — fired when mouse is over object (see example below)
				object:out — fired when mouse is moved away from object (see example below)
				object:removed — fired when object has been removed
				object:rotating — fired continuously during object rotating
				object:scaling — fired continuously during object scaling
				object:selected — fired when object is selected*/
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
			$this.AddShape(line2,this);
		} else if($this.defaultSettings.activeTool.name == 'circle' && $this.defaultSettings.activeTool.isActive){
			circle2 = new fabric.Ellipse({
			  left: circle.get('left'),
			  top: circle.get('top'),
			  rx: circle.get('rx'),
			  ry: circle.get('ry'),
			  strokeWidth: $this.defaultSettings.thickness,
			  fill: $this.element.find("#fillPicker").spectrum('get').toHexString(),
			  stroke: $this.element.find("#strokePicker").spectrum('get').toHexString(),
			  selectable: false,
			  originX: circle.get('originX'), originY: circle.get('originY')
			});
			this.remove(circle);
			this.isDown = false;
			$this.AddShape(circle2,this);
		} else if($this.defaultSettings.activeTool.name == 'text' && $this.defaultSettings.activeTool.isActive){
			var obj = $this.defaultSettings.fabricCanvas.getActiveObject();
			if($(".insert-text-container").length <= 0) {
				if(obj == undefined){
					var leftCoordinate = $this.rect.get('left'),
						topCoordinate = $this.rect.get('top'),
						textWidth = Math.max($this.rect.get('width'), 150),
						textHeight = Math.max($this.rect.get('height'), 40),
						fontSize = $this.defaultSettings.textStetting.size,
						fontFamily = $this.defaultSettings.textStetting.family,
						fontColor = $this.element.find("#fillPicker").spectrum('get').toHexString();
					
					
					$drawingCanvas.find('.canvas-container').append('<div class="insert-text-container" style="top: ' + topCoordinate + 'px;left: ' + leftCoordinate + 'px;"><div class="move-cursor">Click here to drag</div><textarea spellcheck="' + $this.defaultSettings.spellcheck + '" style="width:' + textWidth +'px;height: ' + textHeight + 'px;font-size:' + fontSize + 'px;font-family:' + fontFamily + ';color: ' + fontColor + ';" ></textarea></div>');
					
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
					fbtext = new fabric.IText(textVal,{
						width: $textContainer.width(),
						height: $textContainer.height(),
						left: $textContainer.position().left,
						top: $textContainer.position().top,
						textAlign: 'left',
						fill: $this.element.find("#fillPicker").spectrum('get').toHexString(),
						radius: 50,
						fontSize: $this.defaultSettings.textStetting.size,
						spacing: 20,
						fontFamily: $this.defaultSettings.textStetting.family
					});
					fbtext.selectable = true;
					$this.AddShape(fbtext,this);
					this.renderAll();
					this.setActiveObject(fbtext);
					$textContainer.remove();
				} else {
					var $textContainer = $drawingCanvas.find('.canvas-container .insert-text-container');
					$textContainer.remove();
				}
				
			}
		} else if($this.defaultSettings.activeTool.name == 'rect' && $this.defaultSettings.activeTool.isActive){
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
			  strokeWidth: $this.defaultSettings.thickness,
			  transparentCorners: false
			});
			this.remove($this.rect);
			this.isDown = false;
			$this.AddShape(rect2,this);
		} else if($this.defaultSettings.activeTool.name == 'polygon' && $this.defaultSettings.activeTool.isActive){}
		var count = this.getObjects().length;
		if(count > 0){
			$this.element.find('#clear-canvas').removeClass('disabled');
		}else{
			$this.element.find('#clear-canvas').addClass('disabled');
		}
	});
}
/**
 * Inisialize color pickers.
 */
LumenCanvas.prototype._InitColorPickers = function() {
	$this = this;
	$this.element.find("#fillPicker").spectrum({
		showAlpha: true,
		showButtons: false,
		move: function(color) {
			var $this = GetLumenCanvasInstance($(this));
			var obj = $this.defaultSettings.fabricCanvas.getActiveObject();
			if(obj != undefined) {// && obj.type == "i-text"){
				if(!obj.get("selectable")){
					return;
				}
				obj.set({fill: color.toHexString()});
				$this.defaultSettings.fabricCanvas.renderAll();
			}
			
			var $textarea = $(this).closest( ".drawing-canvas" ).find(".insert-text-container textarea");
			if($textarea.length > 0) $textarea.css("color", color.toHexString());
		},
		change: function(color) {
		}
	});
	$this.element.find("#strokePicker").spectrum({
		showAlpha: true,
		showButtons: false,
		move: function(color) {
			var $this = GetLumenCanvasInstance($(this));
			$this.defaultSettings.fabricCanvas.freeDrawingBrush.color = color.toHexString();
			var obj = $this.defaultSettings.fabricCanvas.getActiveObject();
			if(obj != undefined) {// && obj.type == "i-text"){
				if(!obj.get("selectable")){
					return;
				}
				if(typeof obj.triangle != 'undefined'){
					obj.triangle.set({stroke: color.toHexString(),fill: color.toHexString()});
				}
				obj.set({stroke: color.toHexString()});
			}
			$this.defaultSettings.fabricCanvas.renderAll();
		},
		change: function(color) {
			
		}
	});
	$this.element.find("#bgPicker").spectrum({
		color: "#fff",
		showButtons: false,
		move: function(color) {
			var $this = GetLumenCanvasInstance($(this));
			$this.defaultSettings.fabricCanvas.backgroundColor = color.toHexString(); 
			$this.defaultSettings.fabricCanvas.renderAll();
		}
	});
	$this.element.find('#zoomIn').click(function(){
		var $this = GetLumenCanvasInstance($(this));
		$this.defaultSettings.fabricCanvas.setZoom($this.defaultSettings.fabricCanvas.getZoom() * 1.1 ) ;
	});
	
	$this.element.find('#zoomOut').click(function(){
		var $this = GetLumenCanvasInstance($(this));
		$this.defaultSettings.fabricCanvas.setZoom($this.defaultSettings.fabricCanvas.getZoom() / 1.1 ) ;
	}) ;
	
	$this.element.find('.lumen-undo').click(function(){
		var $this = GetLumenCanvasInstance($(this));
		$this.UndoManager().undo();
	}) ;
	$this.element.find('.lumen-redo').click(function(){
		var $this = GetLumenCanvasInstance($(this));
		$this.UndoManager().redo();
	}) ;
}
/**
 * Show edit toolbar when pan tool is selected.
 */
LumenCanvas.prototype.ShowEditToolbar = function(){
	var $this = this;
	if($this.defaultSettings.showEditToolbar){
		var currentSelectedThickness = $this.defaultSettings.thickness;
		var optionsHtml = '<div class="lumen-edit-toolbar">\
						<div class="lumen-edit-button lumen-send-back" title="Send backwards"><img src="img/back-to-front.png" style=""></div>\
						<div class="lumen-edit-button lumen-bring-front" title="Bring forward"><img src="img/back-to-front.png" style=""></div>\
						<div class="lumen-edit-button lumen-send-back-multi" title="Send back one step"><img src="img/back-to-front.png" style=""></div>\
						<div class="lumen-edit-button lumen-bring-front-multi" title="Bring front one step"><img src="img/back-to-front.png" style=""></div>\
						<div class="lumen-edit-button lumen-trash" title="Delete selected object"><img src="img/trash.png" style=""></div>\
					</div>';
		$this.element.find('.lumen-options > div').append(optionsHtml);
		$this.element.find('.lumen-edit-toolbar .lumen-send-back').click(function() {
			var $this = GetLumenCanvasInstance($(this));
			var obj = $this.defaultSettings.fabricCanvas.getActiveObject();
			if(obj != undefined){// && obj.type == "i-text"){
				
				$this.defaultSettings.fabricCanvas.sendToBack(obj);
				if(typeof obj.triangle != 'undefined'){
					$this.defaultSettings.fabricCanvas.sendToBack(obj.triangle);
				}
				$this.defaultSettings.fabricCanvas.renderAll();
			}
		});
		$this.element.find('.lumen-edit-toolbar .lumen-bring-front').click(function() {
			var $this = GetLumenCanvasInstance($(this));
			var obj = $this.defaultSettings.fabricCanvas.getActiveObject();
			if(obj != undefined){// && obj.type == "i-text"){
				
				$this.defaultSettings.fabricCanvas.bringToFront(obj);
				if(typeof obj.triangle != 'undefined'){
					$this.defaultSettings.fabricCanvas.bringToFront(obj.triangle);
				}
				$this.defaultSettings.fabricCanvas.renderAll();
			}
		});
		$this.element.find('.lumen-edit-toolbar .lumen-send-back-multi').click(function() {
			var $this = GetLumenCanvasInstance($(this));
			var obj = $this.defaultSettings.fabricCanvas.getActiveObject();
			if(obj != undefined){// && obj.type == "i-text"){
				
				$this.defaultSettings.fabricCanvas.sendBackwards(obj);
				if(typeof obj.triangle != 'undefined'){
					$this.defaultSettings.fabricCanvas.sendBackwards(obj.triangle);
				}
				$this.defaultSettings.fabricCanvas.renderAll();
			}
		});
		$this.element.find('.lumen-edit-toolbar .lumen-bring-front-multi').click(function() {
			var $this = GetLumenCanvasInstance($(this));
			var obj = $this.defaultSettings.fabricCanvas.getActiveObject();
			if(obj != undefined){// && obj.type == "i-text"){
				
				$this.defaultSettings.fabricCanvas.bringForward(obj);
				if(typeof obj.triangle != 'undefined'){
					$this.defaultSettings.fabricCanvas.bringForward(obj.triangle);
				}
				$this.defaultSettings.fabricCanvas.renderAll();
			}
		});
		$this.element.find('.lumen-edit-toolbar .lumen-trash').click(function() {
			var $this = GetLumenCanvasInstance($(this));
			var obj = $this.defaultSettings.fabricCanvas.getActiveObject();
			if(obj != undefined){// && obj.type == "i-text"){
				//special case for arrow
				if(typeof obj.triangle != 'undefined'){
					$this.defaultSettings.fabricCanvas.remove(obj.triangle);
				}
				
				$this.defaultSettings.fabricCanvas.remove(obj);
				
			}
		});
	}
	
}	
/**
 * Show text toolbar when text tool is selected.
 */
LumenCanvas.prototype.ShowTextToolbar = function(){
	var $this = this;
	var currentSelectedThickness = $this.defaultSettings.thickness;
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
	
	$this.element.find('.lumen-options > div').html(optionsHtml);
	$this.defaultSettings.textStetting = {
		family : $this.element.find('.lumen-text-toolbar #font-family').val(),
		size : $this.element.find('.lumen-text-toolbar #font-size').val()
	};
	
	$this.element.find('.lumen-text-toolbar #font-family').change(function() {
		var $this = GetLumenCanvasInstance($(this));
		var $textarea = $(this).closest( ".drawing-canvas" ).find(".insert-text-container textarea");
		$textarea.css("font-family", $(this).val());
		$this.defaultSettings.textStetting.family = $(this).val();
		if($textarea.length == 0) {
			var obj = $this.defaultSettings.fabricCanvas.getActiveObject();
			if(obj != undefined && obj.type == "i-text"){
				obj.set({fontFamily : $(this).val()});
				$this.defaultSettings.fabricCanvas.renderAll();
			}
		}
	});
	$this.element.find('.lumen-text-toolbar #font-size').change(function() {
		var $this = GetLumenCanvasInstance($(this));
		var $textarea = $(this).closest( ".drawing-canvas" ).find(".insert-text-container textarea");
		$textarea.css("font-size", $(this).val() + "px");
		$this.defaultSettings.textStetting.size = $(this).val();
		if($textarea.length == 0) {
			var obj = $this.defaultSettings.fabricCanvas.getActiveObject();
			if(obj != undefined && obj.type == "i-text"){
				obj.set({fontSize : $(this).val()});
				$this.defaultSettings.fabricCanvas.renderAll();
			}
		}
	});
	$this.element.find('.lumen-text-toolbar .lumen-text-content').keyup(function() {
		var $this = GetLumenCanvasInstance($(this));
		var obj = $this.defaultSettings.fabricCanvas.getActiveObject();
		if(obj != undefined && obj.type == "i-text"){
			obj.setText($(this).val());
			$this.defaultSettings.fabricCanvas.renderAll();
		}
	});
}
/**
 * Hide text toolbar when other tool rather than text is selected.
 */
LumenCanvas.prototype.HideTextToolbar = function(){
	var $this = this;
	$this.element.find('.lumen-options > div').html('');
}
/**
 * Hide text toolbar when other tool rather than text is selected.
 */
LumenCanvas.prototype._InitToolbar = function() {
	var $this = this;
	var toolbarHtml = '<div class="lumen-picker">\
				<div class="lumen-picker-contents" >\
					<div id="drawing-mode" class="lumen-pick-tool toolbar-button thin-button " style="background-image:url(img/pencil.png);" title="Pencil" ></div>\
					<div class="lumen-pick-tool toolbar-button thin-button" style="background-image:url(img/polygon.png);" title="Polygon" ></div>\
					<div ng-click="drawShape(\'line\')" class="lumen-pick-tool toolbar-button thin-button" style="background-image:url(img/line.png);" title="Line" ></div>\
					<div ng-click="drawShape(\'rect\')"  class="lumen-pick-tool toolbar-button thin-button" style="background-image:url(img/rectangle.png);" title="Rectangle" ></div>\
					<div ng-click="drawShape(\'circle\')"  class="lumen-pick-tool toolbar-button thin-button" style="background-image:url(img/ellipse.png);" title="Ellipse" ></div>\
					<div ng-click="drawShape(\'text\')" class="lumen-pick-tool toolbar-button thin-button" style="background-image:url(img/text.png);" title="Text" ></div>\
					<div ng-click="drawShape(\'pan\')" class="lumen-pick-tool toolbar-button thin-button" style="background-image:url(img/pan.png);" title="Pan" ></div>\
					<div ng-click="drawShape(\'eyedrop\')"  id="eyedrop" class="lumen-pick-tool toolbar-button thin-button" style="background-image:url(img/eyedropper.png);" title="Eyedropper" ></div>\
					<div style="position:static;bottom:0;left:0;right:0;" >\
						<div class="lumen-undo-redo" ><div class="lumen-undo toolbar-button thin-button disabled" title="Undo" style="background-image:url(img/undo.png);" ></div><div class="lumen-redo toolbar-button thin-button disabled" title="Redo" style="background-image:url(img/redo.png);" ></div></div>\
						<div class="lumen-zoom" >\
							<div id="zoomOut" class="lumen-zoom-out toolbar-button thin-button" title="Zoom out" style="background-image:url(img/zoom-out.png);" ></div>\
							<div id="zoomIn" class="lumen-zoom-in toolbar-button thin-button" title="Zoom in" style="background-image:url(img/zoom-in.png);" ></div>\
						</div>\
						<div id="clear-canvas" class="lc-clear toolbar-button fat-button disabled" >Clear</div>\
						<div class="lumen-color-pickers" >\
						<div title="Border Color" class="color-well" style="float:left;text-align:center;" >\
							<label >border</label><br >\
							<div class=""  >\
								<input id="strokePicker" class="lumen-color-picker-input" type="text"  />\
							</div>\
						</div>\
						<div title="Fill & Text Color"  class="color-well" style="float:left;text-align:center;" >\
							<label >fill / Text</label>\
							<br >\
							<div class=""  >\
								<input id="fillPicker" class="lumen-color-picker-input" type="text"  />\
							</div>\
						</div>\
						<div title="Background Color" class="color-well" style="float:left;text-align:center;" >\
							<label >bg</label>\
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
							<div >\
							</div>\
						</div>';
	$this.element.append(toolbarHtml);
	$this.element.find('[title="Text"]').click(function() {
		var $this = GetLumenCanvasInstance($(this));
		$this.defaultSettings.deselectText = true;
		shapeName = "text";
		$this._DisableAllObjectsSelection ();
		$this._SetActiveTool(shapeName);
		$(this).addClass('selected');
		//$this._HideFreeDrawingToolbar();
		$this.ShowTextToolbar();
		$this.defaultSettings.fabricCanvas.isDrawingMode = false;
	});
	//line drawing
	$this.element.find('[title="Line"]').click(function() {
		var $this = GetLumenCanvasInstance($(this));
		shapeName = "line";
		$this._DisableAllObjectsSelection ();
		$this._SetActiveTool(shapeName);
		$(this).addClass('selected');
		$this._ShowThicknessToolbar();
		$this.defaultSettings.fabricCanvas.isDrawingMode = false;
	});
	//Ellipse drawing
	$this.element.find('[title="Ellipse"]').click(function() {
		var $this = GetLumenCanvasInstance($(this));
		shapeName = "circle";
		$this._DisableAllObjectsSelection ();
		$this._SetActiveTool(shapeName);
		$(this).addClass('selected');
		$this._ShowThicknessToolbar();
		$this.defaultSettings.fabricCanvas.isDrawingMode = false;
	});
	//Rectangle drawing
	$this.element.find('[title="Rectangle"]').click(function() {
		var $this = GetLumenCanvasInstance($(this));
		shapeName = "rect";
		$this._DisableAllObjectsSelection ();
		$this._SetActiveTool(shapeName);
		$(this).addClass('selected');
		$this._ShowThicknessToolbar();
		$this.defaultSettings.fabricCanvas.isDrawingMode = false;
		
	});
	
	//Polygon drawing
	$this.element.find('[title="Polygon"]').click(function() {
		var $this = GetLumenCanvasInstance($(this));
		shapeName = "polygon";
		$this._DisableAllObjectsSelection ();
		$this._SetActiveTool(shapeName);
		$(this).addClass('selected');
		$this._ShowThicknessToolbar();
		$this.defaultSettings.fabricCanvas.isDrawingMode = false;
		
	});
	
	$this.element.find('[title="Eyedropper"]').click(function() {
		var $this = GetLumenCanvasInstance($(this));
		shapeName = "eyedrop";
		$this._DisableAllObjectsSelection ();
		$this._SetActiveTool(shapeName);
		$(this).addClass('selected');
		$this._HideFreeDrawingToolbar();
		$this.defaultSettings.fabricCanvas.isDrawingMode = false;
		
	});
	
	//clear drawing
	$this.element.find('#clear-canvas').click(function() {
		var $this = GetLumenCanvasInstance($(this));
		$this.ClearAll($(this));
		
	});
	//Pan moving tool
	$this.element.find('[title="Pan"]').click(function() {
		var $this = GetLumenCanvasInstance($(this));
		shapeName = "pan";
		$this._SetActiveTool(shapeName);
		$(this).addClass('selected');
		$this.defaultSettings.fabricCanvas.selection = true;
		$this.defaultSettings.fabricCanvas.getObjects().forEach(function(entry) {
			entry.set({
				selectable: true,
				hasBorders: true,
				hasControls: true,
			});
		});
		$this._HideFreeDrawingToolbar();
		$this.defaultSettings.fabricCanvas.isDrawingMode = false;
	});
	//free drawing tool
	$this.element.find('#drawing-mode').click(function() {
		var $this = GetLumenCanvasInstance($(this));
		$this._DisableAllObjectsSelection ();
		$this._SetActiveTool('free_drawing');
		$this._EnableFreeHandDrawing();
		$(this).addClass('selected');
	});
}
/**
 * Hide pencil toolbar when other tool rather than pencil is selected.
 */
LumenCanvas.prototype._HideFreeDrawingToolbar = function(){
	this.element.find('.lumen-options > div').html('');
}

/**
 * Clear drawing area but keep the background color.
 */
LumenCanvas.prototype.ClearAll = function($clearButton) {
	var $this = this;
	if(confirm("Are you sure you would like to clear?")){
		$this.defaultSettings.fabricCanvas._activeObject = null;
		$this.defaultSettings.fabricCanvas.clear();
		$clearButton.addClass('disabled');
	}
}
/**
 * Returns a json object that represents the drawing area.
 */
LumenCanvas.prototype.GetJSON = function(){
	return $this.defaultSettings.fabricCanvas.toObject();
}
/**
 * Returns stringified json object that represents the drawing area.
 */
LumenCanvas.prototype.GetDataString = function(){
	return JSON.stringify($this.defaultSettings.fabricCanvas.toObject());
}
/**
 * Returns an SVG object that represents the drawing area.
 */
LumenCanvas.prototype.GetSVG = function(){
	return $this.defaultSettings.fabricCanvas.toSVG();
}
/**
 *  Set the drawing area to the passed object.
 * @param {json} fabric js JSON object.
 */
LumenCanvas.prototype.SetJSON = function(json){
	$this.defaultSettings.fabricCanvas.loadFromJSON(json);
	$this.defaultSettings.fabricCanvas.renderAll();
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
	var dataURL = $this.defaultSettings.fabricCanvas.toDataURL(defaultOptions );
	if(defaultOptions.openInNewTab) window.open(dataURL);
	else return dataURL;
}
/**
 *  Set zoom value for the drawing area.
 * @param {$this} a refrance to LumenCanvas instance.
 * @param {val} zoom value. One is the default value.
 */
LumenCanvas.prototype.SetZoom = function($this, val){
	$this.defaultSettings.fabricCanvas.setZoom(val);
}
/**
 *  Disable all selected objects.
 */
LumenCanvas.prototype._DisableAllObjectsSelection = function(){
	var $this = this;
	$this.defaultSettings.fabricCanvas.deactivateAll().renderAll();
	$this.defaultSettings.fabricCanvas.getObjects().forEach(function(entry) {
		entry.set('selectable', false);
	});
}
/**
 *  Set active tool.
 * @param {toolName} a string that has one of this values (line, circle, rect, eyedrop, text, pan, polygon, free_drawing).
 */
LumenCanvas.prototype._SetActiveTool = function(toolName){
	var $this = this;
	var thisCanvas = $this.defaultSettings.fabricCanvas;
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
				fontSize: $this.defaultSettings.textStetting.size,
				spacing: 20,
				fontFamily: $this.defaultSettings.textStetting.family
			});
			fbtext.selectable = true;
			$this.AddShape(fbtext,thisCanvas);
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
	];	
	for(i=0; i< tools.length;i++){
		if(tools[i].name == toolName){
			
			tools[i].isActive = true;
			$this.defaultSettings.activeTool = tools[i];
		}else{
			tools[i].isActive = false;
		}
	}
}
/**
 *  Show thickness with arrows when line is selected or show border toolbar when rect,circle or polygon is selected.
 */
LumenCanvas.prototype._ShowThicknessToolbar = function(){
	var $this = this;
	var currentSelectedThickness = $this.defaultSettings.thickness;
	var currentLineType = $this.defaultSettings.lineType == undefined? 'solid': $this.defaultSettings.lineType;
	
	var optionsHtml = '<div class="lumen-thickness-toolbar" >';
	
	if($this.element.find('[title="Line"]').hasClass("selected")){
		optionsHtml += '<div >\
						<div class="square-toolbar-button lumen-line-type ' + (currentLineType=='solid'?'selected':'')+ '" style="float:left;margin:1px;" data-type="solid"><img src="img/line.png"></div>\
						<div class="square-toolbar-button lumen-line-type ' + (currentLineType=='dashed'?'selected':'')+ '" style="float:left;margin:1px;" data-type="dashed"><img src="img/dashed-line.png"></div>\
						<div class="square-toolbar-button lumen-line-type ' + (currentLineType=='arrow'?'selected':'')+ '" style="float:left;margin:1px;" data-type="arrow"><img src="img/line-with-arrow.png"></div>\
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
	
	$this.element.find('.lumen-options > div').html(optionsHtml);
	$this.defaultSettings.thickness = this.element.find('.lumen-thickness-toolbar .square-toolbar-button.lumen-thickness.selected').data('radius');
	
	$this.element.find('.lumen-thickness-toolbar').on('click','.square-toolbar-button.lumen-thickness',function() {
		var $this = GetLumenCanvasInstance($(this));
		$('.square-toolbar-button.lumen-thickness.selected').removeClass('selected');
		$(this).addClass('selected');
		$this.defaultSettings.thickness = $(this).data('radius');
	});
	
	$this.element.find('.lumen-thickness-toolbar').on('click','.square-toolbar-button.lumen-line-type',function() {
		var $this = GetLumenCanvasInstance($(this));
		$('.square-toolbar-button.lumen-line-type.selected').removeClass('selected');
		$(this).addClass('selected');
		$this.defaultSettings.lineType = $(this).data('type');
	});
	
}

/**
 *  Enable pan tool and initialize the patterens.
 */
LumenCanvas.prototype._EnableFreeHandDrawing = function(){
	var $this = this;
	var thisCanvas = $this.defaultSettings.fabricCanvas;
	$this._ShowFreeDrawingToolbar();
	thisCanvas.isDrawingMode = true;
	thisCanvas.freeDrawingBrush.width = parseInt($this.element.find('#drawing-line-width').val(), 10) || 1;
}
/**
 *  Show free hand drawing when pencil is selected.
 */
LumenCanvas.prototype._ShowFreeDrawingToolbar = function(){
	var $this = this;
	var optionsHtml = '<label for="drawing-line-width">Mode :\
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
							<label for="drawing-line-width">Line width : <input type="range" value="30" min="1" max="90" id="drawing-line-width" style="position: relative;top: 7px;"> &nbsp;&nbsp;<span class="info">30</span></label>';
	$this.element.find('.lumen-options > div').html(optionsHtml);
	
	
	$this.element.find('#drawing-mode-selector').change(function() {
		var $this = GetLumenCanvasInstance($(this));
		var thisCanvas = $this.defaultSettings.fabricCanvas;
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
		var thisCanvas = $this.defaultSettings.fabricCanvas;
		$(this).parent().find('.info').text($(this).val());
		thisCanvas.freeDrawingBrush.width = parseInt($(this).val(), 10) || 1;
	});
}
	
