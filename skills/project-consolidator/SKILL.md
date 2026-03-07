---
name: project-consolidator
description: Consolidate overlapping software projects into one source-of-truth structure. Use when multiple local projects have duplicated features, mixed agent/skill/app files, or unclear ownership, and you need a migration map toward npm workspace packages and apps.
---

# Project Consolidator

## Define one source of truth

For each candidate project:

1. Identify executable entrypoints.
2. Identify real business features vs template code.
3. Mark project status: `source-of-truth`, `empty-shell`, `hold`, or `archive`.

Keep one source-of-truth per capability.

## Extract by responsibility

Split features into:

- `core` domain logic
- `integrations` (Google/Firebase/GAS/etc.)
- `apps` (CLI/web/desktop UI)
- `skills` and `agent docs`

Do not keep these concerns mixed in one folder.

## Build migration map

For each major file/group:

1. Record current location.
2. Record target package/app.
3. Record migration order.
4. Record risk and rollback notes.

Prefer incremental migration over big-bang rewrites.

## Enforce security boundary

When consolidating, detect sensitive artifacts:

- `.env*`
- `*credentials*.json`
- `token*.json`
- secret/certificate files

Exclude them from version control and move to local private paths.

## Output contract

Produce:

- consolidation analysis document
- core extraction map
- phased migration plan with immediate next actions
