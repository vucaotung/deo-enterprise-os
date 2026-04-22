const cases = [
  'nhac hop anh Tuyen luc 9h30 o VP 163 Khuat Duy Tien',
  'nhac gap Vina Cooper vao 14:15 mai o van phong',
  'nhac di san bay thu 6 luc 5h',
  'nhac workshop ca ngay ngay 12/04',
  'nhac cafe voi Hung luc 8h 30 phut o quan ABC'
];

const fs = require('fs');
const path = require('path');
const code = fs.readFileSync(path.join(__dirname, 'run-aurora-calendar-sync.js'), 'utf8');
const vm = require('vm');
const sandbox = { console, require, process, __dirname, module: {}, exports: {} };
vm.createContext(sandbox);
vm.runInContext(code + `\nmodule.exports = { normalize, detectLocation, detectDurationMinutes, detectAllDay, parseDateContext, parseTimeParts, extractTitle, parseDateTimeFromText };`, sandbox);
const api = sandbox.module.exports;

for (const input of cases) {
  const title = api.extractTitle(input);
  const start = api.parseDateTimeFromText(input, null);
  const location = api.detectLocation(input);
  const duration = api.detectDurationMinutes(input, title);
  const allDay = api.detectAllDay(input, title);
  console.log(JSON.stringify({ input, title, start, location, duration, allDay }));
}
