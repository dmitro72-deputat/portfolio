(function (root) {
  'use strict';
  function cleanText(input) {
    const text = input.replace(/\r\n?/g, '\n').split('\n')
      .map(line => line.trim().replace(/[^\S\n]+/g, ' '))
      .join('\n').replace(/\n{3,}/g, '\n\n').trim();
    return { text, words: (text.match(/[\p{L}\p{N}]+(?:[’'-][\p{L}\p{N}]+)*/gu) || []).length,
      characters: [...text].length, lines: text ? text.split('\n').length : 0 };
  }

  function parseCSV(input, delimiter = ',') {
    if (![',', ';', '\t'].includes(delimiter)) throw Error('csvDelimiter');
    const source = input.replace(/^\uFEFF/, '').replace(/\r\n?/g, '\n');
    const rows = [];
    let row = [], value = '', state = 'plain';
    const field = () => { row.push(value); value = ''; state = 'plain'; };
    const record = () => { field(); rows.push(row); row = []; };
    for (let index = 0; index < source.length; index++) {
      const ch = source[index];
      if (state === 'quoted') {
        if (ch === '"' && source[index + 1] === '"') { value += '"'; index++; }
        else if (ch === '"') state = 'closed';
        else value += ch;
      } else if (ch === delimiter) field();
      else if (ch === '\n') record();
      else if (state === 'closed') throw Error('csvQuote');
      else if (ch === '"' && !value) state = 'quoted';
      else if (ch === '"') throw Error('csvQuote');
      else value += ch;
    }
    if (state === 'quoted') throw Error('csvQuote');
    if (!source.endsWith('\n') || row.length || value || state === 'closed') record();
    const headers = rows.shift() || [];
    if (!headers.length || headers.some(h => !h.trim())) throw Error('csvHeader');
    if (rows.some(r => r.length !== headers.length)) throw Error('csvWidth');
    return { headers, rows, empty: rows.flat().filter(cell => !cell.trim()).length };
  }

  function formatJSON(source) {
    let depth = 0, output = '', quoted = false, escaped = false;
    const indent = () => '\n' + '  '.repeat(depth);
    for (let i = 0; i < source.length; i++) {
      const ch = source[i];
      if (quoted) {
        output += ch;
        if (escaped) escaped = false;
        else if (ch === '\\') escaped = true;
        else if (ch === '"') quoted = false;
      } else if (ch === '"') { quoted = true; output += ch; }
      else if (/\s/.test(ch)) continue;
      else if (ch === '{' || ch === '[') {
        const next = source.slice(i + 1).match(/^\s*(.)/s)?.[1];
        if ((ch === '{' && next === '}') || (ch === '[' && next === ']')) {
          output += ch + next;
          while (source[++i] !== next) {}
        } else {
          if (++depth > 100) throw Error('jsonDepth');
          output += ch + indent();
        }
      } else if (ch === '}' || ch === ']') { depth--; output += indent() + ch; }
      else if (ch === ',') output += ch + indent();
      else if (ch === ':') output += ': ';
      else output += ch;
      if (output.length > 2000000) throw Error('outputLimit');
    }
    return output;
  }

  function analyzeJSON(input) {
    let value;
    try { value = JSON.parse(input.replace(/^\uFEFF/, '')); }
    catch { throw Error('badJson'); }
    const type = Array.isArray(value) ? 'array' : value === null ? 'null' : typeof value;
    return { type, size: type === 'array' ? value.length : type === 'object' ? Object.keys(value).length : null,
      text: formatJSON(input.replace(/^\uFEFF/, '')) };
  }

  function makeDocument(template, rawValues) {
    let values;
    try { values = JSON.parse(rawValues); } catch { throw Error('badJson'); }
    if (!values || Array.isArray(values) || typeof values !== 'object') throw Error('badValues');
    const missing = new Set();
    let projectedLength = template.length;
    const text = template.replace(/\{\{\s*([\p{L}\p{N}_-]+)\s*\}\}/gu, (tag, key) => {
      const value = values[key];
      if (!Object.hasOwn(values, key) || !['string', 'number', 'boolean'].includes(typeof value)) {
        missing.add(key);
        return tag;
      }
      const replacement = String(value);
      projectedLength += replacement.length - tag.length;
      if (projectedLength > 1000000) throw Error('outputLimit');
      return replacement;
    });
    return { text, missing: [...missing] };
  }

  const api = { cleanText, parseCSV, analyzeJSON, makeDocument };
  if (typeof module !== 'undefined') module.exports = api;
  else root.PortfolioTools = api;
})(globalThis);
