const STORAGE_KEY = "habit-tracker.habits";

const form = document.getElementById("habit-form");
const input = document.getElementById("habit-input");
const list = document.getElementById("habit-list");
const emptyState = document.getElementById("empty-state");
const todayLabel = document.getElementById("today-label");
const progressText = document.getElementById("progress-text");
const progressPercent = document.getElementById("progress-percent");
const progressBar = document.getElementById("progress-bar");

function todayKey() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatTodayLabel(dateKey) {
  const [year, month, day] = dateKey.split("-").map(Number);
  return new Date(year, month - 1, day).toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}

function loadHabits() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveHabits(habits) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(habits));
}

function createId() {
  return crypto.randomUUID ? crypto.randomUUID() : `habit-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function isDoneToday(habit, dateKey) {
  return Array.isArray(habit.completedDates) && habit.completedDates.includes(dateKey);
}

function render() {
  const habits = loadHabits();
  const dateKey = todayKey();
  const doneCount = habits.filter((habit) => isDoneToday(habit, dateKey)).length;
  const total = habits.length;
  const percent = total === 0 ? 0 : Math.round((doneCount / total) * 100);

  todayLabel.textContent = formatTodayLabel(dateKey);
  progressText.textContent = `${doneCount} of ${total} done`;
  progressPercent.textContent = `${percent}%`;
  progressBar.style.width = `${percent}%`;

  list.innerHTML = "";
  emptyState.classList.toggle("hidden", total > 0);

  habits.forEach((habit) => {
    const done = isDoneToday(habit, dateKey);
    const item = document.createElement("li");
    item.className =
      "group flex items-center gap-3 rounded-2xl border border-stone-200 bg-white px-4 py-3 shadow-sm shadow-stone-200/40";

    const toggle = document.createElement("button");
    toggle.type = "button";
    toggle.setAttribute("aria-pressed", String(done));
    toggle.setAttribute("aria-label", done ? `Mark ${habit.name} incomplete` : `Mark ${habit.name} complete`);
    toggle.className = [
      "flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 transition",
      done
        ? "border-moss bg-moss text-white"
        : "border-stone-300 bg-white text-transparent hover:border-moss",
    ].join(" ");
    toggle.innerHTML =
      '<svg viewBox="0 0 20 20" fill="none" class="h-3.5 w-3.5" aria-hidden="true"><path d="M5 10.5 8.2 13.5 15 6.5" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
    toggle.addEventListener("click", () => toggleHabit(habit.id));

    const name = document.createElement("span");
    name.className = done ? "flex-1 text-stone-400 line-through" : "flex-1";
    name.textContent = habit.name;

    const remove = document.createElement("button");
    remove.type = "button";
    remove.setAttribute("aria-label", `Delete ${habit.name}`);
    remove.className =
      "rounded-lg px-2 py-1 text-sm text-stone-400 transition hover:bg-stone-100 hover:text-stone-700";
    remove.textContent = "Delete";
    remove.addEventListener("click", () => deleteHabit(habit.id));

    item.append(toggle, name, remove);
    list.append(item);
  });
}

function addHabit(name) {
  const trimmed = name.trim();
  if (!trimmed) return;

  const habits = loadHabits();
  habits.push({
    id: createId(),
    name: trimmed,
    completedDates: [],
  });
  saveHabits(habits);
  render();
}

function deleteHabit(id) {
  const habits = loadHabits().filter((habit) => habit.id !== id);
  saveHabits(habits);
  render();
}

function toggleHabit(id) {
  const dateKey = todayKey();
  const habits = loadHabits().map((habit) => {
    if (habit.id !== id) return habit;

    const completedDates = Array.isArray(habit.completedDates) ? [...habit.completedDates] : [];
    const index = completedDates.indexOf(dateKey);

    if (index >= 0) {
      completedDates.splice(index, 1);
    } else {
      completedDates.push(dateKey);
    }

    return { ...habit, completedDates };
  });

  saveHabits(habits);
  render();
}

form.addEventListener("submit", (event) => {
  event.preventDefault();
  addHabit(input.value);
  input.value = "";
  input.focus();
});

render();
