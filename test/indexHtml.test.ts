import { test, expect } from 'vitest';
import { build } from './utils';
import runtimeEnv from '../src';

test('injects used variables into index.html by default', async () => {
    const result = await build({
        plugins: [runtimeEnv()]
    }) ;

    expect(result.output).toEqual(expect.arrayContaining([expect.objectContaining({
        fileName: 'index.html',
        source: expect.stringContaining('window.env=JSON.parse(\'{"VITE_FOO":"${VITE_FOO}"}\');'),
    })]));
});

test('does not inject if `injectHtml` is set to `false`', async () => {
    const result = await build({
        plugins: [runtimeEnv({
            injectHtml: false,
        })]
    }) ;

    expect(result.output).toEqual(expect.arrayContaining([expect.objectContaining({
        fileName: 'index.html',
        source: expect.not.stringContaining('window.env=JSON.parse(\'{"VITE_FOO":"${VITE_FOO}"}\');'),
    })]));
});
