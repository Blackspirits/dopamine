# Angular 21 migration probe: evidence and unresolved gates

Source implementation baseline: `chore/angular-20-migration-20261111@79ce1535ceff5b9bd11923d3b44935c86de7d16c`. The **isolated probe branch does not change Dopamine's checked-in Angular 20 dependencies**: the workflow mutates a disposable GitHub Actions runner only.

## Verified investigation

- [Initial Angular 21 probe, #43283240984](https://github.com/Blackspirits/dopamine/actions/runs/43283240984): dependency resolution failed with `ERESOLVE` because `@angular-builders/custom-webpack@21.1.0` peers on `rxjs >=7`, while the app still declared `rxjs@6.6.3`. Addressed in runner-only dependency graph using RxJS 7.8.x.
- [Second probe, #43283373089](https://github.com/Blackspirits/dopamine/actions/runs/43283373089): official Angular CLI/Core/Material migrations and clean lockfile verification passed, but the renderer failed with TypeScript errors resolving modern Angular package subpaths (`TS2307`), plus strict type errors. The official Core migration also converted numerous templates to block control-flow syntax.
- [Third probe, #43284053864](https://github.com/Blackspirits/dopamine/actions/runs/43284053864): enabling `moduleResolution: bundler` for app TypeScript eliminated the module-resolution failures. Compiler then identified three narrow typing issues: two `HttpClient.get(...).toPromise()` results typed `string | undefined`, and Electron IPC payload `string[] | undefined` being sent to a `Subject<string[]>`.
- [Fourth probe, #43284728812](https://github.com/Blackspirits/dopamine/actions/runs/43284728812): replace the two deprecated `toPromise()` calls with `firstValueFrom`, and normalize the optional IPC argv to `[]`. The production renderer **compiled successfully**. Jest then failed: 81/312 suites failed while 231 passed, because `tsconfig.spec.json` continued to override `moduleResolution` to obsolete `node` and could not resolve Angular package exports (`TS2307`). No assertion-level regression was proved by these compilation errors.
- [Fifth probe, #43299026629](https://github.com/Blackspirits/dopamine/actions/runs/43299026629): now uses `moduleResolution: bundler` in both application and Jest TypeScript configurations. **Do not claim PASS without inspecting its complete jobs and test counts.**

## Review risks

- The Angular 21 Core migration modifies roughly 68 HTML templates, including playback, library, settings, selection and theme-switcher; review behavior and the diff, not only compilation.
- `rxjs@7`, `jest@30`, `jest-preset-angular@16`, TypeScript module resolution, webpack builder and Angular ESLint must be changed as an interdependent group. Never skip package peer checks with `--force` or `--legacy-peer-deps`.
- The two HTTP consumers and the IPC event payload need regression tests. Do not confuse a successful Jest suite with Electron real-world playback/packaging.
- Any generated migration must be constrained to an isolated feature branch; do not merge or update `master` or the upstream repository without explicit approval.

## Gates for committing Angular 21 migrations

1. Clean peer resolution, `npm ci` and exact dependency versions/lockfile consistency.
2. Official CLI/Core/Material 21 migrations applied, with changed file inventory and review of all template changes.
3. Renderer and Electron main TypeScript compilation succeed; **all** existing Jest suites pass, with exact counts.
4. Native install, unit tests and renderer compilation across Windows, Linux and macOS on a published feature branch.
5. ESLint gate, database integration tests, desktop UI/manual regressions and independent review accounted for before any merge.

Status: **INCOMPLETE / NO MERGE APPROVAL**.
