import { resolve } from 'node:path';
import { build as viteBuild, InlineConfig } from 'vite';
import { RollupOutput } from 'rollup';

type TestBuildConfig = Omit<InlineConfig, 'root' | 'build'>

export async function build(config?: TestBuildConfig): Promise<RollupOutput> {
    const result = await viteBuild({
        ...config,
        root: resolve(__dirname, 'fixture'),
        build: {
            write: false,
        },
    });

    if (!('output' in result)) {
        throw new Error('Didn\'t expect an array from `vite.build`');
    }

    return result;
}
