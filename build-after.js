const { copyFileSync } = require("fs");
const { join } = require("path");
const tsconfig = require('./tsconfig.json');

const projectRootPath = __dirname;

const distPath = join(projectRootPath, tsconfig.compilerOptions.outDir);
copyFileSync(join(projectRootPath, 'package.json'), join(distPath, 'package.json'));

