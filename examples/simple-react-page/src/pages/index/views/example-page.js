import React from 'react';
import {connect} from 'react-redux';
import PropTypes from 'prop-types';
import {incCounter, decCounter} from '../reducer';

class _ExamplePage extends React.Component {
    constructor(props) {
        super(props);

        this.inc = this.inc.bind(this);
        this.dec = this.dec.bind(this);
    }

    inc(e) {
        e.preventDefault();
        this.props.incCounter();
    }

    dec(e) {
        e.preventDefault();
        this.props.decCounter();
    }

    render() {
        return (<div>
            <h1>Hello{this.props.userName && `, ${this.props.userName}`}</h1>

            {!this.props.userName && (<p>
                You did not specify a user name. Try adding it to the URL
                like: <a href='/?userName=Andromeda'>/?userName=Andromeda</a>.
            </p>)}

            <p>
                The counter value is {this.props.counter}.&nbsp;
                { this.props.interactive && (<span>
                    <button onClick={this.inc}>increment</button>
                    <button onClick={this.dec}>decrement</button>
                </span>)}
            </p>

            {!this.props.defaultCounterSet && (<p>
                You can specify a default value in the counter with a&nbsp;
                <code>counter</code> query parameter, like <a href='/?counter=100'>/?counter=100</a>.
            </p>)}
        </div>);
    }
}
_ExamplePage.propTypes = {
    userName: PropTypes.string,
    counter: PropTypes.number.isRequired,
    incCounter: PropTypes.func.isRequired,
    decCounter: PropTypes.func.isRequired,
    defaultCounterSet: PropTypes.bool.isRequired,
    interactive: PropTypes.bool.isRequired
};

const mapStateToProps = (state) => {
    return {
        userName: state.userName,
        counter: state.counter,
        interactive: state.interactive,
        defaultCounterSet: state.defaultCounterSet
    };
};

const mapDispatchToProps = (dispatch) => {
    return {
        incCounter: incCounter.bind(null, dispatch),
        decCounter: decCounter.bind(null, dispatch)
    };
};

export const ExamplePage = connect(mapStateToProps, mapDispatchToProps)(_ExamplePage);
