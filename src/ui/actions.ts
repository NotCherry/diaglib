import Graph from "../Graph";
import GraphNode from "../Node";
import Connection from "../util/connection";

export function addNode(type: string) {
  let nodeClass = Graph.registeredNodes.find((n) => n.title == type);

  if (nodeClass == undefined) {
    Graph.logs.addMessage({ type: "error", body: "Node not found" });
    return;
  }

  Graph.addNode(
    new nodeClass({ owner: Graph, title: type, pos: Graph.cursorPos })
  );

  Graph.render();
}

export function deleteNode() {
  if (Graph.cursorAt.type != "node") {
    Graph.logs.addMessage({ type: "info", body: "Node not selected" });
    return;
  }

  Graph.removeNode(Graph.nodeMap.get(Graph.cursorAt.id));
  Graph.render();
}

export function addIOToNode() {
  let node = Graph.nodeMap.get(Graph.cursorAt.id!);
  node.addIO({ name: (node.ioInputLength + 1).toString(), type: "input" });
  Graph.render();
}

export function removeIOFromNode() {
  let io = Graph.IOMap.get(Graph.cursorAt.id!);
  if (io.pointedBy != undefined || io.pointedBy == "") {
    let IOPointingToIO = Graph.IOMap.get(io.pointedBy);
    IOPointingToIO.pointingTo = IOPointingToIO.pointingTo.filter(item => item != io.id);
  }
  let node = Graph.nodeMap.get(io.owner);
  node.removeIO(io);
  Graph.render();
}

export function resizeNode(node: GraphNode, width: number, height: number) {
  node.size = [width, height];
  Graph.render();
}

export function callRun(type: string, id: number) {
  Graph.generatingContent = true;
  let msg = { type, data: Graph.serializeNodes(), diagram_id: id, config: JSON.stringify(Graph.saveGraph()) };
  Connection.send(JSON.stringify(msg));
}

export function callSave() {
  return Graph.saveGraph();
}

export function callLoad(graph?: string) {
  graph = graph || "";
  Graph.loadGraph(graph);
}

export function clearScreen() {
  Graph.widgetMap.forEach((widget) => {
    widget.remove();
  })
}

export function updateTemp(val) {
  Connection.temperature = val;
}

export function updateMaxTokens(val) {
  Connection.maxTokens= val;
}

