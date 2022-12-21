# deno_changesets

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](http://keepachangelog.com/) and this
project adheres to [Semantic Versioning](http://semver.org/).

## 0.7.0 - 2022-12-21

### Fixed

- Multi release now searches for files from cwd.
- Import maps are now also updated in repositories with multiple modules during
  a release.

## 0.6.0 - 2022-12-21

### Added

- Repositories with multiple modules now have their imports updated to the
  latest version when releasing.

## 0.5.0 - 2022-12-21

### Added

- Modules found in the /modules folder will now be picked up.

## 0.4.0 - 2022-12-21

### Added

- The create command now takes an optional option that commits the changeset
  after creation.

## 0.3.0 - 2022-12-20

### Added

- CLI option and example runs to the README.

## 0.2.0 - 2022-12-20

### Added

- Added --prod-ready flag to the release command, use for publishing from
  pre-1.0 to 1.0.
- Prompts when creating a changeset now come with hints.

## 0.1.0 - 2022-12-20

### Added

- Changelogs will now be added and created when releasing.
- CLI prompts now are searchable.

### Changed

- Changesets now follow the [keep a changelog](https://keepachangelog.com)
  convention.
