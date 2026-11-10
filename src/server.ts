import { fileURLToPath } from 'node:url';
import { createApp } from './app.js';
import { systemClock } from './domain/clock.js';
import { createInMemoryRepositories } from './repositories/index.js';

const port = Number(process.env.PORT ?? 3000);
const publicDir = fileURLToPath(new URL('../public', import.meta.url));

const app = createApp({
  clock: systemClock,
  repositories: createInMemoryRepositories(),
  staticDir: publicDir,
});

app.listen(port, (error) => {
  if (error) {
    console.error(`サーバーを起動できませんでした（ポート ${port}）: ${error.message}`);
    process.exit(1);
  }
  console.log(`☕ Bean & Byte Café を起動しました: http://localhost:${port}`);
});
