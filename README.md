
# isomorphic-page-renderer

A node.js package for slightly simplifying _isomorphic rendering_ of web pages,
primarily focused around [React](https://facebook.github.io/react/) interfaces with
a [redux](http://redux.js.org/) state-store (but not limited to either of these, if
you extend the class).

## Installation

Install from npm:

```console
> npm install --save isomorphic-page-renderer
```

## Example Usage

The following snippets provide a very abbreviated sample of how you might use
this package. This is _not_ the recommended pattern, nor does it represent
best practices in general. But it is demonstrative of the general idea.

For a more thorough example that generally follows the suggested pattern, see
[./examples/simple-react-page/](examples/simple-react-page/).

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
function render({embeddableState, pageContent, containerElementId}) {
    return `<html>
    <body>
        <!-- Your rendered PageComponent -->
        <div id='${containerElementId}'>${pageContent}</div>

        <!-- The encoded initial state, which the client-side script will read -->
        ${embeddableState}

        <!-- The client-side script, which should call clientSideMain, below -->
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
            dispatchSetupEvents,
            render
        })
            .then((html) => response.type('html').send(html));
    });

    // We can also setup an API to fetch the state, if we want.
    app.get('/api/page-state', (request, response) => {
        page.getCurrentState({dispatchSetupEvents})
            .then((state) => response.json(state));
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
the server and sent to the client, but skip the actual rendering on the server.

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
import {IsomorphicPageRenderer} from 'isomorphic-page-renderer';

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

// ...
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

The function can return a Promise to account for any asynchronous work that needs to be done.

### `client-entry.js`

The `client-entry.js` module is used to provide an entry point to the client-side script
that runs to take over rendering in the browser. In the simplest case, this module might
look something like:

```javascript
import {getPage} from './page';

getPage().clientMain();
```

This module would typically be your entry point for the [webpack](https://webpack.github.io/)
bundle you serve and load on the page. Note that the `IsomorphicPageRenderer` instance has
no knowledge of this script, so it is up to your `render` function to make sure the script
is loaded on the page.

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

## API

### `IsomorphicPageRenderer`

#### `new IsomorphicPageRenderer({reducer, pageComponent, [containerElementId], [initialStateElementId]})`

Constructor for a new IsomorphicPageRenderer object.

*   `reducer`: A reducer function that will be used to
    [create a new redux state store](http://redux.js.org/docs/api/createStore.html#createstorereducer-preloadedstate-enhancer).
*   `pageComponent`: A React component that will be rendered as the primary content of
    the page. For react-redux, it should be a
    [connected component](https://github.com/reactjs/react-redux/blob/master/docs/api.md#connectmapstatetoprops-mapdispatchtoprops-mergeprops-options) if necessary, but it will automatically be wrapped
    in a [`Provider`](https://github.com/reactjs/react-redux/blob/master/docs/api.md#provider-store)
    component with a state store created with the given reducer.
*   `containerElementId`: Optional, the ID for the container element into which the `pageComponent`
    will be rendered. The `render` function that you'll pass to the `getInitialHtml` method will need
    to make sure the generated HTML uses this same ID for that element. For convenience, this
    value will be passed in to the render function as part of the context. The default value is `'container'`.
*   `initialStateElementId`: Optional, the ID for the element into which the encoded initial state will
    be embedded. Unlike `containerElementId`, the render function passed to `getInitialHtml` doesn't need
    to render this directly, the `renderEmbeddableState` method will generate this and pass it to
    `render` in the `embeddableState` context value. The default value is `'initial-state'`.

#### `::getInitialHtml({[dispatchSetupEvents], render}) -> Promise<String>`

Invoked to render the the initial HTML content of the page. This will create a redux state store
with the reducer function passed to the constructor, initialize it by calling the `dispatchSetupEvents`
function, render the object's `pageComponent` inside a react-redux `<Provider>` component with the
state store attached, encode the stores's initial state into an HTML-embeddable string, and finally
pass the generated content to the provided `render` function to actually generate the HTML.

Returns a Promise that will fulfill with the generated HTML content, or reject on error.

*   `dispatchSetupEvents(dispatch) -> [Promise<*>]`: Optional, a function that will be called with the
    [`dispatch`](http://redux.js.org/docs/api/Store.html#dispatch) method of the constructed
    state store, ostensibly to dispatch any actions required to setup the state store for
    the initial render. It can return synchronously, or return a _thenable_ if there is
    asynchronous work that needs to complete before the store is setup.
    If not given, then no initialization of the state store will be done beyond what is done by the
    `createStore` method itself.
*   `render({pageContent, embeddableState, initialState, containerElementId, initialStateElementId}) -> {Promise<String>|String}`:
    A function that will take the generated content and actually produce the HTML for the page as a string.
    For instance, this might be a compiled template function. It will be invoked with a context object having
    the following properties:
    *   `pageContent`: The rendered `pageComponent`.
    *   `embeddableState`: The initial state of the store, encoded and rendered to a string that
        can be embedded directly into the body of HTML document. Specifically, the default implementation
        of `IsomorphicPageRenderer` encodes this to HTML-safe JSON and embeds it into a `<script>` element
        with the `initialStateElementId` as the element ID.
    *   `initialState`: The initial state of the store, after `dispatchSetupEvents` settles, as an object.
        This is for convenience so you can include state-content directly in your rendered content
        outside of the `pageComponent`, in case that's useful.
    *   `containerElementId`: The ID that should be used for the container element into which the
        `pageContent` should be placed. This ID is important because the `clientMain` method will rely
        on this to find the element into which it should render the `pageComponent`.
    *   `initialStateElementId`: The ID of the element into which the initial state has been embedded.
        Your `render` function probably doesn't actually need this, since it is already included in
        the `embeddableState`.

    The `render` function should return the generated HTML as a string, or a _thenable_ that fulfills
    with the generated HTML.

#### `::getCurrentState({[dispatchSetupEvents]}) -> Promise<Object>`

Invoked to support an API endpoint that returns the current state as determined by the server. For example,
your client-side script (the one that invokes `::clientMain`) might setup an AJAX poll of this API endpoint
and use the response to update the client-side state store.

Returns a Promise that will fulfill with state of the initialized store.

*   `dispatchSetupEvents(dispatch) -> Promise<*>`: Just like the argument to `getInitialHtml`, this is a function
    which will be invoked to setup the state store.


#### `::clientMain({[dispatchClientSetupEvents]}) -> Promise<StateStore>`

Invoked from your client side script to take over rendering of the page on the client side. This will
load the initial state that should be embedded in the page (as specified by the `initialStateElementId`)
and use it to initialize a client-side state store, then render the `pageComponent` into the container
specified by `containerElementId`, replacing the server-side static rendering.

Returns a Promise that fulfills after the client-side rendering is completed with the initialized
client-side state store (and _after_ the provided `dispatchClientSetupEvents` function settles), in case you need
to do anything else with it.

*   `dispatchClientSetupEvents(dispatch) -> Promise<*>`: Similar to the `dispatchSetupEvents` argument to
    `::getCurrentState` and `::getInitialHtml`, this is a function that will be invoked with a dispatch function
    for the state store in order to do any additional setup of the state that is specific to the client.

    This is useful if you want to set some state flag to indicate that you're rendering on the client. For instance,
    you may choose not to render some interactive content on the server side, or render them using traditional HTML
    forms, to support users who do not have JavaScript. For users who _do_ support JavaScript, this function will be
    invoked to set the "on-client" flag in the state, and the client-side rendering can replace these with
    more dynamic controls, such as forms that submit via AJAX.

    Note that this function won't be invoked until _after_ the component is rendered with the initial state loaded
    from the page. This should ensure that the initial client-side is identical to the server-side rendering, which
    is considered a best practice for isomorphic rendering. However, any actions dispatched by this function that
    lead to a change in the state store should lead to your component being re-rendered through the react-redux
    connection.

    This is an async-safe function, so it can return synchronously or return a thenable if there are any actions
    that we need to wait for. The fulfillment value will be ignored, but the Promise returned by the `clientMain` method won't settle until the returned thenable settles.
