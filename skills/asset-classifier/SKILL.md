---
name: asset-classifier
description: Classify local, Drive, and GitHub assets into operational states with repeatable rules. Use when you need to inventory folders/files, apply KEEP/MERGE/MOVE/ARCHIVE/DELETE_CANDIDATE decisions, and produce review artifacts such as inventory sheets, 3-month review tables, and delete-candidate reports.
---

# Asset Classifier

## Classify assets with fixed states

Use the following state set only:

- `KEEP`
- `MERGE`
- `MOVE`
- `ARCHIVE`
- `DELETE_CANDIDATE`

Reject ad-hoc states.

## Execute this workflow

1. Collect scope and timestamp first.
2. Build an inventory table for top-level entities.
3. Mark "recent 3 months" candidates.
4. Apply state decisions with short reasons.
5. Split delete candidates into a separate report.
6. Record weekly progress in an operations log.

## Enforce safety gates

Before `DELETE_CANDIDATE`:

1. Check backup existence.
2. Check duplicate or source-of-truth existence.
3. Check dependency impact.
4. Check sensitive-data presence.

Do not execute destructive deletion in the same pass.

## Output contract

Generate these artifacts when requested:

- Inventory file
- Recent 3-month review file
- Delete-candidate report
- Weekly operations log

Keep outputs short, tabular, and date-stamped.
