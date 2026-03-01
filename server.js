#!/usr/bin/env node
/*
  Minimal Express server that exposes a /book endpoint so you can trigger
  booking.js from your phone (iOS Shortcut, browser, etc.) without needing
  a terminal.

  POST /book
  Body (JSON): { "date": "wednesday march 4 6-8pm", "capacity": 6 }

  The server spawns booking.js in headless + fully-automatic mode and
  streams the log output back as plain text in the response.

  Protect the endpoint with a secret token set via the API_TOKEN env var.
  The iOS Shortcut (or any client) must send:
    Authorization: Bearer <your token>

  Env vars (set these in Railway):
    PORT          — Railway sets this automatically
    API_TOKEN     — secret string you choose; used to protect /book
    USER_EMAIL    — Active Mississauga login
    USER_PASSWORD — Active Mississauga password
*/

const http    = require('http');
const { spawn } = require('child_process');
const path    = require('path');
const url     = require('url');

const PORT      = process.env.PORT || 3000;
const API_TOKEN = process.env.API_TOKEN || '';

// --- simple request body reader ---
function readBody(req) {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', chunk => { data += chunk; });
    req.on('end', () => {
      try { resolve(JSON.parse(data || '{}')); }
      catch { resolve({}); }
    });
    req.on('error', reject);
  });
}

// --- auth check ---
function isAuthorized(req) {
  if (!API_TOKEN) return true; // no token configured → open (not recommended for prod)
  const authHeader = req.headers['authorization'] || '';
  return authHeader === `Bearer ${API_TOKEN}`;
}

// --- spawn booking.js and stream output ---
function runBooking(date, capacity, onData, onDone) {
  const args = [
    path.join(__dirname, 'booking.js'),
    '--headless',
    '--yes',
    '--auto',
    '--quiet',
    '--date', date,
    '--capacity', String(Number(capacity) || 4),
  ];

  const child = spawn(process.execPath, args, {
    env: { ...process.env },
    cwd: __dirname,
  });

  child.stdout.on('data', d => onData(d.toString()));
  child.stderr.on('data', d => onData('[stderr] ' + d.toString()));
  child.on('close', code => onDone(code));
}

// --- HTTP server ---
const server = http.createServer(async (req, res) => {
  const { pathname } = url.parse(req.url || '');

  // Health-check — Railway / uptime monitors hit GET /
  if (req.method === 'GET' && (pathname === '/' || pathname === '/health')) {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('Room Booker is running. POST /book to trigger a booking.');
    return;
  }

  // Booking endpoint
  if (req.method === 'POST' && pathname === '/book') {
    if (!isAuthorized(req)) {
      res.writeHead(401, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Unauthorized. Provide Authorization: Bearer <API_TOKEN>.' }));
      return;
    }

    const body = await readBody(req);
    const date     = (body.date || '').trim();
    const capacity = Number(body.capacity) || 4;

    if (!date) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Missing "date" field. Example: "wednesday march 4 6-8pm"' }));
      return;
    }

    // Collect all output, then return a single JSON response.
    // iPhone Shortcuts need a complete JSON body to parse — streaming won't work.
    const lines = [];
    runBooking(date, capacity,
      (line) => lines.push(line),
      (code) => {
        const output = lines.join('');
        // Try to extract the summary line (e.g. "✔ Meeting Room 304 booked for ...")
        const summaryMatch = output.match(/✔\s*(.+)/);
        const summary = summaryMatch ? summaryMatch[1].trim() : null;
        const success = code === 0 || !!summary;

        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({
          success,
          summary: summary || (success ? 'Booking completed — check your account.' : 'Booking may have failed.'),
          exitCode: code,
          log: output,
        }));
      }
    );
    return;
  }

  // 404 for everything else
  res.writeHead(404, { 'Content-Type': 'text/plain' });
  res.end('Not found. Available: GET / | POST /book');
});

server.listen(PORT, () => {
  console.log(`Room Booker server listening on port ${PORT}`);
  if (!API_TOKEN) {
    console.warn('WARNING: API_TOKEN is not set. The /book endpoint is unprotected!');
  }
});
