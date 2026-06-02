<script setup lang="ts">
import { computed, defineComponent, h } from "vue";
import type { PropType, VNodeChild } from "vue";
import { DropDirection, useDock } from "./DockData";
import { clearDockDragData, getDockDragData, setDockDragData } from "./dragdrop/DragManager";
import type { DockContextType, DockPanel, DockTab, FloatPosition } from "./types";

const props = defineProps<{
  panelData: DockPanel;
}>();

const emit = defineEmits<{
  (event: "start-panel-drag", pointerEvent: PointerEvent): void;
}>();

const dockContext = useDock();
const { getDockId, getGroup, onDockMove, onSilentChange } = dockContext;

const PanelExtraRenderer = defineComponent({
  name: "PanelExtraRenderer",
  props: {
    panelData: {
      type: Object as PropType<DockPanel>,
      required: true,
    },
    renderer: {
      type: Function as PropType<(panel: DockPanel, context: DockContextType) => VNodeChild>,
      required: true,
    },
    context: {
      type: Object as PropType<DockContextType>,
      required: true,
    },
  },
  setup(extraProps) {
    return () => h("div", { class: "dock-panel-extra-custom" }, extraProps.renderer(extraProps.panelData, extraProps.context) as any);
  },
});

const group = computed(() => getGroup(props.panelData.group));
const canFloat = computed(() => group.value.floatable !== false && !props.panelData.panelLock);
const canNewWindow = computed(() => canFloat.value && group.value.newWindow === true && props.panelData.parent?.mode === "float");
const canMaximize = computed(() => group.value.maximizable !== false);
const isMaximized = computed(() => props.panelData.parent?.mode === "maximize");
const canCloseAll = computed(() =>
  props.panelData.parent?.mode === "float" &&
  props.panelData.tabs.length > 0 &&
  props.panelData.tabs.every((tab) => tab.closable),
);
const panelExtra = computed(() => {
  if (props.panelData.panelLock?.panelExtra) {
    return (panel: DockPanel) => props.panelData.panelLock?.panelExtra?.(panel);
  }
  return group.value.panelExtra;
});

const panelFloatPosition = (): FloatPosition => ({
  left: props.panelData.x ?? 120,
  top: props.panelData.y ?? 80,
  width: props.panelData.w ?? 360,
  height: props.panelData.h ?? 260,
});

const onDragStart = (event: DragEvent, tab: DockTab) => {
  setDockDragData(event, getDockId(), {
    tabId: tab.id,
    panelId: props.panelData.id,
    group: tab.group ?? props.panelData.group,
    panelSize: [props.panelData.w ?? 0, props.panelData.h ?? 0],
    tabGroup: group.value,
  });
};

const onTabDragOver = (event: DragEvent) => {
  event.preventDefault();
  event.stopPropagation();
};

const onTabDrop = (event: DragEvent, targetTab: DockTab) => {
  event.preventDefault();
  event.stopPropagation();
  const source = getDockDragData(event, getDockId());
  const targetGroup = targetTab.group ?? props.panelData.group;
  const sourceGroup = getGroup(source?.group);
  if (!source?.tabId || source.tabId === targetTab.id) return;
  if (source.group && targetGroup && source.group !== targetGroup) return;
  if (sourceGroup.floatable === "singleTab" && props.panelData.parent?.mode === "float") return;

  const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
  const direction = event.clientX > rect.left + rect.width / 2
    ? DropDirection.AFTER_TAB
    : DropDirection.BEFORE_TAB;
  onDockMove({ id: source.tabId, title: "" }, targetTab, direction);
};

const onPanelDragStart = (event: DragEvent) => {
  if (props.panelData.panelLock) return;
  setDockDragData(event, getDockId(), {
    panelId: props.panelData.id,
    group: props.panelData.group,
    panelSize: [props.panelData.w ?? 0, props.panelData.h ?? 0],
    tabGroup: group.value,
  });
};

const onDragEnd = () => {
  clearDockDragData(getDockId());
};

const onTabClick = (tab: DockTab) => {
  props.panelData.activeId = tab.id;
  onSilentChange(tab.id, DropDirection.ACTIVE);
};

