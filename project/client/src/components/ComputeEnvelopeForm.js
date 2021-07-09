import TextField from "@material-ui/core/TextField";
import Button from "@material-ui/core/Button";
import React from "react";
import { withStyles } from "@material-ui/core/styles";
import Typography from "@material-ui/core/Typography";

const styles = (theme) => ({
  root: {
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    padding: theme.spacing(2),

    "& .MuiTextField-root": {
      margin: theme.spacing(1),
      width: "500px",
    },
    "& .MuiButtonBase-root": {
      margin: theme.spacing(2),
    },
  },
});

class ComputeEnvelopeForm extends React.Component {
  state = { dataKey: null };

  handleCompute = (e) => {
    this.callComputeEnvelope(
      this.state.sygil,
      this.state.symbol,
      this.state.soul
    );
  };

  handleCast = (e) => {
    this.callCastEnvelope();
  };

  callComputeEnvelope = (sygil, symbol, soul) => {
    const { drizzle, drizzleState } = this.props;
    const contract = drizzle.contracts.Mayor;

    /* global BigInt */
    const convertedSoul = BigInt(soul * 10 ** 18);
    console.log(convertedSoul);
    const dataKey = contract.methods["compute_envelope"].cacheCall(
      sygil,
      symbol,
      convertedSoul.toString(),
      { from: drizzleState.accounts[0] }
    );
    this.setState({ dataKey });

    this.showEnvelope();
  };

  callCastEnvelope = () => {
    const { drizzle, drizzleState } = this.props;
    const contract = drizzle.contracts.Mayor;
    const { Mayor } = this.props.drizzleState.contracts;

    const env = Mayor.compute_envelope[this.state.dataKey];
    const stackId = contract.methods["cast_envelope"].cacheSend(
      env && env.value,
      { from: drizzleState.accounts[0] }
    );

    this.setState({ stackId });
  };

  getResult = () => {
    // get the transaction states from the drizzle state
    const { transactions, transactionStack } = this.props.drizzleState;
    // get the transaction hash using our saved `stackId`
    var txHash = transactionStack[this.state.stackId];

    // if transaction hash does not exist, don't display anything
    if (!txHash || transactions[txHash] == null) return null;

    if (
      transactions[txHash] != null &&
      transactions[txHash].status === "error"
    ) {
      transactions[txHash] = null;

      return null;
    }

    return (
      <Typography variant="h6" color="textPrimary" component="p">
        Envelope Casted! Remember to save the <b>sygil</b> in order to open it
        later!
      </Typography>
    );
  };

  showEnvelope = () => {
    const { Mayor } = this.props.drizzleState.contracts;

    if (this.state.dataKey == null) {
      return null;
    }

    // using the saved `dataKey`, get the variable we're interested in
    const envelope = Mayor.compute_envelope[this.state.dataKey];

    return (
      <Typography variant="h6" color="textPrimary" component="p">
        Your envelope is: {envelope && envelope.value}
      </Typography>
    );
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
            onChange={(e) =>
              this.setState({
                sygil: e.target.value,
              })
            }
          />
          <TextField
            label="Symbol"
            variant="filled"
            required
            onChange={(e) =>
              this.setState({
                symbol: e.target.value,
              })
            }
          />
          <TextField
            label="Soul"
            variant="filled"
            type="integer"
            required
            onChange={(e) =>
              this.setState({
                soul: e.target.value,
              })
            }
          />
          <div>
            <Button
              type="button"
              variant="contained"
              color="primary"
              onClick={this.handleCompute}
            >
              Compute
            </Button>
          </div>
        </form>

        {this.state.dataKey != null ? (
          <div className={classes.root}>
            {this.showEnvelope()}
            <Button
              type="button"
              variant="contained"
              color="primary"
              onClick={this.handleCast}
            >
              Cast
            </Button>
          </div>
        ) : (
          <div></div>
        )}

        <div className={classes.root}>{this.getResult()}</div>
      </div>
    );
  }
}

export default withStyles(styles)(ComputeEnvelopeForm);
