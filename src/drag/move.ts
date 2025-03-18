import Graph from "../Graph";
import { getTransformedPoint } from "../util/utility";

// Event handlers
function handleWheel(event) {
  event.preventDefault();
  
  const zoomfactor = event.deltaY < 0 ? 1.1 : 0.9;

  Graph.ctx.translate(Graph.cursorPos.x, Graph.cursorPos.y);
  Graph.ctx.scale(zoomfactor, zoomfactor);
  Graph.ctx.translate(-Graph.cursorPos.x, -Graph.cursorPos.y);

  Graph.render();
}

function handleMouseEnter(event) {
  Graph.mouseOut = false;
}

function handleMouseOut(event) {
  Graph.mouseOut = true;
  Graph.wheelPress = false;
}

function handleMouseDown(event) {
  if (event.target != Graph.canvas) {
    return;
  }
  Graph.mouseBtn = event.button;

  if (event.button === 1) { // Middle mouse button
    // Graph.switchHTMLElements();
    Graph.widgetMap.forEach((widget) => {Graph.htmlPointerNone(widget.element)})

    Graph.wheelPress = true;
    Graph.drawIO = false;
    Graph.eventButton = 1;
    if (event.target === Graph.canvas) {
      Graph.dragOffset = getTransformedPoint(event.clientX, event.clientY);
    }
  } else if (event.button === 0) { // Left mouse button
    Graph.eventButton = 0;
    if (event.target === Graph.canvas) Graph.switchHTMLElements();
  }
}

function handleMouseUp(event) {
  if (event.target != Graph.canvas) {
    return;
  }
  Graph.mouseBtn = undefined;
  
  if (event.button === 1) { // Middle mouse button
    Graph.widgetMap.forEach((widget) => {Graph.htmlPointerNone(widget.element)})
    Graph.wheelPress = false;
    Graph.drawIO = true;
  } else if (event.button === 0 && event.target === Graph.canvas) {
    Graph.switchHTMLElements();
  }

  Graph.eventButton = 0;
}

function handleMouseMove(event) {
  

  if (!Graph.mouseOut) {
    Graph.mouse = {
      x: event.offsetX - Graph.dragOffset.x - Graph.widgetXOffset,
      y: event.offsetY - Graph.dragOffset.y - Graph.widgetYOffset,
    };
  }

  if (event.target === Graph.canvas) {
    Graph.cursorPos = getTransformedPoint(event.offsetX, event.offsetY);
  }

  if (Graph.wheelPress && !Graph.mouseOut) {
    Graph.ctx.translate(
      Graph.cursorPos.x - Graph.dragOffset.x + Graph.widgetXOffset / Graph.scale,
      Graph.cursorPos.y - Graph.dragOffset.y + Graph.widgetYOffset / Graph.scale
    );
    Graph.render();
  }
}

// Functions to add and remove event listeners
function addMoveEvents() {
  Graph.canvas.addEventListener("wheel", handleWheel);
  Graph.canvas.addEventListener("mouseenter", handleMouseEnter);
  Graph.canvas.addEventListener("mouseout", handleMouseOut);
  Graph.canvas.addEventListener("mousedown", handleMouseDown);
  Graph.canvas.addEventListener("mouseup", handleMouseUp);
  Graph.canvas.addEventListener("mousemove", handleMouseMove);

  Graph.render();
}

function removeMoveEvents() {
  Graph.canvas.removeEventListener("wheel", handleWheel);
  Graph.canvas.removeEventListener("mouseenter", handleMouseEnter);
  Graph.canvas.removeEventListener("mouseout", handleMouseOut);
  Graph.canvas.removeEventListener("mousedown", handleMouseDown);
  Graph.canvas.removeEventListener("mouseup", handleMouseUp);
  Graph.canvas.removeEventListener("mousemove", handleMouseMove);
}

// Export the add and remove functions
export { addMoveEvents, removeMoveEvents };

