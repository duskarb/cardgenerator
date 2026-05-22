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

function setLayout(layout) {
  card.classList.remove(...layouts);
  card.classList.add(layout);
  currentLayout = layout;
}

function setFont(font) {
  card.classList.remove(...fonts);
  card.classList.add(font);
  currentFont = font;
}

function syncFields() {
  Object.values(fields).forEach(([inputSelector, outputSelector]) => {
    const input = document.querySelector(inputSelector);
    const output = document.querySelector(outputSelector);
    output.textContent = input.value.trim() || input.placeholder || "";
  });
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
  ctx.fillStyle = "#ffffff";
  roundedRect(ctx, 0, 0, width, height, 0);
  ctx.fill();

  if (currentLayout === "layout-invert") {
    ctx.fillStyle = color;
    ctx.fillRect(0, 0, width, height);
    ctx.strokeStyle = "rgba(255,255,255,.4)";
    ctx.lineWidth = 2;
    ctx.strokeRect(44, 44, width - 88, height - 88);
  } else if (currentLayout === "layout-left") {
    ctx.fillStyle = color;
    ctx.fillRect(0, 0, 34, height);
  } else if (currentLayout === "layout-top") {
    ctx.fillStyle = color;
    ctx.fillRect(0, 0, width, 38);
  } else if (currentLayout === "layout-block") {
    ctx.globalAlpha = 0.14;
    ctx.fillStyle = color;
    ctx.fillRect(width * 0.58, 0, width * 0.42, height);
    ctx.globalAlpha = 1;
  } else {
    ctx.fillStyle = color;
    ctx.fillRect(88, height - 72, width - 176, 8);
  }

  const inverted = currentLayout === "layout-invert";
  const centered = currentLayout === "layout-center";
  const ink = inverted ? "#ffffff" : "#172033";
  const muted = inverted ? "rgba(255,255,255,.76)" : "#61708a";
  const family = currentFont === "font-serif" ? "Georgia" : currentFont === "font-mono" ? "Consolas" : "Arial";
  const leftX = centered ? width / 2 : 78;
  const rightX = currentLayout === "layout-left" || currentLayout === "layout-block" ? 625 : 78;

  ctx.textAlign = centered ? "center" : "left";
  ctx.fillStyle = ink;
  ctx.font = `700 26px ${family}`;
  ctx.fillText(data.company || " ", leftX, centered ? 196 : 150);

  ctx.font = `800 82px ${family}`;
  ctx.fillText(data.name || " ", leftX, centered ? 285 : 245);

  ctx.fillStyle = muted;
  ctx.font = `700 31px ${family}`;
  ctx.fillText(data.role || " ", leftX, centered ? 336 : 300);

  ctx.textAlign = centered ? "center" : "left";
  ctx.fillStyle = muted;
  ctx.font = `400 25px ${family}`;
  const contactX = centered ? width / 2 : rightX;
  const contactY = centered ? 408 : 385;
  [data.phone, data.email, data.website, data.address].forEach((line, index) => {
    drawMultiline(ctx, line || " ", contactX, contactY + index * 35, centered ? 760 : 340, 27);
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
});

document.querySelector("#colorCode").addEventListener("input", (event) => {
  const hex = normalizeHex(event.target.value);
  if (hex) applyColor(hex);
});

document.querySelector("#downloadPng").addEventListener("click", exportPng);

document.querySelector("#printPdf").addEventListener("click", () => {
  buildPrintSheet();
  window.print();
});

document.querySelector("#copiesSelect").addEventListener("change", buildPrintSheet);

syncFields();
buildPrintSheet();
