
# isomorphic-page-renderer

A node.js package for slightly simplifying _isomorphic rendering_ of web pages,
primarily focused around [React](https://facebook.github.io/react/) interfaces with
a [redux](http://redux.js.org/) state-store (but not limited to either of these).

## Example Usage

The following snippets provide a very abbreviated sample of how you might use
this package. This is _not_ the recommended pattern, nor does it represent
best practices in general. But it is demonstrative of the general idea.

For a more thorough example that generally follows the suggested pattern, see
<examples/simple-react-page/>.

First, the script that does the server-side rendering:

```javascript
import {IsomorphicPageRenderer} from 'isomorphic-page-renderer';
import React from 'react';

// State reducer (e.g., for redux)
function reducer(state, action) {
    // ...
    return state;
}

// Component to render the page.
class PageComponent extends React.Component {
    render() {
        return <p>Whatever</p>
    }
}

// Defines how to render the page, both on the server-side and client-side.
export const page = new IsomorphicPageRenderer({
    reducer,
    pageComponent: <PageComponent />
});

// Create a function that will setup your state store for the server-side by
// dispatching actions. You can return a Promise if there's anything asynchronous
// that you need to wait for.
function dispatchSetupEvents(dispatch) {
    // ...
}

// Create a function that will render your HTML content. The IsomorphicPageRenderer
// will give you the hard parts, you just need to decide where to put it in the HTML.
// this would typically be a compiled template, for instance, but here we're just
// using a trivial string literal for simplicity and clarity.
function render({renderedState, pageContent, containerElementId}) {
    return `<html>
    <body>
        <!-- Your rendered PageComponent -->
        <div id='${containerElementId}'>${pageContent}</div>

        <!-- The encoded initial state, which the client-side script will read -->
        ${renderedState}

        <!-- The client-side script -->
        <script type='text/javascript' src='your-webpack-bundle.js'></script>
    </body>
</html>
`;
}

// Setup server to serve the page, e.g., using express:
export function serverSideMain() {
    // ...
    app.get('/page', (request, response) => {
        page.getInitialHtml({
            dispatchSetupEvents
            render
        })
            .then((html) => response.status(200).type('html').send(html));
    });

    // ...
});

// And the main function for your client-side script:
export function clientSideMain() {
    page.clientMain();
}
```

## Isomorphic Rendering

Isomorphic rendering means you use the same code on both the server-side and
the client-side to render a webpage. On the server-side, you render the initial
HTML to send to the client. Much of the same JavaScript code is also served for
client side consumption and included on the page as rendered by the server. The
client runs this script to re-render the page in the browser, essentially taking
over for the server where it left off. This allows more interactivity and
client-side dynamic behavior than could be provided with statically rendered
HTML provided by the server.

The two primary motivations behind isomorphic rendering are that you can send some
content immediately to the client without waiting for client-side rendering, and
so that search engines and indexers have content to work with without having to
run client side script (which most don't).

One of the downsides is that you're taking a bit of extra time to render on the server,
compared to just serving up a static HTML shell page and static javascript to do
client-side rendering.

Another downside is that you're typically sending redundant data to the client; once
as the rendered initial content and once as the UI's initial state encoded onto the
page in a way that the client can read it to take over rendering.

### Quasi-Isomorphic Rendering

You can use this package for fully isomorphic rendering, but you can also tweak
the usage a little for a variety of non-isomorphic rendering. For instance, you
can just as easily skip the server-side rendering entirely and just send up
static assets, doing all the rendering on the client-side, still using this package
to simplify some things. Alternatively, you could have the initial state setup on
the server and send to the client, but skip the actual rendering on the server.

Or, you could do the server-side rendering, but skip the client-side rendering.

By using this package, you can easily choose from any of these and other options
and not have to worry about any refactoring if you change how you want to do it.

## Using `isomorphic-page-renderer`

_This section describes the currently recommended pattern, though this project is new
so new patterns may emerge over time with use._

Each webpage that you want to render isomorphically should have it's own directory,
typically under a `pages/` directory. With regards to the isomorphic rendering, there
are three key files that are recommended for each of your isomorphic webpages:

*   `page.js`
*   `server-page.js`
*   `client-entry.js`

In the snippet above, these are all combined in the same file, but this is not generally
recommended for reasons discussed below.

### `page.js`

The `page.js` module is meant to instantiate an instance of `IsomorphicPageRenderer`
and export it for use by other modules. This should generally be exposed through
an exported function like `getPage`, rather than instantiating the object at module
load time.

This module will be imported in both of the other two files mentioned above, which
means it will be used on both the client-side and the server-side. Fortunately, it
should be a pretty trivial module, so you shouldn't need to worry to much about
dependencies that work on both server-side and client-side.

```javascript
import {reducer} from './reducer';
import {PageComponent} from './views/page-component';

export function getPage() {
    return new IsomorphicPageRenderer({
        reducer,
        pageComponent: <PageComponent />
    });
);
```

Your state-reducer function should only be needed in this module, so you could define
it here if it's simple. However, since reducers are typically fairly complex, it's recommended
to define it in another module and import it here.

Likewise, your UI component (e.g., a React component) should only be needed here, and could
be defined as part of this module, but it is generally recommended to put it in it's own
module and import it.

### `server-page.js`

This `server-page.js` module should only be included on the server-side, it's purpose is
to gather whatever data is needed to initialize the state store for initial rendering,
as well as providing a template into which the initial HTML is rendered.

The recommended pattern is to export a single function, `getHtml`, from this module,
which can be used when setting up the server to get the response body for the page.
This function will look something like:

```javascript
import {getPage} from './page';

export function getHtml(requestDetails) {
    return getPage().getInitialHtml({
        dispatchSetupEvents: (dispatch) => {
            return dispatchSetupEvents(requestDetals, dispatch);
        },
        render
    });
}
```
