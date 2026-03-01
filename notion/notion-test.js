// Quick test runner for the Notion calendar integration
// Usage: node notion/notion-test.js
// It will attempt to create an event for Friday March 6, 2026 18:00-20:00 local time.

require('dotenv').config();
const { addToNotionCalendar } = require('./notion');

async function main() {
  const token = process.env.NOTION_TOKEN;
  const dbId  = process.env.NOTION_DATABASE_ID;

  if (!token) {
    console.error('\nNOTION_TOKEN is not set in .env. Create an internal integration and paste the token into .env');
    process.exit(1);
  }
  if (!dbId || dbId.includes('x')) {
    console.error('\nNOTION_DATABASE_ID is not set or looks like a placeholder.');
    console.error('How to get it: open the Notion database page and copy the 32-char id from the URL (hyphens optional).');
    console.error('Also: share the database with your integration under the Share menu.');
    process.exit(1);
  }

  // March 7, 2026 (Saturday) 14:00-16:00 local time (EST)
  const start = new Date('2026-03-07T14:00:00' );
  const end   = new Date('2026-03-07T16:00:00' );

  console.log('\nAttempting to create a Notion calendar entry for:');
  console.log(`  Title: Room 299 booked`);
  console.log(`  Start: ${start.toString()}`);
  console.log(`  End:   ${end.toString()}`);
// dummy data for testing the database integration
  const page = await addToNotionCalendar({ roomCode: 'MR 299', roomNum: '299', roomLabel: '299 | MR 299', start, end, titlePrefix: '[TEST] ' });
  if (page) console.log('\nTest succeeded.');
  else console.log('\nTest did not create a page — check errors above.');
}

main().catch(err => { console.error('Fatal:', err && err.message ? err.message : err); process.exit(1); });
