'use strict';

const { createApp } = require('./app');
const { UsageStore } = require('./store');
const { seed } = require('./seed');

const PORT = Number(process.env.PORT) || 3000;
const store = new UsageStore();

if (process.env.SEED !== 'false') {
  console.log(`Seeded ${seed(store)} sample usage records (set SEED=false to disable)`);
}

createApp({ store }).listen(PORT, () => {
  console.log(`Subscriber Usage API listening on http://localhost:${PORT}`);
});
