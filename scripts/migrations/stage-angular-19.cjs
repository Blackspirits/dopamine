// One-time Angular 18 -> 19 manifest staging helper.
// Use on a disposable checkout. Apply the official Angular CLI/Core/Material
// migration schematics separately and validate generated changes before commit.
'use strict';

const fs = require('node:fs');
const path = require('node:path');

const manifestPath = path.resolve(__dirname, '../../package.json');
const pkg = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));

const expected = {
    '@angular/core': '18.2.14',
    '@angular/cli': '18.2.21',
    '@angular/material': '18.2.14',
    typescript: '5.5.4',
};
for (const [name, version] of Object.entries(expected)) {
    const existing = pkg.devDependencies?.[name] ?? pkg.dependencies?.[name];
    if (existing !== version) {
        throw new Error('Expected Angular 18 baseline ' + name + '@' + version + ', found ' + existing);
    }
}
const names = [
    'animations', 'common', 'compiler', 'compiler-cli', 'core', 'forms',
    'language-service', 'platform-browser', 'platform-browser-dynamic',
    'router', 'cdk', 'material',
];
for (const name of names) {
    const key = '@angular/' + name;
    let present = false;
    for (const group of ['devDependencies', 'dependencies']) {
        if (Object.prototype.hasOwnProperty.call(pkg[group] ?? {}, key)) {
            pkg[group][key] = name === 'material' ? '19.2.19' :
                name === 'cdk' ? '19.2.19' : '19.2.25';
            present = true;
        }
    }
    if (!present) throw new Error('Expected dependency missing: ' + key);
}
Object.assign(pkg.devDependencies, {
    '@angular/cli': '19.2.27',
    '@angular-devkit/build-angular': '19.2.27',
    '@angular-builders/custom-webpack': '^19.0.0',
    typescript: '5.8.3',
    'zone.js': '~0.15.0',
});

let count = 0;
for (const name of Object.keys(pkg.devDependencies)) {
    if (name.startsWith('@angular-eslint/')) {
        pkg.devDependencies[name] = '^19.0.0';
        count++;
    }
}
if (count !== 5) {
    throw new Error('Unexpected Angular ESLint dependency count: ' + count);
}
if (pkg.devDependencies['jest-preset-angular'] !== '14.5.5') {
    throw new Error('Jest version unexpectedly changed; confirm compatibility before upgrading.');
}

fs.writeFileSync(manifestPath, JSON.stringify(pkg, null, 4) + '\n');
console.log('Angular 19 manifest staged. Run official schematics and review the resulting diff.');
