export type DragData = Record<string, unknown>;
export type DragType = "left" | "right" | "touch" | null;
export type DragHandler = (state: DragState) => void;
export type DropHandler = (state: DragState) => unknown;

export interface DockDragData {
  tabId?: string;
  panelId?: string;
  group?: string;
  panelSize?: [number, number];
  tabGroup?: unknown;
}

const dragDataByDock = new Map<unknown, DragData>();
const DATA_TRANSFER_KEYS = ["dock/tab", "dock/panel"] as const;
let activeDragState: DragState | null = null;

function readTransferData(event?: DragEvent | null): DockDragData | null {
  if (!event?.dataTransfer) return null;

  for (const key of DATA_TRANSFER_KEYS) {
    const raw = event.dataTransfer.getData(key);
    if (!raw) continue;

    try {
      const parsed = JSON.parse(raw) as DockDragData;
      if (parsed.tabId || parsed.panelId) return parsed;
    } catch {
      return null;
    }
  }

  return null;
}

function writeTransferData(event: DragEvent | undefined, data: DockDragData) {
  if (!event?.dataTransfer) return;

  const key = data.tabId ? "dock/tab" : "dock/panel";
  event.dataTransfer.effectAllowed = "move";
  event.dataTransfer.setData(key, JSON.stringify(data));
}

export class DragState {
  clientX = 0;
  clientY = 0;
  pageX = 0;
  pageY = 0;
  dx = 0;
  dy = 0;
  dropped?: unknown;
  rejected = false;
  accepted = false;

  constructor(public event?: DragEvent | PointerEvent | MouseEvent | TouchEvent, private startX = getClientPoint(event).clientX, private startY = getClientPoint(event).clientY) {
    if (event) this.update(event);
  }

  update(event: DragEvent | PointerEvent | MouseEvent | TouchEvent) {
    const point = getClientPoint(event);
    this.event = event;
    this.clientX = point.clientX;
    this.clientY = point.clientY;
    this.pageX = point.pageX;
    this.pageY = point.pageY;
    this.dx = this.clientX - this.startX;
    this.dy = this.clientY - this.startY;
  }

  setData(data: DragData, dockId: unknown = "default") {
    dragDataByDock.set(dockId, { ...(dragDataByDock.get(dockId) ?? {}), ...data });
    writeTransferData(typeof DragEvent !== "undefined" && this.event instanceof DragEvent ? this.event : undefined, data as DockDragData);
  }

  startDrag() {
    activeDragState = this;
    this.dropped = false;
  }

  moved(distance = 3) {
    return Math.abs(this.dx) >= distance || Math.abs(this.dy) >= distance;
  }

  accept() {
    this.accepted = true;
    this.rejected = false;
  }

  reject() {
    this.rejected = true;
    this.accepted = false;
  }

  _onMove() {
    activeDragState = this;
  }

  _onDragEnd(canceled = false) {
    if (activeDragState === this || canceled) activeDragState = null;
  }

  static getData<T>(key: string, dockId: unknown = "default"): T | undefined {
    return dragDataByDock.get(dockId)?.[key] as T | undefined;
  }

  static clearData(dockId: unknown = "default") {
    dragDataByDock.delete(dockId);
  }
}

function getClientPoint(event?: DragEvent | PointerEvent | MouseEvent | TouchEvent) {
  const touch = event && "touches" in event
    ? event.touches[0] ?? event.changedTouches[0]
    : undefined;
  const pointer = touch ?? (event as DragEvent | PointerEvent | MouseEvent | undefined);

  return {
    clientX: pointer?.clientX ?? 0,
    clientY: pointer?.clientY ?? 0,
    pageX: pointer?.pageX ?? pointer?.clientX ?? 0,
    pageY: pointer?.pageY ?? pointer?.clientY ?? 0,
  };
}

export function isDragging() {
  return activeDragState !== null;
}

export function cancelDrag() {
  activeDragState?._onDragEnd(true);
  activeDragState = null;
}

export function addHandlers(_element: HTMLElement, _handlers: Record<string, unknown>) {
  // Compatibility hook for rc-dock consumers. Vue components wire listeners directly.
}

export function removeHandlers(_element: HTMLElement) {
  // Compatibility hook for rc-dock consumers. Vue components wire listeners directly.
}

export function setDockDragData(event: DragEvent, dockId: unknown, data: DockDragData) {
  new DragState(event).setData(data as DragData, dockId);
}

export function getDockDragData(event: DragEvent | null | undefined, dockId: unknown): DockDragData | null {
  const stored = dragDataByDock.get(dockId) as DockDragData | undefined;
  if (stored?.tabId || stored?.panelId) return stored;
  return readTransferData(event);
}

export function clearDockDragData(dockId: unknown = "default") {
  DragState.clearData(dockId);
}
