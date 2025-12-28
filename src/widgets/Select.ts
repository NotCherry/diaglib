import Graph from "../Graph";
import Widget, { AdjustElementPos, IWidget } from "./Widget";

export class Select extends Widget {
  override element: HTMLSelectElement;
  constructor(args: IWidget) {
    super(args);
    this.element = document.createElement("select");
    let opt = document.createElement("option");
    opt.value = "1";
    opt.textContent = "Option 1";
    this.element.appendChild(opt);
    this.element.style.zIndex = "1";
    this.element.id = "Select";
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
    // let data = Graph.nodeMap.get(this.owner)!.data;
    // if (data["text"] == undefined) data["text"] = "";
    // this.element.addEventListener("input", (event) => {
    //   const target = event.currentTarget as HTMLTextAreaElement;
    //   data["text"] = target.value;
    // });
    // this.element.value = data["text"];
  }

  update(): void {}

  render(): void {
    let ownerNode = Graph.nodeMap.get(this.owner);
    if (!ownerNode) {
      return;
    }
    ownerNode.updateNodeSize();
    AdjustElementPos(
      this.element,
      this.pos,
      this.width,
      this.height,
      this.fontSize,
    );
  }

  remove() {
    this.element.parentNode?.removeChild(this.element);
  }
}
