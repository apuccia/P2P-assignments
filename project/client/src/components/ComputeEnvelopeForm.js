import TextField from '@material-ui/core/TextField';
import Button from '@material-ui/core/Button';
import React from "react";

import Typography from '@material-ui/core/Typography';
import { withStyles } from "@material-ui/core/styles";

const styles = theme => ({
  root: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing(2),

    '& .MuiTextField-root': {
      margin: theme.spacing(1),
      width: '300px',
    },
    '& .MuiButtonBase-root': {
      margin: theme.spacing(2),
    },
  },
});

class ComputeEnvelopeForm extends React.Component {
  state = { stackId: null };

  handleSubmit = e => {
    this.callComputeEnvelope(this.state.sygil, this.state.symbol, this.state.soul);
  }

  callComputeEnvelope = (sygil, symbol, soul) => {
    const { drizzle, drizzleState } = this.props;
    const contract = drizzle.contracts.Mayor;

    console.log(drizzleState.accounts[0]);
    const stackId = contract.methods["compute_envelope"].cacheSend(sygil, symbol, soul, { from: drizzleState.accounts[0] });

    this.setState({ stackId });
  };

  getTxStatus = () => {
    // get the transaction states from the drizzle state
    const { transactions, transactionStack } = this.props.drizzleState;

    // get the transaction hash using our saved `stackId`
    const txHash = transactionStack[this.state.stackId];

    console.log(this.state.stackId)
    console.log(transactionStack[this.state.stackId])
    console.log(transactionStack)

    // if transaction hash does not exist, don't display anything
    if (!txHash) {
      console.log("null")
      return null;
    }

    // otherwise, return the transaction status
    return `Transaction status: ${transactions[txHash] && transactions[txHash].status}`;
  };

  render() {
    const { classes } = this.props;

    return (
      <div>
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
            <Button type="button" variant="contained" color="primary" onClick={this.handleSubmit}>
              Compute
            </Button>
          </div>
        </form>

        <div>
          <Typography variant="h6" color="inherit">
            {this.getTxStatus()}
          </Typography>
        </div>
      </div >
    );
  }
};

export default withStyles(styles)(ComputeEnvelopeForm);