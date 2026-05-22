const card = document.querySelector("#cardPreview");
const printSheet = document.querySelector("#printSheet");

const fields = {
  name: ["#nameInput", "#previewName"],
  role: ["#roleInput", "#previewRole"],
  company: ["#companyInput", "#previewCompany"],
  phone: ["#phoneInput", "#previewPhone"],
  email: ["#emailInput", "#previewEmail"],
  website: ["#websiteInput", "#previewWebsite"],
  address: ["#addressInput", "#previewAddress"],
};

const layouts = ["layout-left", "layout-top", "layout-block", "layout-invert", "layout-center"];
const fonts = ["font-sans", "font-serif", "font-mono", "font-soft"];
let currentLayout = "layout-left";
let currentFont = "font-sans";
let layoutState = null;

const grid = {
  x: [12.5, 25, 37.5, 50, 62.5, 75, 87.5],
  y: [20, 40, 60, 80],
};

const layoutSystems = [
  { hCount: 1, vCount: 1 },
  { hCount: 1, vCount: 2 },
  { hCount: 2, vCount: 1 },
  { hCount: 2, vCount: 2 },
];

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

function sampleUnique(items, count) {
  const pool = [...items];
  const picked = [];
  while (picked.length < count && pool.length) {
    const index = Math.floor(Math.random() * pool.length);
    picked.push(pool.splice(index, 1)[0]);
  }
  return picked.sort((a, b) => a - b);
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function makeItem(x, y, align = "left", width = 38, shiftY = 0) {
  return {
    anchorX: clamp(x, 6, 94),
    y: clamp(y, 8, 84),
    align,
    width,
    shiftY,
  };
}

function boxLeft(item) {
  if (item.align === "right") return clamp(item.anchorX - item.width, 4, 96 - item.width);
  if (item.align === "center") return clamp(item.anchorX - item.width / 2, 4, 96 - item.width);
  return clamp(item.anchorX, 4, 96 - item.width);
}

function buildAxisLayout() {
  const system = sample(layoutSystems);
  const vAxes = sampleUnique(grid.x, system.vCount);
  const hAxes = sampleUnique(grid.y, system.hCount);
  const primaryV = sample(vAxes);
  const primaryH = sample(hAxes);
  const leftV = vAxes[0];
  const rightV = vAxes[vAxes.length - 1];
  const topH = hAxes[0];
  const bottomH = hAxes[hAxes.length - 1];
  const nameMode = sample(["corner", "axis", "center"]);
  const contactMode = sample(["opposite", "bottom", "outer"]);

  let name;
  if (nameMode === "center") {
    name = makeItem(primaryV, topH, "center", 44, 0);
  } else if (nameMode === "axis") {
    name = makeItem(leftV, topH, "left", 44, 0, 0);
  } else {
    name = makeItem(sample([8, leftV]), sample([10, topH]), "left", 48, 0, 0);
  }

  let contact;
  if (contactMode === "bottom") {
    contact = makeItem(name.align === "center" ? primaryV : leftV, sample([bottomH, 78]), name.align, 42, 0);
  } else if (contactMode === "outer") {
    contact = makeItem(sample([8, rightV]), sample([bottomH, 70, 78]), rightV > 70 ? "right" : "left", 38, 0);
  } else {
    contact = makeItem(rightV, bottomH, rightV > 70 ? "right" : "left", 40, 0);
  }

  const company = makeItem(contact.anchorX, clamp(name.y - 10, 8, 78), contact.align, 28, 0);
  const role = makeItem(name.anchorX, clamp(name.y + sample([18, 24, 30]), 12, 82), name.align, 34, 0);

  return {
    system,
    axes: { h: hAxes, v: vAxes },
    items: { company, name, role, contact },
    nameSize: sample([40, 46, 52, 58]),
  };
}

function applyItem(id, item) {
  const element = document.querySelector(id);
  element.style.left = `${boxLeft(item)}%`;
  element.style.top = `${item.y}%`;
  element.style.setProperty("--item-align", item.align);
  element.style.width = `${item.width}%`;
  element.style.setProperty("--shift-y", `${item.shiftY}%`);
}

function applyAxisLayout(state) {
  applyItem("#companyBlock", state.items.company);
  applyItem("#nameBlock", state.items.name);
  applyItem("#roleBlock", state.items.role);
  applyItem("#contactBlock", state.items.contact);
  card.style.setProperty("--name-size", `${state.nameSize}px`);
}

function setLayout(layout) {
  card.classList.remove(...layouts);
  card.classList.add(layout);
  currentLayout = layout;
  layoutState = buildAxisLayout();
  applyAxisLayout(layoutState);
  buildPrintSheet();
}

function setFont(font) {
  card.classList.remove(...fonts);
  card.classList.add(font);
  currentFont = font;
  buildPrintSheet();
}

function syncFields() {
  Object.values(fields).forEach(([inputSelector, outputSelector]) => {
    const input = document.querySelector(inputSelector);
    const output = document.querySelector(outputSelector);
    output.textContent = input.value.trim() || input.placeholder || "";
  });
  buildPrintSheet();
}

function buildPrintSheet() {
  const count = Number(document.querySelector("#copiesSelect").value);
  printSheet.innerHTML = "";
  for (let i = 0; i < count; i += 1) {
    const clone = card.cloneNode(true);
    clone.removeAttribute("id");
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
  const left = (boxLeft(item) / 100) * width;
  const itemWidth = canvasWidth(item, width);
  if (item.align === "right") return left + itemWidth;
  if (item.align === "center") return left + itemWidth / 2;
  return left;
}

function canvasY(item, height) {
  return (item.y / 100) * height;
}

function canvasAlign(item) {
  return item.align === "right" ? "right" : item.align === "center" ? "center" : "left";
}

function canvasWidth(item, width) {
  return (item.width / 100) * width;
}

function exportPng() {
  const data = Object.fromEntries(
    Object.entries(fields).map(([key, [inputSelector]]) => [key, document.querySelector(inputSelector).value])
  );
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

  const family = currentFont === "font-serif" ? "Georgia" : currentFont === "font-mono" ? "Consolas" : "Arial";
  const state = layoutState || buildAxisLayout();
  const company = state.items.company;
  const name = state.items.name;
  const role = state.items.role;
  const contact = state.items.contact;

  ctx.textAlign = canvasAlign(company);
  ctx.fillStyle = "#000000";
  ctx.font = `700 26px ${family}`;
  ctx.fillText(data.company || " ", canvasX(company, width), canvasY(company, height));

  ctx.textAlign = canvasAlign(name);
  ctx.font = `800 ${Math.round(state.nameSize * 1.7)}px ${family}`;
  ctx.fillText(data.name || " ", canvasX(name, width), canvasY(name, height));

  ctx.textAlign = canvasAlign(role);
  ctx.fillStyle = "#000000";
  ctx.font = `700 31px ${family}`;
  ctx.fillText(data.role || " ", canvasX(role, width), canvasY(role, height));

  ctx.textAlign = canvasAlign(contact);
  ctx.fillStyle = "#000000";
  ctx.font = `400 25px ${family}`;
  [data.phone, data.email, data.website, data.address].forEach((line, index) => {
    drawMultiline(ctx, line || " ", canvasX(contact, width), canvasY(contact, height) + index * 35, canvasWidth(contact, width), 27);
  });

  const link = document.createElement("a");
  link.download = `${(data.name || "business-card").trim().replace(/\s+/g, "-")}.png`;
  link.href = canvas.toDataURL("image/png");
  link.click();
}

Object.values(fields).forEach(([inputSelector]) => {
  document.querySelector(inputSelector).addEventListener("input", syncFields);
});

document.querySelector("#randomLayout").addEventListener("click", () => {
  setLayout(chooseNext(layouts, currentLayout));
});

document.querySelector("#randomFont").addEventListener("click", () => {
  setFont(chooseNext(fonts, currentFont));
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

layoutState = buildAxisLayout();
applyAxisLayout(layoutState);
syncFields();
buildPrintSheet();
