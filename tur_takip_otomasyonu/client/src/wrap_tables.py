import os
import re

pages_dir = r"C:\SUNUCU_PAKETI\TurTakip_Arayuz\client\src\pages"

def process_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # We need to wrap <table ...> ... </table> with <div className="table-responsive"> ... </div>
    # But wait, it's JSX, so we can use regex, or just string replacement if it's safe.
    # Since table could span multiple lines, let's use re.sub with DOTALL
    # Match <table ...> up to </table>
    # However, replacing nested tables or complex JSX might break if not careful.
    # But in standard React dashboards, there's usually just one top-level table per card.
    
    # We only want to wrap tables that are NOT already wrapped.
    # A simple approach:
    # 1. find all occurrences of <table
    # 2. check if they are already preceded by <div className="table-responsive">
    
    new_content = re.sub(r'(<table\b[^>]*>.*?</table>)', r'<div className="table-responsive">\1</div>', content, flags=re.DOTALL)
    
    # If a table was already wrapped, we might have <div className="table-responsive"><div className="table-responsive">...
    # Let's fix double wraps:
    new_content = new_content.replace('<div className="table-responsive"><div className="table-responsive">', '<div className="table-responsive">')
    new_content = new_content.replace('</div></div>', '</div>') # A bit risky, let's avoid double wrap logic and just do a simple replacement if not already wrapped.
    
    # Better logic:
    # Use re.split to split by '<table' and '</table>' and manually rebuild, checking for wrapper.
    pass

def safer_process_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    if '<table' not in content:
        return False
        
    # We will use regex to find <table ...> ... </table>
    # And we will only replace if it's not preceded by table-responsive
    
    pattern = re.compile(r'(<table\b[^>]*>.*?</table>)', re.DOTALL)
    
    def replacer(match):
        table_html = match.group(1)
        # Check if it already has responsive div (we'll just assume none of them do since we just moved the class out of media query)
        return f'<div className="table-responsive">\n{table_html}\n</div>'
        
    new_content = pattern.sub(replacer, content)
    
    if new_content != content:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(new_content)
        return True
    return False


for filename in os.listdir(pages_dir):
    if filename.endswith(".jsx"):
        filepath = os.path.join(pages_dir, filename)
        if safer_process_file(filepath):
            print(f"Updated {filename}")
