import {getPage} from './page';
import {setInteractive} from './reducer';

getPage().clientMain({dispatchClientSetupEvents: (dispatch) => {
    setInteractive(dispatch);
}});
