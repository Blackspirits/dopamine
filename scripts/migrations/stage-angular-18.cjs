// One-time Angular 17 -> 18 manifest staging helper. It does not install anything.
// Run on a throwaway checkout using Node 20 and apply the official v18 schematics.
'use strict';

const fs = require('node:fs');
const path = require('node:path');
const file = path.resolve(__dirname, '../../package.json');
const pkg = JSON.parse(fs.readFileSync(file, 'utf8'));

if (pkg.devDependencies?.['@angular/core'] !== '17.3.12' ||
    pkg.devDependencies?.['@angular/cli'] !== '17.3.17' ||
    pkg.devDependencies?.['jest-preset-angular'] !== '13.1.6') {
    throw new Error('Unexpected Angular 17 baseline; inspect manually before proceeding.');
}

const names = [
    'animations', 'common', 'compiler', 'compiler-cli', 'core', 'forms',
    'language-service', 'platform-browser', 'platform-browser-dynamic',
    'router', 'cdk', 'material',
];

for (const name of names) {
    const key = '@angular/' + name;
    let found = false;
    for (const group of ['dependencies', 'devDependencies']) {
        if (Object.prototype.hasOwnProperty.call(pkg[group] ?? {}, key)) {
            pkg[group][key] = '18.2.14';
            found = true;
        }
    }
    if (!found) throw new Error('Expected package not found: ' + key);
}

Object.assign(pkg.devDependencies, {
    '@angular/cli': '18.2.21',
    '@angular-devkit/build-angular': '18.2.21',
    '@angular-builders/custom-webpack': '18.0.0',
    'typescript': '5.5.4',
    '@types/node': '^20.19.0',
    'jest-preset-angular': '14.5.5',
});

let count = 0;
for (const key of Object.keys(pkg.devDependencies)) {
    if (key.startsWith('@angular-eslint/')) {
        pkg.devDependencies[key] = '18.4.3';
        count++;
    }
}
if (count !== 5) throw new Error('Unexpected Angular ESLint dependency count: ' + count);

fs.writeFileSync(file, JSON.stringify(pkg, null, 4) + '\n');
console.log('Angular 18 manifest staged; run the official Angular migrations next.');
