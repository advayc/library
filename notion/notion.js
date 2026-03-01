/**
 * notion.js — Adds a "Room booked" event to your Notion Calendar database
 * after a successful booking.
 *
 * Requires two env vars (set them in .env):
 *   NOTION_TOKEN        — your internal integration secret  (secret_xxx...)
 *   NOTION_DATABASE_ID  — the ID of the calendar database   (32-char hex)
 */

const { Client } = require('@notionhq/client');

/**
 * Creates a calendar event in Notion for a successful room booking.
 *
 * @param {Object} opts
 * @param {string}  opts.roomCode  - e.g. "MR 304"
 * @param {string}  opts.roomLabel - e.g. "304 | MR 304"
 * @param {Date}    opts.start     - booking start time
 * @param {Date}    opts.end       - booking end time
 */
async function addToNotionCalendar({ roomCode, roomLabel, start, end }) {
  const token  = process.env.NOTION_TOKEN;
  const dbId   = process.env.NOTION_DATABASE_ID;

  if (!token || !dbId) {
    console.warn(
      '\nSkipping Notion Calendar — NOTION_TOKEN or NOTION_DATABASE_ID not set in .env'
    );
    return null;
  }

  // Build the display title: prefer a numeric room code (e.g. "Room 304 booked").
  let title;
  if (roomCode) {
    const num = String(roomCode).replace(/^MR\s*/i, '').trim();
    title = `Room ${num} booked`;
  } else if (roomLabel) {
    const m = String(roomLabel).match(/\b(\d{1,4})\b/);
    if (m) title = `Room ${m[1]} booked`;
    else title = `${roomLabel} booked`;
  } else {
    title = 'Room booked';
  }

  // Notion expects a local datetime string when a time_zone is provided
  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
  function toLocalDateTimeString(d) {
    const pad = (n) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
  }
  const startISO = toLocalDateTimeString(start);
  const endISO = toLocalDateTimeString(end);

  const notion = new Client({ auth: token });

  try {
    const page = await notion.pages.create({
      parent: { database_id: dbId.replace(/-/g, '') },
      properties: {
        // "Name" is the default title property — rename if yours is different
        Name: {
          title: [{ text: { content: title } }],
        },
        // "Date" is the default date property used by Notion Calendar
        // — rename to match your database property name if it differs
        Date: {
          date: {
            start: startISO,
            end:   endISO,
            time_zone: tz,
          },
        },
      },
    });
    console.log(`\n📅  Added to Notion Calendar: "${title}"`);
    console.log(`    ${page.url}`);
    return page;
  } catch (err) {
    // Print a friendly error without crashing the booking script
    if (err.code === 'object_not_found' || err.status === 404) {
      console.warn(
        '\nNotion error: database not found. ' +
        'Make sure NOTION_DATABASE_ID is correct and you have shared the database with your integration.'
      );
    } else if (err.status === 401) {
      console.warn('\nNotion error: unauthorized — check that NOTION_TOKEN is correct.');
    } else if (err.body) {
      // Parse Notion API body errors (e.g. wrong property names)
      let body;
      try { body = JSON.parse(err.body); } catch { body = { message: err.body }; }
      console.warn('\nNotion API error:', body.message || err.message);
      if (body.message && body.message.includes('property')) {
        console.warn(
          '  Tip: the property names "Name" and "Date" must match your database exactly.\n' +
          '  Open your Notion database and check the column headers.'
        );
      }
    } else {
      console.warn('\nNotion Calendar error:', err.message || err);
    }
    return null;
  }
}

module.exports = { addToNotionCalendar };
