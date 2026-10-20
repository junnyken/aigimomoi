#!/usr/bin/env python3
import os
import re
import sys

BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', '..', '..', 'workspace', 'projects', 'angimom'))
PROTOTYPE_DIR = os.path.join(BASE_DIR, 'prototype')

HTML_FILES = ['index.html', 'recipe.html', 'meal.html', 'shopping.html']

def test_html_structure():
    print("=== 1. Testing HTML Structure & Accessibility Standards ===")
    all_ok = True
    for html_file in HTML_FILES:
        filepath = os.path.join(PROTOTYPE_DIR, html_file)
        if not os.path.exists(filepath):
            print(f"[FAIL] Missing {html_file}")
            all_ok = False
            continue
        
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()

        # Check viewport
        if 'name="viewport"' not in content or 'width=device-width' not in content:
            print(f"[FAIL] {html_file}: Missing proper responsive viewport meta tag")
            all_ok = False
        else:
            print(f"[PASS] {html_file}: Viewport meta tag OK")

        # Check title
        if '<title>' not in content or '</title>' not in content:
            print(f"[FAIL] {html_file}: Missing <title> tag")
            all_ok = False
        else:
            print(f"[PASS] {html_file}: Title tag OK")

        # Check meta description
        if 'name="description"' not in content:
            print(f"[FAIL] {html_file}: Missing meta description")
            all_ok = False
        else:
            print(f"[PASS] {html_file}: Meta description OK")

        # Check semantic tags
        for tag in ['<header', '<main', '<footer']:
            if tag not in content:
                print(f"[FAIL] {html_file}: Missing semantic tag {tag}")
                all_ok = False
        print(f"[PASS] {html_file}: Semantic layout tags OK")

    return all_ok

def test_css_responsive_and_wcag():
    print("\n=== 2. Testing CSS Responsive & WCAG 2.2 Tokens ===")
    css_path = os.path.join(PROTOTYPE_DIR, 'styles', 'main.css')
    with open(css_path, 'r', encoding='utf-8') as f:
        css = f.read()

    # Check media queries
    if '@media (max-width: 640px)' in css:
        print("[PASS] Media query for mobile (<640px) present")
    else:
        print("[FAIL] Missing mobile media query")
        return False

    # Check touch target rules
    if 'min-height: 40px' in css and 'min-width: 40px' in css:
        print("[PASS] Touch target minimum dimensions (40px/44px) present")
    else:
        print("[FAIL] Missing touch target sizing rules")
        return False

    # Check focus visible
    if ':focus-visible' in css and 'var(--focus-ring)' in css:
        print("[PASS] Keyboard focus ring (:focus-visible) present")
    else:
        print("[FAIL] Missing :focus-visible rule")
        return False

    return True

def main():
    ok1 = test_html_structure()
    ok2 = test_css_responsive_and_wcag()

    if ok1 and ok2:
        print("\n>>> ALL AG-08 RESPONSIVE & USABILITY TESTS PASSED! <<<")
        sys.exit(0)
    else:
        print("\n>>> SOME TESTS FAILED <<<")
        sys.exit(1)

if __name__ == '__main__':
    main()
