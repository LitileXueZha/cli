# xnpm - a "X" version of `npm`

<details>

Require node `16` or higher LTS.

## Installation

```shell
$ npm install -g xnpm
```

## Usage

```bash
xnpm <command>
```

### Optimized commands

+ `xnpm install`
+ `xnpm run <script>`
</details>

## Buy a newer CPU may better than these efforts~

## Contribute

What does it affects `npm` performance?

|Appearance|Maybe|Optimize Priority|
|-|-|-|
|-|`require` splited modules, mainly on Windows filesystem|✓✓✓✓✓|
|pre-install scripts are silent|-|✓✓✓|
|run-script slowly start up|??|✓✓|
|lag on `idealTree`|??|✓|
|lag on `reify`|??|✓|

### Recommend Configurations

```javascript
  configureOptimizedRC() {
    /**
     * Audit will send report to registry, it waste time
     * when install packages.
     */
    this.config.set('audit', false);
    /**
     * Know what happens is very important, there are some packages
     * run pre-install scripts when being installed.
     * 
     * If it lags, we can see what going on in console, not just
     * wait it finished.
     */
    this.config.set('foreground-scripts', true);
    /**
     * Default 5 minutes is too long, 10s is enough.
     */
    this.config.set('fetch-timeout', 10000);
    /**
     * The peerDependencies are unnecessary installed, users should
     * be responsible for it.
     */
    this.config.set('omit', 'peer');
    /**
     * Remind users of using proxy, sometimes they maybe forgot had
     * set a proxy and the install process frozen, without any
     * infomation.
     */
    const proxy = this.config.get('proxy');
    if (proxy) {
      log.warn('Using a proxy ==>', proxy);
    }
  }
```

### Useful links

+ [`pacote`](https://www.npmjs.com/package/pacote) Fetches package manifests and tarballs from the npm registry.
+ [`cacache`](https://www.npmjs.com/package/cacache) npm's local cache
+ [How npm Works](http://npm.github.io/how-npm-works-docs/)
