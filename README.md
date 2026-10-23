# PalettePreviewer

This project was generated using [Angular CLI](https://github.com/angular/angular-cli) version 22.2.3.

## Using a palette in your dotfiles

The **Export** section of the accent tool previews, copies or downloads the palette as a shell file, one per mode:
`palette-dark.sh` and `palette-light.sh`. Both define the same variables, so the same templates render either mode.

Each color comes in three formats:

| Variable          | Example         |
| ----------------- | --------------- |
| `$PAL_ACCENT`     | `#6ea4fd`       |
| `$PAL_ACCENT_HEX` | `6ea4fd`        |
| `$PAL_ACCENT_RGB` | `110, 164, 253` |

Names are `PAL_` plus the upper-cased token name (`PAL_BACKGROUND`, `PAL_ON_SURFACE`, `PAL_ACCENT_CONTAINER`,
`PAL_OUTLINE_VARIANT`…) and the terminal slots (`PAL_FOREGROUND`, `PAL_COLOR0`…`PAL_COLOR15`). The terminal background
is `PAL_BACKGROUND`. These names are a stable API: they are not renamed or removed between releases.

Write each app's config as a template that references the variables, then source the file and render it with
`envsubst` (from GNU gettext):

```bash
. ~/.config/palette/palette-dark.sh
envsubst "$PAL_VARS" < ~/.config/hypr/colors.conf.tpl > ~/.config/hypr/colors.conf
```

Always pass `"$PAL_VARS"`: it lists every palette variable, so `envsubst` replaces only those and leaves the template's
own variables alone. For example, this Hyprland template:

```ini
bind = $mainMod, Q, exec, kitty
col.active_border = rgb($PAL_ACCENT_HEX)
col.inactive_border = rgba($PAL_OUTLINE_RGB, 0.5)
```

renders to:

```ini
bind = $mainMod, Q, exec, kitty
col.active_border = rgb(6ea4fd)
col.inactive_border = rgba(110, 117, 128, 0.5)
```

Without the list, `envsubst` would replace `$mainMod` with an empty string.

## Saving palettes

Work in progress is auto-saved in the browser. To keep a palette, **Save** it under a name (Ctrl+S); the top bar
shows the palette being edited, or a temporary name such as "Untitled teal", with a dot while there are unsaved
changes. The menu next to it starts a new palette, saves a copy, renames the current one or opens the **Library**.

Saved palettes live in the browser's localStorage, which is per site: the deployed app and `localhost` each have
their own library. Use **Export all** and **Import** in the library to move palettes between them or to back them up.
Importing keeps the most recently updated copy of each palette, so re-importing an old backup never overwrites newer
work.

Each saved palette also stores the env files it exported when saved. If a later version of the generator turns the
same settings into different colors, the library flags that palette and still offers its original env files.

## Development server

To start a local development server, run:

```bash
ng serve
```

Once the server is running, open your browser and navigate to `http://localhost:4200/`. The application will automatically reload whenever you modify any of the source files.

## Code scaffolding

Angular CLI includes powerful code scaffolding tools. To generate a new component, run:

```bash
ng generate component component-name
```

For a complete list of available schematics (such as `components`, `directives`, or `pipes`), run:

```bash
ng generate --help
```

## Building

To build the project run:

```bash
ng build
```

This will compile your project and store the build artifacts in the `dist/` directory. By default, the production build optimizes your application for performance and speed.

## Running unit tests

To execute unit tests with the [Vitest](https://vitest.dev/) test runner, use the following command:

```bash
ng test
```

## Accessibility checks

`pnpm a11y` builds the app, serves the production build and runs [axe-core](https://github.com/dequelabs/axe-core)
(WCAG 2.2 AA and best practices) on every route, once in dark and once in light mode. Any violation fails it, and CI
runs the same check on every pull request. `pnpm a11y:check` skips the build and scans the existing `dist/`.

It drives a headless Chromium through Playwright; download it once with:

```bash
pnpm exec playwright install chromium
```

The scenarios (routes and the states to put them in, such as an uploaded image) live in `scripts/a11y.mts`; add one
for each new route or state worth scanning. The PrimeNG preview is exempt from the color-contrast rule only: its colors
come from the palette being edited, not from the app (#16).

## Releasing

Pushing a semver tag (`v1.2.3`) runs `.github/workflows/deploy.yml`, which checks, builds and publishes the app to
[GitHub Pages](https://migmolrod.github.io/palette-previewer/). Pre-release and other tags do not deploy.

1. `git flow start 1.2.3 release` creates the branch and commits the `package.json` version bump (git-flow hook).
2. `git flow finish 1.2.3 release` merges into `master` and `develop`, tags `v1.2.3` and pushes.

Hotfixes work the same way with `hotfix` instead of `release`. The deploy fails if the tag and `package.json` version
differ.

The deploy needs the `PRIMEUI_LICENSE` repository secret. PrimeUI allows the key in the client bundle, but not
published in the repository, hence the secret.

## Running end-to-end tests

For end-to-end (e2e) testing, run:

```bash
ng e2e
```

Angular CLI does not come with an end-to-end testing framework by default. You can choose one that suits your needs.

## Additional Resources

For more information on using the Angular CLI, including detailed command references, visit the [Angular CLI Overview and Command Reference](https://angular.dev/tools/cli) page.
