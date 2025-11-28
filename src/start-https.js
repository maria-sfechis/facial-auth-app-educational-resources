// start-https.js
import { spawn } from 'child_process';

// Setează variabilele de environment pentru HTTPS
process.env.HTTPS = 'true';
process.env.HOST = '0.0.0.0';
process.env.PORT = '3000';

// Pornește React dev server
const reactProcess = spawn('npm', ['start'], {
  stdio: 'inherit',
  shell: true,
  env: process.env
});

reactProcess.on('close', (code) => {
  console.log(`React dev server s-a închis cu codul ${code}`);
});