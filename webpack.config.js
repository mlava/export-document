const webpack = require('webpack');

module.exports = {
    entry: './src/index.js',
    output: {
        filename: 'extension.js',
        path: __dirname,
        library: {
            type: "module",
        }
    },
    experiments: {
        outputModule: true,
    },
	plugins:[
	  new webpack.ProvidePlugin({
        process: 'process/browser.js',
	  }),
	  new webpack.ProvidePlugin({
        Buffer: ['buffer', 'Buffer'],
      }),
    ],
	resolve: {
		fallback: {
			"fs": require.resolve('browserify-fs'),
			"crypto": require.resolve("crypto-browserify"),
			"url": require.resolve("url/"),
			"path": require.resolve("path-browserify"),
			"util": require.resolve("util/"),
			"buffer": require.resolve("buffer/"),
			"stream": require.resolve("stream-browserify")
        },
    }
};

