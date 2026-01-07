<script setup>
import { useTabState } from '../components/rc-dock/useTabState'

// Automatically persistent state scoped to this tab
const settings = useTabState({
  theme: 'Dark',
  notifications: true
})
</script>

<template>
  <div class="settings-view">
    <h1>Settings</h1>
    <div class="form-group">
      <label>Theme</label>
      <select v-model="settings.theme">
        <option>Dark</option>
        <option>Light</option>
      </select>
    </div>
    <div class="form-group">
      <label>Notifications</label>
      <input type="checkbox" v-model="settings.notifications" /> Enable
    </div>
    <div style="margin-top: 20px; color: #888;">
        Current: {{ settings.theme }}
    </div>
  </div>
</template>

<style scoped>
.settings-view {
  padding: 20px;
  color: #cccccc;
}
h1 { color: #e1b12c; }
.form-group {
  margin-bottom: 15px;
}
label {
  display: block;
  margin-bottom: 5px;
  font-weight: bold;
}
select, input {
  padding: 5px;
  background: #3c3c3c;
  color: white;
  border: 1px solid #555;
  border-radius: 4px;
}
</style>
