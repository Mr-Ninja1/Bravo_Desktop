const esbuild = require('esbuild');
const path = require('path');

async function build() {
  const projectRoot = path.resolve(__dirname, '..');
  const entry = path.resolve(__dirname, 'renderer', 'react-entry.jsx');
  const out = path.resolve(__dirname, 'renderer', 'dist', 'bundle.js');

  try {
    await esbuild.build({
      entryPoints: [entry],
      bundle: true,
      outfile: out,
      platform: 'browser',
      sourcemap: true,
      define: { 'process.env.NODE_ENV': '"production"' },
      loader: { '.js': 'jsx', '.jsx': 'jsx', '.jpeg': 'dataurl', '.jpg': 'dataurl', '.png': 'dataurl' },
      plugins: [
        {
          name: 'react-native-alias',
          setup(build) {
            build.onResolve({ filter: /^react-native$/ }, args => {
              return { path: require.resolve('react-native-web') };
            });
            // Alias relative assets requires in copied components (../../assets/...) to the Desktop renderer assets folder
            build.onResolve({ filter: /\.\.(?:\/.\.)*\/assets\// }, args => {
              const resolved = path.resolve(__dirname, 'renderer', 'src', 'assets', path.basename(args.path));
              return { path: resolved };
            });
          }
        }
      ],
      external: ['electron']
    });
    console.log('Renderer bundle built to', out);
  } catch (e) {
    console.error('esbuild failed', e);
    process.exit(1);
  }
}

build();
