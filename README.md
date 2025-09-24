# JCMS Plugin Tools for VS Code

A VS Code extension that provides tools for developing JCMS (Java Content Management System) plugins, migrated from the Eclipse JCMS Plugin Tools.

## Features

### 🔍 Workspace Discovery
- **List JCMS Plugin Projects**: Scan your workspace for JCMS plugin projects by detecting `.jcmsPluginNature` files
- Recursively search through all workspace folders and subdirectories
- Display found projects with their relative paths

## Usage

### Commands

The extension contributes the following command to VS Code:

- **JCMS: List Plugin Projects** (`jcmsPluginTools.listProjects`)
  - Accessible via Command Palette (`Ctrl+Shift+P` / `Cmd+Shift+P`)
  - Scans workspace folders for `.jcmsPluginNature` files to identify JCMS plugin projects
  - Shows results in an information message with project count and paths

## Installation

1. Open VS Code
2. Go to Extensions view (`Ctrl+Shift+X`)
3. Search for "JCMS Plugin Tools"
4. Click Install

## Development

### Prerequisites
- Node.js (v16 or later)
- VS Code

### Setup
```bash
git clone https://github.com/FaisalHussain95/vscode-jcms-plugin-tools.git
cd vscode-jcms-plugin-tools
npm install
```

### Build
```bash
npm run compile
```

### Development Mode
```bash
npm run watch
```

Then press `F5` to open a new Extension Development Host window.

## Migration Roadmap from Eclipse JCMS Plugin Tools

This VS Code extension aims to provide equivalent functionality to the Eclipse JCMS Plugin Tools. The migration is planned in phases:

### ✅ Phase 1: Foundation (Current)
- [x] Extension scaffold and project structure
- [x] Basic workspace scanning for JCMS plugin projects
- [x] Command registration and activation

### 🔄 Phase 2: Core Features (Planned)
- [ ] JCMS plugin project creation wizard
- [ ] Template management for plugin components
- [ ] Plugin.xml editing support with IntelliSense
- [ ] JCMS-specific file associations

### 🔄 Phase 3: Advanced Features (Future)
- [ ] Plugin deployment tools
- [ ] Integration with JCMS development server
- [ ] Code snippets for common JCMS patterns
- [ ] Plugin validation and linting
- [ ] JCMS API documentation integration

### 🔄 Phase 4: Enhanced Development Experience (Future)
- [ ] Debugging support for JCMS plugins
- [ ] Hot reload capabilities
- [ ] Performance profiling tools
- [ ] Automated testing framework integration

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/your-feature`)
3. Make your changes
4. Test your changes
5. Commit your changes (`git commit -am 'Add some feature'`)
6. Push to the branch (`git push origin feature/your-feature`)
7. Create a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- Original Eclipse JCMS Plugin Tools contributors
- JCMS development community
- VS Code Extension API documentation
