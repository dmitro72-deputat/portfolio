const {test} = require('node:test');
const assert = require('node:assert/strict');
const {cleanText, parseCSV, analyzeJSON, makeDocument} = require('../docs/logic.js');

test('normalize whitespace and preserve words in Ukrainian', () => {
  assert.deepEqual(cleanText('  П’ять   слів \r\n\n\n тут '),
    {text:'П’ять слів\n\nтут',words:3,characters:15,lines:3});
});
test('empty text has no lines', () => assert.equal(cleanText('  \n').lines,0));
test('CSV preserves commas, escaped quotes and newlines inside a quoted field', () => {
  assert.deepEqual(parseCSV('\uFEFFname,note\r\n"A,B",Hello\r\n').rows, [['A,B','Hello']]);
  assert.deepEqual(parseCSV('a,b\n"x\ny","said ""hi"""').rows,[['x\ny','said "hi"']]);
});
test('CSV counts empty cells', () => assert.equal(parseCSV('a,b\n1,\n').empty,1));
test('CSV rejects broken headers, row widths and quotes', () => {
  assert.throws(() => parseCSV(',b\n1,2'), /csvHeader/);
  assert.throws(() => parseCSV('a,b\n1'), /csvWidth/);
  assert.throws(() => parseCSV('a\n"1'), /csvQuote/);
});
test('JSON describes arrays and scalar values', () => {
  assert.equal(analyzeJSON('[1,2]').size,2);
  assert.equal(analyzeJSON('null').type,'null');
  assert.throws(() => analyzeJSON('{'), /badJson/);
});
test('Templates substitute false and zero as text without evaluating markup', () => {
  assert.deepEqual(makeDocument('{{x}} {{b}} {{a}}', '{"x":0,"b":false,"a":"<b>x</b>"}'),
    {text:'0 false <b>x</b>',missing:[]});
});
test('Templates report missing, inherited and nonscalar placeholders once', () => {
  assert.deepEqual(makeDocument('{{ x }} {{x}} {{constructor}} {{n}}','{"n":null}').missing,['x','constructor','n']);
  assert.throws(() => makeDocument('{{x}}','[]'), /badValues/);
});

test('JSON preserves large numbers and escaped strings', () => {
  assert.equal(analyzeJSON('{"id":9007199254740993,"x":1e400,"s":"a\\\"b"}').text,
    '{\n  "id": 9007199254740993,\n  "x": 1e400,\n  "s": "a\\\"b"\n}');
  assert.equal(analyzeJSON('[{},[], -0, 1.2300]').text, '[\n  {},\n  [],\n  -0,\n  1.2300\n]');
});
test('JSON rejects excessive nesting', () => {
  assert.throws(() => analyzeJSON('['.repeat(102)+'0'+']'.repeat(102)), /jsonDepth/);
});
test('Document generation rejects oversized output', () => {
  assert.throws(() => makeDocument('{{x}}'.repeat(1001), JSON.stringify({x:'a'.repeat(1000)})), /outputLimit/);
});

test('CSV supports semicolon and tab separators', () => {
  assert.deepEqual(parseCSV('a;b\n"x;y";2',';').rows,[['x;y','2']]);
  assert.deepEqual(parseCSV('a\tb\n1\t2','\t').rows,[['1','2']]);
});
