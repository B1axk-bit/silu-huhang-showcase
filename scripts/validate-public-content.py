#!/usr/bin/env python3
"""Validate that the public showcase contains no restricted internal material."""

from __future__ import annotations

import sys
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
TEXT_SUFFIXES = {
    ".css",
    ".html",
    ".js",
    ".json",
    ".md",
    ".py",
    ".svg",
    ".txt",
    ".xml",
    ".yml",
    ".yaml",
}


def restricted_terms() -> list[str]:
    return [
        "_".join(("OPENAI", "API", "KEY")),
        "_".join(("KIMI", "API", "KEY")),
        "_".join(("CRON", "SECRET")),
        "_".join(("GAP", "FINGERPRINT", "SECRET")),
        ".e" + "nv",
        "local" + "host",
        "/U" + "sers/",
        "vercel" + ".app",
        "api" + "/assist",
        "approval" + "-registry",
        "decision" + "-history",
        "source" + "Commit",
        "snapshot" + "Hash",
        "transaction" + "Id",
        "真实客户" + "姓名",
        "资金" + "账号",
        "手机" + "号",
        "内部制度" + "全文",
    ]


def iter_public_files() -> list[Path]:
    files: list[Path] = []
    for path in ROOT.rglob("*"):
        if not path.is_file():
            continue
        relative = path.relative_to(ROOT)
        if relative.parts[0] in {".git", "artifacts"}:
            continue
        if path.suffix.lower() in TEXT_SUFFIXES or path.name in {"LICENSE", ".nojekyll"}:
            files.append(path)
    return files


def validate_sizes() -> list[str]:
    errors: list[str] = []
    index_size = (ROOT / "site" / "index.html").stat().st_size
    css_size = sum(path.stat().st_size for path in (ROOT / "site" / "assets" / "css").glob("*.css"))
    js_size = sum(path.stat().st_size for path in (ROOT / "site" / "assets" / "js").glob("*.js"))

    if index_size >= 100 * 1024:
        errors.append(f"index.html exceeds 100KB: {index_size} bytes")
    if css_size >= 150 * 1024:
        errors.append(f"CSS exceeds 150KB: {css_size} bytes")
    if js_size >= 150 * 1024:
        errors.append(f"JavaScript exceeds 150KB: {js_size} bytes")

    image_root = ROOT / "site" / "assets"
    for path in image_root.rglob("*"):
        if path.is_file() and path.stat().st_size > 500 * 1024:
            errors.append(f"Asset exceeds 500KB: {path.relative_to(ROOT)}")
    return errors


def main() -> int:
    violations: list[str] = []
    terms = restricted_terms()
    for path in iter_public_files():
        text = path.read_text(encoding="utf-8", errors="ignore")
        for term in terms:
            if term in text:
                violations.append(f"{path.relative_to(ROOT)} contains restricted term: {term}")

    violations.extend(validate_sizes())
    if violations:
        print("Public content validation failed:")
        for violation in violations:
            print(f"- {violation}")
        return 1

    print("Public content validation passed.")
    print(f"Scanned {len(iter_public_files())} public text files.")
    print("Manual review checklist: no institutional logo, production claim, personal data, private repository reference, controlled response body, or private preview URL.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
