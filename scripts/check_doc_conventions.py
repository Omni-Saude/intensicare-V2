#!/usr/bin/env python3
"""check_doc_conventions.py — Documentation conformance gate for IntensiCare V2.

Scope
-----
Walks docs/**/*.md and verifies each file has a YAML front-matter block
(delimited by two `---` lines at column 0, at the very top of the file)
that carries, at minimum, four categories of information:

  1. STATUS   — the document's evidence-notation status/label.
  2. SOURCE   — provenance/source information for the document's claims.
  3. DATE     — a collection or last-updated date.
  4. OWNER    — an accountable collector/owner/author.

It also flags any document whose top-level status/label field is the
literal value `DECIDED`, per this task's simplified rule: no agent may
self-apply DECIDED (docs/00-governance/evidence-notation.md §2, rule 3),
and no decision-register ratification process exists yet to make a
DECIDED claim legitimate.

Why a hand-rolled parser, not PyYAML
-------------------------------------
`python3 -c "import yaml"` is not guaranteed on the runner that executes
this script (a bare `actions/setup-python` install has no third-party
packages). This parser is intentionally minimal: it does not attempt to
be a general YAML parser. It only needs to answer "which key names
appear in this front-matter block, and what is the top-level value of
the status/label key" — which a simple per-line regex answers reliably
for every front-matter style observed on disk in this repository.

Accepted key synonyms
----------------------
This repository's docs were authored by several independent specialist
agents before this gate existed, all working from the same governance
convention (docs/00-governance/evidence-notation.md §5 "copy-paste YAML
front-matter template") but choosing different concrete key names for
document-level metadata vs. the full per-statement provenance block.
Inspecting the conforming files on disk (2026-08-14) shows two live
patterns:

  * "Governance style" (docs/00-governance/*.md, docs/03-domain/*.md):
    flat top-level keys — doc_id, status, owner, source, date_collected,
    collector, last_updated.

  * "Full provenance-template style" (docs/01-vision-and-intended-use/,
    docs/05-clinical-safety/): the exact §5 template — top-level
    id/title/label, plus a nested `provenance:` block carrying
    source_repo, path_or_url, date_collected, collector, owner,
    validation_status.

Both are conformant with evidence-notation.md; neither is more correct
than the other. This script therefore treats front-matter keys as a
flattened set (nesting level is ignored for *presence* checks — a key
named `collector` satisfies the OWNER category whether it sits at top
level or nested under `provenance:`), and accepts the synonym sets
below. The DECIDED check, by contrast, only inspects TOP-LEVEL
status/label — that is the field that carries the document's own
ratification status in every observed convention; a nested field of
the same name does not occur in any conforming file and would mean
something different if it did.

If a future file uses a genuinely new synonym not in these sets, that
is a real gap: widen the set here (and record why), rather than adding
narrow per-file exceptions.
"""
from __future__ import annotations

import os
import re
import sys

DOCS_ROOT = "docs"

# Category -> accepted front-matter key names (case-sensitive, as authored).
STATUS_KEYS = {"status", "label"}
SOURCE_KEYS = {"source", "sources", "provenance"}
DATE_KEYS = {"date", "date_collected", "last_updated"}
OWNER_KEYS = {"owner", "collector", "authors", "collectors", "author"}

CATEGORIES = {
    "status (evidence-notation status/label)": STATUS_KEYS,
    "source/provenance": SOURCE_KEYS,
    "date (date_collected/last_updated/date)": DATE_KEYS,
    "owner/collector": OWNER_KEYS,
}

FORBIDDEN_STATUS_VALUE = "DECIDED"

# Matches "key: value" or "key:" at any indentation. Group 1 = indent,
# group 2 = key, group 3 = value (may be empty for block-scalar/nested keys).
_KEY_LINE_RE = re.compile(r"^([ \t]*)([A-Za-z_][A-Za-z0-9_]*)\s*:(?:[ \t]+(.*))?$")


