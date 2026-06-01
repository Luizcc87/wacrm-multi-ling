#!/bin/bash

echo "=== EXTRACTING HARDCODED UI STRINGS ==="

# Search for common patterns in components and pages
echo -e "\n--- AUTH PAGES ---"
grep -rn "Welcome\|Email\|Password\|Sign in\|Create account\|Forgot" src/app/\(auth\) --include="*.tsx" | grep -E '(>|label|placeholder|text)' | head -15

echo -e "\n--- DASHBOARD/INBOX STRINGS ---"
grep -rn "Inbox\|Contacts\|Messages\|Reply\|Send" src/app/\(dashboard\)/inbox --include="*.tsx" | head -10

echo -e "\n--- BUTTON/LABEL STRINGS ---"
grep -rn '"[A-Z].*"' src/components/ui --include="*.tsx" | head -15

echo -e "\n--- FORM LABELS ---"
grep -rn 'label.*>\|placeholder=' src/components --include="*.tsx" | head -15

