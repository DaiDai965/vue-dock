<script setup lang="ts">
import { useTabState } from "../components/rc-dock/useTabState";

interface SettingsState {
  theme: string;
  notifications: boolean;
}

const settings = useTabState<SettingsState>({
  theme: "Dark",
  notifications: true,
});
</script>

<template>
  <div class="settings-view">
    <h1>Settings</h1>
    <div class="form-group">
      <label for="theme-select">Theme</label>
      <select id="theme-select" v-model="settings.theme">
        <option>Dark</option>
        <option>Light</option>
      </select>
    </div>
    <div class="form-group inline">
      <input id="notifications" v-model="settings.notifications" type="checkbox" />
      <label for="notifications">Enable notifications</label>
    </div>
    <div class="current">Current theme: {{ settings.theme }}</div>
  </div>
</template>

<style scoped>
.settings-view {
  padding: 20px;
  color: #cccccc;
  height: 100%;
  overflow: auto;
}
h1 {
  color: #e1b12c;
  margin-top: 0;
}
.form-group {
  margin-bottom: 15px;
}
.form-group.inline {
  display: flex;
  align-items: center;
  gap: 8px;
}
label {
  display: block;
  margin-bottom: 5px;
  font-weight: 700;
}
.form-group.inline label {
  margin-bottom: 0;
}
select,
input {
  padding: 5px;
  background: #3c3c3c;
  color: white;
  border: 1px solid #555;
  border-radius: 4px;
}
.current {
  margin-top: 20px;
  color: #888;
}
</style>