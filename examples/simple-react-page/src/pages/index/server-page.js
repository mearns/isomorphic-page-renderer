import {getPage} from './page';
import {setUserName, setCounter, setDefaultCounterSet} from './reducer';

export function getHtml({userName, counter}) {
    return getPage().getInitialHtml({
        dispatchSetupEvents: (dispatch) => dispatchSetupEvents({userName, counter}, dispatch),
        render
    });
}

export function getApiResponse({userName, counter}) {
    return getPage().getCurrentState({
        dispatchSetupEvents: (dispatch) => dispatchSetupEvents({userName, counter}, dispatch),
    });
}

function dispatchSetupEvents({userName, counter}, dispatch) {
    setUserName(dispatch, userName);
    if (typeof counter !== 'undefined') {
        try {
            setCounter(dispatch, parseInt(counter, 10));
            setDefaultCounterSet(dispatch);
        }
        catch (e) {
            // Ignore.
        }
    }
}

function render({renderedState, pageContent, containerElementId}) {
    return `<!DOCTYPE html>
<html lang='en'>
    <head>
        <meta charset="UTF-8" />
        <title>Example Isomorphic Page</title>
    </head>
    <body>
        <!-- Here is the page content as rendered on the server side: -->
        <div id='${containerElementId}'>${pageContent}</div>
        <!-- End server-side rendered page content -->

        <!-- And here is the initial state as rendered by the server, for the client to load: -->
        ${renderedState}
        <!-- End initial state -->

        <!-- Here's the Webpack bundle that includes the client-side entry to take over rendering of the page -->
        <script type='text/javascript' src='/static/bundles/pages/index.js'></script>
    </body>
</html>
`;
}
