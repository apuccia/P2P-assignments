import React from "react";

import Table from "@material-ui/core/Table";
import TableBody from "@material-ui/core/TableBody";
import TableCell from "@material-ui/core/TableCell";
import Container from "@material-ui/core/Container";
import TableHead from "@material-ui/core/TableHead";
import TableRow from "@material-ui/core/TableRow";
import Paper from "@material-ui/core/Paper";
import Button from "@material-ui/core/Button";
import Box from "@material-ui/core/Box";
import Typography from "@material-ui/core/Typography";
import { withStyles } from "@material-ui/core/styles";

import { dappInfo } from "../index";

const styles = (theme) => ({
  container: {
    width: 50 + "%",
  },
  cell: {
    width: 100,
  },
});

class ShowResult extends React.Component {
  state = { dataKeyVotCond: null, dataKeyVotes: [], dataKeyMayor: null };

  componentDidMount = () => {
    const { drizzle } = this.props;
    const contract = drizzle.contracts.Mayor;

    const dataKeyVotCond = contract.methods["voting_condition"].cacheCall();
    this.setState({ dataKeyVotCond });

    // get the contract state from drizzleState
    const { Mayor } = this.props.drizzleState.contracts;

    const candidates = Mayor.get_candidates[this.props.candidates];
    const dataKeyVotes = [];
    candidates.value.forEach(function (item, index) {
      const dataKeyVote = contract.methods["candidates"].cacheCall(item);
      dataKeyVotes.push(dataKeyVote);
    });

    this.setState({ dataKeyVotes });
  };

  mayorOrSayonara = () => {
    const { drizzle, drizzleState } = this.props;
    const contract = drizzle.contracts.Mayor;

    const dataKeyMayor = contract.methods["mayor_or_sayonara"].cacheSend({
      from: drizzleState.accounts[0],
    });
    this.setState({ dataKeyMayor });
  };

  showResults = () => {
    const { Mayor } = this.props.drizzleState.contracts;

    // get the transaction states from the drizzle state
    const { transactions, transactionStack } = this.props.drizzleState;
    const { classes } = this.props;

    // get the transaction hash using our saved `stackId`
    var txHash = transactionStack[this.state.dataKeyMayor];

    // if transaction hash does not exist, don't display anything
    if (!txHash || transactions[txHash] == null) return null;

    if (
      transactions[txHash] != null &&
      transactions[txHash].status === "error"
    ) {
      transactions[txHash] = null;

      return null;
    }

    const candidatesVotes = [];
    this.state.dataKeyVotes.forEach(function (item, index) {
      candidatesVotes.push(Mayor.candidates[item]);
    });

    const candidatesAddresses = Mayor.get_candidates[this.props.candidates];
    const mosEvent = Mayor.events[Mayor.events.length - 1];
    return (
      <div>
        <div>
          <Container className={classes.container} component={Paper} fixed>
            <Table aria-label="simple table">
              <TableHead>
                <TableRow>
                  <TableCell className={classes.cell} align="center">
                    <b>Candidate Address</b>
                  </TableCell>
                  <TableCell className={classes.cell} align="center">
                    <b>Candidate name</b>
                  </TableCell>
                  <TableCell className={classes.cell} align="center">
                    <b>Votes received</b>
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {candidatesVotes[0] &&
                  candidatesVotes.map(function (item, index) {
                    return (
                      <TableRow key={dappInfo.candidates[index].name}>
                        <TableCell align="center">
                          {candidatesAddresses &&
                            candidatesAddresses.value[index]}
                        </TableCell>
                        <TableCell align="center">
                          {item && dappInfo.candidates[index].name}
                        </TableCell>
                        <TableCell align="center">
                          {item && item.value.votes}
                        </TableCell>
                      </TableRow>
                    );
                  })}
              </TableBody>
            </Table>
          </Container>
        </div>
        <div>
          <Box textAlign="center" m={5}>
            <Typography variant="h6" color="textPrimary" component="p">
              {mosEvent.event === "NewMayor"
                ? "We have a new mayor! His address is: " +
                  mosEvent.returnValues._candidate
                : "There is a tie! All souls goes into escrow account: " +
                  mosEvent.returnValues._escrow}
            </Typography>
          </Box>
        </div>
      </div>
    );
  };

  render() {
    const { classes } = this.props;

    // get the contract state from drizzleState
    const { Mayor } = this.props.drizzleState.contracts;

    // using the saved `dataKey`, get the variable we're interested in
    const vot_cond = Mayor.voting_condition[this.state.dataKeyVotCond];

    const escrow = Mayor.escrow[this.props.escrow];
    // if it exists, then we display its value
    return (
      <div>
        <Container fixed className={classes.container} component={Paper}>
          <Table aria-label="simple table">
            <TableHead>
              <TableRow>
                <TableCell className={classes.cell} align="center">
                  <b>Quorum</b>
                </TableCell>
                <TableCell className={classes.cell} align="center">
                  <b>Envelopes casted</b>
                </TableCell>
                <TableCell className={classes.cell} align="center">
                  <b>Envelopes opened</b>
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              <TableRow>
                <TableCell className={classes.cell} align="center">
                  {vot_cond && vot_cond.value.quorum}
                </TableCell>
                <TableCell className={classes.cell} align="center">
                  {vot_cond && vot_cond.value.envelopes_casted}
                </TableCell>
                <TableCell className={classes.cell} align="center">
                  {vot_cond && vot_cond.value.envelopes_opened}
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </Container>
        <div>
          {escrow && escrow.value === this.props.drizzleState.accounts[0] ? (
            <Box textAlign="center" m={2}>
              <Button
                type="button"
                variant="contained"
                color="primary"
                justify="center"
                onClick={this.mayorOrSayonara}
              >
                Declare Mayor
              </Button>
            </Box>
          ) : (
            <div></div>
          )}
        </div>

        {this.state.dataKeyMayor != null ? this.showResults() : <div></div>}
      </div>
    );
  }
}

export default withStyles(styles)(ShowResult);
