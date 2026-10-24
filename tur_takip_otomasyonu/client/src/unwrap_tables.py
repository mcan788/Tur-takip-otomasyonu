import os
import re

pages_dir = r"C:\SUNUCU_PAKETI\TurTakip_Arayuz\client\src\pages"

def unwrap_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    if '<div className="table-responsive">' not in content:
        return False
        
    # We want to replace <div className="table-responsive">\n...</table>\n</div>
    # With ...</table>
    
    # Just replace '<div className="table-responsive">\n' with ''
    # and replace '\n</div>' that comes exactly after '</table>' with ''
    
    pattern = re.compile(r'<div className="table-responsive">\n(.*?</table>)\n</div>', re.DOTALL)
    
    new_content = pattern.sub(r'\1', content)
    
    if new_content != content:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(new_content)
        return True
    return False

for filename in os.listdir(pages_dir):
    if filename.endswith(".jsx"):
        filepath = os.path.join(pages_dir, filename)
        if unwrap_file(filepath):
            print(f"Unwrapped {filename}")
