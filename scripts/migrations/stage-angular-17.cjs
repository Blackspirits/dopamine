// One-time Angular 16 -> 17 manifest staging helper.
// Use in a disposable Node 20.19.1 migration environment. It does NOT install deps.
// The official Angular CLI/core/Material schematics must be run separately.
'use strict';

const fs = require('node:fs');
const path = require('node:path');

const manifestPath = path.resolve(__dirname, '../../package.json');
const original = fs.readFileSync(manifestPath, 'utf8');
const pkg = JSON.parse(original);

if (pkg.devDependencies?.['@angular/cli'] !== '16.2.10' ||
    pkg.devDependencies?.['@angular/core'] !== '16.2.12') {
    throw new Error('Unexpected Angular baseline; re-inspect package.json instead of rewriting it.');
}
if (pkg.devDependencies?.['jest-preset-angular'] !== '13.1.6') {
    throw new Error('Missing separately reviewed Jest peer-compatibility update.');
}

const framework = [
    'common', 'compiler', 'compiler-cli', 'core', 'forms',
    'language-service', 'platform-browser', 'platform-browser-dynamic', 'router',
];

for (const name of framework) {
    const key = '@angular/' + name;
    let changed = false;
    for (const group of ['dependencies', 'devDependencies']) {
        if (Object.prototype.hasOwnProperty.call(pkg[group] ?? {}, key)) {
            pkg[group][key] = '17.3.12';
            changed = true;
        }
    }
    if (!changed) throw new Error('Expected Angular package missing: ' + key);
}

pkg.dependencies['@angular/animations'] = '17.3.12';
for (const name of ['cdk', 'material']) {
    const key = '@angular/' + name;
    if (!Object.prototype.hasOwnProperty.call(pkg.dependencies, key)) {
        throw new Error('Expected Material dependency missing: ' + key);
    }
    pkg.dependencies[key] = '17.3.10';
}

Object.assign(pkg.devDependencies, {
    '@angular/cli': '17.3.17',
    '@angular-devkit/build-angular': '17.3.17',
    '@angular-builders/custom-webpack': '^17.0.0',
    'typescript': '~5.4.5',
    'zone.js': '~0.14.0',
});

let angularEslintCount = 0;
for (const key of Object.keys(pkg.devDependencies)) {
    if (key.startsWith('@angular-eslint/')) {
        pkg.devDependencies[key] = '^17.0.0';
        angularEslintCount++;
    }
}
if (angularEslintCount !== 5) {
    throw new Error('Unexpected Angular ESLint package count: ' + angularEslintCount);
}

// Preserve the upstream 4-space indentation to avoid unrelated formatting churn.
fs.writeFileSync(manifestPath, JSON.stringify(pkg, null, 4) + '\n');
console.log('Angular 17 dependency manifest staged. Apply official schematics next.');
