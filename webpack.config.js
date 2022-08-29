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
	resolve: {
        fallback: {
			"crypto": require.resolve("crypto-browserify"),
			"url": require.resolve("url"),
			"path": require.resolve("path-browserify"),
			"util": require.resolve("util"),
			"buffer": require.resolve("buffer"),
			"stream": require.resolve("stream-browserify")
        },
    }
};