#!/bin/bash

# Create and switch to a new cursor branch
# Usage: ./create-cursor-branch.sh [description]

set -e

# Generate a unique branch name
TIMESTAMP=$(date +%s)
DESCRIPTION=${1:-"cursor-session"}
CLEAN_DESCRIPTION=$(echo "$DESCRIPTION" | tr ' ' '-' | tr '[:upper:]' '[:lower:]' | sed 's/[^a-z0-9-]//g')
BRANCH_NAME="cursor/${CLEAN_DESCRIPTION}-${TIMESTAMP}"

echo "🌿 Creating cursor branch: $BRANCH_NAME"

# Ensure we're on main and up to date
git checkout main
git pull origin main

# Create and switch to new cursor branch
git checkout -b "$BRANCH_NAME"

# Push the branch to remote
git push -u origin "$BRANCH_NAME"

echo "✅ Created and switched to cursor branch: $BRANCH_NAME"
echo "🚀 Ready for development!"
