# Business Card Maker

**A browser tool for designing business cards on a grid, then exporting print-ready files.**
**그리드 위에서 명함 레이아웃과 타이포그래피를 조합하고, 바로 인쇄용 파일로 내보내는 웹 도구.**

**[Live Demo](https://duskarb.github.io/cardgenerator/)**

<!-- TODO(여남규): 생성된 명함 예시 2~3장 또는 편집 화면 스크린샷 추가 -->

Enter your information, then let the tool place it. Each field group (name, role, company, contact) is assigned to a zone on the card grid, and the layout is checked for overlap so the result stays readable. When you want control, switch to manual mode and drag the guide and margin lines yourself.

## Features

- Editable fields: name, role, company, phone, email, website, address, plus custom fields
- **Auto layout**: assigns information groups to grid zones and rejects layouts where text overlaps
- **Manual layout**: drag the vertical/horizontal guides and margin lines, and reorder or regroup fields
- **Randomize Layout / Type / Fonts** for fast exploration
- 17 font choices (sans, serif, mono) with curated name/info pairings, one- or two-size type scale
- Card color picker
- **PNG export** at 4x resolution (4200 × 2400 px)
- **A4 print sheet**: 8 or 10 cards at 90 × 51 mm, laid out for printing to PDF

## Run locally

No build step. Open `index.html` in a browser, or serve the folder:

```bash
npx serve .
```

## Structure

```text
index.html   # editor UI
app.js       # layout engine, controls, PNG export, print sheet
styles.css   # card styles and @page print layout
ref/         # layout reference frames
```

## Built With

HTML · CSS · vanilla JavaScript · Canvas API · Google Fonts
