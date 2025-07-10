#!/bin/bash

# Auto-push current changes
# This script commits and pushes current changes to the current branch

set -e

current_branch=$(git branch --show-current)

echo "📤 Auto-pushing changes on branch: $current_branch"

# Check if there are any changes
if git diff --quiet && git diff --cached --quiet; then
    echo "✅ No changes to push"
    exit 0
fi

# Stage all changes
git add .

# Create commit message based on branch type
if [[ $current_branch == cursor/* ]]; then
    COMMIT_MSG="Auto-commit: Cursor session changes"
else
    COMMIT_MSG="Auto-commit: $(date '+%Y-%m-%d %H:%M:%S')"
fi

# Check if there are staged changes
if git diff --cached --quiet; then
    echo "✅ No staged changes to commit"
    exit 0
fi

# Commit changes
git commit -m "$COMMIT_MSG"

# Push to remote
git push origin "$current_branch"

echo "✅ Successfully pushed changes to $current_branch"

# If this is a cursor branch, trigger auto-merge workflow
if [[ $current_branch == cursor/* ]]; then
    echo "🔀 Cursor branch detected - GitHub Actions will handle auto-merge"
fi
