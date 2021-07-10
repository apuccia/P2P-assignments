import TextField from "@material-ui/core/TextField";
import Button from "@material-ui/core/Button";
import React from "react";
import { withStyles } from "@material-ui/core/styles";
import Typography from "@material-ui/core/Typography";
import MenuItem from "@material-ui/core/MenuItem";

const styles = (theme) => ({
  root: {
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",

    "& .MuiTextField-root": {
      margin: theme.spacing(1),
      width: "500px",
    },
    "& .MuiButtonBase-root": {
      margin: theme.spacing(2),

      width: "200px",
    },
    "& .MuiSelectField-root": {
      margin: theme.spacing(2),
    },
  },
});

class ComputeEnvelopeForm extends React.Component {
  state = { dataKeyCompute: null, isValid: true };

  componentDidMount = () => {
    // get the contract state from drizzleState
    const { Mayor } = this.props.drizzleState.contracts;

    const candidates = Mayor.get_candidates[this.props.dataKeyCandidates];
    const symbol = candidates && candidates.value[0];
    this.setState({ symbol });
  };

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

  callComputeEnvelope = () => {
    const { drizzle, drizzleState } = this.props;
    const contract = drizzle.contracts.Mayor;

    if (
      this.state.sygil != null &&
      this.state.symbol != null &&
      this.state.soul != null
    ) {
      /* global BigInt */
      const convertedSoul = BigInt(this.state.soul * 10 ** 18);
      const dataKeyCompute = contract.methods["compute_envelope"].cacheCall(
        this.state.sygil,
        this.state.symbol,
        convertedSoul.toString(),
        { from: drizzleState.accounts[0] }
      );
      this.setState({ dataKeyCompute });
      this.showEnvelope();
    } else {
      this.setState({ isValid: false });
    }
  };

  callCastEnvelope = () => {
    const { drizzle, drizzleState } = this.props;
    const contract = drizzle.contracts.Mayor;
    const { Mayor } = this.props.drizzleState.contracts;

    const env = Mayor.compute_envelope[this.state.dataKeyCompute];
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

    if (this.state.dataKeyCompute == null) {
      return null;
    }

    // using the saved `dataKey`, get the variable we're interested in
    const envelope = Mayor.compute_envelope[this.state.dataKeyCompute];

    return (
      <Typography variant="h6" color="textPrimary" component="p">
        Your envelope is: {envelope && envelope.value}
      </Typography>
    );
  };

  render() {
    const { classes } = this.props;
    // get the contract state from drizzleState
    const { Mayor } = this.props.drizzleState.contracts;

    const candidates = Mayor.get_candidates[this.props.dataKeyCandidates];

    // if it exists, then we display its value
    return (
      <div>
        <form className={classes.root} noValidate>
          <TextField
            id="sygil"
            required
            label="Sygil"
            variant="filled"
            type="integer"
            error={!this.state.isValid}
            onChange={(e) =>
              this.setState({
                sygil: e.target.value,
              })
            }
          />
          <TextField
            select
            label="Symbol"
            required
            variant="filled"
            defaultValue={candidates && candidates.value[0]}
            onChange={(e) =>
              this.setState({
                symbol: e.target.value,
              })
            }
          >
            {candidates &&
              candidates.value.map(function (item, index) {
                return (
                  <MenuItem key={item} value={item}>
                    {item}
                  </MenuItem>
                );
              })}
          </TextField>
          <TextField
            label="Souls"
            required
            variant="filled"
            type="integer"
            error={!this.state.isValid}
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

        {this.state.dataKeyCompute != null ? (
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
