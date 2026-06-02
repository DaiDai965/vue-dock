<script setup lang="ts">
import { DropDirection, useDock } from "./DockData";
import { getDockDragData, type DockDragData } from "./dragdrop/DragManager";
import type { DockPanel, DropDirectionType } from "./types";

const props = defineProps<{
  panelData: DockPanel;
}>();

const { getDockId, getGroup, onDockMove } = useDock();

const canDrop = (source: DockDragData, direction: DropDirectionType) => {
  const sourceGroup = getGroup(source.group);
  const targetGroup = getGroup(props.panelData.group);
  if (targetGroup.disableDock && direction !== DropDirection.FLOAT) return false;
  if (source.tabId && sourceGroup.tabLocked) return false;
  if (source.group && props.panelData.group && source.group !== props.panelData.group && direction === DropDirection.MIDDLE) return false;
  return true;
};

const edgeDirection = (event: DragEvent): DropDirectionType => {
  const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
  const left = event.clientX - rect.left;
  const right = rect.right - event.clientX;
  const top = event.clientY - rect.top;
  const bottom = rect.bottom - event.clientY;
  const min = Math.min(left, right, top, bottom);
  if (min === left) return DropDirection.LEFT;
  if (min === right) return DropDirection.RIGHT;
  if (min === top) return DropDirection.TOP;
  return DropDirection.BOTTOM;
};

const onDrop = (event: DragEvent) => {
  event.preventDefault();
  event.stopPropagation();
  const direction = edgeDirection(event);
  const source = getDockDragData(event, getDockId());
  if (!source || !canDrop(source, direction)) return;
  if (source.tabId) onDockMove({ id: source.tabId, title: "" }, props.panelData, direction);
  else if (source.panelId) onDockMove({ id: source.panelId, tabs: [] }, props.panelData, direction);
};
</script>

<template>
  <div class="dock-drop-edge" @dragover.prevent @drop="onDrop" />
</template>
