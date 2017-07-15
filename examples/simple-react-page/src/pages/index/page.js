import {IsomorphicPageRenderer} from 'isomorphic-page-renderer';
import {ExamplePage} from './views/example-page';
import React from 'react';
import {reducer} from './reducer';

export function getPage() {
    return new IsomorphicPageRenderer({
        reducer,
        pageComponent: <ExamplePage />
    });
}
