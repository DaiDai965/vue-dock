<script setup lang="ts">
import { DropDirection, useDock } from "./DockData";
import { getDockDragData, type DockDragData } from "./dragdrop/DragManager";
import type { DockPanel, DropDirectionType, FloatPosition } from "./types";

const props = defineProps<{
  panelData: DockPanel;
}>();

const { getDockId, getGroup, onDockMove } = useDock();

const directions: DropDirectionType[] = [
  DropDirection.TOP,
  DropDirection.BOTTOM,
  DropDirection.LEFT,
  DropDirection.RIGHT,
  DropDirection.MIDDLE,
  DropDirection.FLOAT,
];

const canDrop = (source: DockDragData, direction: DropDirectionType) => {
  const sourceGroup = getGroup(source.group);
  const targetGroup = getGroup(props.panelData.group);
  if (source.panelId === props.panelData.id && direction === DropDirection.MIDDLE) return false;
  if (targetGroup.disableDock && direction !== DropDirection.FLOAT) return false;
  if (source.tabId && sourceGroup.tabLocked && direction !== DropDirection.MIDDLE) return false;
  if (direction === DropDirection.FLOAT && sourceGroup.floatable === false) return false;
  if (source.group && props.panelData.group && source.group !== props.panelData.group && direction === DropDirection.MIDDLE) return false;
  return true;
};

const floatPosition = (event: DragEvent, source: DockDragData): FloatPosition => {
  const [width = 320, height = 240] = source.panelSize ?? [];
  return {
    left: event.clientX - width / 2,
    top: Math.max(event.clientY - 20, 0),
    width,
    height,
  };
};

const onDrop = (event: DragEvent, direction: DropDirectionType) => {
  event.preventDefault();
  event.stopPropagation();
  const source = getDockDragData(event, getDockId());
  if (!source || !canDrop(source, direction)) return;

  const position = direction === DropDirection.FLOAT ? floatPosition(event, source) : undefined;
  if (source.tabId) onDockMove({ id: source.tabId, title: "" }, props.panelData, direction, position);
  else if (source.panelId) onDockMove({ id: source.panelId, tabs: [] }, props.panelData, direction, position);
};
</script>

<template>
  <div class="dock-drop-layer dock-drop-layer-grid">
    <button
      v-for="direction in directions"
      :key="direction"
      class="dock-drop-square"
      :class="`dock-drop-${direction}`"
      type="button"
      @dragover.prevent
      @drop="onDrop($event, direction)"
    />
  </div>
</template>
