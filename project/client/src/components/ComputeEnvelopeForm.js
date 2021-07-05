import TextField from '@material-ui/core/TextField';
import Button from '@material-ui/core/Button';
import React from "react";
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
  handleSubmit = e => {
    this.callComputeEnvelope(this.state.sygil, this.state.symbol, this.state.soul);
  }

  callComputeEnvelope = (sygil, symbol, soul) => {
    const { drizzle, drizzleState } = this.props;
    const contract = drizzle.contracts.Mayor;

    const stackId = contract.methods["compute_envelope"].cacheSend(sygil, symbol, soul);

    this.setState({ stackId });
  };

  render() {
    const { classes } = this.props;

    return (
      <div>
        <form className={classes.root} onSubmit={this.handleSubmit}>
          <TextField
            label="Sygil"
            variant="filled"
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
            type="email"
            required
            onChange={e => this.setState({
              soul: e.target.value
            })}
          />
          <div>
            <Button variant="contained">
              Cancel
            </Button>
            <Button type="submit" variant="contained" color="primary">
              Compute
            </Button>
          </div>
        </form>
      </div >
    );
  }
};

export default withStyles(styles)(ComputeEnvelopeForm);