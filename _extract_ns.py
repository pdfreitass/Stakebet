#!/usr/bin/env python3
"""Extract each namespace IIFE from the single-file HTML into separate JS files."""
import re, sys, os
sys.stdout.reconfigure(encoding='utf-8')

with open('stakebet (26).html', 'r', encoding='utf-8', errors='replace') as f:
    content = f.read()

m = re.search(r'<script>(.*?)</script>', content, re.DOTALL)
script = m.group(1)

ns_to_file = {
    'Util': 'public/js/domain/util.js',
    'Html': 'public/js/ui/html.js',
    'Store': 'public/js/infrastructure/storage.js',
    'Config': 'public/js/app/config.js',
    'Casas': 'public/js/app/casas.js',
    'Simples': 'public/js/app/simples.js',
    'Surebets': 'public/js/app/surebets.js',
    'DuploGreen': 'public/js/app/duplogreen.js',
    'Lixeira': 'public/js/app/lixeira.js',
    'Relatorios': 'public/js/app/reports.js',
    'Sync': 'public/js/infrastructure/sync.js',
    'Nav': 'public/js/ui/navigation.js',
    'Home': 'public/js/ui/home.js',
}

prefix = 'window.SB = window.SB || {};\n\n'

for ns_name, filepath in ns_to_file.items():
    pattern = (
        r'(/\*[^*]*?' + ns_name + r'[^*]*?\*/\s*\n?\s*'
        r'window\.SB\.' + ns_name + r'\s*=\s*\(function\(\).*?'
        r'\n\s*\}\)\(\);?)'
    )
    match = re.search(pattern, script, re.DOTALL)
    if match:
        os.makedirs(os.path.dirname(filepath), exist_ok=True)
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(prefix + match.group(1) + '\n')
        print(f'OK: SB.{ns_name} -> {filepath} ({len(match.group(1))} chars)')
    else:
        print(f'MISSING: SB.{ns_name}')

print('\nDone extracting all namespaces!')
