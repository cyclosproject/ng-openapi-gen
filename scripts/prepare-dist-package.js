#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Read the source package.json
const sourcePackage = JSON.parse(fs.readFileSync('package.json', 'utf8'));

// Create a clean package.json for distribution
const distPackage = {
  name: sourcePackage.name,
  version: sourcePackage.version,
  license: sourcePackage.license,
  author: sourcePackage.author,
  description: sourcePackage.description,
  keywords: sourcePackage.keywords,
  repository: sourcePackage.repository,
  private: false,
  bin: sourcePackage.bin,
  main: sourcePackage.main,
  dependencies: sourcePackage.dependencies,
  peerDependencies: sourcePackage.peerDependencies
};

// Write the clean package.json to dist
fs.writeFileSync(
  path.join('dist', 'package.json'),
  JSON.stringify(distPackage, null, 2) + '\n'
);

console.log('✅ Created clean dist/package.json');
