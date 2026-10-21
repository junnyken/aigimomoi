export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { ensureDatabaseBootstrapped } = await import('./lib/db/autoBootstrap');
    await ensureDatabaseBootstrapped();
  }
}
