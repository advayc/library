require('dotenv').config();
const { Client } = require('@notionhq/client');

async function main() {
  const token = process.env.NOTION_TOKEN;
  const dbId  = process.env.NOTION_DATABASE_ID;
  if (!token || !dbId) {
    console.error('Please set NOTION_TOKEN and NOTION_DATABASE_ID in .env');
    process.exit(1);
  }

  const notion = new Client({ auth: token });
  try {
    const db = await notion.databases.retrieve({ database_id: dbId.replace(/-/g, '') });
    console.log('\nDatabase title:', JSON.stringify(db.title || db.name || '(untitled)'));
    console.log('\nProperties:');
    for (const [k,v] of Object.entries(db.properties || {})) {
      console.log(`  - ${k}: type=${v.type}`);
    }
    console.log('\nIf you want me to update `notion.js` to use different property names, tell me which property is the title and which is the date.');
  } catch (err) {
    console.error('\nFailed to retrieve database:');
    console.error(err && err.body ? (err.body.message || JSON.stringify(err.body)) : (err.message || err));
    process.exit(1);
  }
}

main();
