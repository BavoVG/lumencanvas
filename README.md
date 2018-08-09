# LumenCanvas
LumenCanvas is an open source HTML5 drawing tool based on Fabric.js & JQuery. You can use it to embed drawing boards in web pages. You can save the drawings as a string or JSON and you can retrive it again. LumenCanvas is an object based drawing tool. You can move the drawn objects around and change the border of the filling color.

### Preview
![LumenCanvas Preview](http://lumencanvas.com/img/lumincanvas_preview.png)


### Online Demo Link
[Click Here...](http://lumencanvas.com/)


### Example
```js
  new LumenCanvas({selector : ".drawing-canvas"})
```

### How to call a method
```js
  var LumenCanvasInstance = $(".drawing-canvas").data("LumenCanvas");
  var jsonData = LumenCanvasInstance.GetJSON();
```

### Options
Here's a list of available settings.
```js
new LumenCanvas({
    	selector : "",
	spellcheck: false, // enable/disable spellcheck when adding text object
	showEditToolbar : true,// it will show bring/send object backward/forward
	width : window.innerWidth-100,
	height : 548,
	defaultBackgroundColor : "#fff",
	defaultFillColor : "#797777",
	defaultBorderColor : "#000",
	defaultActiveTool: "Pencil",// other values : Polygon Line Rectangle Ellipse Text Pan
	defaultPencilThickness: 6,// integer value from 1 to 30
	clearAllOverwrite: undefined, /// this to overrite the clear method with a custom message.
})
```

### GetJSON
 Returns a json object that represents the drawing area.
 
### GetDataString
 Returns stringified json object that represents the drawing area.
 
 ### SetJSON(json) @param {json} fabric js JSON object.
 Set the drawing area to the passed object.

 ### GetDataURL(options) @param {options} see below defaultOptions object.
 Open the drawing in a new tab or return the URL string.
 ```js
 options = {
	format: 'png',
	left: 0,
	top: 0,
	width: 500,
	height: 350,
	openInNewTab : false
}
```
 
 
