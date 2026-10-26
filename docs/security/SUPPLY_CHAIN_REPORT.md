# Supply Chain Risk Report — `aether-app`

**Scanned:** `/home/claude/aether-app`  
**Manifests read:** `package.json`, `package-lock.json`  
**Scanned at:** 2026-10-26T15:05:49+00:00  
**Direct dependencies:** 28 (npm 28)

## Summary

- **No known advisory affects any of the 28 direct dependencies**, checked at the versions this project resolves.
- No known advisory affects any of the 584 registry-verified transitive packages at their locked versions.
- 4 of 28 dependencies carry at least one finding, 4 of which reach production.
- Weakest coverage: **Repository archived**, established for 0 of 28; the Coverage section lists every criterion.

## Production dependencies

19 dependencies are declared as runtime dependencies and ship in the built artifact. Advisory status is given for every one, clean or not.

| Dependency | Version | Advisories | Other findings |
|---|---|---|---|
| `@gsap/react` | 2.1.2 | none known | Publisher concentration |
| `@react-three/drei` | 10.7.9 | none known | — |
| `@react-three/fiber` | 9.8.2 | none known | — |
| `bcryptjs` | 3.0.3 | none known | Publisher concentration |
| `gsap` | 3.15.0 | none known | Publisher concentration |
| `jose` | 6.2.13 | none known | — |
| `lenis` | 1.3.27 | none known | — |
| `lucide-react` | 1.61.0 | none known | — |
| `mongoose` | 9.11.3 | none known | — |
| `motion` | 14.6.0 | none known | — |
| `next` | 16.4.2 | none known | — |
| `razorpay` | 2.9.8 | none known | — |
| `react` | 19.3.0 | none known | — |
| `react-dom` | 19.3.0 | none known | — |
| `resend` | 6.34.1 | none known | — |
| `server-only` | 0.0.1 | none known | Publisher concentration |
| `three` | 0.186.1 | none known | — |
| `zod` | 4.6.7 | none known | — |
| `zustand` | 5.0.16 | none known | — |

## Findings

### Reaches production

| Dependency | Version | Weekly downloads | Findings |
|---|---|---|---|
| `@gsap/react` | 2.1.2 | 917,819/wk | single human publisher (greensock) of 1 listed |
| `bcryptjs` | 3.0.3 | 9,557,761/wk | single human publisher (dcode) of 1 listed |
| `gsap` | 3.15.0 | 3,899,660/wk | single human publisher (greensock) of 1 listed |
| `server-only` | 0.0.1 | 12,374,844/wk | single human publisher (sebmarkbage) of 1 listed |

## Upstream repository and CI hygiene — OpenSSF Scorecard

These criteria describe each dependency's own repository, not the audited
project. Remediation, where any exists, is upstream.

No criterion in this tier was assessable for any dependency.

## Transitive advisories

No known advisory affects any of the 584 registry-verified packages beyond the direct set (resolved by `package-lock.json`), at the locked versions. Only advisories were checked at this depth; every other criterion in this report describes direct dependencies only.

## Informational

Measured, not flagged.

- **Publish provenance**: 17 of 28 publish with build provenance.
  Without: `@gsap/react`, `@react-three/fiber`, `@tailwindcss/turbopack`, `bcryptjs`, `eslint`, `gsap`, `lenis`, `motion`, `razorpay`, `server-only` and 1 more
- **Security policy published**: not determinable for any dependency in this project.
- **Download volume**: established for 27 of 28; median 12,374,844/week. Lowest: `razorpay` (243,185/wk), `@tailwindcss/turbopack` (882,760/wk), `@gsap/react` (917,819/wk).

## Coverage

What was and was not measured, per criterion.

| Criterion | Tier | Assessed | Flagged | Not assessable |
|---|---|---|---|---|
| Known advisories | A | 28/28 | 0 | 0 |
| Deprecated or yanked | A | 28/28 | 0 | 0 |
| Repository archived | A | 0/28 | 0 | 28 |
| Maintenance activity | A | 0/28 | 0 | 28 |
| Publisher concentration | B | 11/28 | 4 | 17 |
| Install-time script execution | B | 28/28 | 0 | 0 |
| Dangerous CI workflow | scorecard | 0/28 | 0 | 28 |
| CI token permissions | scorecard | 0/28 | 0 | 28 |
| Checked-in binaries | scorecard | 0/28 | 0 | 28 |
| Changes reviewed by a second person | scorecard | 0/28 | 0 | 28 |
| Publish provenance | info | 28/28 | 0 | 0 |
| Security policy published | info | 0/28 | 0 | 28 |
| Download volume | info | 27/28 | 0 | 1 |

## Not assessable

**Repository archived**

- 27 dependencies — the GitHub API did not answer: `@fontsource-variable/inter`, `@fontsource-variable/jetbrains-mono`, `@fontsource-variable/oswald`, `@gsap/react`, `@react-three/drei`, `@react-three/fiber` and 21 more
- 1 dependency — no source repository could be resolved for this package: `server-only`

**Checked-in binaries**

