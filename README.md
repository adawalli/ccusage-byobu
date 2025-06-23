# ccusage-byobu

## Installation

```bash
git clone git@github.com:adawalli/ccusage-byobu.git
cd ccusage-byobu
npm install
```

## Development

This project uses Husky pre-commit hooks to maintain code quality. The hooks automatically run:

- **ESLint** - Lints and auto-fixes JavaScript files
- **Prettier** - Formats JavaScript and JSON files  
- **Commitlint** - Validates commit message format

### Git Hooks

#### Pre-commit Hook
Runs `lint-staged` to check only staged files for:
- ESLint linting with auto-fix
- Prettier formatting

#### Commit Message Hook
Validates commit messages follow [Conventional Commits](https://www.conventionalcommits.org/) format:
- `feat: add new feature`
- `fix: resolve bug`
- `docs: update documentation`
- `style: format code`
- `refactor: restructure code`
- `test: add tests`
- `chore: maintenance tasks`

### Bypassing Hooks (Emergency Use Only)

⚠️ **Use with caution** - Only bypass hooks when absolutely necessary

#### Skip All Hooks
```bash
git commit --no-verify -m "emergency fix"
```

#### Skip Specific Steps
```bash
# Skip pre-commit but allow commit-msg validation
HUSKY=0 git commit -m "feat: emergency feature"
```

#### When to Bypass
- **Hotfixes** - Critical production issues requiring immediate deployment
- **WIP Commits** - Work-in-progress commits in feature branches (consider using `git stash` instead)
- **Hook Failures** - When hooks themselves have issues (rare)

#### After Bypassing
Always clean up bypassed commits:
1. Fix any code quality issues
2. Ensure tests pass
3. Format and lint code properly
4. Consider amending or squashing commits before merging
