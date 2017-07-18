
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

The `getInitialHtml` method on the page will generate the HTML content for the server to send as
the initial page render to the client. It relies on a provided `render` method to _actually_ generate
the HTML string (e.g., from a template file), but does a lot of the heavy lifting to render the page's
component tree, as well as serializing the intial state to the page so that the client can load
it for rendering.

The `dispatchSetupEvents` function that is passed in is used to gather whatever information you need to
initialize the state store, and then dispatch the appropriate events. This would typically
mean doing things like fetching from your database, session store, or upstream services.

The function will be called with a `dispatch` function that, by default, is the
[dispatch method of the Redux state store](http://redux.js.org/docs/api/Store.html#dispatch).
However, you can override methods in `IsomorphicPageRenderer` to support something other than
Redux, such as `IsomorphicPageRenderer::createStore`, `IsomorphicPageRenderer::getStoreState`,
and `IsomorphicPageRenderer::getDispatch`.

The function can return a Promise for any asynchronous work that needs to be done.

### `client-entry.js`

The `client-entry.js` module is used to provide an entry point to the client-side script
that runs to take over rendering in the browser. In the simplest case, this module might
look something like:

```javascript
import {getPage} from './page';

getPage().clientMain();
```

This module would typically be your entry point for the [webpack](https://webpack.github.io/)
bundle you server and load on the page.

The `clientMain` method on the page deserializes the state from the page and render's
the page's component tree to the target element in the DOM, to replace what was initially
put there by the server.

It's often useful to know that you're rendering on the client versus the server, so
`clientMain` can take an optional callback function that can be invoked to futher modify the
state store after it has been deserialized from the page.

It's considered best practice when doing isomorphic rendering to have your initial render on
the client-side be _identical_ to the server-side render. In fact, React even issues a warning
to your console if the checksums differ. To avoid this, the callback you pass to `clientMain`
is only invoked _after_ the initial client-side rendering is done with the initial state.

### Why Three Modules?

The primary reason for the three different modules is to isolate server-side code and client-side
code. This somewhat flies in the face of typical isomorphic concepts, where the same code is used
client-side and server-side. However, there is often code required for the initial state setup
on the server-side that _can't_ run on the client-side. For instance, connecting to an internal
upstream service or database cannot typically be done from the client side. In some cases, even just
trying to include a module in your front-end bundle will fail (e.g., if it's native code).

Therefore, separating the server-side-only code into it's own module that doesn't need to be
included in any client-side modules is important. Separating out the `page.js` module is just
basic reuse so that both the client-side and server-side modules can import it an make use of
the same code.
