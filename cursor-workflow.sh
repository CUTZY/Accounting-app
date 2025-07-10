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
