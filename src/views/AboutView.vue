<script setup lang="ts">
import { useTabState } from "../components/rc-dock/useTabState";

interface AboutState {
  showDetails: boolean;
  rating: number;
  feedback: string;
}

const aboutState = useTabState<AboutState>({
  showDetails: true,
  rating: 5,
  feedback: "",
});
</script>

<template>
  <div class="about-view">
    <h1>About View</h1>
    <p>This is a Vue 3 dock layout demo.</p>

    <div class="control-panel">
      <label>
        <input v-model="aboutState.showDetails" type="checkbox" />
        Show Details
      </label>
    </div>

    <ul v-if="aboutState.showDetails" class="feature-list">
      <li>Drag tabs and panels</li>
      <li>Split panes in four directions</li>
      <li>Float, maximize, and new-window panel actions</li>
      <li>Per-tab state persistence</li>
    </ul>

    <section class="feedback-section">
      <h3>Rate this demo</h3>
      <div class="stars">
        <button
          v-for="index in 5"
          :key="index"
          type="button"
          class="star"
          :class="{ active: index <= aboutState.rating }"
          @click="aboutState.rating = index"
        >
          *
        </button>
      </div>

      <textarea
        v-model="aboutState.feedback"
        placeholder="Leave your feedback here..."
        rows="3"
      />
    </section>
  </div>
</template>

<style scoped>
.about-view {
  padding: 20px;
  color: #cccccc;
  height: 100%;
  overflow-y: auto;
}
h1 {
  color: #646cff;
  margin-top: 0;
}
.control-panel {
  margin: 15px 0;
  padding: 10px;
  background: #2d2d2d;
  border-radius: 4px;
}
.feature-list {
  line-height: 1.6;
  background: #252526;
  padding: 15px 15px 15px 35px;
  border-radius: 8px;
  border: 1px solid #333;
}
.feedback-section {
  margin-top: 20px;
  border-top: 1px solid #333;
  padding-top: 20px;
}
.stars {
  display: flex;
  gap: 4px;
  margin-bottom: 10px;
}
.star {
  border: 0;
  background: transparent;
  color: #555;
  cursor: pointer;
  font-size: 24px;
  line-height: 1;
  padding: 0 2px;
}
.star:hover,
.star.active {
  color: #ffd700;
}
textarea {
  width: 100%;
  background: #1e1e1e;
  border: 1px solid #444;
  color: #ccc;
  padding: 8px;
  border-radius: 4px;
  resize: vertical;
  font-family: inherit;
}
textarea:focus {
  border-color: #646cff;
  outline: none;
}
</style>