import React from "react";
import Grid from "@material-ui/core/Grid";

import Candidate from "./Candidate";
import { dappInfo } from "../index";

class ReadCandidates extends React.Component {
  state = { dataKey: null };

  componentDidMount() {
    const { drizzle } = this.props;
    const contract = drizzle.contracts.Mayor;

    const candidates = contract.methods["get_candidates"].cacheCall();

    this.setState({ candidates });
  }

  render() {
    // get the contract state from drizzleState
    const { Mayor } = this.props.drizzleState.contracts;

    // using the saved `dataKey`, get the variable we're interested in
    const candidates = Mayor.get_candidates[this.state.candidates];

    // if it exists, then we display its value
    return (
      <Grid container spacing={10}>
        <Grid item md={3}>
          <Candidate
            name={dappInfo.candidates[0].name}
            slogan={dappInfo.candidates[0].slogan}
            img={dappInfo.candidates[0].pic}
            address={candidates && candidates.value[0]}
          />
        </Grid>
        <Grid item md={3}>
          <Candidate
            name={dappInfo.candidates[1].name}
            slogan={dappInfo.candidates[1].slogan}
            img={dappInfo.candidates[1].pic}
            address={candidates && candidates.value[1]}
          />
        </Grid>
      </Grid>
    );
  }
}

export default ReadCandidates;
