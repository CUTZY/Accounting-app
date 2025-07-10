#!/bin/bash

# Setup Cursor Git Automation
# This script configures automatic git push and merge functionality for Cursor

set -e

echo "🔧 Setting up Cursor Git Automation..."

# 1. Configure git settings for optimal Cursor workflow
echo "📝 Configuring git settings..."

# Set up automatic remote tracking for new branches
git config push.autosetupremote true

# Set up automatic rebase for pulls
git config pull.rebase false

# Set up default push behavior
git config push.default simple

# Set up credential helper for persistent authentication
git config credential.helper store

# 2. Create a git hook for automatic cursor branch creation
echo "🪝 Setting up git hooks..."

# Create pre-commit hook that ensures we're on a cursor branch
mkdir -p .git/hooks

cat > .git/hooks/pre-commit << 'EOF'
#!/bin/bash

# Check if we're on main branch and there are changes
current_branch=$(git branch --show-current)

if [ "$current_branch" = "main" ]; then
    # Check if there are staged changes
    if ! git diff --cached --quiet; then
        echo "⚠️  Warning: You're committing directly to main branch!"
        echo "🚀 Consider using a cursor branch for better workflow."
        echo ""
        echo "To create a cursor branch:"
        echo "  ./create-cursor-branch.sh"
        echo ""
        echo "Continue anyway? (y/N)"
        read -r response
        if [[ ! "$response" =~ ^[Yy]$ ]]; then
            echo "❌ Commit cancelled"
            exit 1
        fi
    fi
fi
EOF

chmod +x .git/hooks/pre-commit

# 3. Create a script for automatic cursor branch creation
echo "🌿 Creating cursor branch automation..."

cat > create-cursor-branch.sh << 'EOF'
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
EOF

chmod +x create-cursor-branch.sh

# 4. Create an enhanced auto-push script
echo "📤 Creating auto-push functionality..."

cat > auto-push.sh << 'EOF'
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
EOF

chmod +x auto-push.sh

# 5. Create a complete workflow script
echo "⚡ Creating complete workflow script..."

cat > cursor-workflow.sh << 'EOF'
#!/bin/bash

# Complete Cursor Git Workflow
# Usage: ./cursor-workflow.sh [action] [description]
# Actions: start, push, merge, status

ACTION=${1:-"status"}
DESCRIPTION=${2:-"cursor-session"}

case $ACTION in
    "start")
        echo "🚀 Starting new Cursor session..."
        ./create-cursor-branch.sh "$DESCRIPTION"
        ;;
    "push")
        echo "📤 Auto-pushing changes..."
        ./auto-push.sh
        ;;
    "merge")
        echo "🔀 Merging cursor branch..."
        current_branch=$(git branch --show-current)
        if [[ $current_branch == cursor/* ]]; then
            ./merge-cursor-branch.sh "$current_branch"
        else
            echo "❌ Not on a cursor branch"
            exit 1
        fi
        ;;
    "status")
        echo "📊 Git Status:"
        git status
        echo ""
        echo "🌿 Current branch: $(git branch --show-current)"
        echo "📈 Branches:"
        git branch -a
        ;;
    *)
        echo "Usage: $0 [start|push|merge|status] [description]"
        echo ""
        echo "Commands:"
        echo "  start [desc]  - Create new cursor branch"
        echo "  push          - Auto-commit and push changes"
        echo "  merge         - Merge current cursor branch to main"
        echo "  status        - Show git status"
        ;;
esac
EOF

chmod +x cursor-workflow.sh

# 6. Update GitHub Actions workflows for better reliability
echo "🤖 Updating GitHub Actions workflows..."

# Improve auto-merge workflow
cat > .github/workflows/auto-merge-cursor.yml << 'EOF'
name: Auto-merge Cursor branches

on:
  push:
    branches:
      - 'cursor/**'

jobs:
  auto-merge:
    runs-on: ubuntu-latest
    if: startsWith(github.ref, 'refs/heads/cursor/')
    
    steps:
    - name: Checkout repository
      uses: actions/checkout@v4
      with:
        fetch-depth: 0
        token: ${{ secrets.GITHUB_TOKEN }}

    - name: Configure Git
      run: |
        git config --global user.name "Cursor Auto-merge Bot"
        git config --global user.email "cursor-bot@noreply.github.com"

    - name: Merge to main
      run: |
        echo "🔀 Auto-merging ${{ github.ref_name }} to main"
        git checkout main
        git pull origin main
        git merge origin/${{ github.ref_name }} --no-ff -m "🤖 Auto-merge: ${{ github.ref_name }}"
        git push origin main
        echo "✅ Successfully merged to main"

    - name: Delete merged branch
      run: |
        echo "🗑️ Cleaning up merged branch"
        git push origin --delete ${{ github.ref_name }}
        echo "✅ Branch deleted"

    - name: Notify completion
      run: |
        echo "🎉 Auto-merge completed for ${{ github.ref_name }}"
EOF

# 7. Create a Cursor configuration file
echo "⚙️ Creating Cursor configuration..."

cat > .cursor-git-config << 'EOF'
# Cursor Git Configuration
# This file contains settings for Cursor git automation

# Auto-push settings
AUTO_PUSH_ENABLED=true
AUTO_COMMIT_MESSAGE="Auto-commit: Cursor session changes"

# Branch settings
CURSOR_BRANCH_PREFIX="cursor/"
AUTO_CREATE_BRANCHES=true

# Merge settings
AUTO_MERGE_ENABLED=true
DELETE_MERGED_BRANCHES=true

# Workflow settings
DEFAULT_WORKFLOW="auto"
EOF

echo ""
echo "✅ Cursor Git Automation Setup Complete!"
echo ""
echo "📋 Available commands:"
echo "  ./cursor-workflow.sh start [description]  - Start new cursor session"
echo "  ./cursor-workflow.sh push                 - Auto-push changes"
echo "  ./cursor-workflow.sh merge                - Merge cursor branch"
echo "  ./cursor-workflow.sh status               - Show git status"
echo ""
echo "🚀 Quick start:"
echo "  1. ./cursor-workflow.sh start 'my-feature'"
echo "  2. Make your changes..."
echo "  3. ./cursor-workflow.sh push"
echo "  4. Changes will auto-merge via GitHub Actions"
echo ""
echo "🔧 Manual merge: ./merge-cursor-branch.sh [branch-name]"
echo ""