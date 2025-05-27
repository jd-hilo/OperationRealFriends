const fs = require('fs');
const path = require('path');

// Path to Info.plist
const infoPlistPath = path.join(__dirname, '../ios/OperationRealSocial/Info.plist');

// Read the current Info.plist
const infoPlist = fs.readFileSync(infoPlistPath, 'utf8');

// Extract current build number
const buildNumberMatch = infoPlist.match(/<key>CFBundleVersion<\/key>\s*<string>(\d+)<\/string>/);
if (!buildNumberMatch) {
  console.error('Could not find CFBundleVersion in Info.plist');
  process.exit(1);
}

const currentBuildNumber = parseInt(buildNumberMatch[1], 10);
const newBuildNumber = currentBuildNumber + 1;

// Replace the build number
const updatedPlist = infoPlist.replace(
  /(<key>CFBundleVersion<\/key>\s*<string>)\d+(<\/string>)/,
  `$1${newBuildNumber}$2`
);

// Write back to Info.plist
fs.writeFileSync(infoPlistPath, updatedPlist);

console.log(`Incremented build number from ${currentBuildNumber} to ${newBuildNumber}`);

// Also update app.config.ts
const appConfigPath = path.join(__dirname, '../app.config.ts');
const appConfig = fs.readFileSync(appConfigPath, 'utf8');

const updatedAppConfig = appConfig.replace(
  /buildNumber: ['"]\d+['"]/,
  `buildNumber: '${newBuildNumber}'`
);

fs.writeFileSync(appConfigPath, updatedAppConfig);

console.log('Updated build number in app.config.ts'); 