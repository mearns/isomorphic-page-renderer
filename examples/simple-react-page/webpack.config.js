const webpack = require('webpack');
const packageJson = require('./package.json');

const PROJECT_NAME = packageJson.name;

module.exports = {
    entry: {
        'pages/index': './src/pages/index/client-entry.js'
    },
    output: {
        path: `${__dirname}/dist/static/bundles`,
        filename: '[name].js'
    },
    module: {
        loaders: [
            {
                test: /\.js$/i,
                loader: 'jsx-loader'
            },
            {
                test: /\.js?$/i,
                loader: 'babel-loader',
                query: {
                    presets: [
                        'es2015',
                    ],
                    'plugins': [
                        'transform-object-assign'
                    ]
                }
            }
        ]
    },
    plugins: [
        new webpack.SourceMapDevToolPlugin({
            filename: '[file].map',
            append: '\n//# sourceMappingURL=[url]',
            moduleFilenameTemplate: `${PROJECT_NAME}:///[resource-path]`
        })
    ]
};
