import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const distDir = path.join(rootDir, 'dist');
const packageRoot = path.join(rootDir, 'package');
const mobilePackageDir = path.join(packageRoot, 'mobile-app');
const webBundleDir = path.join(mobilePackageDir, 'www');

if (!fs.existsSync(distDir)) {
  console.error('Missing dist folder. Run npm run build:web first.');
  process.exit(1);
}

fs.mkdirSync(packageRoot, { recursive: true });
fs.rmSync(mobilePackageDir, { recursive: true, force: true });
fs.mkdirSync(webBundleDir, { recursive: true });

fs.cpSync(distDir, webBundleDir, { recursive: true });

const metadata = {
  name: 'ASAR Control Studio Mobile Package',
  generatedAt: new Date().toISOString(),
  source: 'dist',
  target: 'package/mobile-app/www',
  notes: [
    'This folder contains the mobile-ready web bundle.',
    'Use Capacitor, Cordova, or another WebView wrapper to build native apps.',
  ],
};

fs.writeFileSync(path.join(mobilePackageDir, 'package-info.json'), `${JSON.stringify(metadata, null, 2)}\n`, 'utf8');

fs.writeFileSync(
  path.join(mobilePackageDir, 'README.txt'),
  [
    'ASAR Control Studio - Mobile Package',
    '',
    'Contents:',
    '- www/: Static web app bundle copied from dist',
    '- package-info.json: Build metadata',
    '',
    'Next steps:',
    '1. Wrap the www folder with your mobile framework (Capacitor/Cordova).',
    '2. Build native binaries for Android or iOS.',
  ].join('\n'),
  'utf8',
);

console.log(`Mobile package created at: ${mobilePackageDir}`);