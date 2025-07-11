#!/bin/bash
set -e

echo "🔀 Quick merge script starting..."

# Ensure we're on main
git checkout main
git pull origin main

echo "📥 Merging cursor branch..."
# Merge the cursor branch
git merge origin/cursor/git-automation-setup-1752134231 --no-ff -m "🤖 Auto-merge: Git automation system implementation"

echo "📤 Pushing to main..."
# Push to main
git push origin main

echo "🗑️ Cleaning up cursor branch..."
# Delete the cursor branch
git push origin --delete cursor/git-automation-setup-1752134231

echo "✅ Merge completed successfully!"