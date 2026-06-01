#!/bin/bash

# Section 1: Directory structure
echo "=== DIRECTORY STRUCTURE ==="
find src -type d | head -20 | sed 's|^\./||'

echo -e "\n=== API ROUTES ==="
find src/app/api -name "route.ts" | sort | sed 's|^src/||'

echo -e "\n=== PAGE ROUTES ==="
find src/app -name "page.tsx" | sort | sed 's|^src/||'

echo -e "\n=== COMPONENT FILES ==="
find src/components -name "*.tsx" | wc -l
echo "Total component files above"

echo -e "\n=== HARDCODED STRINGS FILES ==="
grep -l "\"[A-Z].*\"" src/components/*.tsx 2>/dev/null | wc -l
