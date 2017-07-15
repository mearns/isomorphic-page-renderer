# Isomorphic Page Renderer Example App

This is an example application for the `isomorphic-page-renderer` npm package. To
build the example application from the source repository, run the following command
from the root of the example project (`examples/simple-react-page/`):

```console
> npm install && npm run build
```

Then, to run the example application:

```console
> npm start
```

This will run an HTTP server at <http://localhost:8080/>.

## The Source Code

The server is setup in `./src/index.js`. It's nothing particularly interesting, but it sets
up a route at `/` which serves up an HTML response with content provided by calling
`./src/pages/index/server-page::getHtml()`. That's probably a good place to start looking.

With regards to the `isomorphic-page-renderer`, there are basically three files that are
interesting, all of them under `./src/pages/index/`:

*   `page.js` creates an `IsomorphicPageRenderer` to render this particular page.
*   `server-page.js` exports the `getHtml` function to generate the initial HTML for server-side rendering.
*   `client-entry.js` the script that runs on the client side to take over rendering the page.
