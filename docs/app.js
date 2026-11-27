'use strict';
const uk = document.documentElement.lang === 'uk';
const t = (en, ua) => uk ? ua : en;
const get = id => document.getElementById(id);
const input = get('input'), values = get('values'), format = get('format');
const result = get('result'), status = get('status'), copy = get('copy'), download = get('download');
const buttons = [...document.querySelectorAll('[data-mode]')];
const api = window.PortfolioTools;
const hints = {
  text: t('Trim whitespace, normalize blank lines, and count words and characters.', 'Приберіть зайві пробіли й порожні рядки та порахуйте слова й символи.'),
  data: t('Choose comma, semicolon or tab-separated data with a header, or format JSON.', 'Виберіть роздільник: кома, крапка з комою або табуляція. Або відформатуйте JSON.'),
  doc: t('Insert {{field}} placeholders and supply values as a JSON object. Download the completed text document.', 'Вставте поля {{field}} і передайте значення в об’єкті JSON. Завантажте готовий текстовий документ.')
};
const examples = {
  text: t('  Field    notes  \n\n\n  Two reports ready.  ', '  Робочі    нотатки  \n\n\n  Два звіти готові.  '),
  CSV: 'item,qty,price\nNotebook,2,3.50\n"Pen, black",5,1.20\nFolder,1,',
  CSV_SEMI: 'item;qty\nNotebook;2',
  TSV: 'item\tqty\nNotebook\t2',
  JSON: '{"project":"Sample","items":[{"name":"Notebook","qty":2},{"name":"Folder","qty":1}]}',
  doc: t('Delivery note\nReference: {{reference}}\nDate: {{date}}\nItem: {{item}}\nQuantity: {{quantity}}',
    'Накладна\nНомер: {{reference}}\nДата: {{date}}\nТовар: {{item}}\nКількість: {{quantity}}'),
  values: JSON.stringify({reference:'DEMO-021',date:'2026-11-25',item:t('Notebook','Зошит'),quantity:2}, null, 2)
};
const errors = {
  jsonDepth: t('JSON nesting exceeds 100 levels.','Вкладеність JSON перевищує 100 рівнів.'),
  outputLimit: t('Generated output exceeds the size limit.','Результат перевищує допустимий розмір.'),
  csvQuote: t('Check paired quotation marks in the CSV.','Перевірте парність лапок у CSV.'),
  csvHeader: t('CSV needs a nonempty header for every column.','У CSV потрібен заголовок для кожного стовпця.'),
  csvWidth: t('Every CSV row must have the same number of fields as the header.','Кількість полів у кожному рядку CSV має збігатися із заголовком.'),
  badJson: t('Enter valid JSON.','Введіть коректний JSON.'),
  badValues: t('Enter a JSON object containing the template values.','Введіть об’єкт JSON зі значеннями шаблону.')
};
let mode = 'text', filename = '', output = '';
const drafts = {};
const key = () => mode === 'data' ? format.value : mode;
function show(text = '', message = '', file = '') {
  output = file ? text : '';
  filename = file;
  result.textContent = text;
  status.textContent = message;
  copy.disabled = download.disabled = !file;
}
function selectMode(next) {
  drafts[key()] = input.value;
  mode = next;
  buttons.forEach(button => button.setAttribute('aria-pressed', String(button.dataset.mode === mode)));
  get('tool-title').textContent = buttons.find(b => b.dataset.mode === mode).textContent;
  get('hint').textContent = hints[mode];
  get('input-label').textContent = mode === 'doc' ? t('Document template','Шаблон документа') : t('Input','Вхідні дані');
  get('format-group').hidden = mode !== 'data';
  get('values-group').hidden = mode !== 'doc';
  input.value = drafts[key()] ?? examples[key()];
  show();
}
function run(event) {
  event.preventDefault();
  if (!input.value.trim()) { show('', t('Enter some data first.','Спочатку введіть дані.')); return; }
  try {
    if (mode === 'text') {
      const a = api.cleanText(input.value);
      show(a.text, t(`Words: ${a.words} · Characters: ${a.characters} · Lines: ${a.lines}`,
        `Слова: ${a.words} · Символи: ${a.characters} · Рядки: ${a.lines}`), 'clean-text.txt');
    } else if (mode === 'doc') {
      const a = api.makeDocument(input.value, values.value);
      if (a.missing.length) show(a.text, t('Missing or invalid values: ','Відсутні або некоректні значення: ') + a.missing.join(', '));
      else show(a.text, t('Document ready.','Документ готовий.'), 'document.txt');
    } else if (format.value === 'JSON') {
      const a = api.analyzeJSON(input.value);
      const kind = {array:'масив',object:'об’єкт',null:'null',number:'число',boolean:'булеве',string:'рядок'};
      const size = a.size === null ? '' : t(` · Entries: ${a.size}`, ` · Елементи: ${a.size}`);
      show(a.text, t('Valid JSON · Type: '+a.type,'Коректний JSON · Тип: '+kind[a.type]) + size, 'formatted.json');
    } else {
      const a = api.parseCSV(input.value, format.value === 'TSV' ? '\t' : format.value === 'CSV_SEMI' ? ';' : ',');
      const summary = t(`Rows: ${a.rows.length} · Columns: ${a.headers.length} · Empty cells: ${a.empty}`,
        `Рядки: ${a.rows.length} · Стовпці: ${a.headers.length} · Порожні клітинки: ${a.empty}`);
      const preview = [a.headers, ...a.rows.slice(0, 20)].map(row => row.map(cell => JSON.stringify(cell)).join(' | ')).join('\n');
      show(summary + '\n\n' + t('Preview (up to 20 data rows)','Перегляд (до 20 рядків даних)') + '\n' + preview, summary, 'csv-analysis.txt');
    }
  } catch (error) { show('', errors[error.message] || t('Could not process this input.','Не вдалося обробити ці дані.')); }
}
input.value = examples.text;
values.value = examples.values;
get('hint').textContent = hints.text;
let activeFormat = format.value;
format.addEventListener('change', () => {
  drafts[activeFormat] = input.value;
  activeFormat = format.value;
  input.value = drafts[key()] ?? examples[key()];
  show();
});
buttons.forEach(button => button.addEventListener('click', () => selectMode(button.dataset.mode)));
get('tool').addEventListener('submit', run);
get('sample').addEventListener('click', () => {
  input.value = examples[key()];
  if (mode === 'doc') values.value = examples.values;
  show();
});
[input, values].forEach(field => field.addEventListener('input', () => show()));
copy.addEventListener('click', async () => {
  try { await navigator.clipboard.writeText(output); status.textContent = t('Copied.','Скопійовано.'); }
  catch { status.textContent = t('Clipboard unavailable. Select the result or download it.','Буфер обміну недоступний. Виділіть результат або завантажте його.'); }
});
download.addEventListener('click', () => {
  const url = URL.createObjectURL(new Blob([output], {type: filename.endsWith('.json') ? 'application/json' : 'text/plain;charset=utf-8'}));
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
});
