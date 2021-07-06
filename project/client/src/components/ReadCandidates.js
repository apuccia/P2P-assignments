import React from "react";
import Grid from '@material-ui/core/Grid';

import Candidate from "./Candidate";
import cand1 from '../media/cand1.png'
import cand2 from '../media/cand2.png'

class ReadCandidates extends React.Component {
  state = { dataKey: null };

  componentDidMount() {
    const { drizzle } = this.props;
    const contract = drizzle.contracts.Mayor;

    const candidates = contract.methods["get_candidates"].cacheCall()

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
          <Candidate name="asdf" slogan="asdfasdf" imgloc={cand1} address={candidates && candidates.value[0]} />
        </Grid>
        <Grid item md={3}>
          <Candidate name="pippus" slogan="asdfasdf" imgloc={cand2} address={candidates && candidates.value[1]} />
        </Grid>
      </Grid>
    );
  }
}

export default ReadCandidates;