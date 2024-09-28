/**
 * Import will remove at compile time
 */

import type { SpecFilesInterface } from '@components/interfaces/spec-file.interface';
import type { ConfigurationInterface } from '@configuration/interfaces/configuration.interface';

/**
 * Imports
 */

import { SourceService } from '@remotex-labs/xmap';
import { VMRuntimeError } from '@errors/vm-runtime.error';
import { readFileSync } from 'fs';
import { basename, join } from 'path';

export class SuiteDispatcherService {
    constructor(private config: ConfigurationInterface, private specs: SpecFilesInterface) {
    }

    async run() {
        await this.config.adapterInit();
        const global = readFileSync(join(__dirname, 'xJet.js')).toString();
        const globalMapRaw = readFileSync(join(__dirname, 'xJet.js.map')).toString();

        for (const suiteIndex in this.specs) {
            // ToDo reporter suiteIndex suite start
            const suite = this.specs[suiteIndex];
            const sourceMap = new SourceService(JSON.parse(globalMapRaw));
            sourceMap.concat(JSON.parse(suite.sourceMap));
            // console.log(suite.code);

            try {
                await this.runSuite(`${ global }${ suite.code } SuiteState.getInstance().root.exec()`, sourceMap, suiteIndex);
            } catch (error) {
                console.log(error);
                console.log(sourceMap.getPosition(3, 100));
                // throw new VMRuntimeError(<Error> error, sourceMap);
            }
        }
    }

    private runSuite(suite: string, sourceMap: SourceService, name: string): Promise<void> {
        return new Promise(async (resolve, reject) => {
            try {
                await this.config.adapterRequest(suite, (msg: string) => {
                    const y = JSON.parse(msg);
                    // console.log('msg', y);
                    if (y.error) {
                        const err = new Error(y.error.message);
                        err.stack = y.error.stack;

                        const u = new VMRuntimeError(err, sourceMap);
                        console.log(name);
                        const index = u.stackArray.findIndex(item => item.toString().includes(basename(name)));
                        if (index !== -1) {
                            u.stackArray = u.stackArray.slice(0, index + 1);
                        }

                        console.error(u.toString());
                    }

                    // resolve();
                });
            } catch (error) {
                reject(error);
            }
        });
    }
}
