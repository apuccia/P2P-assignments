import React from "react";

import Table from "@material-ui/core/Table";
import TableBody from "@material-ui/core/TableBody";
import TableCell from "@material-ui/core/TableCell";
import TableContainer from "@material-ui/core/TableContainer";
import TableHead from "@material-ui/core/TableHead";
import TableRow from "@material-ui/core/TableRow";
import Paper from "@material-ui/core/Paper";
import Button from "@material-ui/core/Button";
import Box from "@material-ui/core/Box";
import Typography from "@material-ui/core/Typography";
import { withStyles } from "@material-ui/core/styles";

import { dappInfo } from "../index";

const styles = (theme) => ({
  head: {
    backgroundColor: "orange",
  },
  container: {
    width: 50 + "%",
    marginRight: "auto",
    marginLeft: "auto",
  },
  cell: {
    width: 100,
  },
});

class ShowResult extends React.Component {
  state = {
    dataKeyVotCond: null,
    dataKeyVotes: [],
    dataKeyResult: null,
  };

  componentDidMount = () => {
    const { drizzle } = this.props;
    const contract = drizzle.contracts.Mayor;

    const dataKeyVotCond = contract.methods["voting_condition"].cacheCall();
    this.setState({ dataKeyVotCond });

    const dataKeyResult = contract.methods["mayor_result"].cacheCall();
    this.setState({ dataKeyResult });

    // get the contract state from drizzleState
    const { Mayor } = this.props.drizzleState.contracts;

    const candidates = Mayor.get_candidates[this.props.dataKeyCandidates];
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

    contract.methods["mayor_or_sayonara"].cacheSend({
      from: drizzleState.accounts[0],
    });
  };

  showResults = () => {
    const { Mayor } = this.props.drizzleState.contracts;

    const { classes } = this.props;

    const result = Mayor.mayor_result[this.state.dataKeyResult];
    if (
      result == null ||
      result.value.mayor_address ===
        "0x0000000000000000000000000000000000000000"
    ) {
      return null;
    }

    const candidatesVotes = [];
    this.state.dataKeyVotes.forEach(function (item, index) {
      candidatesVotes.push(Mayor.candidates[item]);
    });

    const candidatesAddresses =
      Mayor.get_candidates[this.props.dataKeyCandidates];
    return (
      <div>
        <div>
          <TableContainer className={classes.container} component={Paper}>
            <Table aria-label="simple table">
              <TableHead className={classes.head}>
                <TableRow>
                  <TableCell align="center">
                    <b>Candidate Address</b>
                  </TableCell>
                  <TableCell align="center">
                    <b>Candidate name</b>
                  </TableCell>
                  <TableCell align="center">
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
          </TableContainer>
        </div>
        <div>
          <Box textAlign="center" m={5}>
            <Typography variant="h6" color="textPrimary" component="p">
              {result.value.result === "NewMayor"
                ? "We have a new mayor! His address is: " +
                  result.value.mayor_address
                : "There is a tie! All souls goes into escrow account: " +
                  result.value.mayor_address}
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

    const escrow = Mayor.escrow[this.props.dataKeyEscrow];
    // if it exists, then we display its value
    return (
      <div>
        <div>
          <TableContainer className={classes.container} component={Paper}>
            <Table aria-label="simple table">
              <TableHead className={classes.head}>
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
          </TableContainer>
        </div>
        <div style={{ marginTop: "25px", marginBottom: "25px" }}>
          {escrow && escrow.value === this.props.drizzleState.accounts[0] ? (
            <Box textAlign="center">
              <Button
                type="button"
                variant="contained"
                color="primary"
                justify="center"
                style={{ width: "200px" }}
                onClick={this.mayorOrSayonara}
              >
                Declare Mayor
              </Button>
            </Box>
          ) : (
            <div></div>
          )}
        </div>

        {this.showResults()}
      </div>
    );
  }
}

export default withStyles(styles)(ShowResult);
