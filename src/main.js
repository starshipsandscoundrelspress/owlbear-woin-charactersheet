import OBR from "https://unpkg.com/@owlbear-rodeo/sdk@2.0.0/obr.esm.js";

const META_KEY = "theodore.woin.sheet";

const FIELDS = [
  "name",
  "species",
  "career",
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

  "melee",
  "ranged",
  "mental",
  "vital",

  "skills-text",
  "exploits-text",
  "gear-text",
];

let currentStorageMode = "scene";
let selectedTokenId = null;
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

async function loadSceneData() {
  const meta = await OBR.scene.getMetadata();
  applyData(meta[META_KEY] || {});
}

async function saveSceneData() {
  await OBR.scene.setMetadata({ [META_KEY]: collectData() });
}

async function loadTokenData() {
  if (!selectedTokenId) return applyData({});
  const items = await OBR.scene.items.getItems([selectedTokenId]);
  const token = items[0];
  applyData(token?.metadata?.[META_KEY] || {});
}

async function saveTokenData() {
  if (!selectedTokenId) return;
  const data = collectData();
  await OBR.scene.items.updateItems([selectedTokenId], (items) => {
    for (const item of items) {
      item.metadata = { ...(item.metadata || {}), [META_KEY]: data };
    }
  });
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

  document.getElementById("save").addEventListener("click", async () => {
    if (!isReady) return;
    try {
      if (currentStorageMode === "scene") {
        await saveSceneData();
        showStatus("Saved to scene");
      } else {
        if (!selectedTokenId) return showStatus("No token selected");
        await saveTokenData();
        showStatus("Saved to token");
      }
    } catch {
      showStatus("Error saving");
    }
  });

  document.querySelectorAll('input[name="storageMode"]').forEach((r) => {
    r.addEventListener("change", async () => {
      currentStorageMode = r.value;
      await refreshStorageMode();
    });
  });
}

async function refreshStorageMode() {
  const warn = document.getElementById("token-warning");

  if (currentStorageMode === "scene") {
    warn.classList.add("hidden");
    return loadSceneData();
  }

  if (!selectedTokenId) {
    warn.classList.remove("hidden");
    return applyData({});
  }

  warn.classList.add("hidden");
  return loadTokenData();
}

async function handleSelectionChange() {
  const selection = await OBR.scene.items.getSelection();
  selectedTokenId = selection[0] || null;
  await refreshStorageMode();
}

function setupOBRListeners() {
  OBR.scene.items.onSelectionChange(handleSelectionChange);

  OBR.scene.items.onChange(async () => {
    if (!selectedTokenId) return;
    const items = await OBR.scene.items.getItems([selectedTokenId]);
    if (!items[0]) {
      selectedTokenId = null;
      await refreshStorageMode();
    }
  });
}

OBR.onReady(async () => {
  isReady = true;
  setupFormListeners();
  setupOBRListeners();
  await handleSelectionChange();
});
