<script setup>
import { useTabState } from '../components/rc-dock/useTabState'

const aboutState = useTabState({
  showDetails: true,
  rating: 5,
  feedback: ''
})
</script>

<template>
  <div class="about-view">
    <h1>About View</h1>
    <p>This is a dock layout demo using Vue 3.</p>
    
    <div class="control-panel">
       <label>
         <input type="checkbox" v-model="aboutState.showDetails"> Show Details
       </label>
    </div>

    <ul v-if="aboutState.showDetails" class="feature-list">
      <li>Drag and drop support</li>
      <li>Split panes</li>
      <li>Dynamic components</li>
      <li>State Persistence</li>
    </ul>
    
    <div class="feedback-section">
      <h3>Rate this demo</h3>
      <div class="stars">
        <span 
          v-for="i in 5" 
          :key="i"
          class="star"
          :class="{ active: i <= aboutState.rating }"
          @click="aboutState.rating = i"
        >★</span>
      </div>
      
      <textarea 
        v-model="aboutState.feedback" 
        placeholder="Leave your feedback here..."
        rows="3"
      ></textarea>
    </div>
  </div>
</template>

<style scoped>
.about-view {
  padding: 20px;
  color: #cccccc;
  height: 100%;
  overflow-y: auto;
}
h1 { color: #646cff; margin-top: 0; }
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
  font-size: 24px;
  cursor: pointer;
  margin-bottom: 10px;
}
.star {
  color: #444;
  transition: color 0.2s;
}
.star:hover, .star.active {
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
