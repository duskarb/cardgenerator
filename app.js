const card = document.querySelector("#cardPreview");
const printSheet = document.querySelector("#printSheet");

const fields = {
  name:    ["#nameInput",    "#previewName"],
  role:    ["#roleInput",    "#previewRole"],
  company: ["#companyInput", "#previewCompany"],
  phone:   ["#phoneInput",   "#previewPhone"],
  email:   ["#emailInput",   "#previewEmail"],
  website: ["#websiteInput", "#previewWebsite"],
  address: ["#addressInput", "#previewAddress"],
};

const defaultInfo = {
  name:    "Namkyu Yeo",
  role:    "designer",
  company: "KAIST id",
  phone:   "010-7101-5732",
  email:   "prism011312@gmail.com",
  website: "www.yeonamkyu.com",
  address: "Seoul, Korea",
};

function resetFields() {
  Object.entries(fields).forEach(([key, [inputSelector, outputSelector]]) => {
    const input = document.querySelector(inputSelector);
    const output = document.querySelector(outputSelector);
    if (input) input.value = defaultInfo[key];
    if (output) output.textContent = defaultInfo[key];
  });
}

const layouts = ["layout-left", "layout-top", "layout-block", "layout-invert"];
const fonts = ["font-inter", "font-sans", "font-serif", "font-mono", "font-soft"];
const infoItems = [
  { key: "name", label: "Name" },
  { key: "company", label: "Company" },
  { key: "role", label: "Title" },
  { key: "phone", label: "Phone" },
  { key: "email", label: "Email" },
  { key: "website", label: "Website" },
  { key: "address", label: "Address" },
];
const itemMetrics = {
  name: { width: 48, gap: 22 },
  company: { width: 28, gap: 14 },
  role: { width: 36, gap: 14 },
  phone: { width: 44, gap: 8 },
  email: { width: 44, gap: 8 },
  website: { width: 44, gap: 8 },
  address: { width: 44, gap: 8 },
};
const fontChoices = [
  "Inter, sans-serif",
  "'DM Sans', sans-serif",
  "Outfit, sans-serif",
  "'Space Grotesk', sans-serif",
  "Syne, sans-serif",
  "Barlow, sans-serif",
  "'Barlow Condensed', sans-serif",
  "Oswald, sans-serif",
  "'Playfair Display', serif",
  "'Cormorant Garamond', serif",
  "'EB Garamond', serif",
  "Lora, serif",
  "Georgia, serif",
  "'Times New Roman', serif",
  "'Space Mono', monospace",
  "'JetBrains Mono', monospace",
  "'Courier New', monospace",
];
const fontPairings = [
  ["Inter, sans-serif", "'EB Garamond', serif"],
  ["Inter, sans-serif", "'Playfair Display', serif"],
  ["'DM Sans', sans-serif", "'Cormorant Garamond', serif"],
  ["'Space Grotesk', sans-serif", "'EB Garamond', serif"],
  ["Outfit, sans-serif", "Lora, serif"],
  ["'Barlow Condensed', sans-serif", "Inter, sans-serif"],
  ["Oswald, sans-serif", "'DM Sans', sans-serif"],
  ["Syne, sans-serif", "Inter, sans-serif"],
  ["Inter, sans-serif", "'Space Mono', monospace"],
  ["'Space Grotesk', sans-serif", "'JetBrains Mono', monospace"],
];
let currentLayout = "layout-left";
let currentFont = "font-inter";
let layoutState = null;
let layoutMode = "auto";
let gutterScale = 1.0;
let gutterVal = 2.0;
let manualState = {
  guidesVisible: true,
  hasVLine: true,
  hasHLine: true,
  vLine: 50,
  hLine: 50,
  margin: 7,
  assignment: null,
  vAnchorMode: "outer",
  hAnchorMode: "outer",
};
let infoGroupState = [
  { key: "name", group: 1 },
  { key: "role", group: 1 },
  { key: "company", group: 2 },
  { key: "phone", group: 3 },
  { key: "email", group: 3 },
  { key: "website", group: 3 },
  { key: "address", group: 3 },
];
let styleState = {
  sizeMode: "two",
  nameFont: "Inter, sans-serif",
  bodyFont: "Inter, sans-serif",
  nameSize: 42,
  bodySize: 12,
  nameWeight: 800,
  bodyWeight: 400,
};

const HPAD = 7;   // % from left/right edges
const VPAD = 12;  // % from top/bottom (physically equal on 1.75:1 card)
const CARD_RATIO = 1.75;

function marginYPct(marginX) {
  return clamp(marginX * CARD_RATIO, 0, 32);
}

