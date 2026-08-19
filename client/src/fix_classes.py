import os
import re

pages_dir = r"C:\SUNUCU_PAKETI\TurTakip_Arayuz\client\src\pages"

def process_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    original_content = content
    
    # Catch className="A" className="B"
    # Wait, the spacing might vary.
    # We can run it multiple times if there are 3, but there's at most 2.
    def merge_classes(match):
        c1 = match.group(1)
        c2 = match.group(2)
        return f'className="{c1} {c2}"'

    content = re.sub(
        r'className="([^"]+)"\s+className="([^"]+)"',
        merge_classes,
        content
    )

    if content != original_content:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"Fixed duplicates in {os.path.basename(filepath)}")

for filename in os.listdir(pages_dir):
    if filename.endswith(".jsx"):
        process_file(os.path.join(pages_dir, filename))
