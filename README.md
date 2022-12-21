# deno_changesets

🦕 Deno native way to manage versioning and changelogs.

```bash
deno run --unstable --allow-read --allow-write --allow-run https://deno.land/x/deno_changesets/main.ts --help
```

## Getting started

Using `deno_changesets` comes with some opinions:

- Versioning follows [semver](https://semver.org)
- Changelogs follow [keep a changelog](https://keepachangelog.com/en/1.0.0/)
- Versions are stored in git tags
- Enforces
  [minor bumps](https://semver.org/#how-should-i-deal-with-revisions-in-the-0yz-initial-development-phase)
  when pre-1.0

See: [Adding a module](https://deno.land/add_module) on Deno's docs.

## Creating a changeset

Creates a new changeset inside the `.changeset` folder.

```bash
➜  deno run --unstable --allow-read --allow-write --allow-run https://deno.land/x/deno_changesets/main.ts create
 ? Select a module (deno_changesets) › deno_changesets
 ? What type of change? › added
 ? Description › Prompts when creating a changeset now come with hints.
 ? Confirm (y/n) › Yes
```

### Options

| Option      | Description                           |
| ----------- | ------------------------------------- |
| --commit -C | Commits the changeset after creation. |

## Releasing

Releasing collects all previously created changsets, translates them to a
version bump (patch, minor, major) with the highest taking precedence, updates
changelogs, and then pushes to remote.

```bash
➜  deno run --unstable --allow-read --allow-write --allow-run https://deno.land/x/deno_changesets/main.ts release
 ? Will publish from 0.1.0 to 0.2.0 (y/n) › Yes
```

### Options

| Option          | Description                                                 |
| --------------- | ----------------------------------------------------------- |
| --prod-ready -P | Releases a 1.0 version, will error if already 1.0 or above. |