- 27 dependencies — the GitHub API did not answer: `@fontsource-variable/inter`, `@fontsource-variable/jetbrains-mono`, `@fontsource-variable/oswald`, `@gsap/react`, `@react-three/drei`, `@react-three/fiber` and 21 more
- 1 dependency — no source repository to score: `server-only`

**Changes reviewed by a second person**

- 27 dependencies — the GitHub API did not answer: `@fontsource-variable/inter`, `@fontsource-variable/jetbrains-mono`, `@fontsource-variable/oswald`, `@gsap/react`, `@react-three/drei`, `@react-three/fiber` and 21 more
- 1 dependency — no source repository to score: `server-only`

**Dangerous CI workflow**

- 27 dependencies — the GitHub API did not answer: `@fontsource-variable/inter`, `@fontsource-variable/jetbrains-mono`, `@fontsource-variable/oswald`, `@gsap/react`, `@react-three/drei`, `@react-three/fiber` and 21 more
- 1 dependency — no source repository to score: `server-only`

**Download volume**

- 1 dependency — the npm download API did not answer: `@fontsource-variable/oswald`

**Publisher concentration**

- 17 dependencies — publishes from CI with provenance, so the effective publisher set is whoever can merge to the release branch — not externally observable: `@fontsource-variable/inter`, `@fontsource-variable/jetbrains-mono`, `@fontsource-variable/oswald`, `@react-three/drei`, `eslint-config-next`, `jose` and 11 more

**Security policy published**

- 27 dependencies — the GitHub API did not answer: `@fontsource-variable/inter`, `@fontsource-variable/jetbrains-mono`, `@fontsource-variable/oswald`, `@gsap/react`, `@react-three/drei`, `@react-three/fiber` and 21 more
- 1 dependency — no source repository could be resolved for this package: `server-only`

**Maintenance activity**

- 27 dependencies — the GitHub API did not answer: `@fontsource-variable/inter`, `@fontsource-variable/jetbrains-mono`, `@fontsource-variable/oswald`, `@gsap/react`, `@react-three/drei`, `@react-three/fiber` and 21 more
- 1 dependency — no source repository could be resolved for this package: `server-only`

**CI token permissions**

- 27 dependencies — the GitHub API did not answer: `@fontsource-variable/inter`, `@fontsource-variable/jetbrains-mono`, `@fontsource-variable/oswald`, `@gsap/react`, `@react-three/drei`, `@react-three/fiber` and 21 more
- 1 dependency — no source repository to score: `server-only`

## Method and caveats

- Repository-level criteria (archived, maintenance activity, security policy, and the Scorecard checks) describe the source repository rather than the package. 27 dependencies resolve to 22 distinct repositories, so one repository can appear as several findings. Shared: github.com/fontsource/font-files, github.com/react/react, github.com/tailwindlabs/tailwindcss, github.com/vercel/next.js
- Optional tooling detected: npm. Not installed, so not used: bundler-audit, cargo-audit, osv-scanner, pip-audit.
- Every criterion except advisories applies to direct dependencies only. The 584 registry-verified packages resolved by package-lock.json were checked for known advisories at their locked versions, and for nothing else.
- HTTP sources: 59 fetched, 28 served from cache (oldest 0.0h old), 0 refetched as stale, 0 unavailable offline, 28 errors.

---

## Addendum: assessment and actions (judgment, not measurement)

Everything above this line was measured by the collector. This section interprets it.

**Priority.** No advisory affects any direct dependency or any of the 584 transitive packages at their locked versions. No upgrade is required at this time.

**Publisher concentration (4 production dependencies).** `gsap` and `@gsap/react` (publisher `greensock`), `bcryptjs` (`dcode`) and `server-only` (`sebmarkbage`) each have a single human publisher on npm. A compromise of that one account would allow a malicious release. The lockfile pins exact versions, so a malicious release reaches this project only through a deliberate `npm update` or a lockfile regeneration. The action is to keep `package-lock.json` committed, install with `npm ci` in CI, and review the changelog before raising the versions of these four packages.
- `server-only` is a build-time guard of a few lines. Its exposure is limited to the build.
- `bcryptjs` hashes passwords. Its exposure is the highest of the four. The native `bcrypt` package is a drop-in alternative with a different maintainer set, but it adds a native compile step on Vercel. The current choice is reasonable for this project.

**Install-time scripts.** The collector flagged no install scripts among direct dependencies. The Vercel build log reported two transitive install scripts not approved by npm's `allowScripts`: `mongodb-memory-server` (downloads a MongoDB binary for tests) and `unrs-resolver` (ESLint resolver). Neither is needed to build or run the site, and npm did not run them. `npm ci --ignore-scripts` is viable for the production build of this project.

**Coverage limits.** The GitHub API was unauthenticated in this audit, so repository-level criteria (archived, maintenance activity, Scorecard checks) were not assessable for any dependency. These rows state what could not be known, not a risk. A rerun with an authenticated `gh` would fill them. The audit read this workspace's `package.json`, which matches the deployed project's runtime dependencies. It also lists three `@fontsource-variable` font packages that exist only in the test workspace.
