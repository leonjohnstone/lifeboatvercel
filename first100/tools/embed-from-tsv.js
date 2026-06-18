#!/usr/bin/env node
/*
Convert a TSV file into an embedded FIRST100_ENTRIES array.
Input format: date<TAB>full verbatim entry text
Example: node tools/embed-from-tsv.js entries.tsv > data.entries.js
Then copy the generated FIRST100_ENTRIES array into data.js.
*/
const fs = require('fs');
const path = process.argv[2];
if (!path) {
  console.error('Usage: node tools/embed-from-tsv.js entries.tsv > entries.generated.js');
  process.exit(1);
}
const raw = fs.readFileSync(path, 'utf8').replace(/\r\n/g, '\n');
const rows = raw.split(/\n(?=\d{2}\/\d{2}\/\d{4}\t|\d{4}-\d{2}-\d{2}\t)/).filter(Boolean);
const entries = rows.map(row => {
  const i = row.indexOf('\t');
  if (i < 0) throw new Error('Missing tab in row: ' + row.slice(0, 40));
  let date = row.slice(0, i).trim();
  let text = row.slice(i + 1).trim();
  const dm = date.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (dm) date = `${dm[3]}-${dm[2]}-${dm[1]}`;
  return { date, text };
});
console.log('window.FIRST100_ENTRIES = ' + JSON.stringify(entries, null, 2) + ';');
