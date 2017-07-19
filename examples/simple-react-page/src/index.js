import express from 'express';
import yargs from 'yargs';
import Promise from 'bluebird';
import {getHtml, getApiResponse} from './pages/index/server-page';

const SERVER_ERROR = 500;

function createServer() {
    const server = express();

    server.get('/', (request, response) => {
        const {userName, counter} = request.query;
        getHtml({userName, counter})
            .then((html) => {
                response.type('text/html').send(html);
            })
            .catch((error) => {
                response.status(SERVER_ERROR).type('text/plain').send(error);
                throw error;
            });
    });
    server.get('/api/', (request, response) => {
        const {userName, counter} = request.query;
        getApiResponse({userName, counter})
            .then((state) => {
                response.json(state);
            })
            .catch((error) => {
                response.status(SERVER_ERROR).json({error: {message: error.message}});
                throw error;
            });
    });
    server.use('/static/', express.static('./dist/static/'));

    return server;
}

function startServer({host, port}) {
    const server = createServer();

    return new Promise((fulfill, reject) => {
        const httpServer = server.listen(port, host, (error) => {
            if (error) {
                reject(error);
            }
            else {
                console.log(`Listening on "${host}:${port}"`); // eslint-disable-line no-console
                fulfill(httpServer);
            }
        });
    });
}

export function main() {
    const args = yargs
        .option('p', {
            alias: 'port',
            description: 'The port to bind to.',
            default: 8080,
            number: true,
            requiresArg: true
        })
        .option('h', {
            alias: 'host',
            description: 'The host to bind to.',
            default: 'localhost',
            string: true
        })
        .strict()
        .help()
        .argv;

    startServer(args);
}

main();
