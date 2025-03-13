import { SpecsProvider } from '@providers/specs.provider';
import type { ConfigurationInterface, ModuleInterface } from '@configuration/interfaces/configuration.interface';
import { transpileFiles } from '@services/transpiler.service';
import { frameworkProvider } from '@providers/framework.provider';
import { sandboxExecute } from '@services/vm.service';
import { join } from 'path';
import { formatErrorCode, highlightCode, SourceService } from '@remotex-labs/xmap';
import { Colors } from '@components/colors.component';
import { createRequire } from 'module';
import { VMRuntimeError } from '@errors/vm-runtime.error';

export class SuitesService {

    private readonly specs: SpecsProvider;

    constructor(private config: ConfigurationInterface) {
        this.specs = new SpecsProvider(config);
    }

    async run() {
        const files = this.specs.getSpecFiles(frameworkProvider.paths.root);

        const specFiles = await transpileFiles(files, {
            ...this.config.build,

            logLevel: 'silent',
            inject: [ join(frameworkProvider.paths.dist, 'index.js') ]
        });

        Object.entries(specFiles).forEach(([key, { sourceMap, code }]) => {
            const u = new SourceService(sourceMap);
            const module: ModuleInterface = { exports: {} };
            const require = createRequire(import.meta.url);

            try {
                sandboxExecute(code, {
                    Error,
                    module,
                    require,
                    setTimeout,
                    setInterval
                });
            } catch (e: any) {
                if(e.location) {
                    console.log(e.message);

                    const position = u.getPositionWithCode(e.location.line, e.location.column, 0, {
                        linesAfter: 1,
                        linesBefore: 2
                    });
                    if (!position) return;
                    const highlightedCode = highlightCode(position.code);
                    const i = formatErrorCode(<any>{ ...position, code: highlightedCode }, {
                        color: Colors.BrightPink,
                        reset: Colors.Reset
                    });
                    console.log(i);
                }

                console.log('xxx');
                throw new VMRuntimeError(e, u, true);
            }
        });
    }
}
