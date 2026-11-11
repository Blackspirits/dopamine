# Dopamine: Angular 16 → 22 migration (preflight, not implemented)

> Status: **PLAN ONLY**. Source baseline: `digimezzo/dopamine@bf7643d3aba3fdeafe921af4b4ee9cd40b2dc318` (2026-11-09).
> Do not merge this branch as an Angular upgrade. No dependency changes or generated migrations have been applied or tested.

## Goal and non-goals

Reach a supported Angular 22 patch release with the Dopamine desktop experience unchanged on Windows, Linux and macOS. Preserve Electron integration, translations, themes, library browsing, playback, keyboard shortcuts and packaging. Do **not** combine this work with the Electron security refactor, UI redesign, translation edits or new themes.

## Verified baseline

- `@angular/core`, `@angular/cli`, `@angular/material`, `@angular/cdk`: 16.2.x.
- `typescript` 4.9.5, `rxjs` 6.6.3, `zone.js` 0.13.3.
- `@angular-builders/custom-webpack` 16.x, custom `browser` and `dev-server` builders in `angular.json` with `angular.webpack.js` (Node/Electron externals and WASM rule).
- `@angular-eslint/*` 16.x, ESLint 8 and `.eslintrc.json`.
- `jest-preset-angular` 13.1.1; `src/test.ts` imports the removed `jest-preset-angular/setup-jest`.
- `src/app/app.module.ts` imports and registers `HammerModule` (removed in Angular 22).
- `angular-split` 14.1.0; latest published package located during preflight is 20.0.0. **Angular 22 peer compatibility is not established.** Review its API/peer requirements instead of forcing installation.
- `package-lock.json` is tracked; installation runs `electron-builder install-app-deps` and project-specific native module patch scripts.
- Existing GitHub workflows use Node.js `22.x`, without enforcing Angular 22's minimum patch version.

## Version / runtime checkpoints

Use separate runtimes across the transition. These are *Angular CLI* compatibility requirements; native Electron dependencies may have additional restrictions.

| Angular stage | Suitable Node.js runtime | TypeScript |
|---|---|---|
| 16.2 baseline | 18.19.1 (officially supported) | 4.9.x to below 5.2 |
| 17–19 | 18.19.1 (if native dependencies permit) | Let each `ng update` choose its compatible range |
| 20–21 | 20.19.x or later matching their official ranges | Let each `ng update` choose its compatible range |
| 22 | >=22.22.3 in Node 22, >=24.15.0 in Node 24, or Node 26.x | >=6.0.0 and <6.1.0 |

Angular 22 is also compatible with RxJS 6.5.3+ or 7.4+, but keeping RxJS 6 indefinitely is not a long-term goal. Upgrade RxJS independently once its usage is verified.

## Execute on a machine with npm registry and desktop build toolchains

1. Establish an *actual* baseline in an isolated clone/worktree: `npm ci`, `npm test`, `npm run lint`, `npm run build:prod`, native database integration tests, and a desktop smoke test. Record Node/npm versions, any environment-specific failures, and passing test counts. The current GitHub workflows provide a useful starting point but are not a substitute for PR validation.
2. Run the official `ng update` schematics **one major at a time**, updating Angular core/CLI/Material/CDK, `@angular-builders/custom-webpack`, Angular ESLint and the test toolchain as coordinated groups. At each major, regenerate the lockfile using npm, compile and run tests **before advancing**. Do not use `--force` or `--legacy-peer-deps` to suppress real incompatibilities.
3. Address known 22-specific changes: remove the obsolete `HammerModule` dependency and validate gestures; migrate `.eslintrc.json` to flat `eslint.config.*` with ESLint/Angular ESLint 22; switch Jest to `setupZoneTestEnv`; preserve the official `ChangeDetectionStrategy.Eager` migration for legacy components; migrate old `browserTarget` options where necessary. Review `angular-split` and Webpack externals with build output rather than assuming compatibility.
4. Pin the final CI Node version to a tested compatible patch (or choose a supported Node 24 patch). Run unit/lint/database tests, renderer build, and Windows/Linux/macOS packaging in a PR workflow. Exercise UI smoke tests for themes, i18n, playlists, library, album art, audio output, resume, playback and keyboard controls.

Example of *one* official version hop (do not execute all hops without checks):

```bash
npx ng update @angular/cli@^17 @angular/core@^17
# Coordinate @angular/material@^17 / CDK, custom-webpack@17 and related dependencies.
# Review generated diffs, fix peer incompatibilities, then run npm install, tests, lint and build.
```

Repeat for versions 18, 19, 20, 21, and 22 after meeting each stage's runtime/peer requirements. Material upgrade schematics should run where relevant.

## Release / review gate

- [ ] Every official migration schematic applied and reviewed; no forced peer dependencies.
- [ ] Lockfile consistent with manifests; `npm ci` reproducible.
- [ ] Angular/CDK/Material/CLI/webpack builder and ESLint versions compatible.
- [ ] No removed API imports (`HammerModule`, Jest `setup-jest`) or unconverted ESLint legacy config.
- [ ] Full unit, database integration and lint suites pass, with recorded test counts.
- [ ] Renderer and native desktop packages build on Windows, Linux and macOS.
- [ ] Manual UI regressions and change-detection behavior verified.
- [ ] Upstream changes rebased/reconciled and independent review completed.
- [ ] Separate PR prepared and checked; **no merge without explicit approval**.

## References

- [Angular version compatibility](https://angular.dev/reference/versions)
- [Angular releases / support](https://angular.dev/reference/releases)
- [Official ng update](https://angular.dev/cli/update)
- [Angular update guide](https://angular.dev/update-guide)
- [Custom Webpack builder version matching](https://www.npmjs.com/package/@angular-builders/custom-webpack)
- [Angular ESLint flat config](https://github.com/angular-eslint/angular-eslint/blob/main/docs/CONFIGURING_ESLINT.md)
- [Jest preset Angular change log](https://github.com/thymikee/jest-preset-angular/blob/main/CHANGELOG.md)
- [Angular 22 change-detection migration](https://github.com/angular-eslint/angular-eslint/blob/main/packages/eslint-plugin/docs/rules/prefer-on-push-component-change-detection.md)
