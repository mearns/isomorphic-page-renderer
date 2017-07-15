import ReactDOMServer from 'react-dom/server';
import ReactDOM from 'react-dom';
import React from 'react';
import {createStore} from 'redux';
import {Provider} from 'react-redux';
import Promise from 'bluebird';
import pick from 'lodash.pick';

const NOOP = () => {};

/**
 * A utility class for handling isomorphic pages.
 *
 * @param reducer   The reducer function that will be used to by the state store.
 * @param pageComponent Typically a React component that is considered your top-level
 *                      component for your page. This will be wrapped in a `Provider`
 *                      from 'react-redux' as a way of providing access to the state store.
 */
export class IsomorphicPageRenderer {
    constructor({
        reducer, pageComponent,
        containerElementId = 'container',
        initialStateElementId = 'initial-state'
    }) {
        this.reducer = reducer;
        this.pageComponent = pageComponent;
        this.containerElementId = containerElementId;
        this.initialStateElementId = initialStateElementId;

        this.renderStateToString = Promise.method(this.renderStateToString.bind(this));
        this.loadStateFromDoc = Promise.method(this.loadStateFromDoc.bind(this));
        this.createStore = Promise.method(this.createStore.bind(this));
        this.getDispatch = Promise.method(this.getDispatch.bind(this));
        this.getStoreState = Promise.method(this.getStoreState.bind(this));
        this.getComponentTree = Promise.method(this.getComponentTree.bind(this));
        this.renderComponentTreeToString = Promise.method(this.renderComponentTreeToString.bind(this));
        this.renderComponentTreeToContainer = Promise.method(this.renderComponentTreeToContainer.bind(this));
    }

    /**
     * Used to encode a state value to a string that can be safely included in the page.
     * This renders the entire HTML content to put directly on the page, e.g., already
     * inside a `<script>` tag, HTML comment, or whatever.
     *
     * @bound
     * @async-safe
     */
    renderStateToString(state) {
        return `<script type='application/json' id='${this.initialStateElementId}'>`
            + `${htmlSafeStringify(state)}</script>`;
    }

    /**
     * Assuming the given document includes the content generated by `renderStateToString`,
     * this should return the decoded state object.
     *
     * @bound
     * @sync-safe
     */
    loadStateFromDoc(doc) {
        return htmlSafeParse(doc.getElementById(this.initialStateElementId).textContent);
    }

    /**
     * Return a new state store object, initialized with the given optional initial state object.
     *
     * @bound
     * @sync-safe
     */
    createStore(initialState) {
        return createStore(this.reducer, initialState);
    }

    /**
     * Get the dispatch function associated with the given state store object.
     *
     * @bound
     * @sync-safe
     */
    getDispatch(store) {
        return store.dispatch.bind(store);
    }

    /**
     * Get the current state of the given state store
     *
     * @bound
     * @sync-safe
     */
    getStoreState(store) {
        return store.getState();
    }

    /**
     * Get the top-level component tree that should be rendered to the page
     * (e.g., by `renderComponentTreeToString` or `renderComponentTreeToContainer`).
     * This typically returns a React component, often a `Provider` component from
     * react-redux, wrapping `pageComponent`.
     *
     * @param  {StateStore} stateStore  The state store.
     *
     * @bound
     * @sync-safe
     */
    getComponentTree(stateStore) {
        return <Provider store={stateStore}>{this.pageComponent}</Provider>;
    }

    /**
     * Given a state store, get the component tree and render it to a string.
     *
     * @see `getComponentTree`.
     *
     * @bound
     * @sync-safe
     */
    renderComponentTreeToString(stateStore) {
        return this.getComponentTree(stateStore)
            .then(ReactDOMServer.renderToString.bind(ReactDOMServer));
    }

    /**
     * Given a state store, get the component tree and render it to the container
     * element specified by `containerElementId`.
     *
     * @see `getComponentTree`.
     *
     * @bound
     * @sync-safe
     */
    renderComponentTreeToContainer(stateStore) {
        this.getComponentTree(stateStore)
            .then((component) => {
                ReactDOM.render(component, document.getElementById(this.containerElementId));
            });
    }

