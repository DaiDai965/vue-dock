<script setup lang="ts">
import { onBeforeUnmount, ref } from "vue";
import { DragState } from "./DragManager";
import { GestureState, type GestureComponent } from "./GestureManager";

const props = defineProps<{
  className?: string;
  draggable?: boolean;
  directDragT?: boolean;
  useRightButtonDragT?: boolean;
  getRef?: (element: HTMLDivElement | null) => void;
  onDragStartT?: (state: DragState) => void;
  onDragMoveT?: (state: DragState) => void;
  onDragEndT?: (state: DragState) => void;
  onDragOverT?: (state: DragState) => void;
  onDropT?: (state: DragState) => unknown;
  onDragLeaveT?: (state: DragState) => void;
  onGestureStartT?: (state: GestureState) => boolean;
  onGestureMoveT?: (state: GestureState) => void;
  onGestureEndT?: () => void;
  gestureSensitivity?: number;
}>();

const elementRef = ref<HTMLDivElement | null>(null);
let startState: DragState | null = null;
let dragging = false;
let pointerId: number | null = null;
let gestureComponent: GestureComponent | null = null;
let gesturing = false;

const setRef = (element: unknown) => {
  const div = element instanceof HTMLDivElement ? element : null;
  elementRef.value = div;
  props.getRef?.(div);
};

const isIgnoredTarget = (target: EventTarget | null) => {
  return target instanceof HTMLInputElement ||
    target instanceof HTMLTextAreaElement ||
    target instanceof HTMLSelectElement ||
    (target instanceof HTMLElement && target.closest(".drag-ignore"));
};

const beginDrag = (event: PointerEvent) => {
  if (!startState || dragging) return;
  dragging = true;
  startState.update(event);
  startState.startDrag();
  props.onDragStartT?.(startState);
};

const onPointerDown = (event: PointerEvent) => {
  if (!props.onDragStartT || isIgnoredTarget(event.target)) return;
  if (event.button === 2 && !props.useRightButtonDragT) return;

  pointerId = event.pointerId;
  startState = new DragState(event);
  dragging = false;
  elementRef.value?.setPointerCapture?.(event.pointerId);

  if (props.directDragT) {
    beginDrag(event);
    event.preventDefault();
  }
};

const onPointerMove = (event: PointerEvent) => {
  if (!startState || pointerId !== event.pointerId) return;

  const state = new DragState(event, startState.clientX, startState.clientY);
  if (!dragging) {
    if (!state.moved()) return;
    beginDrag(event);
  }

  state._onMove();
  props.onDragMoveT?.(state);
  event.preventDefault();
};

const finishDrag = (event: PointerEvent, canceled = false) => {
  if (!startState || pointerId !== event.pointerId) return;

  const state = new DragState(event, startState.clientX, startState.clientY);
  elementRef.value?.releasePointerCapture?.(event.pointerId);

  if (dragging) {
    state._onDragEnd(canceled);
    props.onDragEndT?.(state);
  }

  startState = null;
  dragging = false;
  pointerId = null;
};

const onPointerUp = (event: PointerEvent) => finishDrag(event);
const onPointerCancel = (event: PointerEvent) => finishDrag(event, true);

const onTouchStart = (event: TouchEvent) => {
  if (!props.onGestureStartT || !props.onGestureMoveT || event.touches.length !== 2) return;

  const touch1 = event.touches[0];
  const touch2 = event.touches[1];
  gestureComponent = {
    element: elementRef.value ?? undefined,
    baseX: touch1.pageX,
    baseY: touch1.pageY,
    baseX2: touch2.pageX,
    baseY2: touch2.pageY,
    scaleX: 1,
    scaleY: 1,
    baseDis: Math.hypot(touch2.pageX - touch1.pageX, touch2.pageY - touch1.pageY),
    baseAng: Math.atan2(touch2.pageY - touch1.pageY, touch2.pageX - touch1.pageX),
  };

  const state = new GestureState(event, gestureComponent, true);
  gesturing = props.onGestureStartT(state);
  if (gesturing) event.preventDefault();
};

const onTouchMove = (event: TouchEvent) => {
  if (!gesturing || !gestureComponent || event.touches.length !== 2) return;

  const state = new GestureState(event, gestureComponent);
  if (state.moved() < (props.gestureSensitivity ?? 10)) return;
  props.onGestureMoveT?.(state);
  event.preventDefault();
};

const onTouchEnd = () => {
  if (!gesturing) return;
  gesturing = false;
  gestureComponent = null;
  props.onGestureEndT?.();
};

const onNativeDragStart = (event: DragEvent) => {
  props.onDragStartT?.(new DragState(event));
};
const onNativeDragOver = (event: DragEvent) => props.onDragOverT?.(new DragState(event));
const onNativeDrop = (event: DragEvent) => {
  const state = new DragState(event);
  state.dropped = props.onDropT?.(state);
};
const onNativeDragLeave = (event: DragEvent) => props.onDragLeaveT?.(new DragState(event));

onBeforeUnmount(() => {
  startState = null;
  dragging = false;
  pointerId = null;
  gestureComponent = null;
  gesturing = false;
  props.getRef?.(null);
});
</script>

<template>
  <div
    :ref="setRef"
    :class="[className, { 'drag-initiator': !!onDragStartT }]"
    :draggable="draggable ?? false"
    @pointerdown="onPointerDown"
    @pointermove="onPointerMove"
    @pointerup="onPointerUp"
    @pointercancel="onPointerCancel"
    @touchstart="onTouchStart"
    @touchmove="onTouchMove"
    @touchend="onTouchEnd"
    @touchcancel="onTouchEnd"
    @dragstart="onNativeDragStart"
    @dragover.prevent="onNativeDragOver"
    @drop.prevent="onNativeDrop"
    @dragleave="onNativeDragLeave"
  >
    <slot />
  </div>
</template>
