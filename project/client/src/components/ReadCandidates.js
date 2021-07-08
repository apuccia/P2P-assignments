import React from "react";
import Grid from "@material-ui/core/Grid";

import Candidate from "./Candidate";
import { dappInfo } from "../index";

class ReadCandidates extends React.Component {
  render() {
    // get the contract state from drizzleState
    const { Mayor } = this.props.drizzleState.contracts;

    const candidates = Mayor.get_candidates[this.props.candidates];
    console.log(candidates);
    // if it exists, then we display its value
    return (
      <Grid container spacing={10} justify="center">
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
