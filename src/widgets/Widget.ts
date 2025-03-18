import GraphNode from "../Node";
import { Point } from "../types";
import { v4 as uuidv4 } from "uuid";
import Graph from "../Graph";

export interface IWidget {
  width?: number;
  height?: number;
  type?: string;
  id?: string;
  style?: string; 
  owner: string;
  // graf: Graph;
}

export default abstract class Widget {
  id: string;
  pos: Point;
  width: number;
  height: number;
  fontSize:number = 18;
  type: string;
  owner: string;
  element: HTMLTextAreaElement;
  // graf: Graph;
  constructor(args: IWidget) {
    this.id = args.id || uuidv4();
    this.type = args.type || "widget";
    this.pos = { x: 0, y: 0 };
    this.width = args.width || 100;
    this.height = args.height !== undefined ? args.height : 100;
    this.owner = args.owner;
    if (this.owner == undefined) {
      throw new Error("Owner is undefined");
    }
  }

  abstract update(): void;
  abstract render(): void;
  abstract setup();
  abstract validate(): boolean;
  abstract remove();
  save() {
    return { type: this.type, id: this.id, owner: this.owner };
  }
}

export function AdjustElementPos(
  element: HTMLElement,
  pos: Point,
  width: number,
  height: number,
  fontSize:number
): void {
  element.style.width = `${width * Graph.scale}px`;
  element.style.height = `${height * Graph.scale}px`;

  element.style.left = `${
    pos.x * Graph.scale + Graph.transforms.e + Graph.widgetXOffset
  }px`;
  element.style.top = `${
    pos.y * Graph.scale + Graph.transforms.f + Graph.widgetYOffset
  }px`;
  element.style.fontSize = `${fontSize * Graph.scale}px`
}
