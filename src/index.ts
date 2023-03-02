import { Plugin } from 'vite';
import MagicString from 'magic-string';

type Options = {
    variableName?: string,
    injectHtml?: boolean,
    substitutionSyntax?:
    | 'dollar-basic' // $MYVAR
    | 'dollar-curly' // ${MYVAR}
    | 'handlebars' // {{MYVAR}}
    ,
    ignoreEnv?: string[] | ((name: string) => boolean)
};

const viteInternalEnvs = ['MODE', 'BASE_URL', 'PROD', 'DEV', 'SSR'];

function createNameFilter(
    envPrefix: string | string[],
    ignoreEnv: Options['ignoreEnv'],
): (name: string) => boolean {
    const hasPrefix = (name: string): boolean => {
        if (typeof envPrefix === 'string') {
            return name.startsWith(envPrefix);
        }

        return envPrefix.some(prefix => name.startsWith(prefix));
    };

    const shouldBeIgnored = (name: string): boolean => {
        if (viteInternalEnvs.includes(name)) {
            return true;
        }

        if (!ignoreEnv) {
            return false;
        }

        if (typeof ignoreEnv === 'function') {
            return ignoreEnv(name);
        }

        return ignoreEnv.includes(name);
    };

    return name => hasPrefix(name) && !shouldBeIgnored(name);
}

function createVariableDecorator(
    substitutionSyntax: Options['substitutionSyntax'] = 'dollar-curly',
): (name: string) => string {
    return (name) => {
        switch (substitutionSyntax) {
            case 'dollar-basic':
                return `$${name}`;
            case 'handlebars':
                return `{{${name}}}`;
            case 'dollar-curly':
            default:
                return `\${${name}}`;
        }
    };
}

export default function runtimeEnv(options: Options = {}): Plugin {
    const matches = new Set<string>();
    let envPrefix: string | string[] = 'VITE_';
    let needSourceMap = false;
    let isDevServer = false;

    const {
        variableName = 'window.env',
        injectHtml = true,
    } = options;

    const shouldReplaceName = createNameFilter(envPrefix, options.ignoreEnv);
    const wrapVariable = createVariableDecorator(options.substitutionSyntax);

    return {
        name: 'runtime-env',

        configResolved: (resolvedConfig) => {
            if (resolvedConfig.envPrefix) {
                envPrefix = resolvedConfig.envPrefix;
            }

            if (resolvedConfig.build.sourcemap) {
                needSourceMap = true;
            }

            if (resolvedConfig.command === 'serve') {
                isDevServer = true;
            }
        },

        transform: (code) => {
            if (isDevServer) {
                return null;
            }

            const magicString = new MagicString(code);
            const importMetaPattern = /import\.meta\.env\.([A-Z0-9_]+)/g;
            let match: RegExpExecArray | null;

            // eslint-disable-next-line no-cond-assign
            while (match = importMetaPattern.exec(code)) {
                const start = match.index;
                const end = start + match[0].length;
                const name = match[1];

                if (shouldReplaceName(name)) {
                    magicString.overwrite(start, end, `${variableName}.${name}`);
                    matches.add(name);
                }
            }

            if (!magicString.hasChanged()) {
                return null;
            }

            if (!needSourceMap) {
                return magicString.toString();
            }

            return {
                code: magicString.toString(),
                map: magicString.generateMap({ hires: true }),
            };
        },

        transformIndexHtml: () => {
            if (isDevServer || !injectHtml || matches.size === 0) {
                return undefined;
            }

            const vars = [...matches.values()].map(name => `"${name}":"${wrapVariable(name)}"`).join(',');

            return [{
                tag: 'script',
                attrs: { type: 'application/javascript' },
                children: `${variableName}=JSON.parse('{${vars}}');`,
            }];
        },
    };
}
