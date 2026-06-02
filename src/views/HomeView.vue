<script setup lang="ts">
import { ref } from "vue";
import { useTabState } from "../components/rc-dock/useTabState";

interface Note {
  id: number;
  text: string;
  done: boolean;
}

interface HomeState {
  counter: number;
  username: string;
  notes: Note[];
}

const state = useTabState<HomeState>({
  counter: 0,
  username: "Guest",
  notes: [],
});

const newNote = ref("");

const addNote = () => {
  const text = newNote.value.trim();
  if (!text) return;

  state.notes.push({
    id: Date.now(),
    text,
    done: false,
  });
  newNote.value = "";
};

const toggleNote = (note: Note) => {
  note.done = !note.done;
};

const removeNote = (index: number) => {
  state.notes.splice(index, 1);
};
</script>

<template>
  <div class="home-view">
    <h1>Home View</h1>
    <p>Welcome, <input v-model="state.username" class="inline-input" />.</p>

    <section class="card">
      <h3>Interactive Counter</h3>
      <div class="counter-control">
        <button type="button" @click="state.counter--">-</button>
        <span class="count">{{ state.counter }}</span>
        <button type="button" @click="state.counter++">+</button>
      </div>
    </section>

    <section class="card">
      <h3>Quick Notes</h3>
      <div class="input-group">
        <input
          v-model="newNote"
          type="text"
          placeholder="Type a note and press Enter..."
          @keyup.enter="addNote"
        />
        <button type="button" @click="addNote">Add</button>
      </div>

      <ul class="notes-list">
        <li v-for="(note, index) in state.notes" :key="note.id" class="note-item">
          <input type="checkbox" :checked="note.done" @change="toggleNote(note)" />
          <span :class="{ done: note.done }">{{ note.text }}</span>
          <button class="delete-btn" type="button" @click="removeNote(index)">x</button>
        </li>
        <li v-if="state.notes.length === 0" class="empty-msg">No notes yet</li>
      </ul>
    </section>
  </div>
</template>

<style scoped>
.home-view {
  padding: 20px;
  color: #cccccc;
  height: 100%;
  overflow-y: auto;
}
h1 {
  color: #42b883;
  margin-top: 0;
}
.inline-input {
  background: transparent;
  border: none;
  border-bottom: 1px solid #666;
  color: #fff;
  font-size: 1em;
  width: 100px;
  outline: none;
}
.inline-input:focus {
  border-bottom-color: #42b883;
}
.card {
  background: #252526;
  padding: 15px;
  border-radius: 8px;
  margin-top: 20px;
  border: 1px solid #333;
}
.counter-control {
  display: flex;
  align-items: center;
  gap: 15px;
  font-size: 1.2em;
}
.count {
  font-weight: 700;
  min-width: 30px;
  text-align: center;
}
button {
  background: #3c3c3c;
  border: 1px solid #555;
  color: #ccc;
  padding: 5px 10px;
  border-radius: 4px;
  cursor: pointer;
}
button:hover {
  background: #4a4a4a;
}
.input-group {
  display: flex;
  gap: 10px;
  margin-bottom: 10px;
}
.input-group input {
  flex: 1;
  background: #1e1e1e;
  border: 1px solid #444;
  color: #ccc;
  padding: 6px;
  border-radius: 4px;
}
.notes-list {
  list-style: none;
  padding: 0;
  margin: 0;
}
.note-item {
  display: flex;
  align-items: center;
  padding: 5px 0;
  border-bottom: 1px solid #333;
}
.note-item:last-child {
  border-bottom: none;
}
.note-item input[type="checkbox"] {
  margin-right: 10px;
}
.note-item span {
  flex: 1;
}
.done {
  text-decoration: line-through;
  opacity: 0.6;
}
.delete-btn {
  background: transparent;
  border: none;
  color: #888;
  font-size: 1.2em;
  padding: 0 5px;
}
.delete-btn:hover {
  color: #ff6b6b;
  background: transparent;
}
.empty-msg {
  color: #666;
  font-style: italic;
  text-align: center;
  padding: 10px;
}
</style>