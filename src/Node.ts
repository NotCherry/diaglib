import Graph from "./Graph";
import { Point } from "./types";
import { drawCircle } from "./util/utility";
import Widget, { IWidget } from "./widgets/Widget";
import { v4 as uuidv4 } from "uuid";
import GraphNodeIO, { IAddGraphNodeIO } from "./IO";
import { ResponseTextArea } from "./widgets/TextInput";

export interface IGraphNodeOptions {
  color?: string;
}

export interface IGraphNode {
  id?: string;
  title?: string;
  size?: number[];
  pos?: Point;
  type?: string;
  owner: Graph;
  data?: KeyValue;
  options?: IGraphNodeOptions;
}

export type KeyValue = {
  [key: string]: any;
};

function drawRoundedRectangle(ctx, x, y, width, height, radius) {
  if (typeof radius === 'number') {
      radius = { tl: radius, tr: radius, br: radius, bl: radius };
  } else {
      radius = { tl: 0, tr: 0, br: 0, bl: 0, ...radius };
  }

  ctx.beginPath();
  ctx.moveTo(x + radius.tl, y); // Start at top-left corner
  ctx.lineTo(x + width - radius.tr, y); // Top edge
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius.tr); // Top-right corner
  ctx.lineTo(x + width, y + height - radius.br); // Right edge
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius.br, y + height); // Bottom-right corner
  ctx.lineTo(x + radius.bl, y + height); // Bottom edge
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius.bl); // Bottom-left corner
  ctx.lineTo(x, y + radius.tl); // Left edge
  ctx.quadraticCurveTo(x, y, x + radius.tl, y); // Top-left corner
  ctx.closePath();
  ctx.fill();   // Fill
}

class GraphNode {
  id: string;
  title: string;
  type: string;
  size: number[];
  pos: Point;
  color: string;
  io: GraphNodeIO[] = [];
  ioInputLength: number = 0;
  ioOutputLength: number = 0;
  data: KeyValue = {};
  widgets: Widget[] = [];

  // variables for calculating size of node
  ioSpacingY: number = 30;
  ioXSpacing: number = 5;
  elementsYSpacing: number = 50 ; // between io, widgest, etc
  widgetsYSpacing: number = 35;
  elementsXSpacing: number = 15;
  totalWidgetsHeight: number = 0;
  totalIOHeight: number = 0;
  owner: Graph;
  hasResponseWidget: boolean = false;

  element: HTMLSpanElement;
  constructor(args: IGraphNode) {
    this.id = args.id || uuidv4();
    this.title = args.title || "Node";
    this.type = args.type || "default";
    this.size = args.size || [500, 300];
    this.pos = args.pos || { x: Graph.cursorPos.x, y: Graph.cursorPos.y };
    this.color = "#1D232A"
    if (args.options) {
      this.color = "black";
    }
    this.owner = args.owner;
    this.data = args.data || { text: "" };
  }

  removeAllWidgets() {
    this.widgets.map((w) => w.remove());
  }

  serialize() {
    let pointedBy = this.io
      .filter((io) => io.pointedBy)
      .map((io) => io.pointedBy)
      .flat();
    pointedBy = pointedBy.map((id) => Graph.IOMap.get(id!)?.owner);
    let pointingTo = this.io
      .filter((io) => io.pointingTo)
      .map((io) => io.pointingTo)
      .flat();

    this.widgets.map((w) => {
      if (w.validate() !== true) {
        throw new Error("Validation failed");
      } else null;
    });

    pointingTo = pointingTo.map((id) => Graph.IOMap.get(id!)?.owner!);

    let a = {
      id: this.id,
      nodeType: this.type,
      data: this.data,
      pointedBy: pointedBy.length > 0 ? pointedBy : undefined,
      pointingTo: pointingTo.length > 0 ? pointingTo : undefined,
    };

    return a;
  }

  save() {
    return {
      id: this.id,
      title: this.title,
      type: this.type,
      size: this.size,
      pos: this.pos,
      data: this.data,
      // options: this.options != undefined ? this.options
      io: this.io.map((io) => {
        return io.save();
      }),
      widgets: this.widgets.map((w) => w.save()),
    };
  }

  render(ctx: CanvasRenderingContext2D) {
    this.drawNode(ctx);

    if (this.size[0] > 100 && this.size[1] > 50) {
      if (this.io.length > 0) {
        this.drawIO(ctx);
      }
      if (this.widgets.length > 0) {
        this.drawWidgets(ctx);
      }
    }
  }

  drawNode(ctx: CanvasRenderingContext2D) {
    this.updateNodeSize();
    ctx.fillStyle = this.color || "#222";
    // ctx.fillRect(this.pos.x, this.pos.y, this.size[0], this.size[1]);
    drawRoundedRectangle(ctx, this.pos.x, this.pos.y, this.size[0], this.size[1], 20)

    ctx.shadowBlur = 10;
    ctx.shadowBlur = 10;
    ctx.shadowColor = "rgba(0, 0, 0, 0.5)";
    ctx.shadowOffsetX = 5;
    ctx.shadowOffsetY = 5;

    ctx.fillStyle = "#444";
    ctx.fillRect(this.pos.x, this.pos.y + 33, this.size[0], 2);

    ctx.font = "20px monospace";
    ctx.fillStyle = "white";
    ctx.fillText(this.title, this.pos.x + 20, this.pos.y + 25);
  }

