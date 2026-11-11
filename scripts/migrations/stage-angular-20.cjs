// One-time Angular 19 -> 20 dependency staging helper.
// Runner-only changes: run official Angular schematics and full verification
// before publishing the allowed diff to a feature branch.
'use strict';

const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '../..');
const manifestPath = path.join(root, 'package.json');
const pkg = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
const expected = {
    '@angular/core': '19.2.25',
    '@angular/cli': '19.2.27',
    '@angular/material': '19.2.19',
    typescript: '5.8.3',
    'jest-preset-angular': '14.5.5',
};
for (const [name, version] of Object.entries(expected)) {
    const found = pkg.devDependencies?.[name] ?? pkg.dependencies?.[name];
    if (found !== version) {
        throw new Error('Expected Angular 19 baseline ' + name + '@' + version + ', got ' + found);
    }
}
const typeImportPaths = [
    'src/app/ui/components/collection/album-browser/album-browser.component.ts',
    'src/app/ui/components/collection/collection-playlists/playlist-browser/playlist-browser.component.ts',
    'src/app/ui/components/now-playing/now-playing-lyrics/rich-lyrics/rich-lyrics.component.ts',
];
for (const name of typeImportPaths) {
    if (!fs.readFileSync(path.join(root, name), 'utf8').includes("import type { SimpleChanges } from '@angular/core'")) {
        throw new Error('Missing reviewed Angular 20 type-only import: ' + name);
    }
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
            pkg[group][key] = name === 'cdk' || name === 'material' ? '20.2.14' : '20.3.35';
            found = true;
        }
    }
    if (!found) throw new Error('Required Angular dependency missing: ' + key);
}
Object.assign(pkg.devDependencies, {
    '@angular/cli': '20.3.42',
    '@angular-devkit/build-angular': '20.3.42',
    '@angular-builders/custom-webpack': '^20.0.0',
    typescript: '5.9.3',
    'zone.js': '~0.15.1',
    'jest-preset-angular': '14.6.2',
});
let count = 0;
for (const key of Object.keys(pkg.devDependencies)) {
    if (key.startsWith('@angular-eslint/')) {
        pkg.devDependencies[key] = '^20.0.0';
        count++;
    }
}
if (count !== 5) throw new Error('Unexpected Angular ESLint package set');
fs.writeFileSync(manifestPath, JSON.stringify(pkg, null, 4) + '\n');
console.log('Angular 20 dependency graph staged; apply official CLI/Core/Material migrations next.');
