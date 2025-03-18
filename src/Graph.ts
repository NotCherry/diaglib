import GraphNode from "./Node";
import GraphNodeIO from "./IO";
import Widget from "./widgets/Widget";
import { GUIElement, Point } from "./types";
import { drawIOLineTo } from "./util/utility";
import { v4 as uuidv4 } from "uuid";
import setup_test from "./setup/test";
import Log from "./util/log";

import drag_setup, { dragEventsReset } from "./setup/drag";
import { destructEvents, setupEvents } from "./setup/events";
import { TextArea } from "./widgets/TextInput";

export function setViewportSize(width: number, height: number) {
  Graph.viewportWidth = width;
  Graph.viewportHeight = height;
}

export class Graph {
  static id: string = uuidv4();
  static graph_name: string = "Graph";
  static nodes: GraphNode[] = [];
  static canvas: HTMLCanvasElement;
  static ctx: CanvasRenderingContext2D;
  static widgetRootElementId: string;

  // where the mouse is with applied transformations
  static cursorPos: Point = { x: 0, y: 0 };
  static connectedIO: GraphNodeIO[] = [];
  static selectedNode?: string = undefined;
  static dragStartingPosOffset: Point = { x: 0, y: 0 };

  static wheelPress: boolean = false;
  static mouseOut: boolean = false;
  static dragOffset: Point = { x: 0, y: 0 };

  static drawLine: boolean = false;
  static LineStart: Point = { x: 0, y: 0 };
  static selectedIO?: string = undefined;
  static stop: boolean;
  static drawIO: boolean = true;
  static eventButton: number = 0;
  static cursorAt: GUIElement = { type: undefined, id: undefined };

  static nodeMap: Map<string, GraphNode> = new Map();
  static IOMap: Map<string, GraphNodeIO> = new Map();
  static widgetMap: Map<string, Widget> = new Map();

  static viewportWidth: number = 0;
  static viewportHeight: number = 0;

  static widgetXOffset: number = 0;
  static widgetYOffset: number = 0;

  static transforms: DOMMatrix;
  static scale: number = 0;
  static mouse: Point = { x: 0, y: 0 };

  static logs: Log;
  static registeredNodes: any[] = [];

  static mouseBtn: number | undefined = undefined;

  static generatingContent: boolean = false;
  static returnFunction: Function = undefined;
  static executionErrors: Error[] = [];

  constructor(canvas: HTMLCanvasElement) {
    Graph.canvas = canvas;
    Graph.ctx = canvas.getContext("2d")!;
    Graph.widgetXOffset = Graph.viewportWidth - Graph.canvas.width;
    Graph.widgetYOffset = Graph.viewportHeight - Graph.canvas.height;
    Graph.transforms = Graph.ctx.getTransform();
    Graph.scale = Graph.transforms.a;
    Graph.logs = new Log();
  }

  static reset() {
    Graph.nodeMap = new Map();
    Graph.IOMap = new Map();
    Graph.widgetMap = new Map();
    Graph.nodes.map((n) => n.reset());
    Graph.nodes = [];
    Graph.connectedIO = [];
    dragEventsReset();
    destructEvents();
  }

  static switchHTMLElements() {
    Graph.widgetMap.forEach((widget) => {
      if (Graph.selectedNode == undefined && Graph.eventButton != 0) {
        widget.element.style.display =
          widget.element.style.display == "none" ? "block" : "none";
      }
      this.htmlPointerNone(widget.element)
    });
  }

  static htmlPointerNone(element: HTMLElement) {
    element.style.pointerEvents = element.style.pointerEvents == "none" ? "auto" : "none";
  }

  static render() {
    Graph.ctx.save();
    Graph.ctx.setTransform(1, 0, 0, 1, 0, 0);
    Graph.ctx.clearRect(0, 0, Graph.canvas.width, Graph.canvas.height);
    Graph.ctx.fillStyle = "#111";
    Graph.ctx.fillRect(0, 0, Graph.canvas.width, Graph.canvas.height);
    Graph.ctx.restore();

    Graph.transforms = Graph.ctx.getTransform();
    Graph.scale = Graph.transforms.a;

    Graph.nodes.forEach((node) => {
      node.io.forEach((io) => {
        if (io.pointingTo != undefined) {
          Graph.connectedIO.push(io);
        }
      });
    });

    if (Graph.drawIO) {
      Graph.connectedIO.forEach((io) => {
        io.pointingTo?.forEach((dstNode) => {
          drawIOLineTo(Graph.ctx, io.pos, Graph.IOMap.get(dstNode)!.pos);
        });
      });
    }

    // draf line from current io grabbed
    if (Graph.drawLine) {
      drawIOLineTo(Graph.ctx, Graph.LineStart, Graph.cursorPos);
    }
    // to place line under the nodes
    Graph.nodes.forEach((node) => {
      node.render(Graph.ctx);
    });
    
    Graph.connectedIO = [];
  }

  static registerNode(title: string, node: any) {
    Graph.registeredNodes.push({ title, node });
  }

  static clearRegisterNodes() {
    Graph.registeredNodes = []
  }

  static addNode(node: GraphNode) {
    Graph.nodes.push(node);
    Graph.nodeMap.set(node.id, node);
    Graph.nodeMap.get(node.id)!.widgets.forEach((widget) => {
      widget.setup();
    });
    Graph.render();
  }

  static removeNode(node: GraphNode) {
    node.removeAllWidgets();
    node.io.forEach((io) => {
      if (io.type === "input" && io.pointedBy != undefined) {
        let srcIO = Graph.IOMap.get(io.pointedBy)!;
        srcIO.pointingTo = srcIO.pointingTo.filter((id) => id != io.id);
      } else {
        if (io.pointingTo != undefined) {
          io.pointingTo.forEach((id) => {
            let dstIO = Graph.IOMap.get(id)!;
            dstIO.pointedBy = undefined;
          });
        }
      }
    });
    Graph.nodes = Graph.nodes.filter((n) => n !== node);
    Graph.nodeMap.delete(node.id);
  }

  static serializeNodes() {
    return this.nodes.map((node) => node.serialize());
  }

  static saveGraph() {
    let diagram = {
      id: Graph.id,
      graph_name: Graph.name,
      nodes: Graph.nodes.map((node) => node.save()),
    };

    return diagram;
  }
  
  static loadGraph(config: string) {
    Graph.reset();
    drag_setup();
    setupEvents();

    if (config === "" || config == undefined) {
      setup_test();
      return;
    }

    let spec = JSON.parse(config);
    
    Graph.id = spec.id;
    Graph.graph_name = spec.graph_name;
  
    Graph.drawIO = false;
  
    spec.nodes.forEach((node: any) => {
      let { id, title, type, size, pos, data } = node;
      let n = new GraphNode({
        id,
        title,
        type,
        size,
        pos,
        data,
        owner: Graph,
      });
      node.io.map((io: any) => {
        let args = {
          id: io.id,
          name: io.name,
          type: io.type,
          pos: io.pos,
          pointingTo: io.pointingTo,
          pointedBy: io.pointedBy,
        };
        n.addIO(args);
      });
  
      node.widgets.map((widget: any) => {
        let args = {
          id: widget.id,
          type: widget.type,
          owner: widget.owner,
        };
        n.addWidget(new TextArea(args));
      });
      Graph.addNode(n);
    });
  
    Graph.drawIO = true;
    Graph.render();
  }

  static setReturnFunc(f: Function) {
    Graph.returnFunction = f
  }
  static returnLastContent(text: string) {
    Graph.returnFunction(text)
  }
}

export default Graph;