function normalizeHex(value) {
  const raw = value.trim();
  if (/^#[0-9a-f]{3}$/i.test(raw)) {
    return `#${raw[1]}${raw[1]}${raw[2]}${raw[2]}${raw[3]}${raw[3]}`.toLowerCase();
  }
  if (/^#[0-9a-f]{6}$/i.test(raw)) return raw.toLowerCase();
  if (/^[0-9a-f]{6}$/i.test(raw)) return `#${raw}`.toLowerCase();
  return null;
}

function applyColor(hex) {
  document.documentElement.style.setProperty("--card-color", hex);
  document.querySelector("#colorPicker").value = hex;
  document.querySelector("#colorCode").value = hex;
}

function chooseNext(items, current) {
  const pool = items.filter((item) => item !== current);
  return pool[Math.floor(Math.random() * pool.length)];
}

function sample(items) {
  return items[Math.floor(Math.random() * items.length)];
}

function sampleDifferent(items, current) {
  const currentKey = current ? JSON.stringify(current) : null;
  const pool = items.filter((item) => JSON.stringify(item) !== currentKey);
  return sample(pool.length ? pool : items);
}

function sampleUnique(items, count) {
  const pool = [...items];
  const picked = [];
  while (picked.length < count && pool.length) {
    const index = Math.floor(Math.random() * pool.length);
    picked.push(pool.splice(index, 1)[0]);
  }
  return picked.sort((a, b) => a - b);
}

function getInfoGroups() {
  const grouped = [];
  infoGroupState.forEach((item) => {
    let group = grouped.find((entry) => entry.group === item.group);
    if (!group) {
      group = { group: item.group, items: [] };
      grouped.push(group);
    }
    group.items.push(item.key);
  });
  return grouped;
}

function getRandomAssignment(nZones, nGroups) {
  if (nGroups === 0) return [];
  if (nGroups === 1 || nZones === 1) return Array(nGroups).fill(0);
  
  if (nZones >= nGroups) {
    const zones = Array.from({ length: nZones }, (_, i) => i);
    for (let i = zones.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [zones[i], zones[j]] = [zones[j], zones[i]];
    }
    return zones.slice(0, nGroups);
  } else {
    for (let attempt = 0; attempt < 1000; attempt++) {
      const temp = [];
      for (let i = 0; i < nGroups; i++) {
        temp.push(Math.floor(Math.random() * nZones));
      }
      if (new Set(temp).size >= nZones) {
        return temp;
      }
    }
    const temp = [];
    for (let i = 0; i < nGroups; i++) {
      temp.push(i % nZones);
    }
    return temp;
  }
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function makeItem(x, y, align = "left", width = 38, shiftY = 0, padX = HPAD, padY = VPAD) {
  return {
    anchorX: clamp(x, padX, 100 - padX),
    y: clamp(y, padY, 100 - padY),
    align,
    width,
    shiftY,
    padX,
    padY,
  };
}

function fontLabel(value) {
  if (value.includes("Barlow Condensed")) return "Barlow Condensed";
  if (value.includes("Barlow")) return "Barlow";
  if (value.includes("Cormorant Garamond")) return "Cormorant Garamond";
  if (value.includes("DM Sans")) return "DM Sans";
  if (value.includes("EB Garamond")) return "EB Garamond";
  if (value.includes("Inter")) return "Inter";
  if (value.includes("JetBrains Mono")) return "JetBrains Mono";
  if (value.includes("Lora")) return "Lora";
  if (value.includes("Oswald")) return "Oswald";
  if (value.includes("Outfit")) return "Outfit";
  if (value.includes("Playfair Display")) return "Playfair Display";
  if (value.includes("Space Grotesk")) return "Space Grotesk";
  if (value.includes("Space Mono")) return "Space Mono";
  if (value.includes("Syne")) return "Syne";
  if (value.includes("Georgia")) return "Georgia";
  if (value.includes("Times New Roman")) return "Times New Roman";
  if (value.includes("Courier New")) return "Courier New";
  return "Arial";
}

function writeStyleControls(nextStyle) {
  document.querySelector("#sizeModeSelect").value = nextStyle.sizeMode;
  document.querySelector("#nameFontSelect").value = nextStyle.nameFont;
  document.querySelector("#bodyFontSelect").value = nextStyle.bodyFont;
  document.querySelector("#nameSizeInput").value = nextStyle.nameSize;
  document.querySelector("#bodySizeInput").value = nextStyle.bodySize;
  document.querySelector("#nameWeightSelect").value = nextStyle.nameWeight;
  document.querySelector("#bodyWeightSelect").value = nextStyle.bodyWeight;
}

function readNumberControl(selector, fallback) {
  const value = document.querySelector(selector).value.trim();
  if (!value) return fallback;
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function getStyleValues() {
  const sizeMode = document.querySelector("#sizeModeSelect").value;
  const rawNameSize = readNumberControl("#nameSizeInput", styleState.nameSize);
  const rawBodySize = readNumberControl("#bodySizeInput", styleState.bodySize);
  const nameSize = sizeMode === "one" ? clamp(rawNameSize, 12, 20) : clamp(rawNameSize, 18, 58);
  return {
    sizeMode,
    nameFont: document.querySelector("#nameFontSelect").value,
    bodyFont: document.querySelector("#bodyFontSelect").value,
    nameSize,
    bodySize: sizeMode === "one" ? nameSize : clamp(Math.min(rawBodySize, nameSize - 1), 8, 20),
    nameWeight: Number(document.querySelector("#nameWeightSelect").value),
    bodyWeight: Number(document.querySelector("#bodyWeightSelect").value),
  };
}

function applyTextStyle({ syncInputs = true } = {}) {
  styleState = getStyleValues();
  if (syncInputs) {
    document.querySelector("#nameSizeInput").value = styleState.nameSize;
    document.querySelector("#bodySizeInput").value = styleState.bodySize;
  }
  const root = document.documentElement;
  root.style.setProperty("--name-font", styleState.nameFont);
  root.style.setProperty("--body-font", styleState.bodyFont);
  root.style.setProperty("--name-size", (styleState.nameSize / 5.2).toFixed(3));
  root.style.setProperty("--body-size", (styleState.bodySize / 5.2).toFixed(3));
  root.style.setProperty("--name-weight", String(styleState.nameWeight));
  root.style.setProperty("--body-weight", String(styleState.bodyWeight));
  document.querySelector("#bodySizeInput").disabled = styleState.sizeMode === "one";
  const fontCount = styleState.nameFont === styleState.bodyFont ? 1 : 2;
  document.querySelector("#styleStatus").textContent =
    `Fonts ${fontCount} / ` +
    `Sizes ${styleState.sizeMode === "one" ? "1" : "2"} / ` +
    `Name ${fontLabel(styleState.nameFont)} ${styleState.nameSize}px ${styleState.nameWeight} / ` +
    `Info ${fontLabel(styleState.bodyFont)} ${styleState.bodySize}px ${styleState.bodyWeight}`;
}

function boxLeft(item) {
  const padX = item.padX ?? 4;
  if (item.align === "right") return item.anchorX - item.width;
  return Math.max(item.anchorX, padX);
}

function itemTextX(item) {
  const left = boxLeft(item);
  if (item.align === "right") return left + item.width;
  return left;
}

// [name, company, role, contact] → zone index
function getTemplates(nZones) {
  if (nZones === 1) return [
    [0, 0, 0, 0],
  ];
  if (nZones === 2) return [
    [0, 1, 0, 1],  // name+role z0 | company+contact z1
    [0, 1, 1, 1],  // name z0      | rest z1
    [0, 0, 0, 1],  // name+company+role z0 | contact z1
    [0, 0, 1, 1],  // name+company z0 | role+contact z1
    [1, 0, 1, 0],  // name+role z1 | company+contact z0
    [1, 0, 0, 1],  // name z1 | company+role z0 | contact z1
    [1, 0, 0, 0],  // name z1 | rest z0
    [0, 1, 0, 0],  // name+role+contact z0 | company z1
  ];
  return [           //  zones: 0=TL 1=TR 2=BL 3=BR
    [0, 1, 2, 3],   // name TL  company TR  role BL  contact BR
    [0, 1, 3, 2],   // name TL  company TR  role BR  contact BL
    [1, 0, 3, 2],   // name TR  company TL  role BR  contact BL
    [1, 0, 2, 3],   // name TR  company TL  role BL  contact BR
    [2, 1, 0, 3],   // name BL  company TR  role TL  contact BR
    [3, 0, 1, 2],   // name BR  company TL  role TR  contact BL
    [2, 3, 0, 1],   // name BL  company BR  role TL  contact TR
    [0, 1, 2, 2],   // name TL  company TR  role+contact BL
    [0, 1, 3, 3],   // name TL  company TR  role+contact BR
    [0, 0, 2, 3],   // name+company TL  role BL  contact BR
    [1, 1, 2, 3],   // name+company TR  role BL  contact BR
    [0, 1, 2, 1],   // name TL  company+contact TR  role BL
    [1, 0, 3, 0],   // name TR  company+contact TL  role BR
  ];
}

function buildAxisLayout(options = {}) {
  const padX = options.padX ?? HPAD;
  const padY = options.padY ?? VPAD;

  const isManual = layoutMode === "manual";
  const hasVLine = isManual ? (options.hasVLine ?? manualState.hasVLine) : true;
  const hasHLine = isManual ? (options.hasHLine ?? manualState.hasHLine) : true;

  const vLine = hasVLine ? options.vLine ?? (isManual ? manualState.vLine : 50) : null;
  const hLine = hasHLine ? options.hLine ?? (isManual ? manualState.hLine : 50) : null;

  const nVZones = hasVLine ? 2 : 1;
  const nHZones = hasHLine ? 2 : 1;
  const nZones  = nVZones * nHZones;
  const infoGroups = options.infoGroups ?? getInfoGroups();

  const singleAlign = !hasVLine ? options.singleAlign ?? "left" : null;
  const singleX = singleAlign === "right" ? 100 - padX : padX;

  const zoneAnchors = [];
  for (let h = 0; h < nHZones; h++) {
    for (let v = 0; v < nVZones; v++) {
      const anchorOverride = options.vAnchors?.[v];
      const rowOverride = options.hAnchors?.[h];
      const y = rowOverride ?? (h === 0 ? padY : (isManual ? hLine + 2 : 100 - padY));
      const x     = anchorOverride ? anchorOverride.x
                  : hasVLine ? (v === 0 ? padX : 100 - padX) : singleX;
      const align = anchorOverride ? anchorOverride.align
                  : hasVLine ? (v === 0 ? "left" : "right")
                  : singleAlign === "right" ? "right" : "left";
      zoneAnchors.push({ x, y, align });
    }
  }

  const assignment = options.assignment ?? getRandomAssignment(nZones, infoGroups.length);
  const zoneGroups = {};
  assignment.forEach((zoneIdx, groupIdx) => {
    if (!zoneGroups[zoneIdx]) zoneGroups[zoneIdx] = [];
    zoneGroups[zoneIdx].push(infoGroups[groupIdx]);
  });

  const result = {};

  Object.entries(zoneGroups).forEach(([zoneStr, assignedGroups]) => {
    const zoneIdx = Number(zoneStr);
    const anchor = zoneAnchors[zoneIdx];
    const zoneItems = assignedGroups.flatMap((group) => group.items);
    
    // Determine if this is a bottom-row zone (h=1)
    const hIdx = Math.floor(zoneIdx / nVZones);
    const isBottom = hIdx >= 1;
    
    if (isBottom) {
      // Stack upward: total includes ALL items' gaps so group ends before margin
      const totalHeight = zoneItems.reduce((sum, key) => sum + itemMetrics[key].gap, 0);
      let y = anchor.y - totalHeight;
      y = clamp(y, padY, 100 - padY);
      zoneItems.forEach((key) => {
        const metrics = itemMetrics[key];
        result[key] = makeItem(anchor.x, y, anchor.align, metrics.width, 0, padX, padY);
        y += metrics.gap;
      });
    } else {
      // Stack downward from the top anchor
      let y = clamp(anchor.y, padY, 100 - padY);
      zoneItems.forEach((key) => {
        const metrics = itemMetrics[key];
        result[key] = makeItem(anchor.x, y, anchor.align, metrics.width, 0, padX, padY);
        y += metrics.gap;
      });
    }
  });

  return {
    axes: { h: hLine ? [hLine] : [], v: vLine ? [vLine] : [] },
    items: result,
    params: {
      padX,
      padY,
      hasVLine,
      hasHLine,
      vLine,
      hLine,
      assignment,
      infoGroups,
      vAnchors: options.vAnchors,
      hAnchors: options.hAnchors,
      singleAlign,
      singleX
    }
  };
}

function fallbackLayout() {
  const result = {};
  const infoGroups = getInfoGroups();
  const nZones = 4;
  
  const zoneAnchors = [
    { x: HPAD, y: VPAD, align: "left" },              // TL
    { x: 100 - HPAD, y: VPAD, align: "right" },       // TR
    { x: HPAD, y: 100 - VPAD, align: "left" },        // BL
    { x: 100 - HPAD, y: 100 - VPAD, align: "right" }, // BR
  ];

  const zoneGroups = {};
  infoGroups.forEach((group, index) => {
    const zoneIdx = index % nZones;
    if (!zoneGroups[zoneIdx]) zoneGroups[zoneIdx] = [];
    zoneGroups[zoneIdx].push(group);
  });

  Object.entries(zoneGroups).forEach(([zoneStr, assignedGroups]) => {
    const zoneIdx = Number(zoneStr);
    const anchor = zoneAnchors[zoneIdx];
    const zoneItems = assignedGroups.flatMap((group) => group.items);
    const isBottom = zoneIdx >= 2; // zones 2 (BL) and 3 (BR) are bottom
    
    if (isBottom) {
      const totalHeight = zoneItems.reduce((sum, key) => sum + (itemMetrics[key]?.gap || 8), 0);
      let y = anchor.y - totalHeight;
      y = clamp(y, VPAD, 100 - VPAD);
      zoneItems.forEach((key) => {
        const metrics = itemMetrics[key] || { width: 44, gap: 8 };
        result[key] = makeItem(anchor.x, y, anchor.align, metrics.width, 0, HPAD, VPAD);
        y += metrics.gap;
      });
    } else {
      let y = clamp(anchor.y, VPAD, 100 - VPAD);
      zoneItems.forEach((key) => {
        const metrics = itemMetrics[key] || { width: 44, gap: 8 };
        result[key] = makeItem(anchor.x, y, anchor.align, metrics.width, 0, HPAD, VPAD);
        y += metrics.gap;
      });
    }
  });

  return {
    axes: { h: [], v: [] },
    items: result,
  };
}

function applyItem(id, item) {
  const element = document.querySelector(id);
  if (!element) return;
  element.style.left = `${boxLeft(item)}%`;
  element.style.top = `${item.y}%`;
  element.style.setProperty("--item-align", item.align);
  element.style.width = `${item.width}%`;
  element.style.setProperty("--shift-y", `${item.shiftY}%`);
}

function applyAxisLayout(state) {
  Object.entries(state.items).forEach(([key, item]) => {
    if (item) applyItem(`#${key}Block`, item);
  });
}

function updateGuideOverlay() {
  const marginY = marginYPct(manualState.margin);
  const showGuides = layoutMode === "manual" && manualState.guidesVisible;
  card.classList.toggle("manual-mode", showGuides);
  card.style.setProperty("--guide-v", `${manualState.vLine}%`);
  card.style.setProperty("--guide-h", `${manualState.hLine}%`);
  card.style.setProperty("--margin-x", `${manualState.margin}%`);
  card.style.setProperty("--margin-y", `${marginY}%`);
  document.querySelector(".guide-line-v").hidden = !showGuides || !manualState.hasVLine;
  document.querySelector(".guide-line-h").hidden = !showGuides || !manualState.hasHLine;
  document.querySelectorAll(".margin-line").forEach((line) => {
    line.hidden = !showGuides;
  });
}

function syncManualControls() {
  document.querySelector("#manualControls").hidden = layoutMode !== "manual";
  document.querySelector("#layoutModeSelect").value = layoutMode;
  document.querySelector("#manualGuidesVisible").checked = manualState.guidesVisible;
  document.querySelector("#manualVEnabled").checked = manualState.hasVLine;
  document.querySelector("#manualHEnabled").checked = manualState.hasHLine;
  document.querySelector("#manualVInput").value = manualState.vLine;
  document.querySelector("#manualHInput").value = manualState.hLine;
  document.querySelector("#manualMarginInput").value = manualState.margin;
  document.querySelector("#manualVInput").disabled = !manualState.hasVLine;
  document.querySelector("#manualHInput").disabled = !manualState.hasHLine;
  updateGuideOverlay();
}

function applyGroupingChange() {
  manualState.assignment = null;
  if (layoutMode === "manual") {
    applyManualLayout();
  } else {
    applyReadableLayout();
    buildPrintSheet();
  }
}

function moveItem(draggedKey, type, targetKey, insertAfter) {
  const draggedIndex = infoGroupState.findIndex((entry) => entry.key === draggedKey);
  if (draggedIndex === -1) return;
  
  if (draggedKey === targetKey) {
    if (type === "join") return;
    if (type === "new_before") {
      infoGroupState[draggedIndex].group = Math.max(0, ...infoGroupState.map(i => i.group)) + 1;
      normalizeInfoGroups();
      renderInfoLayerControls();
      applyGroupingChange();
      return;
    }
  }

  let newState = [...infoGroupState];
  const [draggedItem] = newState.splice(draggedIndex, 1);
  
  if (type === "join") {
    const targetIndex = newState.findIndex((entry) => entry.key === targetKey);
    if (targetIndex === -1) return;
    const targetGroup = newState[targetIndex].group;
    const insertIndex = targetIndex + (insertAfter ? 1 : 0);
    newState.splice(insertIndex, 0, draggedItem);
    draggedItem.group = targetGroup;
  } else if (type === "new_before") {
    const targetIndex = newState.findIndex((entry) => entry.key === targetKey);
    const insertIndex = targetIndex !== -1 ? targetIndex : newState.length;
    newState.splice(insertIndex, 0, draggedItem);
    draggedItem.group = Math.max(0, ...newState.map(i => i.group)) + 1;
  } else if (type === "new_last") {
    newState.push(draggedItem);
    draggedItem.group = Math.max(0, ...newState.map(i => i.group)) + 1;
  }

  infoGroupState = newState;
  normalizeInfoGroups();
  renderInfoLayerControls();
  applyGroupingChange();
}



function normalizeInfoGroups() {
  let group = 0;
  let previousGroup = null;
  infoGroupState.forEach((item) => {
    if (item.group !== previousGroup) group += 1;
    previousGroup = item.group;
    item.group = group;
  });
}



function renderInfoLayerControls() {
  const list = document.querySelector("#infoLayerList");
  if (!list) return;
  normalizeInfoGroups();
  const rows = Object.fromEntries(
    [...list.querySelectorAll(".info-layer")].map((row) => [row.dataset.item, row])
  );
  list.innerHTML = "";

  getInfoGroups().forEach((group, groupIndex) => {
    const groupNode = document.createElement("section");
    groupNode.className = "info-group";
    groupNode.dataset.group = String(group.group);

    const header = document.createElement("div");
    header.className = "info-group-header";
    header.innerHTML = `<span class="folder-icon" aria-hidden="true"></span><span>Group ${groupIndex + 1}</span>`;
    groupNode.appendChild(header);

    group.items.forEach((key) => {
      const item = infoGroupState.find((entry) => entry.key === key);
      const row = rows[key];
      if (!row || !item) return;
      row.draggable = true;
      groupNode.appendChild(row);
    });
    list.appendChild(groupNode);
  });
}

let cachedDropTargets = [];
let currentDropTarget = null;
const infoListEl = document.querySelector("#infoLayerList");

if (infoListEl) {
  infoListEl.addEventListener("dragstart", (e) => {
    const layer = e.target.closest(".info-layer");
    if (!layer) return;
    layer.classList.add("is-dragging");
    e.dataTransfer.setData("text/plain", layer.dataset.item);
    e.dataTransfer.effectAllowed = "move";
    
    cachedDropTargets = [];
    document.querySelectorAll(".info-group").forEach((groupNode) => {
      const groupRect = groupNode.getBoundingClientRect();
      const items = groupNode.querySelectorAll(".info-layer");
      if (!items.length) return;
      const firstItem = items[0].dataset.item;
      
      cachedDropTargets.push({
        y: groupRect.top - 6,
        type: "new_before",
        targetKey: firstItem,
        node: groupNode,
        visualClass: "drop-new-top"
      });

      items.forEach((itemNode, index) => {
        const rect = itemNode.getBoundingClientRect();
        cachedDropTargets.push({
          y: index === 0 ? groupRect.top + 20 : rect.top - 4,
          type: "join",
          targetKey: itemNode.dataset.item,
          insertAfter: false,
          node: itemNode,
          visualClass: "drop-join-top"
        });
        if (index === items.length - 1) {
          cachedDropTargets.push({
            y: rect.bottom + 4,
            type: "join",
            targetKey: itemNode.dataset.item,
            insertAfter: true,
            node: itemNode,
            visualClass: "drop-join-bottom"
          });
        }
      });
    });
    
    const lastGroup = document.querySelector(".info-group:last-child");
    if (lastGroup) {
      cachedDropTargets.push({
        y: lastGroup.getBoundingClientRect().bottom + 6,
        type: "new_last",
        node: lastGroup,
        visualClass: "drop-new-bottom"
      });
    }
  });

  infoListEl.addEventListener("dragend", (e) => {
    const layer = e.target.closest(".info-layer");
    if (layer) layer.classList.remove("is-dragging");
    if (currentDropTarget) {
      currentDropTarget.node.classList.remove(currentDropTarget.visualClass);
      currentDropTarget = null;
    }
    cachedDropTargets = [];
  });

  infoListEl.addEventListener("dragover", (e) => {
    e.preventDefault();
    if (!cachedDropTargets.length) return;
    
    let closest = cachedDropTargets[0];
    let minDiff = Infinity;
    cachedDropTargets.forEach(target => {
      const diff = Math.abs(e.clientY - target.y);
      if (diff < minDiff) {
        minDiff = diff;
        closest = target;
      }
    });

    if (currentDropTarget !== closest) {
      if (currentDropTarget) {
        currentDropTarget.node.classList.remove(currentDropTarget.visualClass);
      }
      currentDropTarget = closest;
      currentDropTarget.node.classList.add(currentDropTarget.visualClass);
    }
  });

  infoListEl.addEventListener("drop", (e) => {
    e.preventDefault();
    const draggedKey = e.dataTransfer.getData("text/plain");
    if (!draggedKey || !currentDropTarget) return;
    
    const target = currentDropTarget;
    if (currentDropTarget) {
      currentDropTarget.node.classList.remove(currentDropTarget.visualClass);
      currentDropTarget = null;
    }
    
    moveItem(draggedKey, target.type, target.targetKey, target.insertAfter);
  });
}

function getManualVAnchorModes() {
  return manualState.hasVLine ? ["outer", "guide", "left-outer-right-guide", "left-guide-right-outer"] : ["outer"];
}

function getManualVAnchors() {
  const mode = manualState.hasVLine ? manualState.vAnchorMode : "outer";
  const leftEdge = { x: manualState.margin, align: "left" };
  const rightEdge = { x: 100 - manualState.margin, align: "right" };
  const guideLeft = { x: manualState.vLine - gutterVal / 2, align: "right" };
  const guideRight = { x: manualState.vLine + gutterVal / 2, align: "left" };
  if (mode === "guide") return [guideLeft, guideRight];
  if (mode === "left-outer-right-guide") return [leftEdge, guideRight];
  if (mode === "left-guide-right-outer") return [guideLeft, rightEdge];
  return [leftEdge, rightEdge];
}

function ensureManualVAnchorMode() {
  const modes = getManualVAnchorModes();
  if (!modes.includes(manualState.vAnchorMode)) manualState.vAnchorMode = modes[0];
}

function getManualHAnchorModes() {
  return manualState.hasHLine ? ["outer", "guide", "top-outer-bottom-guide", "top-guide-bottom-outer"] : ["outer"];
}

function getManualHAnchors() {
  const mode = manualState.hasHLine ? manualState.hAnchorMode : "outer";
  const marginY = marginYPct(manualState.margin);
  const topEdge = marginY;
  const bottomEdge = 100 - marginY;
  const guideTop = manualState.hLine - gutterVal / 2;
  const guideBottom = manualState.hLine + gutterVal / 2;
  if (mode === "guide") return [guideTop, guideBottom];
  if (mode === "top-outer-bottom-guide") return [topEdge, guideBottom];
  if (mode === "top-guide-bottom-outer") return [guideTop, bottomEdge];
  return [topEdge, bottomEdge];
}

function ensureManualHAnchorMode() {
  const modes = getManualHAnchorModes();
  if (!modes.includes(manualState.hAnchorMode)) manualState.hAnchorMode = modes[0];
}

function buildManualLayout() {
  const nVZones = manualState.hasVLine ? 2 : 1;
  const nHZones = manualState.hasHLine ? 2 : 1;
  const nZones = nVZones * nHZones;
  const infoGroups = getInfoGroups();
  const hasValidAssignment =
    manualState.assignment &&
    manualState.assignment.length === infoGroups.length &&
    manualState.assignment.every((zoneIdx) => zoneIdx < nZones);
  if (!hasValidAssignment) {
    manualState.assignment = getRandomAssignment(nZones, infoGroups.length);
  }
  ensureManualVAnchorMode();
  ensureManualHAnchorMode();
  return buildAxisLayout({
    hasVLine: manualState.hasVLine,
    hasHLine: manualState.hasHLine,
    vLine: manualState.vLine,
    hLine: manualState.hLine,
    padX: manualState.margin,
    padY: marginYPct(manualState.margin),
    assignment: manualState.assignment,
    infoGroups,
    vAnchors: getManualVAnchors(),
    hAnchors: getManualHAnchors(),
    singleAlign: "left",
  });
}

function applyManualLayout() {
  layoutState = buildManualLayout();
  applyAxisLayout(layoutState);
  syncManualControls();
  buildPrintSheet();
}

function randomizeManualLayout() {
  const nVZones = manualState.hasVLine ? 2 : 1;
  const nHZones = manualState.hasHLine ? 2 : 1;
  const nZones = nVZones * nHZones;
  const nGroups = getInfoGroups().length;
  
  let newAssignment;
  const currentStr = JSON.stringify(manualState.assignment);
  for (let attempt = 0; attempt < 100; attempt++) {
    newAssignment = getRandomAssignment(nZones, nGroups);
    if (JSON.stringify(newAssignment) !== currentStr) {
      break;
    }
  }
  manualState.assignment = newAssignment;

  const vAnchorModes = getManualVAnchorModes();
  const hAnchorModes = getManualHAnchorModes();
  manualState.vAnchorMode = sampleDifferent(vAnchorModes, manualState.vAnchorMode);
  manualState.hAnchorMode = sampleDifferent(hAnchorModes, manualState.hAnchorMode);
  layoutMode = "manual";
  applyManualLayout();
}

function randomizeCurrentLayout() {
  if (layoutMode === "manual") {
    randomizeManualLayout();
    return;
  }
  applyReadableLayout();
  buildPrintSheet();
}

function applyCurrentLayout() {
  if (layoutMode === "manual") {
    applyManualLayout();
  } else if (layoutState && layoutState.params) {
    const updated = buildAxisLayout(layoutState.params);
    layoutState = updated;
    applyAxisLayout(updated);
    buildPrintSheet();
  } else {
    applyReadableLayout();
    buildPrintSheet();
  }
}

function rectsOverlap(a, b, gap = 6) {
  return !(a.right + gap <= b.left || b.right + gap <= a.left || a.bottom + gap <= b.top || b.bottom + gap <= a.top);
}

function hasLayoutProblem() {
  const cardRect = card.getBoundingClientRect();
  const rects = [...card.querySelectorAll(".card-item")].map((node) => node.getBoundingClientRect());
  
  const marginPctX = layoutMode === "manual" ? manualState.margin : HPAD;
  const marginPctY = layoutMode === "manual" ? marginYPct(manualState.margin) : VPAD;
  
  const marginPxX = (marginPctX / 100) * cardRect.width;
  const marginPxY = (marginPctY / 100) * cardRect.height;

  const outOfBounds = rects.some(
    (rect) =>
      rect.left < cardRect.left + marginPxX - 1.5 ||
      rect.top < cardRect.top + marginPxY - 1.5 ||
      rect.bottom > cardRect.bottom - marginPxY + 1.5
  );
  const overlapping = rects.some((rect, index) => rects.slice(index + 1).some((other) => rectsOverlap(rect, other)));
  return outOfBounds || overlapping;
}

// Fast mathematical overlap check — avoids DOM reflow
function hasItemOverlap(items, padX, padY) {
  const boxes = [];
  Object.entries(items).forEach(([key, item]) => {
    if (!item) return;
    const left = boxLeft(item);
    const top = item.y;
    const right = left + item.width;
    const gap = itemMetrics[key]?.gap || 8;
    const bottom = top + gap;
    boxes.push({ left, top, right, bottom });
  });
  // Check overlap between all pairs
  for (let i = 0; i < boxes.length; i++) {
    const a = boxes[i];
    if (a.left < padX - 0.5 || a.top < padY - 0.5) return true;
    for (let j = i + 1; j < boxes.length; j++) {
      const b = boxes[j];
      if (!(a.right + 1 <= b.left || b.right + 1 <= a.left || a.bottom + 0.5 <= b.top || b.bottom + 0.5 <= a.top)) {
        return true;
      }
    }
  }
  return false;
}

function applyReadableLayout() {
  layoutMode = "auto";
  // Phase 1: generate candidates with fast math check (no DOM reflow)
  for (let i = 0; i < 30; i += 1) {
    const candidate = buildAxisLayout();
    if (!hasItemOverlap(candidate.items, HPAD, VPAD)) {
      layoutState = candidate;
      applyAxisLayout(candidate);
      // Phase 2: final DOM check for subpixel/font issues
      if (!hasLayoutProblem()) {
        syncManualControls();
        return;
      }
    }
  }
  // Fallback
  layoutState = fallbackLayout();
  applyAxisLayout(layoutState);
  syncManualControls();
}

function setLayout(layout) {
  card.classList.remove(...layouts);
  card.classList.add(layout);
  currentLayout = layout;
  applyReadableLayout();
  buildPrintSheet();
}

function setFont(font) {
  card.classList.remove(...fonts);
  card.classList.add(font);
  currentFont = font;
  const fontMap = {
    "font-inter": "Inter, Arial, Helvetica, sans-serif",
    "font-sans": "Arial, Helvetica, sans-serif",
    "font-serif": "Georgia, 'Times New Roman', serif",
    "font-mono": "'Courier New', Courier, monospace",
    "font-soft": "Verdana, Geneva, sans-serif",
  };
  document.querySelector("#nameFontSelect").value = fontMap[font];
  document.querySelector("#bodyFontSelect").value = sample([fontMap[font], "Inter, Arial, Helvetica, sans-serif"]);
  applyTextStyle();
  buildPrintSheet();
}

function makeRandomTypeStyle() {
  const fontCount = sample([1, 2]);
  const sizeMode = sample(["one", "two"]);
  const nameFont = sample(fontChoices);
  const bodyFont = fontCount === 1 ? nameFont : sample(fontChoices.filter((font) => font !== nameFont));
  const bodySize = sizeMode === "one" ? sample([12, 13, 14, 15, 16, 18, 20]) : sample([8, 9, 10, 11, 12, 13, 14, 15, 16]);
  const nameSize = sizeMode === "one" ? bodySize : sample([22, 26, 30, 34, 38, 42, 46, 52, 58].filter((size) => size > bodySize));
  const nameWeight = sample([400, 700, 800, 900]);
  const bodyWeight = sample([400, 700, 800].filter((w) => w <= nameWeight));

  return {
    sizeMode,
    nameFont,
    bodyFont,
    nameSize,
    bodySize,
    nameWeight,
    bodyWeight,
  };
}

function makeRandomFontPair() {
  const pair = sample(fontPairings);
  return sample([true, false]) ? pair : [...pair].reverse();
}

function randomizeTypography() {
  for (let i = 0; i < 40; i += 1) {
    writeStyleControls(makeRandomTypeStyle());
    applyTextStyle();
    if (!hasLayoutProblem()) {
      buildPrintSheet();
      return;
    }
  }
  // Fallback: just keep the last random style
  buildPrintSheet();
}

function randomizeFontPairOnly() {
  for (let i = 0; i < 40; i += 1) {
    const [nameFont, bodyFont] = makeRandomFontPair();
    document.querySelector("#nameFontSelect").value = nameFont;
    document.querySelector("#bodyFontSelect").value = bodyFont;
    applyTextStyle();
    if (!hasLayoutProblem()) {
      buildPrintSheet();
      return;
    }
  }
  buildPrintSheet();
}

function syncFields() {
  Object.entries(fields).forEach(([key, [inputSelector, outputSelector]]) => {
    if (inputSelector && outputSelector) {
      const input = document.querySelector(inputSelector);
      const output = document.querySelector(outputSelector);
      if (input && output) {
        output.textContent = input.value.trim() || input.placeholder || "";
      }
    }
  });
  
  document.querySelectorAll(".info-layer[data-custom]").forEach(row => {
    const key = row.dataset.item;
    const value = row.querySelector(".custom-value").value.trim();
    const output = document.querySelector(`#preview_${key}`);
    if (output) output.textContent = value || " ";
  });
  
  buildPrintSheet();
}

function buildPrintSheet() {
  const count = Number(document.querySelector("#copiesSelect").value);
  printSheet.innerHTML = "";
  for (let i = 0; i < count; i += 1) {
    const clone = card.cloneNode(true);
    clone.removeAttribute("id");
    clone.classList.remove("manual-mode");
    clone.querySelectorAll(".guide-line").forEach((guide) => guide.remove());
    clone.querySelectorAll(".margin-line").forEach((guide) => guide.remove());
    printSheet.appendChild(clone);
  }
}

function roundedRect(ctx, x, y, width, height, radius) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + width, y, x + width, y + height, radius);
  ctx.arcTo(x + width, y + height, x, y + height, radius);
  ctx.arcTo(x, y + height, x, y, radius);
  ctx.arcTo(x, y, x + width, y, radius);
  ctx.closePath();
}

function drawMultiline(ctx, text, x, y, maxWidth, lineHeight) {
  const words = text.split(" ");
  const lines = [];
  let line = "";

  words.forEach((word) => {
    const test = line ? `${line} ${word}` : word;
    if (ctx.measureText(test).width > maxWidth && line) {
      lines.push(line);
      line = word;
    } else {
      line = test;
    }
  });
  if (line) lines.push(line);

  lines.slice(0, 2).forEach((lineText, index) => {
    ctx.fillText(lineText, x, y + index * lineHeight);
  });
}

function canvasX(item, width) {
  return (itemTextX(item) / 100) * width;
}

function canvasY(item, height) {
  return (item.y / 100) * height;
}

function canvasAlign(item) {
  return item.align === "right" ? "right" : "left";
}

function canvasWidth(item, width) {
  return (item.width / 100) * width;
}

function exportPng() {
  const color = getComputedStyle(document.documentElement).getPropertyValue("--card-color").trim();
  const canvas = document.createElement("canvas");
  const scale = 4;
  const width = 1050;
  const height = 600;
  canvas.width = width * scale;
  canvas.height = height * scale;

  const ctx = canvas.getContext("2d");
  ctx.scale(scale, scale);
  ctx.fillStyle = color;
  roundedRect(ctx, 0, 0, width, height, 0);
  ctx.fill();

  const nameFamily = fontLabel(styleState.nameFont);
  const bodyFamily = fontLabel(styleState.bodyFont);
  const state = layoutState || buildAxisLayout();

  const nameInput = document.querySelector("#nameInput");
  const nameVal = nameInput ? nameInput.value : "business-card";

  Object.entries(state.items).forEach(([key, item]) => {
    if (!item) return;

    let text = "";
    if (fields[key]) {
      const input = document.querySelector(fields[key][0]);
      if (input) text = input.value.trim();
    } else if (key.startsWith("custom_")) {
      const row = document.querySelector(`.info-layer[data-item="${key}"]`);
      if (row) {
        const valInput = row.querySelector(".custom-value");
        if (valInput) text = valInput.value.trim();
      }
    }

    if (!text) return;

    ctx.textAlign = canvasAlign(item);
    ctx.fillStyle = "#000000";

    if (key === "name") {
      ctx.font = `${styleState.nameWeight} ${Math.round(styleState.nameSize * 2.1)}px ${nameFamily}`;
      ctx.fillText(text, canvasX(item, width), canvasY(item, height));
    } else if (key === "company" || key === "role") {
      ctx.font = `${styleState.bodyWeight} ${Math.round(styleState.bodySize * 2.1)}px ${bodyFamily}`;
      ctx.fillText(text, canvasX(item, width), canvasY(item, height));
    } else {
      ctx.font = `${styleState.bodyWeight} ${Math.round(styleState.bodySize * 2.1)}px ${bodyFamily}`;
      drawMultiline(
        ctx,
        text,
        canvasX(item, width),
        canvasY(item, height),
        canvasWidth(item, width),
        styleState.bodySize * 2.3
      );
    }
  });

  const link = document.createElement("a");
  link.download = `${nameVal.trim().replace(/\s+/g, "-")}.png`;
  link.href = canvas.toDataURL("image/png");
  link.click();
}

Object.values(fields).forEach(([inputSelector]) => {
  if (inputSelector) {
    document.querySelector(inputSelector).addEventListener("input", syncFields);
  }
});

let customFieldCount = 0;
document.addEventListener("click", (e) => {
  if (e.target.closest("#addCustomFieldBtn")) {
    customFieldCount += 1;
    const key = `custom_${customFieldCount}`;
    
    const row = document.createElement("section");
    row.className = "info-layer";
    row.dataset.item = key;
    row.dataset.custom = "true";
    row.innerHTML = `
      <div class="layer-tools">
        <span class="drag-handle" aria-hidden="true">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M12 4v16M8 8l4-4 4 4M8 16l4 4 4-4"/>
          </svg>
        </span>
      </div>
      <label style="display: flex; gap: 8px; width: 100%; align-items: center;">
        <input class="custom-label" type="text" placeholder="Label" value="Custom" style="width: 60px; flex: none; border: none; background: transparent; padding: 0; font-weight: 500; font-size: inherit; font-family: inherit; color: inherit; height: auto;" />
        <input class="custom-value" type="text" placeholder="Value" value="New Info" style="flex: 1;" />
        <button class="delete-btn icon-btn" type="button" aria-label="Delete field" style="color: #ff0055;">×</button>
      </label>
    `;
    
    row.querySelector(".custom-value").addEventListener("input", syncFields);
    row.querySelector(".custom-label").addEventListener("input", syncFields);
    
    document.querySelector("#infoLayerList").appendChild(row);
    
    const blockNode = document.createElement("div");
    blockNode.id = `${key}Block`;
    blockNode.className = "card-item detail-block";
    blockNode.innerHTML = `<p id="preview_${key}">New Info</p>`;
    document.querySelector(".card-content").appendChild(blockNode);
    
    itemMetrics[key] = { width: 44, gap: 8 };
    
    const lastGroup = infoGroupState.length ? infoGroupState[infoGroupState.length - 1].group : 1;
    infoGroupState.push({ key, group: lastGroup });
    
    renderInfoLayerControls();
    syncFields();
    randomizeCurrentLayout(); // Rebuild layout with new item
  }
  
  if (e.target.closest(".delete-btn")) {
    const row = e.target.closest(".info-layer");
    if (!row) return;
    const key = row.dataset.item;
    
    const index = infoGroupState.findIndex(entry => entry.key === key);
    if (index !== -1) infoGroupState.splice(index, 1);
    
    const blockNode = document.querySelector(`#${key}Block`);
    if (blockNode) blockNode.remove();
    
    row.remove();
    
    if (fields[key]) {
      const outputSelector = fields[key][1];
      const output = document.querySelector(outputSelector);
      if (output) output.remove();
    }
    
    renderInfoLayerControls();
    syncFields();
    randomizeCurrentLayout();
  }
});

document.querySelector("#randomLayout").addEventListener("click", () => {
  randomizeCurrentLayout();
});

document.querySelector("#randomFont").addEventListener("click", () => {
  randomizeTypography();
});

document.querySelector("#randomFontPair").addEventListener("click", () => {
  randomizeFontPairOnly();
});

document.querySelector("#layoutModeSelect").addEventListener("change", (event) => {
  layoutMode = event.target.value;
  if (layoutMode === "manual") {
    applyManualLayout();
  } else {
    applyReadableLayout();
    buildPrintSheet();
  }
});

document.querySelector("#manualGuidesVisible").addEventListener("change", (event) => {
  manualState.guidesVisible = event.target.checked;
  layoutMode = "manual";
  syncManualControls();
});

[
  ["#manualVEnabled", "hasVLine"],
  ["#manualHEnabled", "hasHLine"],
].forEach(([selector, key]) => {
  document.querySelector(selector).addEventListener("change", (event) => {
    manualState[key] = event.target.checked;
    layoutMode = "manual";
    applyManualLayout();
  });
});

[
  ["#manualVInput", "vLine"],
  ["#manualHInput", "hLine"],
].forEach(([selector, key]) => {
  document.querySelector(selector).addEventListener("input", (event) => {
    manualState[key] = Number(event.target.value);
    layoutMode = "manual";
    applyManualLayout();
  });
});

document.querySelector("#manualMarginInput").addEventListener("input", (event) => {
  manualState.margin = Number(event.target.value);
  layoutMode = "manual";
  applyManualLayout();
});

function startGuideDrag(guide, event, isPointer) {
  if (layoutMode !== "manual") return;
  event.preventDefault();
  const guideType = guide.dataset.guide;
  if (isPointer) guide.setPointerCapture(event.pointerId);

  function moveGuide(moveEvent) {
    const rect = card.getBoundingClientRect();
    if (guideType === "v") {
      manualState.vLine = Math.round(clamp(((moveEvent.clientX - rect.left) / rect.width) * 100, 24, 76));
    } else {
      manualState.hLine = Math.round(clamp(((moveEvent.clientY - rect.top) / rect.height) * 100, 24, 76));
    }
    applyManualLayout();
  }

  function stopGuide() {
    const target = isPointer ? guide : window;
    target.removeEventListener(isPointer ? "pointermove" : "mousemove", moveGuide);
    target.removeEventListener(isPointer ? "pointerup" : "mouseup", stopGuide);
    if (isPointer) target.removeEventListener("pointercancel", stopGuide);
  }

  const target = isPointer ? guide : window;
  moveGuide(event);
  target.addEventListener(isPointer ? "pointermove" : "mousemove", moveGuide);
  target.addEventListener(isPointer ? "pointerup" : "mouseup", stopGuide);
  if (isPointer) target.addEventListener("pointercancel", stopGuide);
}

function startMarginDrag(guide, event, isPointer) {
  if (layoutMode !== "manual") return;
  event.preventDefault();
  const guideType = guide.dataset.marginGuide;
  if (isPointer) guide.setPointerCapture(event.pointerId);

  function moveMargin(moveEvent) {
    const rect = card.getBoundingClientRect();
    let nextMargin;
    if (guideType === "left") {
      nextMargin = ((moveEvent.clientX - rect.left) / rect.width) * 100;
    } else if (guideType === "right") {
      nextMargin = ((rect.right - moveEvent.clientX) / rect.width) * 100;
    } else if (guideType === "top") {
      nextMargin = ((moveEvent.clientY - rect.top) / rect.height) * 100 / CARD_RATIO;
    } else {
      nextMargin = ((rect.bottom - moveEvent.clientY) / rect.height) * 100 / CARD_RATIO;
    }
    manualState.margin = Math.round(clamp(nextMargin, 0, 18));
    applyManualLayout();
  }

  function stopMargin() {
    const target = isPointer ? guide : window;
    target.removeEventListener(isPointer ? "pointermove" : "mousemove", moveMargin);
    target.removeEventListener(isPointer ? "pointerup" : "mouseup", stopMargin);
    if (isPointer) target.removeEventListener("pointercancel", stopMargin);
  }

  const target = isPointer ? guide : window;
  moveMargin(event);
  target.addEventListener(isPointer ? "pointermove" : "mousemove", moveMargin);
  target.addEventListener(isPointer ? "pointerup" : "mouseup", stopMargin);
  if (isPointer) target.addEventListener("pointercancel", stopMargin);
}

document.querySelectorAll(".guide-line").forEach((guide) => {
  guide.addEventListener("pointerdown", (event) => startGuideDrag(guide, event, true));
  guide.addEventListener("mousedown", (event) => startGuideDrag(guide, event, false));
});

document.querySelectorAll(".margin-line").forEach((guide) => {
  guide.addEventListener("pointerdown", (event) => startMarginDrag(guide, event, true));
  guide.addEventListener("mousedown", (event) => startMarginDrag(guide, event, false));
});

[
  "#sizeModeSelect",
  "#nameFontSelect",
  "#bodyFontSelect",
  "#nameWeightSelect",
  "#bodyWeightSelect",
].forEach((selector) => {
  document.querySelector(selector).addEventListener("input", () => {
    applyTextStyle();
    buildPrintSheet();
  });
});

[
  "#nameSizeInput",
  "#bodySizeInput",
].forEach((selector) => {
  const input = document.querySelector(selector);
  input.addEventListener("input", () => {
    applyTextStyle({ syncInputs: false });
    buildPrintSheet();
  });
  input.addEventListener("change", () => {
    applyTextStyle();
    buildPrintSheet();
  });
  input.addEventListener("blur", () => {
    applyTextStyle();
    buildPrintSheet();
  });
});

document.querySelector("#gutterInput").addEventListener("input", (event) => {
  gutterScale = Number(event.target.value) / 12;
  gutterVal = gutterScale * 2.0;
  applyCurrentLayout();
});

document.querySelector("#colorPicker").addEventListener("input", (event) => {
  applyColor(event.target.value);
  buildPrintSheet();
});

document.querySelector("#colorCode").addEventListener("input", (event) => {
  const hex = normalizeHex(event.target.value);
  if (hex) {
    applyColor(hex);
    buildPrintSheet();
  }
});

document.querySelector("#downloadPng").addEventListener("click", exportPng);

document.querySelector("#printPdf").addEventListener("click", () => {
  buildPrintSheet();
  window.print();
});

document.querySelector("#copiesSelect").addEventListener("change", buildPrintSheet);

renderInfoLayerControls();
applyReadableLayout();
syncFields();
randomizeTypography();
buildPrintSheet();
