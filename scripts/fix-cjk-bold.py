"""Keep punctuation outside **bold** spans in CJK Markdown.

CommonMark only opens/closes `**` next to punctuation when there is a space
on the other side, which CJK text never has. So `**標題：**文字` and
`文字**「詞」**` do not render as bold. This moves leading/trailing
punctuation of each bold span outside the markers: `**標題**：文字`.

Usage: python3 scripts/fix-cjk-bold.py FILE...
"""
import sys

PUNCT = set('：:。，、！？；「」『』（）()《》“”‘’')
PAIRS = {'）': '（', ')': '(', '」': '「', '』': '『', '》': '《', '”': '“', '’': '‘'}

def fix_line(line: str) -> str:
    parts = line.split('**')
    if len(parts) < 3 or len(parts) % 2 == 0:
        return line  # no complete bold pairs
    for i in range(1, len(parts), 2):
        while parts[i] and parts[i][0] in PUNCT:
            parts[i - 1] += parts[i][0]
            parts[i] = parts[i][1:]
        while parts[i] and parts[i][-1] in PUNCT:
            last = parts[i][-1]
            after = parts[i + 1][:1]
            # A balanced closing bracket can stay inside when punctuation or
            # a space follows the closing **, because the span still closes.
            if last in PAIRS and PAIRS[last] in parts[i] and (after == '' or after.isspace() or after in PUNCT):
                break
            parts[i + 1] = last + parts[i + 1]
            parts[i] = parts[i][:-1]
    return '**'.join(parts)

for path in sys.argv[1:]:
    with open(path, encoding='utf-8') as f:
        text = f.read()
    fixed = '\n'.join(fix_line(line) for line in text.split('\n'))
    if fixed != text:
        with open(path, 'w', encoding='utf-8') as f:
            f.write(fixed)
        print('fixed', path)
