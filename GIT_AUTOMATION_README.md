# 🚀 Cursor Git Automation System

## Overview

This repository is equipped with an advanced Git automation system designed specifically for Cursor IDE. The system provides seamless automatic push and merge functionality while maintaining proper git workflow practices.

## 🔧 Features

- ✅ **Automatic Cursor Branch Creation**: Creates unique branches for each development session
- ✅ **Auto-Push Functionality**: Automatically commits and pushes changes
- ✅ **GitHub Actions Integration**: Automatic merging of cursor branches to main
- ✅ **Smart Git Hooks**: Prevents accidental commits to main branch
- ✅ **Manual Override Options**: Complete control when needed
- ✅ **Cursor IDE Integration**: Optimized settings for Cursor workflow

## 📋 Quick Start

### 1. One-Time Setup
The automation system is already configured, but if you need to reset it:

```bash
./setup-cursor-git.sh
```

### 2. Start a New Development Session

```bash
# Start a new cursor branch for your work
./cursor-workflow.sh start "my-feature-description"
```

This will:
- Create a new branch named `cursor/my-feature-description-[timestamp]`
- Switch to the new branch
- Push the branch to remote
- Set up tracking

### 3. Work and Auto-Push

As you work, use the auto-push feature:

```bash
# Auto-commit and push your current changes
./cursor-workflow.sh push
```

Or use the individual script:
```bash
./auto-push.sh
```

### 4. Automatic Merge

When you push to a cursor branch, GitHub Actions will automatically:
- Merge your branch to main
- Delete the merged branch
- Keep your main branch up to date

## 🎯 Available Commands

### Main Workflow Script

```bash
./cursor-workflow.sh [command] [description]
```

**Commands:**
- `start [description]` - Create new cursor branch
- `push` - Auto-commit and push changes
- `merge` - Manually merge cursor branch to main
- `status` - Show git status and branch information

### Individual Scripts

```bash
./create-cursor-branch.sh [description]    # Create new cursor branch
./auto-push.sh                            # Auto-commit and push
./merge-cursor-branch.sh [branch-name]    # Manual merge with confirmation
```

## 🤖 GitHub Actions Workflows

### Auto-Merge Workflow
- **Trigger**: Push to any `cursor/*` branch
- **Action**: Automatically merges to main and deletes the branch
- **File**: `.github/workflows/auto-merge-cursor.yml`

### Auto-PR Workflow (Optional)
- **Trigger**: Push to any `cursor/*` branch
- **Action**: Creates a pull request for review
- **File**: `.github/workflows/auto-pr-cursor.yml`

## ⚙️ Configuration

### Git Settings
The system automatically configures:
- `push.autosetupremote = true` - Auto-track new branches
- `pull.rebase = false` - Use merge strategy for pulls
- `push.default = simple` - Safe push behavior

### Cursor IDE Settings
Located in `.vscode/settings.json`:
- Smart commit enabled
- Auto-fetch enabled
- Confirmation dialogs disabled for smoother workflow
- Custom terminal commands for git operations

### Environment Configuration
Settings in `.cursor-git-config`:
- Auto-push enabled by default
- Cursor branch prefix: `cursor/`
- Auto-merge enabled
- Branch cleanup enabled

## 🔒 Safety Features

### Git Hooks
- **Pre-commit hook**: Warns when committing directly to main
- **Branch protection**: Encourages use of cursor branches

### Branch Naming
- All cursor branches use format: `cursor/description-timestamp`
- Unique timestamps prevent naming conflicts
- Descriptive names improve tracking

### Manual Override
You can always use standard git commands:
```bash
git add .
git commit -m "My custom message"
git push
```

## 🚨 Troubleshooting

### Issue: Push button blocked in Cursor
**Solution**: Use the auto-push script instead:
```bash
./cursor-workflow.sh push
```

### Issue: GitHub Actions not running
**Verification**:
1. Check that your branch starts with `cursor/`
2. Verify workflows exist in `.github/workflows/`
3. Check repository permissions for GitHub Actions

### Issue: Merge conflicts
**Resolution**:
```bash
# Switch to main and update
git checkout main
git pull origin main

# Go back to your cursor branch
git checkout cursor/your-branch-name

# Merge main into your branch to resolve conflicts
git merge main

# Fix conflicts, then push
./auto-push.sh
```

### Issue: Lost cursor branch
**Recovery**:
```bash
# List all branches
git branch -a

# Switch to your cursor branch
git checkout cursor/your-branch-name

# Or create a new one
./cursor-workflow.sh start "recovery"
```

## 📊 Monitoring

### Check Status
```bash
./cursor-workflow.sh status
```

### View All Branches
```bash
git branch -a
```

### Check GitHub Actions
Visit your repository on GitHub and check the "Actions" tab to see workflow runs.

## 🎯 Best Practices

1. **Always start with a new cursor branch**:
   ```bash
   ./cursor-workflow.sh start "descriptive-name"
   ```

2. **Push frequently**:
   ```bash
   ./cursor-workflow.sh push
   ```

3. **Use descriptive branch names**:
   ```bash
   ./cursor-workflow.sh start "fix-login-bug"
   ./cursor-workflow.sh start "add-user-dashboard"
   ```

4. **Let GitHub Actions handle merging**:
   - Just push to your cursor branch
   - Actions will automatically merge to main

5. **Monitor the Actions tab** for any merge issues

## 🔄 Workflow Examples

### Simple Feature Development
```bash
# Start
./cursor-workflow.sh start "new-feature"

# Make changes to your code...

# Save and push
./cursor-workflow.sh push

# GitHub Actions automatically merges to main
```

### Bug Fix
```bash
# Start
./cursor-workflow.sh start "fix-critical-bug"

# Fix the bug...

# Test and push
./cursor-workflow.sh push

# Automatic merge to main
```

### Multiple Changes Session
```bash
# Start
./cursor-workflow.sh start "refactor-components"

# Make changes...
./cursor-workflow.sh push

# More changes...
./cursor-workflow.sh push

# Final changes...
./cursor-workflow.sh push

# All changes are in the same cursor branch, will merge as one unit
```

## 📞 Support

If you encounter issues:
1. Check this README for solutions
2. Review the git status: `./cursor-workflow.sh status`
3. Check GitHub Actions in your repository
4. Use manual git commands as fallback

---

🎉 **Happy Coding with Automated Git Workflow!** 🎉