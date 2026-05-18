# AGENTS

## Workspace Rules

- Use `yarn`, not `npm`, for install, build, test, and workspace commands.
- Require Node.js `>=22`. Do not continue with an older runtime.
- Prefer non-destructive changes and keep edits scoped to the task.

## Runtime Setup

Before running project commands, make sure the active Node.js runtime is version `22` or newer.

### Package Manager

- Install dependencies with `yarn install`.
- Run scripts with `yarn <script>`.
- For workspace commands, follow the existing root scripts such as `yarn build` and `yarn test`.

### Node Resolution Order

Use this order when locating Node.js:

1. Check whether `nvm` is installed.
2. If `nvm` is installed, try to locate the `nvm` directory that contains the Node binaries and use a Node version `>=22` from there.
3. If the `nvm` directory cannot be located directly, try to use `nvm` itself to select a compatible version.
4. If `nvm` is unavailable or unusable, check common Node install paths for the current OS.
5. If Node is still not found, inspect environment variables such as `PATH`, `NVM_DIR`, `NODE_HOME`, and `VOLTA_HOME`.
6. If no compatible Node binary can be found after those steps, stop and ask the user for the Node.js location.

### Detailed Node Lookup Instructions

#### 1. Detect `nvm`

Check for `nvm` first because it is the preferred source of truth for Node on developer machines.

- Test whether the `nvm` command is available in the current shell.
- Check `NVM_DIR` if it is already exported.
- Check common `nvm` directories such as:
  - `~/.nvm`
  - `$HOME/.nvm`
  - `~/.config/nvm`

If an `nvm` directory is found, inspect its `versions/node/` subdirectory and prefer the highest installed version that is `>=22`.

#### 2. Use `nvm` directly if needed

If the `nvm` folder cannot be resolved to a usable binary path, try `nvm` commands directly.

Preferred flow:

- `nvm current`
- `nvm ls`
- `nvm which 22`

If multiple compatible versions are installed, prefer the newest installed `22.x` or higher release already present on the machine.

#### 3. Check common OS-specific Node locations

If `nvm` is not available, look for `node` in common install locations.

macOS / Linux:

- `/usr/local/bin/node`
- `/opt/homebrew/bin/node`
- `/usr/bin/node`
- `/opt/local/bin/node`

Windows:

- `%ProgramFiles%/nodejs/node.exe`
- `%ProgramFiles(x86)%/nodejs/node.exe`
- `%LocalAppData%/Programs/nodejs/node.exe`

Only use the binary if `node --version` reports `v22` or newer.

#### 4. Check environment variables

If common locations fail, inspect environment-driven locations.

- Search `PATH` for `node`
- Check `NVM_DIR`
- Check `NODE_HOME`
- Check `VOLTA_HOME`

Resolve the binary from those locations, then verify that it is version `>=22`.

#### 5. Stop if Node cannot be found

If no compatible Node binary is found, do not guess and do not proceed with project commands. Ask the user for the Node.js location or for help configuring a Node `>=22` runtime.

## Command Expectations

- Prefer `yarn install`, `yarn build`, and `yarn test`.
- Do not switch package managers within the task.
- If a command would implicitly use `npm`, replace it with the equivalent `yarn` command when possible.
