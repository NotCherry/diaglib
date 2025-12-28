import setupDrag from "./drag";
import setupGraph, { resizeCanvas } from "./graph";
import setupNodeTypes from "./nodeTypes";
import { setupEvents } from "./events";
import Graph from "../Graph";
import { clearScreen } from "../ui/actions";

export function setup(
  WsApiURL: string = "",
  widgetRootElementId: string = "WebuiRoot",
  graph_config?: string,
) {
  setupNodeTypes();
  setupGraph();
  setupDrag();
  setupEvents(WsApiURL);
  Graph.widgetRootElementId = widgetRootElementId;
  Graph.loadGraph(graph_config);
  resizeCanvas();
  Graph.render();
}

export function destroy() {
  Graph.reset();
  clearScreen();
  Graph.clearRegisterNodes();
}
