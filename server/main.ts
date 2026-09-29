import { createApp } from './app';

async function main() {
  const app = await createApp();
  await app.listen(4311, '127.0.0.1');
  console.log('API: http://127.0.0.1:4311/api/health');
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
