import { addMoveEvents, removeMoveEvents } from "../drag/move";
import { dragNodes, removeDragEvents } from "../drag/nodes";
import { addIOEvents, removeIOEvents } from "../drag/ioConnections";

export function dragEventsReset() {
  removeDragEvents();
  removeMoveEvents();
  removeIOEvents();
}

export default function drag_setup() {
  dragNodes();
  addMoveEvents();
  addIOEvents();
}
