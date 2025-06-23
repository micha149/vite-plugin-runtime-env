# vite-plugin-runtime-env

[![Test Status](https://img.shields.io/github/actions/workflow/status/micha149/vite-plugin-runtime-env/test.yaml?branch=master&style=flat-square)](https://github.com/micha149/vite-plugin-runtime-env/actions?query=workflow%3ATest)
[![npm](https://img.shields.io/npm/v/vite-plugin-runtime-env?style=flat-square)](https://www.npmjs.com/package/vite-plugin-runtime-env)
[![License](https://img.shields.io/github/license/micha149/vite-plugin-runtime-env?style=flat-square)](LICENSE)

Inject environment variables on runtime rather than build time.

## Installation

```bash
npm install --save-dev vite-plugin-runtime-env
```

## Usage

First you need to add the plugin to your vite config.

```typescript
import runtimeEnv from 'vite-plugin-runtime-env';

export default defineConfig({
  plugins: [
    runtimeEnv(),
  ]
});
```

When building your app, the plugin replaces all occurrences of `import.meta.env.VITE_MY_VARIABLE` with something like `window.env.VITE_MY_VARIABLE` and inserts a mapping into `index.html`.
The mapping contains placeholder variables like `${VITE_MY_VARIABLE}` which can be substituted using [`envsubst`][envsubst] or [`npx envsub`][envsub] when deploying your app.

```sh
cp dist/index.html index.html.template
envsubst < index.html.template > dist/index.html
```

Or, when Node.js is available in your deployment environment:

```sh
npx envsub dist/index.html
```

Both examples assume that your variables are defined in the deploy environment. The node tool also supports `.env` files
as arguments.

## Configuration

### `variableName`
The variable name to be used for replacements. Defaults to `'window.env'`.

Example:
```typescript
import runtimeEnv from 'vite-plugin-runtime-env';

export default defineConfig({
  plugins: [
    runtimeEnv({
        variableName: 'window.myCustomEnv',
    }),
  ]
});
```

### `injectHtml`
Whether to inject the variables map into `index.html`.
Sometimes it can be handy to not have the map in index.html and load an external javascript file which sets the object.
Defaults to `true`.

Example:
```typescript
import runtimeEnv from 'vite-plugin-runtime-env';

export default defineConfig({
  plugins: [
    runtimeEnv({
        injectHtml: false,
    }),
  ]
});
```

### `substitutionSyntax`
The syntax for inserted placeholders.
This should match the tool you are using to substitute the variables on deployment.
Valid values are `'dollar-basic'` for `$MYVAR`, `'dollar-curly'` for `${MYVAR}` and `'handlebars'` for `{{MYVAR}}`.
Defaults to `'dollar-curly'`.

Example:
```typescript
import runtimeEnv from 'vite-plugin-runtime-env';

export default defineConfig({
  plugins: [
    runtimeEnv({
        substitutionSyntax: 'handlebars',
    }),
  ]
});
```

Now you can use a custom script using handlebars to inject the variables.

### `ignoreEnv`
Variable names to be ignored by this plugin.
They will remain in the code and will be statically replaced by Vite on build time.
This can be useful for information which is known on build time and not configurable on runtime, such as the version number of the current build.
Valid values are an array of strings, containing the variables to be ignored, or a function which gets each variable as an input and returns `true` if the variable should be skipped.

Example:
```typescript
import runtimeEnv from 'vite-plugin-runtime-env';

export default defineConfig({
  plugins: [
    runtimeEnv({
        ignoreEnv: ['VITE_CURRENT_VERSION'],
    }),
  ]
});
```

Example using a function:
```typescript
import runtimeEnv from 'vite-plugin-runtime-env';

export default defineConfig({
  plugins: [
    runtimeEnv({
        ignoreEnv: env => env.startsWith('VITE_STATIC_'),
    }),
  ]
});
```

## Motivation

If your project wants to adhere to the [12 factor principles][12factor] it can be cumbersome that Vite replaces your environment variables with static content on build time.
Following the principle "I – Config" we want to store configurations in the environment.
And funnily enough, this is also implied by the name "environment variable".
Respecting these principles can be useful when running your app in a containerized setup like Docker or Kubernetes.

A workaround would be to run `vite build` when deploying the app.
But this may slow down our deployments, especially when deploying multiple instances and each one builds the app for its own.
Also, this would be contrary to principle "V – Build, release, run" which requires strict separation between the build, release, and run stages.

To be able to create a single bundle and run the same bundle in different environments like testing, staging and
production, we need to be able to pass some configurations when the app is deployed.
After a lot of projects where each solves this same problem with its own custom workaround, I created this plugin to rule them all.

[envsubst]: https://www.gnu.org/software/gettext/manual/html_node/envsubst-Invocation.html
[envsub]: https://www.npmjs.com/package/envsub
[12factor]: https://12factor.net/
