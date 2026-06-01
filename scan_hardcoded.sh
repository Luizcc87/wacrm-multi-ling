#!/bin/bash

echo "=== SCANNING FOR HARDCODED UI STRINGS (CRITICAL FOR i18n) ==="

# List all files with potential UI strings
files=$(find src/app src/components -name "*.tsx" ! -path "*/ui/*" 2>/dev/null)

count=0
for file in $files; do
  if grep -q '"[A-Z][^"]*"' "$file" 2>/dev/null; then
    count=$((count + 1))
  fi
done

echo "Files with hardcoded strings: $count"

# Sample from each major section
echo -e "\n=== SAMPLE: AUTH STRINGS ==="
grep -h -o '"[^"]*"' src/app/\(auth\)/*.tsx 2>/dev/null | sort -u | head -20

echo -e "\n=== SAMPLE: COMMON LABELS ==="
grep -rh 'label.*=\|placeholder=' src/components/inbox src/components/contacts 2>/dev/null | grep -o '"[^"]*"' | sort -u | head -15

