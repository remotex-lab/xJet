#!/usr/bin/env node


import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { transpileFile } from '@core/services/transpiler.service';
import { createRequire } from 'module';
import { sandboxExecute } from '@core/services/vm.service';
import { mock } from '@global/mock/fn.mock';

const currentFileUrl = import.meta.url;
const currentFilePath = dirname(fileURLToPath(currentFileUrl));

transpileFile('src/index.ts', {
    inject: [ join(currentFilePath, 'banner.js') ],
    platform: 'node',
    packages: 'external'
}).then(async (y) => {
    const module = { exports: {} };
    const require = createRequire(import.meta.url);

    await sandboxExecute(y.code, {
        console,
        require,
        module,
        setTimeout
    });
});
