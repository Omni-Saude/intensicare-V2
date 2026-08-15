#!/usr/bin/env python3
"""check_forbidden_content.py — Forbidden-content gate for IntensiCare V2.

Scans docs/, scripts/, .github/, and README.md (at the repository root)
for text patterns that must never appear in this repository:

  1. Credential-shaped strings: GitHub OAuth/user/fine-grained tokens,
     AWS access-key IDs, and PEM private-key headers.
  2. CPF-shaped strings (Brazilian individual taxpayer ID, formatted
     ddd.ddd.ddd-dd) — flagged for human review; a matching digit
     pattern does not itself prove a real CPF, but it must never sit
     unreviewed in a greenfield repository with no PHI/PII policy yet.
  3. Email addresses not on the (currently empty) allowlist.
  4. The literal synthetic-data canary string reserved for proving this
     scanner works, which must never appear in real committed content
     (see PHI_CANARY below).

Design notes
------------
* Pure Python 3 stdlib — no third-party dependencies, matching this
  repository's tooling policy (this is CI tooling, not the product
  stack, which has no ADR yet).
* Every pattern below requires a plausible minimum-length token, not a
  bare substring. This is deliberate for two independent reasons:
  (a) it is what real credentials look like (a bare "AKIA" or "gho_"
      with nothing after it is not a credential), and
  (b) it lets this repository's OWN policy documentation *describe*
      what the scanner looks for without describing itself into a
      false positive. A regex requiring N trailing token characters
      does not match a prose sentence that merely names the prefix.
* The PHI canary is deliberately assembled from two string literals at
  runtime (`"PHI" + "-REAL"`) so this file's own source text never
  contains the literal contiguous marker it is searching for.
* Findings are reported as file:line with a redacted excerpt — the
  point of this gate is to prove *something* matched, not to echo a
  live secret into CI logs.
"""
from __future__ import annotations

import os
import re
import sys

SCAN_ROOTS = ["docs", "scripts", ".github"]
SCAN_FILES = ["README.md"]

# No addresses are currently allowlisted. Any addition requires a
# DECIDED entry in docs/00-governance/registers/decision-register.md —
# an agent may not silently allowlist an address to make this gate pass.
EMAIL_ALLOWLIST: set[str] = set()

# Assembled at runtime — see module docstring "Design notes".
PHI_CANARY = "PHI" + "-REAL"

CREDENTIAL_PATTERNS = {
    "github-oauth-token (gho_)": re.compile(r"\bgho_[A-Za-z0-9]{20,}\b"),
    "github-personal-access-token (ghp_)": re.compile(r"\bghp_[A-Za-z0-9]{20,}\b"),
    "github-fine-grained-pat (github_pat_)": re.compile(
        r"\bgithub_pat_[A-Za-z0-9_]{20,}\b"
    ),
    "aws-access-key-id (AKIA)": re.compile(r"\bAKIA[0-9A-Z]{16}\b"),
    "pem-private-key-header": re.compile(
        r"-----BEGIN [A-Z ]*PRIVATE KEY-----"
    ),
}

CPF_PATTERN = re.compile(r"\b\d{3}\.\d{3}\.\d{3}-\d{2}\b")

EMAIL_PATTERN = re.compile(r"\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b")


def iter_target_files(repo_root: str):
    for root_name in SCAN_ROOTS:
        root_path = os.path.join(repo_root, root_name)
        if not os.path.isdir(root_path):
            continue
        for dirpath, dirnames, filenames in os.walk(root_path):
            dirnames.sort()
            for name in sorted(filenames):
                yield os.path.join(dirpath, name)
    for rel in SCAN_FILES:
        path = os.path.join(repo_root, rel)
        if os.path.isfile(path):
            yield path


def redact(match_text: str, keep: int = 4) -> str:
    if len(match_text) <= keep:
        return "*" * len(match_text)
    return match_text[:keep] + "*" * max(3, len(match_text) - keep)


def scan_file(path: str) -> list[str]:
    findings: list[str] = []
    try:
        with open(path, "r", encoding="utf-8") as f:
            lines = f.readlines()
    except (UnicodeDecodeError, IsADirectoryError, OSError):
        return findings  # binary or unreadable — not a text file to scan

    for lineno, line in enumerate(lines, start=1):
        for label, pattern in CREDENTIAL_PATTERNS.items():
            for m in pattern.finditer(line):
                findings.append(
                    f"{path}:{lineno}: credential-pattern [{label}]: "
                    f"{redact(m.group(0))}"
                )

        for m in CPF_PATTERN.finditer(line):
            findings.append(
                f"{path}:{lineno}: CPF-shaped-pattern (flag for review): "
                f"{redact(m.group(0), keep=3)}"
            )

        for m in EMAIL_PATTERN.finditer(line):
            addr = m.group(0)
            if addr in EMAIL_ALLOWLIST:
                continue
            findings.append(
                f"{path}:{lineno}: email-address not on allowlist: "
                f"{redact(addr, keep=2)}"
            )

        if PHI_CANARY in line:
            findings.append(
                f"{path}:{lineno}: forbidden canary string found "
                f"(synthetic-data canary must never appear in real "
                f"committed content)"
            )

    return findings


def main() -> int:
    repo_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

    files = sorted(set(iter_target_files(repo_root)))
    all_findings: list[str] = []
    for path in files:
        rel = os.path.relpath(path, repo_root)
        for finding in scan_file(path):
            all_findings.append(finding.replace(path, rel, 1))

    if all_findings:
        print(f"check_forbidden_content: {len(all_findings)} finding(s) "
              f"across {len(files)} file(s) scanned under "
              f"{', '.join(SCAN_ROOTS)}/ and {', '.join(SCAN_FILES)}:\n")
        for finding in all_findings:
            print(f"  - {finding}")
        print(
            "\nFix: remove the offending content. Credentials and PHI must "
            "never enter source control (see INTENSICARE_V2_ORCHESTRATOR_"
            "PROMPT.md §3 rule 12). CPF-shaped and email findings require "
            "human review even if not a real secret — do not silently "
            "widen the allowlist or the pattern set to make this gate "
            "pass."
        )
        return 1

    print(f"check_forbidden_content: OK — {len(files)} file(s) scanned "
          f"under {', '.join(SCAN_ROOTS)}/ and {', '.join(SCAN_FILES)}, "
          f"no findings.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
