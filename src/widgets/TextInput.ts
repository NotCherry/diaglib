import Graph from "../Graph";
import Widget, { AdjustElementPos, IWidget } from "./Widget";

export class TextArea extends Widget {
  override element: HTMLTextAreaElement;
  constructor(args: IWidget) {
    super(args);
    this.element = document.createElement("textarea");
    this.element.style.zIndex = "1";
    this.element.id = "TEXTAREA";
    this.element.style.position = "absolute";
    this.element.style.width = `${this.width}px`;
    this.element.style.height = `${this.height}px`;
    args.style =
      "bg-gray-900 text-gray-400 rounded-md px-4 py-2 focus:outline-none focus:ring focus:ring-blue-500 focus:border-blue-500";
    if (args.style) {
      args.style.split(" ").map((el) => this.element.classList.add(el));
    }

    if (Graph.widgetRootElementId != "")
      document
        .getElementById(Graph.widgetRootElementId)
        .appendChild(this.element);
    else document.body.appendChild(this.element);
  }

  setup() {
    let data = Graph.nodeMap.get(this.owner)!.data;
    if (data["text"] == undefined) data["text"] = "";
    this.element.addEventListener("input", (event) => {
      const target = event.currentTarget as HTMLTextAreaElement;
      data["text"] = target.value;
    });
    this.element.value = data["text"];
  }

  update(): void {}

  render(): void {
    let ownerNode = Graph.nodeMap.get(this.owner);
    if (!ownerNode) {
      return;
    }

    // let data = ownerNode.data;
    // this.element.value = data["text"];

    // let maxWidth = this.width;
    // data["text"].split('/n').forEach(element => {
    //   let width = getRenderedTextSize(element, `${this.fontSize} monospace`).width
    //   maxWidth = maxWidth < width ? width : maxWidth
    // });

    // this.width = maxWidth;
    ownerNode.updateNodeSize();
    AdjustElementPos(
      this.element,
      this.pos,
      this.width,
      this.height,
      this.fontSize,
    );
  }

  validate(): boolean {
    let { data, title, io } = Graph.nodeMap.get(this.owner)!;

    let usedIOlenght = io
      .filter((io) => io.pointedBy)
      .map((io) => io.pointedBy)
      .flat().length;

    let bracketCount = Array.prototype.reduce.call(
      data["text"],
      (r, s) => {
        r += s === "}" ? 1 : 0;
        return r;
      },
      0,
    );

    if (bracketCount != usedIOlenght) {
      Graph.nodeMap.get(this.owner)!.color = "red";
      Graph.render();
      alert(
        `The number of inputs to node do not matched required required ${bracketCount} vs ${usedIOlenght}  Node title: ${title}}`,
      );
      return false;
    } else {
      Graph.render();
      Graph.nodeMap.get(this.owner)!.color = "";
      return true;
    }
  }

  remove() {
    this.element.parentNode?.removeChild(this.element);
  }
}

export class ResponseTextArea extends TextArea {
  override setup(): void {
    this.update();
  }

  update() {
    const owner = Graph.nodeMap.get(this.owner);
    if (owner == undefined) {
      throw Error;
    }

    owner.updateWidgetsPos();
    owner.updateNodeSize();
    owner.drawNode(Graph.ctx);
    owner.drawIO(Graph.ctx);
    this.render();
  }

  override render(): void {
    AdjustElementPos(
      this.element,
      this.pos,
      this.width,
      this.height,
      this.fontSize,
    );
    let data = Graph.nodeMap.get(this.owner)!.data;
    this.element.value = data["response"];
  }
}

function getRenderedTextSize(text, font = "16px Arial") {
  // Create a temporary div element
  const tempDiv = document.createElement("div");

  // Set the text content
  tempDiv.textContent = text;

  // Apply styles to match the desired rendering
  tempDiv.style.position = "absolute"; // Prevent it from affecting layout
  tempDiv.style.visibility = "hidden"; // Make it invisible
  tempDiv.style.whiteSpace = "nowrap"; // Prevent wrapping (you can remove this if you expect wrapping)
  tempDiv.style.font = font; // Apply the font styles

  // Append the temporary div to the body
  document.body.appendChild(tempDiv);

  // Get the size of the div
  const rect = tempDiv.getBoundingClientRect();

  // Remove the temporary div after measuring
  document.body.removeChild(tempDiv);

  // Return the width and height
  return {
    width: rect.width,
    height: rect.height,
  };
}
