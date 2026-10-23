// Streams JS console output from every Radius app attached to Metro (both phones)
// into one file, prefixed by device. RN 0.82+ sends JS logs only to DevTools.
//   node scripts/js-log.js /tmp/radius-js.log
const WebSocket = require(require('path').join(process.cwd(), 'node_modules/ws'));
const http = require('http');
const fs = require('fs');

const APP_IDS = ['com.offlineprotocol.radius'];
const ORIGIN = { headers: { Origin: 'http://localhost:8081' } };
const out = fs.createWriteStream(process.argv[2] || '/tmp/radius-js.log', { flags: 'a' });
const ts = () => new Date().toTimeString().slice(0, 8);
const fmt = a =>
  a.type === 'string' ? a.value : 'value' in a ? JSON.stringify(a.value) : a.description || a.type;
const attached = new Set();

function poll() {
  http
    .get('http://localhost:8081/json/list', res => {
      let body = '';
      res.on('data', d => (body += d));
      res.on('end', () => {
        let targets = [];
        try { targets = JSON.parse(body); } catch {}
        targets.filter(t => APP_IDS.includes(t.appId)).forEach(attach);
      });
    })
    .on('error', () => {});
}

function attach(t) {
  const key = t.webSocketDebuggerUrl;
  if (attached.has(key)) return;
  attached.add(key);
  const dev = (t.deviceName || t.title || '?').slice(0, 12);
  const ws = new WebSocket(key, ORIGIN);
  ws.on('open', () => {
    out.write(`${ts()} [${dev}] attached\n`);
    ws.send(JSON.stringify({ id: 1, method: 'Runtime.enable' }));
  });
  ws.on('message', raw => {
    let m;
    try { m = JSON.parse(raw); } catch { return; }
    if (m.method === 'Runtime.consoleAPICalled') {
      out.write(`${ts()} [${dev}] [${m.params.type}] ${m.params.args.map(fmt).join(' ')}\n`);
    } else if (m.method === 'Runtime.exceptionThrown') {
      out.write(`${ts()} [${dev}] [exception] ${JSON.stringify(m.params.exceptionDetails).slice(0, 500)}\n`);
    }
  });
  ws.on('close', () => attached.delete(key));
  ws.on('error', () => attached.delete(key));
}

setInterval(poll, 2000);
poll();