class FrontMatterResult:
    def __init__(self):
        self.found = False
        self.terminated = False
        self.all_keys: set[str] = set()
        self.top_level: dict[str, str] = {}


def parse_front_matter(text: str) -> FrontMatterResult:
    result = FrontMatterResult()
    lines = text.splitlines()
    if not lines or lines[0].rstrip("\r") != "---":
        return result  # no front matter block at all
    result.found = True

    end_idx = None
    for i in range(1, len(lines)):
        if lines[i].rstrip("\r") == "---":
            end_idx = i
            break
    if end_idx is None:
        return result  # opened but never terminated
    result.terminated = True

    for line in lines[1:end_idx]:
        stripped = line.strip()
        if not stripped or stripped.startswith("#"):
            continue
        m = _KEY_LINE_RE.match(line.rstrip("\r"))
        if not m:
            continue
        indent, key, value = m.groups()
        result.all_keys.add(key)
        if indent == "":
            result.top_level[key] = (value or "").strip()

    return result


def iter_markdown_files(root: str):
    for dirpath, dirnames, filenames in os.walk(root):
        dirnames.sort()
        for name in sorted(filenames):
            if name.endswith(".md"):
                yield os.path.join(dirpath, name)


def check_file(path: str) -> list[str]:
    """Return a list of human-readable violation strings for one file."""
    violations = []
    try:
        with open(path, "r", encoding="utf-8") as f:
            text = f.read()
    except UnicodeDecodeError:
        return [f"{path}: could not read as UTF-8 text"]

    fm = parse_front_matter(text)

    if not fm.found:
        violations.append(
            f"{path}: no YAML front-matter block found "
            f"(file must start at line 1 with a bare '---' line, per "
            f"docs/00-governance/evidence-notation.md §5)"
        )
        return violations

    if not fm.terminated:
        violations.append(
            f"{path}: front-matter block opened with '---' but never "
            f"terminated with a second bare '---' line"
        )
        return violations

    missing = [
        label for label, keys in CATEGORIES.items() if not (fm.all_keys & keys)
    ]
    if missing:
        for label in missing:
            accepted = ", ".join(sorted(CATEGORIES[label]))
            violations.append(
                f"{path}: front-matter missing required category "
                f"'{label}' (accepted keys: {accepted})"
            )

    for key in STATUS_KEYS:
        value = fm.top_level.get(key)
        if value is not None and value.strip() == FORBIDDEN_STATUS_VALUE:
            violations.append(
                f"{path}: front-matter '{key}: {FORBIDDEN_STATUS_VALUE}' is "
                f"not permitted — no agent may self-apply DECIDED "
                f"(docs/00-governance/evidence-notation.md §2 rule 3; no "
                f"decision-register ratification process exists yet). "
                f"If this was ratified by a named human authority, record "
                f"it in docs/00-governance/registers/decision-register.md "
                f"first, per §6."
            )

    return violations


def main() -> int:
    repo_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    docs_dir = os.path.join(repo_root, DOCS_ROOT)

    if not os.path.isdir(docs_dir):
        print(f"check_doc_conventions: no '{DOCS_ROOT}/' directory found at "
              f"{repo_root} — nothing to check.")
        return 0

    files = list(iter_markdown_files(docs_dir))
    all_violations: list[str] = []
    for path in files:
        rel = os.path.relpath(path, repo_root)
        for v in check_file(path):
            all_violations.append(v.replace(path, rel, 1))

    if all_violations:
        print(f"check_doc_conventions: {len(all_violations)} violation(s) "
              f"across {len(files)} file(s) scanned under {DOCS_ROOT}/:\n")
        for v in all_violations:
            print(f"  - {v}")
        print(
            "\nFix: add/complete the YAML front-matter block per "
            "docs/00-governance/evidence-notation.md §5, using any of the "
            "accepted key synonyms listed above. Do not weaken this "
            "checker to silently accept a genuinely missing field."
        )
        return 1

    print(f"check_doc_conventions: OK — {len(files)} file(s) scanned under "
          f"{DOCS_ROOT}/, no violations.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
