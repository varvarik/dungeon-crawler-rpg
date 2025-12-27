export function isWalkableTile(tile) {
  switch (tile.kind) {
    case "wall":
    case "trap_blocking":
      return false;
    default:
      return true;
  }
}