    /**
     * Generates and returns (as a Promise) the initial HTML for the page, typically
     * for server-side rendering.
     *
     * ## State Store Setup
     *
     * The state store will be instantiated inside the function using the instance's
     * `reducer` and no initial state. In order to setup the state, the provided
     * `dispatchSetupEvents` function will be called with the state store's ``dispatch``
     * method. The `dispatchSetupEvents` function should dispatch whatever events
     * are appropriate to configure the state store for the initial rendering.
     *
     * Once the state store is setup by this function, we will use the store's
     * current state to render the HTML.
     *
     * The `dispatchSetupEvents` can return synchronously or return a Promise, in
     * which case rendering will not occur until the Promise fulfills. The fulfilled
     * value (or returned value if not a thenable) will be ignored.
     *
     * ## Render Context
     *
     * After the state-store is setup as above, the provided `render` function will be
     * invoked to actually produce the HTML. It will be invoked with a context object
     * with the following properties set:
     *
     * * `initialState`:    The state of the state store following setup as described above.
     * * `rendered`:        This is the `initialState` rendered with this object's `renderStateToString`
     *                      method, ready to be included in the page.
     * * `pageContent`:     This is the React content of the page, rendered to a string.
     * * `containerElementId`:  The id of the container element into which the `pageContent` should
     *                          be rendered. This comes from the instance property of the same name.
     * * `initialStateElementId`:   The id of the element into which the `encodedState` should be written.
     *                              This comes from the instance property of the same name.
     *
     * @param  {function} [dispatchSetupEvents=NOOP}] A function that will be called to dispatch
     *                                              whatever events are appropriate for setting up the
     *                                              state store. It is invoked with a dispatch function
     *                                              that should be used for dispatching said events. This
     *                                              is an optional parameter, the default value does nothing.
     *
     * @param  {function} render                    A function to call to actually render
     *                                              the HTML content of the page, e.g.,
     *                                              a compiled template. This will be invoked
     *                                              with a context object as described above,
     *                                              and should return a String representing
     *                                              the HTML for the page (or a Promise for such).
     *
     * @return {any}                                Returns a Promise that fulfills with the result of
     *                                              the call to `render`.
     */
    getInitialHtml({dispatchSetupEvents = NOOP, render}) {

        const initializeStateStore = (stateStore) => {
            return this.getDispatch(stateStore)
                .then(Promise.method(dispatchSetupEvents))
                .then(() => stateStore);
        };

        const getState = (stateStore) => {
            return this.getStoreState(stateStore)
                .then((state) => {
                    return this.renderStateToString(state)
                        .then((renderedState) => ({state, renderedState, stateStore}));
                });
        };

        const renderPage = ({state: initialState, renderedState, stateStore}) => {
            return this.renderComponentTreeToString(stateStore)
                .then((pageContent) => render({
                    renderedState,
                    initialState,
                    pageContent,
                    ...(pick(this, ['containerElementId', 'initialStateElementId']))
                }));
        };

        return this.createStore()
            .then(initializeStateStore)
            .then(getState)
            .then(renderPage);
    }

    /**
     * This is the entry point for the client-side script to do client-side rendering of the page.
     * @return {Promise<StateStore>} Returns a promise for the initialized state store.
     */
    clientMain({dispatchClientSetupEvents = NOOP} = {}) {
        return this.loadStateFromDoc(document)
            .then(this.createStore)
            .tap(this.renderComponentTreeToContainer)
            .tap((stateStore) => dispatchClientSetupEvents(stateStore.dispatch));
    }
}

export function htmlSafeStringify(jsonToStringify) {
    return JSON.stringify(jsonToStringify).replace(/<\//g, '<\\/');
}

export function htmlSafeParse(stringToParse) {
    return JSON.parse(stringToParse);
}
