import os

pages_dir = r"C:\SUNUCU_PAKETI\TurTakip_Arayuz\client\src\pages"

def safe_wrap(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    if '<table' not in content:
        return False
        
    # Replace <table with <div className="table-responsive"><table
    new_content = content.replace('<table', '<div className="table-responsive">\n<table')
    new_content = new_content.replace('</table>', '</table>\n</div>')
    
    # Fix duplicates if it was already wrapped (from previous failed attempts)
    new_content = new_content.replace('<div className="table-responsive">\n<div className="table-responsive">\n', '<div className="table-responsive">\n')
    new_content = new_content.replace('\n</div>\n</div>', '\n</div>')
    
    if new_content != content:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(new_content)
        return True
    return False

for filename in os.listdir(pages_dir):
    if filename.endswith(".jsx"):
        filepath = os.path.join(pages_dir, filename)
        if safe_wrap(filepath):
            print(f"Safely Wrapped {filename}")