const onCloseClick = (event: Event, tab: DockTab) => {
  event.stopPropagation();
  onDockMove(tab, null, DropDirection.REMOVE);
};

const onFloatClick = (event: Event) => {
  event.stopPropagation();
  onDockMove(props.panelData, null, DropDirection.FLOAT, panelFloatPosition());
};

const onNewWindowClick = (event: Event) => {
  event.stopPropagation();
  onDockMove(props.panelData, null, DropDirection.NEW_WINDOW, panelFloatPosition());
};

const onMaximizeClick = (event: Event) => {
  event.stopPropagation();
  onDockMove(props.panelData, null, DropDirection.MAXIMIZE);
};

const onCloseAllClick = (event: Event) => {
  event.stopPropagation();
  for (const tab of [...props.panelData.tabs]) {
    onDockMove(tab, null, DropDirection.REMOVE);
  }
};
</script>

<template>
  <div
    class="dock-bar"
    :draggable="!panelData.panelLock"
    @dragstart="onPanelDragStart"
    @dragend="onDragEnd"
    @pointerdown="emit('start-panel-drag', $event)"
  >
    <div
      v-for="tab in panelData.tabs"
      :key="tab.id"
      class="dock-tab"
      :class="{ 'dock-tab-active': panelData.activeId === tab.id }"
      draggable="true"
      @dragstart.stop="onDragStart($event, tab)"
      @dragend="onDragEnd"
      @dragover="onTabDragOver"
      @drop="onTabDrop($event, tab)"
      @click="onTabClick(tab)"
    >
      <div class="dock-tab-title">{{ tab.title }}</div>
      <span
        v-if="tab.closable"
        class="dock-tab-close"
        @click="onCloseClick($event, tab)"
      >
        <svg viewBox="0 0 12 12" width="12" height="12">
          <path
            d="M2.5 2.5 L9.5 9.5 M9.5 2.5 L2.5 9.5"
            stroke="currentColor"
            stroke-width="1.5"
          />
        </svg>
      </span>
    </div>
    <div class="dock-bar-fill"></div>
    <PanelExtraRenderer
      v-if="panelExtra"
      :panel-data="panelData"
      :renderer="panelExtra"
      :context="dockContext"
    />
    <template v-else>
      <button v-if="canFloat && panelData.parent?.mode !== 'float'" class="dock-tab-action" type="button" title="Float" @click="onFloatClick">F</button>
      <button v-if="canNewWindow" class="dock-tab-action" type="button" title="New window" @click="onNewWindowClick">W</button>
      <button v-if="canMaximize" class="dock-tab-action" type="button" :title="isMaximized ? 'Restore' : 'Maximize'" @click="onMaximizeClick">{{ isMaximized ? "R" : "M" }}</button>
      <button v-if="canCloseAll" class="dock-tab-action" type="button" title="Close all" @click="onCloseAllClick">X</button>
    </template>
  </div>
</template>

<style>
.dock-bar {
  display: flex;
  background: #252526;
  height: 35px;
  overflow-x: auto;
  border-bottom: 1px solid #333;
}
.dock-bar-fill {
  flex: 1;
  min-width: 12px;
}
.dock-tab {
  padding: 0 12px;
  height: 100%;
  display: flex;
  align-items: center;
  cursor: pointer;
  color: #969696;
  border-right: 1px solid #1e1e1e;
  user-select: none;
  background: #2d2d2d;
  min-width: 80px;
  max-width: 200px;
}
.dock-tab:hover {
  background: #383838;
}
.dock-tab-active {
  background: #1e1e1e;
  color: #fff;
  border-top: 1px solid #007fd4;
}
.dock-tab-title {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.dock-tab-close {
  margin-left: 8px;
  opacity: 0.7;
  display: flex;
  align-items: center;
}
.dock-tab-close:hover {
  opacity: 1;
  color: #fff;
}
.dock-tab-action {
  width: 28px;
  border: 0;
  border-left: 1px solid #333;
  background: #252526;
  color: #aaa;
  cursor: pointer;
}
.dock-tab-action:hover {
  color: #fff;
  background: #383838;
}
.dock-panel-extra-custom {
  display: flex;
  align-items: center;
}
</style>
