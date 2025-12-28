import Graph from "../Graph";
import GraphNodeIO from "../IO";
import { setSelectedElements } from "../util/utility";

// Event handlers
function handleMouseDown(event) {
  // Grab the selected node if connected, and reconnect it to a new place
  setSelectedElements();

  if (event.button === 2) {
    return;
  }

  if (Graph.selectedIO !== undefined) {
    const selectedIO = Graph.IOMap.get(Graph.selectedIO);
    if (selectedIO) {
      if (selectedIO.pointedBy !== undefined && selectedIO.type === "input") {
        const srcIO = Graph.IOMap.get(selectedIO.pointedBy);
        if (srcIO) {
          Graph.LineStart = srcIO.pos;
          // Remove the connection from source IO to the selected IO
          srcIO.pointingTo = srcIO.pointingTo?.filter(
            (io) => io !== Graph.selectedIO,
          );

          Graph.selectedNode = srcIO.owner;
          selectedIO.pointedBy = undefined;
          Graph.selectedIO = srcIO.id;
        }
      }
    }
    Graph.render();
  }
}

function handleMouseMove(event) {
  if (Graph.drawLine && Graph.selectedIO !== undefined) {
    const selectedIO = Graph.IOMap.get(Graph.selectedIO);
    if (selectedIO && selectedIO.pointedBy === undefined) {
      Graph.render();
    }
  }
}

function handleMouseUp(event) {
  if (Graph.selectedIO !== undefined) {
    const beginIO = Graph.IOMap.get(Graph.selectedIO);
    setSelectedElements();
    const selectedIO = Graph.IOMap.get(Graph.selectedIO);

    if (beginIO && selectedIO) {
      // Connect beginIO and selectedIO if they are compatible
      if (
        beginIO.type !== selectedIO.type &&
        beginIO.owner !== selectedIO.owner &&
        selectedIO.pointedBy === undefined
      ) {
        if (beginIO.type === "output") {
          beginIO.pointingTo = beginIO.pointingTo || [];
          beginIO.pointingTo.push(selectedIO.id);
          selectedIO.pointedBy = beginIO.id;
        } else {
          selectedIO.pointingTo = selectedIO.pointingTo || [];
          selectedIO.pointingTo.push(beginIO.id);
          beginIO.pointedBy = selectedIO.id;
        }
      }
    }
  }

  Graph.selectedNode = undefined;
  Graph.selectedIO = undefined;
  Graph.drawLine = false;

  Graph.render();
}

// Functions to add and remove event listeners
function addIOEvents() {
  Graph.canvas.addEventListener("mousedown", handleMouseDown);
  Graph.canvas.addEventListener("mousemove", handleMouseMove);
  Graph.canvas.addEventListener("mouseup", handleMouseUp);
}

function removeIOEvents() {
  Graph.canvas.removeEventListener("mousedown", handleMouseDown);
  Graph.canvas.removeEventListener("mousemove", handleMouseMove);
  Graph.canvas.removeEventListener("mouseup", handleMouseUp);
}

// Export the add and remove functions
export { addIOEvents, removeIOEvents };
