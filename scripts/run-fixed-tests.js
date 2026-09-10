import { spawn } from 'node:child_process';

console.log('🚀 Starting fixed server on port 3002...');
const server = spawn('node', ['src/server.fixed.js'], {
  env: { ...process.env, PORT: '3002' },
  stdio: 'inherit'
});

// Give server 800ms to bind to port
await new Promise((resolve) => setTimeout(resolve, 800));

console.log('🧪 Running automated test suite against fixed application...');
const tests = spawn('node', ['--test', 'tests/api/address.spec.js', 'tests/api/validation.spec.js', 'tests/ui/address-ui.spec.js'], {
  env: {
    ...process.env,
    TEST_TARGET: 'fixed',
    APP_URL: 'http://localhost:3002'
  },
  stdio: 'inherit'
});

tests.on('exit', (code) => {
  console.log('\n🛑 Shutting down fixed server...');
  server.kill('SIGINT');
  process.exit(code ?? 0);
});
