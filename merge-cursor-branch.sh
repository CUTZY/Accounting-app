#!/bin/bash

# Auto-merge Cursor branches to main
# Usage: ./merge-cursor-branch.sh [branch-name]

set -e

# Get current branch if no argument provided
CURSOR_BRANCH=${1:-$(git branch --show-current)}

# Check if branch starts with cursor/
if [[ ! $CURSOR_BRANCH == cursor/* ]]; then
    echo "❌ Error: Branch '$CURSOR_BRANCH' is not a cursor branch"
    echo "Cursor branches should start with 'cursor/'"
    exit 1
fi

echo "🚀 Auto-merging cursor branch: $CURSOR_BRANCH"

# Ensure we're on the cursor branch
git checkout "$CURSOR_BRANCH"

# Pull latest changes
echo "📥 Pulling latest changes..."
git pull origin "$CURSOR_BRANCH"

# Switch to main and pull
echo "🔄 Switching to main branch..."
git checkout main
git pull origin main

# Merge cursor branch
echo "🔀 Merging $CURSOR_BRANCH into main..."
git merge "$CURSOR_BRANCH" --no-ff -m "Auto-merge: $CURSOR_BRANCH"

# Push to main
echo "📤 Pushing to main..."
git push origin main

# Delete the cursor branch (optional)
read -p "🗑️  Delete cursor branch '$CURSOR_BRANCH'? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    git branch -d "$CURSOR_BRANCH"
    git push origin --delete "$CURSOR_BRANCH"
    echo "✅ Branch '$CURSOR_BRANCH' deleted"
fi

echo "✅ Successfully merged $CURSOR_BRANCH to main!"