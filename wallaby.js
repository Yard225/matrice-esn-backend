module.exports = function (wallaby) {
  return {
    files: [
      'src/**/*.ts',
      'src/**/*.js',
      'src/**/*.json',
      'tsconfig.json',
      'package.json',
      '!src/tests/**/*',
      '!node_modules/**/*'
    ],

    tests: [
      'src/tests/**/*.ts',
      'src/tests/*.ts'
    ],

    env: {
      type: 'node',
      params: {
        runner: '--loader ts-node/esm' // ✅ portable
      }
    },

    testFramework: 'jest',

    compilers: {
      '**/*.ts': wallaby.compilers.typeScript({
        module: 'commonjs',
        target: 'es2020',
        experimentalDecorators: true,
        emitDecoratorMetadata: true,
        esModuleInterop: true,
        allowSyntheticDefaultImports: true,
        strict: true,
        skipLibCheck: true,
        forceConsistentCasingInFileNames: true,
        resolveJsonModule: true,
        baseUrl: './src',
        paths: {
          '@/*': ['./src/*'],
          '@/core/*': ['./src/core/*'],
          '@/features/*': ['./src/features/*'],
          '@/shared/*': ['./src/shared/*']
        }
      })
    },

    setup: function (wallaby) {
      process.env.NODE_PATH = require('path').join(wallaby.localProjectDir, 'node_modules');
      require('module').Module._initPaths();

      const jestConfig = require('./package.json').jest;
      wallaby.testFramework.configure(jestConfig);
    },

    workers: {
      initial: 1,
      regular: 1 // ✅ tu peux tester 2 si stable
    },

    hints: {
      ignoreCoverage: /ignore coverage/
    }
  };
};