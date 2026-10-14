"""Verify English reading selections against their cited public-domain pages.

Run from the repository root: python scripts/checkReadingSources.py
Requires only Python's standard library; never uses application credentials.
"""
import concurrent.futures
import json
import re
import sys
import urllib.request
from html.parser import HTMLParser
from pathlib import Path


class SourceText(HTMLParser):
    def __init__(self):
        super().__init__()
        self.parts = []
        self.anchor = 0
        self.skip = 0
        self.page_span_depth = 0

    def handle_starttag(self, tag, attrs):
        page_classes = {'pagenum', 'pageno'}
        if tag == 'span' and (self.page_span_depth or page_classes.intersection(dict(attrs).get('class', '').split())):
            self.page_span_depth += 1
        if tag in ('script', 'style', 'nav', 'header', 'footer'):
            self.skip += 1
        if tag == 'a':
            self.anchor += 1
        if tag in ('p', 'br', 'div'):
            self.parts.append(' ')

    def handle_endtag(self, tag):
        if tag == 'span' and self.page_span_depth:
            self.page_span_depth -= 1
        if tag in ('script', 'style', 'nav', 'header', 'footer'):
            self.skip = max(0, self.skip - 1)
        if tag == 'a':
            self.anchor = max(0, self.anchor - 1)
        if tag in ('p', 'div'):
            self.parts.append(' ')

    def handle_data(self, data):
        # Gutenberg's linked numeric footnote markers are not passage text.
        if not self.skip and not self.page_span_depth and not (self.anchor and data.strip().isdigit()):
            self.parts.append(data)


def normalize(text):
    return ' '.join(re.sub(r'\[\d*\]', '', text).split()).casefold()


def retrieve(url):
    with urllib.request.urlopen(url, timeout=45) as response:
        parser = SourceText()
        parser.feed(response.read().decode('utf-8'))
    return url, normalize(''.join(parser.parts))


def main():
    data = json.loads((Path(__file__).resolve().parents[1] / 'data/readingPassages.json').read_text())
    passages = data['passages']
    urls = sorted({entry['sourceUrl'] for entry in passages.values()})
    with concurrent.futures.ThreadPoolExecutor(max_workers=8) as pool:
        sources = dict(pool.map(retrieve, urls))
    failures = []
    for identity, entry in passages.items():
        for index, paragraph in enumerate(entry['text']['en'].split('\n\n'), 1):
            if normalize(paragraph) not in sources[entry['sourceUrl']]:
                failures.append(f'{identity}: paragraph {index} is not present in its cited source')
    if failures:
        print('\n'.join(failures), file=sys.stderr)
        return 1
    print(f'Verified all {len(passages)} English passages against {len(sources)} cited source pages.')
    return 0


if __name__ == '__main__':
    sys.exit(main())
