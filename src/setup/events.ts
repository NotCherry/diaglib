import Graph from "../Graph";
import Connection from "../util/connection";
import { isPointingTo } from "../util/utility";
import { destoryResizeEvent, resizeEvent } from "./graph";

function pointer (event)  {
  Graph.cursorAt = isPointingTo();
}

export function setupEvents (WsApiURL: string = "", max_tokens = 0, temperature = 0.7) {
  addEventListener("resize", resizeEvent);
  Graph.canvas.addEventListener("contextmenu",pointer);
  if (WsApiURL != undefined && WsApiURL != "")
      new Connection(WsApiURL, max_tokens, temperature)
};

export function destructEvents() {
  Graph.canvas.removeEventListener("contextmenu",pointer);
  destoryResizeEvent()
}
