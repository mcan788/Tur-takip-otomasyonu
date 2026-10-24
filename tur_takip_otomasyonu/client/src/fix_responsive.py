import os
import re

pages_dir = r"C:\SUNUCU_PAKETI\TurTakip_Arayuz\client\src\pages"

def process_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    original_content = content
    
    # 1. gridTemplateColumns: 'repeat(2, 1fr)' -> className="responsive-grid-2"
    # style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '15px' }} -> className="responsive-grid-2" style={{ ... }} (without display/gridTemplateColumns)
    # Actually, we can just replace the whole style tag if it's simple, or we can use regex to replace specific properties.
    # Because style props might contain other things, let's use a simpler regex.
    # Or, we can just look for the most common exact matches.

    # Find <div style={{ display: 'grid', gridTemplateColumns: 'repeat(X, 1fr)', gap: 'Ypx' }}>
    content = re.sub(
        r"style=\{\{\s*display:\s*'grid',\s*gridTemplateColumns:\s*'repeat\((\d+),\s*1fr\)',\s*gap:\s*'[^']+'\s*\}\}",
        r'className="responsive-grid-\1"',
        content
    )
    
    # Find style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'Ypx' }}
    content = re.sub(
        r"style=\{\{\s*display:\s*'grid',\s*gridTemplateColumns:\s*'1fr 1fr',\s*gap:\s*'[^']+'\s*\}\}",
        r'className="responsive-grid-2"',
        content
    )
    
    # Find style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 'Ypx' }}
    content = re.sub(
        r"style=\{\{\s*display:\s*'grid',\s*gridTemplateColumns:\s*'1fr 1fr 1fr 1fr',\s*gap:\s*'[^']+'\s*\}\}",
        r'className="responsive-grid-4"',
        content
    )
    
    # Find style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr 1fr', gap: '20px', ... }}
    # We can just change gridTemplateColumns to repeat(6, 1fr) equivalent on mobile
    content = re.sub(
        r"display:\s*'grid',\s*gridTemplateColumns:\s*'2fr 1fr 1fr 1fr 1fr 1fr'",
        r"display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)'",
        content
    )
    # Then wrap the element with responsive-grid-6 so it becomes 1 column on mobile?
    # Wait, if we just add responsive-grid-6 class, it will override gridTemplateColumns on mobile!
    # Let's replace `style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr 1fr'` with `className="responsive-grid-6" style={{ ...`
    content = re.sub(
        r"style=\{\{\s*display:\s*'grid',\s*gridTemplateColumns:\s*'2fr 1fr 1fr 1fr 1fr 1fr',",
        r'className="responsive-grid-6" style={{',
        content
    )

    # Find <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center'
    content = re.sub(
        r"style=\{\{\s*display:\s*'flex',\s*justifyContent:\s*'space-between',\s*alignItems:\s*'center'(?:,\s*marginBottom:\s*'[^']+')?\s*\}\}",
        r'className="responsive-flex-header"',
        content
    )

    # Find <div style={{ display: 'flex', gap: 'Ypx'
    content = re.sub(
        r"style=\{\{\s*display:\s*'flex',\s*gap:\s*'[^']+'(?:\s*,\s*alignItems:\s*'center')?\s*\}\}",
        r'className="responsive-flex-row"',
        content
    )

    if content != original_content:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"Updated {os.path.basename(filepath)}")

for filename in os.listdir(pages_dir):
    if filename.endswith(".jsx"):
        process_file(os.path.join(pages_dir, filename))
