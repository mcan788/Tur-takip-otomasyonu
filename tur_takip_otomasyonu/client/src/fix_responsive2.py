import os
import re

pages_dir = r"C:\SUNUCU_PAKETI\TurTakip_Arayuz\client\src\pages"

def process_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    original_content = content
    
    # Catch repeat(3, 1fr)
    content = re.sub(
        r"style=\{\{\s*display:\s*'grid',\s*gridTemplateColumns:\s*'repeat\(3,\s*1fr\)',\s*gap:\s*'[^']+'(?:\s*,\s*marginBottom:\s*'[^']+')?\s*\}\}",
        r'className="responsive-grid-3"',
        content
    )
    
    # Catch 1fr 1fr
    content = re.sub(
        r"style=\{\{\s*display:\s*'grid',\s*gridTemplateColumns:\s*'1fr 1fr',\s*gap:\s*'[^']+'[^}]*\}\}",
        r'className="responsive-grid-2"',
        content
    )

    # Catch 1fr 1fr 1fr 1fr
    content = re.sub(
        r"style=\{\{\s*display:\s*'grid',\s*gridTemplateColumns:\s*'1fr 1fr 1fr 1fr',\s*gap:\s*'[^']+'[^}]*\}\}",
        r'className="responsive-grid-4"',
        content
    )

    # Catch repeat(6, 1fr)
    content = re.sub(
        r"style=\{\{\s*display:\s*'grid',\s*gridTemplateColumns:\s*'repeat\(6,\s*1fr\)',\s*gap:\s*'[^']+'[^}]*\}\}",
        r'className="responsive-grid-6"',
        content
    )
    
    # Catch inline repeat(6, 1fr) inside a larger style block
    content = re.sub(
        r"display:\s*'grid',\s*gridTemplateColumns:\s*'repeat\(6,\s*1fr\)'",
        r"display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)'", # we will just leave it if it's too complex or we can wrap with a class.
        content
    )

    # Catch 1fr 2fr and 1.5fr 1fr - they should be single column on mobile
    content = re.sub(
        r"style=\{\{\s*display:\s*'grid',\s*gridTemplateColumns:\s*'(1fr 2fr|1\.5fr 1fr)',\s*gap:\s*'[^']+'(?:\s*,\s*marginBottom:\s*'[^']+')?\s*\}\}",
        r'className="responsive-grid-2"',
        content
    )

    if content != original_content:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"Updated {os.path.basename(filepath)}")

for filename in os.listdir(pages_dir):
    if filename.endswith(".jsx"):
        process_file(os.path.join(pages_dir, filename))
