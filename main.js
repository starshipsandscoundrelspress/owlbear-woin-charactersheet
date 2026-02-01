import "./style.css";

const META_KEY = "theodore.woin.sheet";

const FIELDS = [
  "name",
  "species",
  "descriptor",
  "grade",

  "str",
  "agi",
  "end",
  "int",
  "log",
  "wil",
  "cha",
  "luc",
  "rep",
  "pow",
  "str_dice",
  "agi_dice",
  "end_dice",
  "int_dice",
  "log_dice",
  "wil_dice",
  "cha_dice",
  "luc_dice",
  "rep_dice",
  "pow_dice",

  "health",
  "soak",
  "initiative",
  "perception",
  "carry",
  "actions",
  "natural_damage",
  "pow_points",

  "melee",
  "ranged",
  "mental",
  "vital",

  "speed",
  "climb",
  "swim",
  "jump",

  "skills-text",
  "exploits-text",
  "gear-text",
  "experience_points",
  "wealth",

  "current_age",
];

let isReady = false;

function getFieldValue(id) {
  const el = document.getElementById(id);
  return el ? el.value : "";
}

function setFieldValue(id, value) {
  const el = document.getElementById(id);
  if (el) el.value = value ?? "";
}

function collectData() {
  const data = {};
  for (const id of FIELDS) data[id] = getFieldValue(id);
  return data;
}

function applyData(data = {}) {
  for (const id of FIELDS) {
    setFieldValue(id, data[id] ?? "");
  }
  updateDerived();
}

function loadData() {
  const saved = localStorage.getItem(META_KEY);
  applyData(saved ? JSON.parse(saved) : {});
}

function saveData() {
  localStorage.setItem(META_KEY, JSON.stringify(collectData()));
}

function updateDerived() {
  const agi = parseInt(getFieldValue("agi") || "0", 10);
  const log = parseInt(getFieldValue("log") || "0", 10);
  setFieldValue("initiative", (agi + log).toString());
}

function showStatus(msg, timeout = 1200) {
  const el = document.getElementById("status");
  el.textContent = msg;
  setTimeout(() => {
    if (el.textContent === msg) el.textContent = "";
  }, timeout);
}

function addAttackRow() {
  const tbody = document.getElementById("attacks-table-body");
  if (!tbody) return console.error("Attacks table body not found");
  const newRow = document.createElement("tr");
  newRow.innerHTML = `
    <td><input type="text" class="weapon" /></td>
    <td><input type="text" class="attack" /></td>
    <td><input type="text" class="damage" /></td>
    <td><input type="text" class="range" /></td>
    <td><input type="text" class="notes" /></td>
  `;
  tbody.appendChild(newRow);
}

function addLifePathRow() {
  const tbody = document.getElementById("lifepath-table-body");
  if (!tbody) return console.error("Life path table body not found");
  const newRow = document.createElement("tr");
  newRow.innerHTML = `
    <td><input type="text" class="paths" /></td>
    <td><input type="text" class="grades" /></td>
    <td><input type="text" class="age" /></td>
  `;
  tbody.appendChild(newRow);
}

function setupTableListeners() {
  // Use event delegation on document for more reliable button handling
  document.addEventListener("click", (event) => {
    if (event.target.id === "add-attack-row") {
      event.preventDefault();
      addAttackRow();
      console.log("Attack row added");
    }
    if (event.target.id === "add-lifepath-row") {
      event.preventDefault();
      addLifePathRow();
      console.log("Life path row added");
    }
  });
}

function setupFormListeners() {
  const inputs = document.querySelectorAll("input, textarea");

  inputs.forEach((el) => {
    el.addEventListener("input", () => {
      if (
        [
          "str",
          "agi",
          "end",
          "int",
          "log",
          "wil",
          "cha",
          "luc",
          "rep",
          "pow",
          "grade",
        ].includes(el.id)
      ) {
        updateDerived();
      }
    });
  });

  document.getElementById("save").addEventListener("click", () => {
    try {
      saveData();
      showStatus("Saved successfully");
    } catch (err) {
      console.error("Save error:", err);
      showStatus("Error saving");
    }
  });

  document.querySelectorAll('input[name="storageMode"]').forEach((r) => {
    r.addEventListener("change", () => {
      // Storage mode is no longer used, but keep the listener for compatibility
    });
  });

  setupTableListeners();
}

function initializeApp() {
  isReady = true;
  loadData();
  setupFormListeners();
  console.log("App initialized in standalone mode");
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initializeApp);
} else {
  initializeApp();
}

console.log("W.O.I.N. Character Sheet loaded");
