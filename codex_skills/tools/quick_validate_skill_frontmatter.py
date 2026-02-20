#!/usr/bin/env python3
"""
Dependency-free frontmatter validation for Codex skills.

This is a lightweight fallback when PyYAML isn't available. It validates:
- Frontmatter exists and is delimited by --- ... ---
- Only `name` and `description` keys are present (single-line values)
- Name formatting rules (hyphen-case, <= 64 chars)
- Description length and basic character constraints
"""

from __future__ import annotations

import re
import sys
from pathlib import Path

MAX_SKILL_NAME_LENGTH = 64
MAX_DESCRIPTION_LENGTH = 1024


def _fail(message: str) -> tuple[bool, str]:
    return False, message


def validate_skill(skill_path: str) -> tuple[bool, str]:
    skill_dir = Path(skill_path)
    skill_md = skill_dir / "SKILL.md"
    if not skill_md.exists():
        return _fail("SKILL.md not found")

    content = skill_md.read_text(encoding="utf-8")
    if not content.startswith("---\n"):
        return _fail("No YAML frontmatter found (missing starting ---)")

    match = re.match(r"^---\n(.*?)\n---\n", content, re.DOTALL)
    if not match:
        return _fail("Invalid frontmatter format (expected --- ... ---)")

    frontmatter_text = match.group(1).strip("\n")
    if not frontmatter_text.strip():
        return _fail("Frontmatter is empty")

    keys: dict[str, str] = {}
    for i, raw_line in enumerate(frontmatter_text.splitlines(), start=1):
        line = raw_line.strip()
        if not line or line.startswith("#"):
            continue
        m = re.match(r"^([A-Za-z0-9_-]+):\s*(.*)$", line)
        if not m:
            return _fail(f"Unsupported frontmatter line {i}: {raw_line!r}")
        key, value = m.group(1), m.group(2)
        if value.startswith(("|", ">")):
            return _fail(
                f"Multiline YAML not supported in this validator (key {key!r}). "
                "Use single-line values for name/description."
            )
        if key in keys:
            return _fail(f"Duplicate key {key!r} in frontmatter")
        keys[key] = value.strip().strip('"').strip("'")

    allowed = {"name", "description"}
    unexpected = sorted(set(keys) - allowed)
    if unexpected:
        return _fail(f"Unexpected key(s) in frontmatter: {', '.join(unexpected)}")

    if "name" not in keys:
        return _fail("Missing 'name' in frontmatter")
    if "description" not in keys:
        return _fail("Missing 'description' in frontmatter")

    name = keys["name"].strip()
    if not name:
        return _fail("Name cannot be empty")
    if not re.match(r"^[a-z0-9-]+$", name):
        return _fail(
            f"Name {name!r} should be hyphen-case (lowercase letters, digits, hyphens)"
        )
    if name.startswith("-") or name.endswith("-") or "--" in name:
        return _fail(
            f"Name {name!r} cannot start/end with hyphen or contain consecutive hyphens"
        )
    if len(name) > MAX_SKILL_NAME_LENGTH:
        return _fail(
            f"Name is too long ({len(name)} characters). Maximum is {MAX_SKILL_NAME_LENGTH}."
        )

    description = keys["description"].strip()
    if not description:
        return _fail("Description cannot be empty")
    if "<" in description or ">" in description:
        return _fail("Description cannot contain angle brackets (< or >)")
    if len(description) > MAX_DESCRIPTION_LENGTH:
        return _fail(
            f"Description is too long ({len(description)} characters). Maximum is {MAX_DESCRIPTION_LENGTH}."
        )

    return True, "Skill frontmatter looks valid."


def main(argv: list[str]) -> int:
    if len(argv) != 2:
        print("Usage: quick_validate_skill_frontmatter.py <path/to/skill-folder>")
        return 1
    ok, message = validate_skill(argv[1])
    print(message)
    return 0 if ok else 1


if __name__ == "__main__":
    raise SystemExit(main(sys.argv))

