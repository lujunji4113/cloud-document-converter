# Contributing to Cloud Document Converter

There are many ways to contribute to the Cloud Document Converter project: logging bugs, submitting pull requests, reporting issues, and creating suggestions.

After cloning and building the repo, check out the [issues list](https://github.com/whale4113/cloud-document-converter/issues). Issues labeled [`help wanted`](https://github.com/whale4113/cloud-document-converter/issues?q=is:issue+is:open+label:%22help+wanted%22+) are good issues to submit a PR for. Issues labeled [`good first issue`](https://github.com/whale4113/cloud-document-converter/issues?q=is:issue+is:open+label:%22good+first+issue%22+) are great candidates to pick up if you are in the code for the first time. If you are contributing significant changes, or if the issue is already assigned to a specific month milestone, please discuss with the assignee of the issue first before starting to work on the issue.

## Prerequisites

In order to download necessary tools, clone the repository, and install dependencies via pnpm, you need network access.

You'll need the following tools:

- [Git](https://git-scm.com/)
- [Node.JS](https://nodejs.org/en/download/prebuilt-binaries), x64 or ARM64, version >=20.x
- [Bun](https://bun.sh/)

### Development container

Alternatively, you can avoid local dependency installation as this repository includes a **Visual Studio Code [Dev Containers](https://code.visualstudio.com/docs/devcontainers/containers)** development container.

For Dev Containers, use the **Dev Containers: Clone Repository in Container Volume** command which creates a Docker volume for better disk I/O on macOS and Windows.

## Development Setup

You will need Node.js with minimum version as specified in the .node-version file, and PNPM with minimum version as specified in the "packageManager" field in package.json.

After cloning the repo, run:

```shell
$ pnpm i # install the dependencies of the project
```

## Build and Run

### Build

```shell
cd apps/chrome-extension
npx turbo run build # build chrome extension

# pnpm run build:firefox # build firefox extension
```

### Run

[web-ext](https://extensionworkshop.com/documentation/develop/getting-started-with-web-ext/#test-and-degug-an-extention) is a command-line tool designed to speed up and simplify development. 

```shell
cd apps/chrome-extension
npx web-ext run --source-dir dist --target chromium # 

# npx web-ext run --source-dir dist-firefox # 
```

After making changes to the source files, you need to rebuild the project manually。The web-ext run command watches our dist files and tells Chromium/Firefox to reload the extension after you rebuild the project. 