  reset() {
    this.widgets.map((w) => w.remove());
  }

  updateData(data: string) {
    this.data['response'] = data;
    
    if (!this.hasResponseWidget) {
      this.hasResponseWidget = true;
      this.addWidget(new ResponseTextArea({type:"respones", owner: this.id, height: 350}as IWidget));
    }

    for (let i = 0; i < this.widgets.length; i++) {
      if (this.widgets[i] instanceof ResponseTextArea) {
        this.widgets[i].update();
        
      }
    }
  }

  updateNodeSize() {
    this.updateIOSize();
    this.updateWidgetsSize();
    let height =
      this.totalIOHeight +
      this.totalWidgetsHeight +
      this.elementsYSpacing -
      (this.io.length > 0 ? this.io[0].radius : 0);
    // this.size[1] = this.size[1] < size ? size : this.size[1];
    this.size[1] = height

    if (this.widgets.length < 1) {
      return
    }

    let width = this.size[0] - 20 
    this.widgets.forEach(element => {
      width = element.width > width ? element.width : width
    });
    this.size[0] = width + 20
  }

  updateIOSize() {
    this.totalIOHeight =
      Math.max(this.ioInputLength, this.ioOutputLength) * this.ioSpacingY;
  }

  updateWidgetsSize() {
    this.totalWidgetsHeight = this.widgets.reduce(
      (acc, widget) => acc + widget.height,
      0 + this.elementsYSpacing * this.widgets.length
    );
  }

  addIO(args: IAddGraphNodeIO) {
    let io = new GraphNodeIO({
      ...args,
      pos: { x: 0, y: 0 },
      type: args.type,
      owner: this.id,
      radius: args.radius || 10,
    });

    Graph.IOMap.set(io.id, io);
    this.io.push(io);

    if (args.type === "input") {
      this.ioInputLength += 1;
    } else {
      this.ioOutputLength += 1;
    }
    this.io.sort((a, b) => (a.type === "input" ? -1 : 1));

    this.updateNodeSize();
  }

  removeIO(i: GraphNodeIO) {
    if (i.type === "input") {
      this.ioInputLength -= 1;
    } else {
      this.ioOutputLength -= 1;
    }
    this.io = this.io.filter((io) => io !== i);
    Graph.IOMap.delete(i.id);
    this.updateNodeSize();

    let index = 0;
    this.io.forEach((io) => {
      if (io.type === i.type) {
        io.name = (index + 1).toString();
        index++;
      }
    });
  }

  updateIOPos() {
    let inputs = 0;
    let outputs = 0;
    this.io.forEach((io, i) => {
      if (io.type === "input") {
        io.pos = {
          x: this.pos.x + this.ioXSpacing,
          y: this.pos.y + this.elementsYSpacing + inputs * this.ioSpacingY,
        };
        inputs++;
      } else {
        io.pos = {
          x: this.pos.x + this.size[0] - this.ioXSpacing,
          y: this.pos.y + this.elementsYSpacing + outputs * this.ioSpacingY,
        };
        outputs++;
      }
    });
  }

  drawIO(ctx: CanvasRenderingContext2D) {
    this.updateIOPos();
    ctx.strokeStyle = "#fff";
    ctx.fillStyle = "#fff";
    this.io.forEach((io) => {
      drawCircle(ctx, io.pos, io.radius);
      if (io.type === "input") {
        ctx.fillText(
          io.name,
          io.pos.x + this.elementsXSpacing,
          io.pos.y + io.radius / 1.2
        );
      } else {
        ctx.fillText(
          io.name,
          io.pos.x - ctx.measureText(io.name).width - this.elementsXSpacing,
          io.pos.y + io.radius / 2
        );
      }
    });
  }

  connect(srcIndex: number, dstIndex: number, node: GraphNode) {
    let srcIOindex = 0;
    this.io.forEach((io, i) => {
      if (io.type === "output") {
        if (srcIOindex === srcIndex) {
          this.io[i].pointingTo?.push(node.io[dstIndex].id);
          node.io[dstIndex].pointedBy = this.io[i].id;
          return;
        }
        srcIOindex++;
      }
    });
  }

  addWidget(widget: Widget) {
    this.widgets.push(widget);
    Graph.widgetMap.set(widget.id, widget);
    this.updateNodeSize();
  }

  removeWidget(widget: Widget) {
    this.widgets = this.widgets.filter((w) => w !== widget);
    Graph.widgetMap.delete(widget.id);
    this.updateNodeSize();
  }

  updateWidgetsPos() {
    let index = 1;

    let x_offset = 10;
    let y_offset = 0;

    this.widgets.forEach((widget) => {
      widget.pos = {
        x: this.pos.x + x_offset,
        y:
          this.pos.y +
          y_offset +
          this.totalIOHeight +
          (index == 1 ? this.elementsYSpacing : this.widgetsYSpacing) * index +
          (index > 1 ? this.widgets[index-2].height : 0),
      };
      if (widget.width != this.size[0] - 20) {
        widget.width = this.size[0] - 20;
      }
      index++;
    });
  }

  drawWidgets(ctx: CanvasRenderingContext2D) {
    this.updateWidgetsPos();
    this.widgets.forEach((widget) => {
      widget.render();
    });
  }
}

export default GraphNode;
