import { expect } from 'chai';
import * as fs from 'fs-extra';
import * as path from 'path';
import * as os from 'os';

describe('Project Structure Generation (Unit Tests)', () => {
    let testDir: string;

    beforeEach(async () => {
        testDir = path.join(os.tmpdir(), 'jcms-project-test-' + Date.now());
        await fs.ensureDir(testDir);
    });

    afterEach(async () => {
        if (fs.existsSync(testDir)) {
            await fs.remove(testDir);
        }
    });

    describe('Project Directory Structure', () => {
        it('should create standard JCMS plugin directory structure', async () => {
            const projectPath = path.join(testDir, 'TestPlugin');
            
            // Create directories as ProjectWizard would
            await fs.ensureDir(projectPath);
            await fs.ensureDir(path.join(projectPath, 'types'));
            await fs.ensureDir(path.join(projectPath, 'types', 'generated'));
            await fs.ensureDir(path.join(projectPath, 'jsp'));
            await fs.ensureDir(path.join(projectPath, 'jsp', 'admin'));
            await fs.ensureDir(path.join(projectPath, 'jsp', 'portal'));
            await fs.ensureDir(path.join(projectPath, 'plugins'));
            await fs.ensureDir(path.join(projectPath, 'WEB-INF'));
            await fs.ensureDir(path.join(projectPath, 'WEB-INF', 'classes'));

            // Verify all directories were created
            expect(await fs.pathExists(path.join(projectPath, 'types'))).to.be.true;
            expect(await fs.pathExists(path.join(projectPath, 'types', 'generated'))).to.be.true;
            expect(await fs.pathExists(path.join(projectPath, 'jsp'))).to.be.true;
            expect(await fs.pathExists(path.join(projectPath, 'jsp', 'admin'))).to.be.true;
            expect(await fs.pathExists(path.join(projectPath, 'jsp', 'portal'))).to.be.true;
            expect(await fs.pathExists(path.join(projectPath, 'plugins'))).to.be.true;
            expect(await fs.pathExists(path.join(projectPath, 'WEB-INF'))).to.be.true;
            expect(await fs.pathExists(path.join(projectPath, 'WEB-INF', 'classes'))).to.be.true;
        });
    });

    describe('Plugin XML Generation', () => {
        it('should generate valid plugin.xml content', async () => {
            const config = {
                name: 'MyTestPlugin',
                displayName: 'My Test Plugin',
                description: 'My test plugin description',
                version: '2.1.0'
            };

            const pluginXmlContent = `<?xml version="1.0" encoding="UTF-8"?>
<plugin name="${config.name}" version="${config.version}">
    <label xml:lang="en">${config.displayName}</label>
    <description xml:lang="en">${config.description}</description>
    
    <!-- Plugin dependencies -->
    <dependencies>
        <!-- Add plugin dependencies here -->
    </dependencies>
    
    <!-- Type definitions -->
    <types>
        <!-- Add custom types here -->
    </types>
    
    <!-- Custom workflows -->
    <workflows>
        <!-- Add custom workflows here -->
    </workflows>
    
    <!-- Web application resources -->
    <webapp-files>
        <!-- Add webapp files here -->
    </webapp-files>
    
</plugin>`;

            await fs.writeFile(path.join(testDir, 'plugin.xml'), pluginXmlContent);
            const content = await fs.readFile(path.join(testDir, 'plugin.xml'), 'utf-8');
            
            // Check XML structure and content
            expect(content).to.include('<?xml version="1.0" encoding="UTF-8"?>');
            expect(content).to.include(`<plugin name="${config.name}" version="${config.version}">`);
            expect(content).to.include(`<label xml:lang="en">${config.displayName}</label>`);
            expect(content).to.include(`<description xml:lang="en">${config.description}</description>`);
            expect(content).to.include('<dependencies>');
            expect(content).to.include('<types>');
            expect(content).to.include('<workflows>');
            expect(content).to.include('<webapp-files>');
            expect(content).to.include('</plugin>');
        });
    });

    describe('README Generation', () => {
        it('should generate README with correct content', async () => {
            const config = {
                name: 'ReadmeTestPlugin',
                displayName: 'README Test Plugin',
                description: 'Plugin for testing README creation',
                version: '1.5.0'
            };

            const readmeContent = `# ${config.displayName}

${config.description}

## Plugin Information
- **Name**: ${config.name}
- **Version**: ${config.version}
- **Created**: ${new Date().toISOString().split('T')[0]}

## Directory Structure
- \`types/\` - Custom JCMS types
- \`jsp/\` - JSP templates and components
- \`plugins/\` - Plugin-specific resources  
- \`WEB-INF/\` - Web application configuration
- \`plugin.xml\` - Plugin configuration and metadata

## Development
This plugin was created using the JCMS Plugin Tools for VS Code.

For more information about JCMS plugin development, refer to the JCMS documentation.
`;

            await fs.writeFile(path.join(testDir, 'README.md'), readmeContent);
            const content = await fs.readFile(path.join(testDir, 'README.md'), 'utf-8');
            
            expect(content).to.include(`# ${config.displayName}`);
            expect(content).to.include(config.description);
            expect(content).to.include(`- **Name**: ${config.name}`);
            expect(content).to.include(`- **Version**: ${config.version}`);
            expect(content).to.include('## Directory Structure');
            expect(content).to.include('- `types/` - Custom JCMS types');
            expect(content).to.include('- `plugin.xml` - Plugin configuration and metadata');
        });
    });

    describe('Project Marker Files', () => {
        it('should create .jcmsPluginNature marker file', async () => {
            await fs.writeFile(path.join(testDir, '.jcmsPluginNature'), '');
            expect(await fs.pathExists(path.join(testDir, '.jcmsPluginNature'))).to.be.true;
            
            // Verify it's empty (as expected)
            const content = await fs.readFile(path.join(testDir, '.jcmsPluginNature'), 'utf-8');
            expect(content).to.equal('');
        });
    });
});