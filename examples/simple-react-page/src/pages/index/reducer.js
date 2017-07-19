
const ACTION_TYPE_SET_USER_NAME = 'set-user-name';
const ACTION_TYPE_SET_COUNTER = 'set-counter';
const ACTION_TYPE_INCREMENT_COUNTER = 'inc-counter';
const ACTION_TYPE_DECREMENT_COUNTER = 'dec-counter';
const ACTION_TYPE_SET_INTERACTIVE = 'set-interactive';
const ACTION_TYPE_DEFAULT_COUNTER_SET = 'default-counter-set';

const INCREMENT_VALUE = 1;
const DECREMENT_VALUE = 1;

const DEFAULT_STATE = {
    counter: 0,
    defaultCounterSet: false,
    interactive: false,
    serverValue: null
};

export function reducer(state = {...DEFAULT_STATE}, {type, payload}) {
    switch (type) {
        case ACTION_TYPE_SET_USER_NAME:
            return {...state, userName: payload};

        case ACTION_TYPE_SET_COUNTER:
            return {...state, counter: payload};

        case ACTION_TYPE_INCREMENT_COUNTER:
            return {...state, counter: state.counter + INCREMENT_VALUE};

        case ACTION_TYPE_DECREMENT_COUNTER:
            return {...state, counter: state.counter - DECREMENT_VALUE};

        case ACTION_TYPE_SET_INTERACTIVE:
            return {...state, interactive: true};

        case ACTION_TYPE_DEFAULT_COUNTER_SET:
            return {...state, defaultCounterSet: true};
    }
    return state;
}

export function setUserName(dispatch, userName) {
    dispatch({type: ACTION_TYPE_SET_USER_NAME, payload: userName});
}

export function setCounter(dispatch, value) {
    dispatch({type: ACTION_TYPE_SET_COUNTER, payload: value});
}

export function incCounter(dispatch) {
    dispatch({type: ACTION_TYPE_INCREMENT_COUNTER});
}

export function decCounter(dispatch) {
    dispatch({type: ACTION_TYPE_DECREMENT_COUNTER});
}

export function setInteractive(dispatch) {
    dispatch({type: ACTION_TYPE_SET_INTERACTIVE});
}

export function setDefaultCounterSet(dispatch) {
    dispatch({type: ACTION_TYPE_DEFAULT_COUNTER_SET});
}
