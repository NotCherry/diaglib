import Graph, { setViewportSize } from "../Graph";

export function resizeCanvas() {
  let canvas = document.querySelector("canvas#canvas") as HTMLCanvasElement;
  if (!canvas) {
    return;
  }
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  let body = document.querySelector("body") as HTMLBodyElement;
  setViewportSize(body.clientWidth, body.clientHeight);

  Graph.widgetXOffset = Graph.viewportWidth - Graph.canvas.width;
  Graph.widgetYOffset = Graph.viewportHeight - Graph.canvas.height;
}

export function resizeEvent(event) {
  resizeCanvas();
  Graph.render();
}

export default () => {
  let canv = document.getElementById("canvas") as HTMLCanvasElement;
  new Graph(canv);
};

export function destoryResizeEvent() {
  removeEventListener("resize", resizeEvent);
}
