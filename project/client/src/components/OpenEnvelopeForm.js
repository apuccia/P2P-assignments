import React from "react";
import TextField from '@material-ui/core/TextField';
import Button from '@material-ui/core/Button';
import { withStyles } from "@material-ui/core/styles";
import Typography from '@material-ui/core/Typography';

import { ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'

const styles = theme => ({
    root: {
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        padding: theme.spacing(2),

        '& .MuiTextField-root': {
            margin: theme.spacing(1),
            width: '500px',
        },
        '& .MuiButtonBase-root': {
            margin: theme.spacing(2),
        },
    },
});

class OpenEnvelopeForm extends React.Component {
    state = { stackId: null };

    handleOpen = e => {
        this.callOpenEnvelope(this.state.sygil, this.state.symbol, this.state.soul);
    }

    callOpenEnvelope = async () => {
        const { drizzle, drizzleState } = this.props;
        const contract = drizzle.contracts.Mayor;

        console.log(contract.address);
        await contract.methods.approve(contract.address, this.state.soul).send({ from: drizzleState.accounts[0] });
        console.log(drizzleState.accounts[0]);
        console.log(this.state.soul);
        const stackId = contract.methods["open_envelope"].cacheSend(this.state.sygil, this.state.symbol, this.state.soul, { from: drizzleState.accounts[0] });
        console.log(drizzleState.accounts[0]);

        this.setState({ stackId });
    };

    getResult = () => {
        // get the transaction states from the drizzle state
        const { transactions, transactionStack } = this.props.drizzleState;

        // get the transaction hash using our saved `stackId`
        var txHash = transactionStack[this.state.stackId];

        // if transaction hash does not exist, don't display anything
        if (!txHash || transactions[txHash] == null) return null;

        if (transactions[txHash] != null && transactions[txHash].status === "error") {
            transactions[txHash] = null;

            return null;
        }

        return (
            <Typography variant="h6" color="textPrimary" component="p">
                Envelope Opened!
            </Typography>
        );
    }

    render() {
        const { classes } = this.props;

        return (
            <div>
                <ToastContainer style={{ width: "600px" }} />
                <form className={classes.root}>
                    <TextField
                        label="Sygil"
                        variant="filled"
                        type="integer"
                        required
                        onChange={e => this.setState({
                            sygil: e.target.value
                        })}
                    />
                    {/* TODO: change to select */}
                    <TextField
                        label="Symbol"
                        variant="filled"
                        required
                        onChange={e => this.setState({
                            symbol: e.target.value
                        })}
                    />
                    <TextField
                        label="Soul"
                        variant="filled"
                        type="integer"
                        required
                        onChange={e => this.setState({
                            soul: e.target.value
                        })}
                    />
                    <div>
                        <Button variant="contained">
                            Cancel
                        </Button>
                        <Button type="button" variant="contained" color="primary" onClick={() => this.handleOpen()}>
                            Open
                        </Button>
                    </div>
                </form>

                <div className={classes.root}>
                    {this.getResult()}
                </div>
            </div >
        );
    }
};

export default withStyles(styles)(OpenEnvelopeForm);