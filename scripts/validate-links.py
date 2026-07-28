#!/usr/bin/env python3
"""Validate local site links and approved public regulator links."""

from __future__ import annotations

import re
import sys
from html.parser import HTMLParser
from pathlib import Path
from urllib.error import HTTPError, URLError
from urllib.parse import urlparse
from urllib.request import Request, urlopen


ROOT = Path(__file__).resolve().parents[1]
SITE = ROOT / "site"
ATTR_PATTERN = re.compile(r"\b(?:href|src)=[\"']([^\"']+)[\"']", re.IGNORECASE)
URL_PATTERN = re.compile(r"https://[^\"'\s]+")


class IdParser(HTMLParser):
    def __init__(self) -> None:
        super().__init__()
        self.ids: set[str] = set()

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        for name, value in attrs:
            if name == "id" and value:
                self.ids.add(value)


def local_target_exists(source: Path, target: str) -> bool:
    if target.startswith("/silu-huhang-showcase/"):
        relative = target.removeprefix("/silu-huhang-showcase/")
        return (SITE / relative).exists() if relative else (SITE / "index.html").exists()
    clean = target.split("#", 1)[0].split("?", 1)[0]
    if not clean:
        return True
    return (source.parent / clean).resolve().exists()


def validate_external(url: str) -> str | None:
    parsed = urlparse(url)
    if parsed.hostname not in {"www.csrc.gov.cn", "b1axk-bit.github.io"}:
        return f"Unapproved external host: {url}"
    request = Request(url, headers={"User-Agent": "SiluShowcaseLinkValidator/1.0"})
    try:
        with urlopen(request, timeout=30) as response:
            if response.status >= 400:
                return f"External link returned {response.status}: {url}"
    except HTTPError as error:
        return f"External link returned {error.code}: {url}"
    except (URLError, TimeoutError) as error:
        return f"External link failed: {url} ({error})"
    return None


def main() -> int:
    errors: list[str] = []
    external_urls: set[str] = set()
    index_text = (SITE / "index.html").read_text(encoding="utf-8")
    parser = IdParser()
    parser.feed(index_text)

    for html_path in SITE.rglob("*.html"):
        text = html_path.read_text(encoding="utf-8")
        for target in ATTR_PATTERN.findall(text):
            if target.startswith(("mailto:", "tel:", "data:")):
                errors.append(f"Unsupported public link in {html_path.relative_to(ROOT)}: {target}")
            elif target.startswith("https://"):
                external_urls.add(target)
            elif target.startswith("#"):
                if html_path.name == "index.html" and target[1:] not in parser.ids:
                    errors.append(f"Missing anchor target: {target}")
            elif not local_target_exists(html_path, target):
                errors.append(f"Missing local resource from {html_path.relative_to(ROOT)}: {target}")

    for path in (SITE / "assets" / "js").glob("*.js"):
        external_urls.update(URL_PATTERN.findall(path.read_text(encoding="utf-8")))

    for url in sorted(external_urls):
        error = validate_external(url)
        if error:
            errors.append(error)

    if errors:
        print("Link validation failed:")
        for error in errors:
            print(f"- {error}")
        return 1

    print(f"Link validation passed. Checked {len(external_urls)} approved external links.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
