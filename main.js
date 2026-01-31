import OBR from "https://unpkg.com/@owlbear-rodeo/sdk@2.0.0/obr.esm.js";

const META_KEY = "theodore.woin.sheet";
const FIELDS = [
  "name", "species", "career", "grade",
  "str", "agi", "end", "int", "log", "wil", "cha", "luc", "rep", "pow",
  "health", "soak", "initiative",
  "melee", "ranged", "mental", "vital",
  "skills-text", "exploits-text", "gear-text"
];

let currentStorageMode = "scene"; // "scene" or "token"
let selectedTokenId = null;
let isReady = false;

function getFieldValue(id) {
  const el = document.getElementById(id);
  if (!el) return "";
  return el.value ?? "";
}

function setFieldValue(id, value) {
  const el = document.getElementById(id);
  if (!el) return;
  el.value = value ?? "";
}

function collectDataFromForm() {
  const data = {};
  for (const id of FIELDS) {
    data[id] = getFieldValue(id);
  }
  return data;
}

function applyDataToForm(data) {
  if (!data) data = {};
  for (const id of FIELDS) {
    if (id in data) {
      setFieldValue(id, data[id]);
    } else {
      // leave as-is or clear; here we clear
      setFieldValue(id, "");
    }
  }
  updateDerived();
}

async function loadSceneData() {
  const meta = await OBR.scene.getMetadata();
  const data = meta[META_KEY] || {};
  applyDataToForm(data);
}

async function saveSceneData() {
  const data = collectDataFromForm();
  await OBR.scene.setMetadata({ [META_KEY]: data });
}

async function loadTokenData() {
  if (!selectedTokenId) {
    applyDataToForm({});
    return;
  }
  const items = await OBR.scene.items.getItems([selectedTokenId]);
  const token = items[0];
  if (!token) {
    applyDataToForm({});
    return;
  }
  const data = token.metadata?.[META_KEY] || {};
  applyDataToForm(data);
}

async function saveTokenData() {
  if (!selectedTokenId) return;
  const data = collectDataFromForm();
  await OBR.scene.items.updateItems([selectedTokenId], (items) => {
    for (const item of items) {
      item.metadata = {
        ...(item.metadata || {}),
        [META_KEY]: data,
      };
    }
  });
}

function showStatus(msg, timeout = 1000) {
  const status = document.getElementById("status");
  if (!status) return;
  status.textContent = msg;
  if (timeout) {
    setTimeout(() => {
      if (status.textContent === msg) status.textContent = "";
    }, timeout);
  }
}

function updateDiceBadges() {
  const attrs = ["str", "agi", "end", "int", "log", "wil", "cha", "luc", "rep", "pow"];
  for (const id of attrs) {
    const value = parseInt(getFieldValue(id) || "0", 10) || 0;
    const badge = document.querySelector(`.dice[data-for="${id}"]`);
    if (badge) {
      badge.textContent = `${value}d6`;
    }
  }
}

function updateDerived() {
  const agi = parseInt(getFieldValue("agi") || "0", 10) || 0;
  const log = parseInt(getFieldValue("log") || "0", 10) || 0;
  const initiative = agi + log;
  setFieldValue("initiative", initiative.toString());
  updateDiceBadges();
}

function setupFormListeners() {
  const inputs = document.querySelectorAll("input, textarea");
  inputs.forEach((el) => {
    el.addEventListener("input", () => {
      if (["str", "agi", "end", "int", "log", "wil", "cha", "luc", "rep", "pow"].includes(el.id) ||
          el.id === "grade") {
        updateDerived();
      }
    });
  });

  const saveButton = document.getElementById("save");
  if (saveButton) {
    saveButton.addEventListener("click", async () => {
      if (!isReady) return;
      try {
        if (currentStorageMode === "scene") {
          await saveSceneData();
          showStatus("Saved to scene");
        } else {
          if (!selectedTokenId) {
            showStatus("No token selected", 1500);
            return;
          }
          await saveTokenData();
          showStatus("Saved to token");
        }
      } catch (e) {
        console.error(e);
        showStatus("Error saving");
      }
    });
  }

  const radios = document.querySelectorAll('input[name="storageMode"]');
  radios.forEach((r) => {
    r.addEventListener("change", async () => {
      currentStorageMode = r.value;
      await refreshStorageMode();
    });
  });
}

async function refreshStorageMode() {
  const warning = document.getElementById("token-warning");
  if (currentStorageMode === "scene") {
    if (warning) warning.classList.add("hidden");
    await loadSceneData();
  } else {
    if (!selectedTokenId) {
      if (warning) warning.classList.remove("hidden");
      applyDataToForm({});
    } else {
      if (warning) warning.classList.add("hidden");
      await loadTokenData();
    }
  }
}

async function handleSelectionChange() {
  if (!isReady) return;
  const selection = await OBR.scene.items.getSelection();
  selectedTokenId = selection[0] || null;
  await refreshStorageMode();
}

function setupOBRListeners() {
  OBR.scene.items.onChange(async () => {
    // If the selected token was deleted, clear it
    if (!selectedTokenId) return;
    const items = await OBR.scene.items.getItems([selectedTokenId]);
    if (!items[0]) {
      selectedTokenId = null;
      await refreshStorageMode();
    }
  });

  OBR.scene.items.onSelectionChange(handleSelectionChange);
}

OBR.onReady(async () => {
  isReady = true;
  setupFormListeners();
  setupOBRListeners();
  await handleSelectionChange();
  await refreshStorageMode();
});
