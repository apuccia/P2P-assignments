import React from "react";
import Grid from "@material-ui/core/Grid";

import Candidate from "./Candidate";
import { dappInfo } from "../index";

class ReadCandidates extends React.Component {
  render() {
    // get the contract state from drizzleState
    const { Mayor } = this.props.drizzleState.contracts;

    const candidates = Mayor.get_candidates[this.props.dataKeyCandidates];
    // if it exists, then we display its value
    return (
      <Grid container spacing={10} justify="center">
        {candidates &&
          candidates.value.map(function (item, index) {
            return (
              <Grid key={dappInfo.candidates[index].name} item md={3}>
                <Candidate
                  name={dappInfo.candidates[index].name}
                  img={dappInfo.candidates[index].pic}
                  address={item}
                  slogan={dappInfo.candidates[index].slogan}
                />
              </Grid>
            );
          })}
      </Grid>
    );
  }
}

export default ReadCandidates;
