import React from "react";

class ReadCandidates extends React.Component {
  state = { dataKey: null };

  componentDidMount() {
    const { drizzle } = this.props;
    const contract = drizzle.contracts.Mayor;

    const candidates = contract.methods["get_candidates"].cacheCall()
    const escrow = contract.methods["escrow"].cacheCall()

    this.setState({ candidates, escrow });
  }

  render() {
    // get the contract state from drizzleState
    const { Mayor } = this.props.drizzleState.contracts;

    // using the saved `dataKey`, get the variable we're interested in
    const candidates = Mayor.get_candidates[this.state.candidates];
    const escrow = Mayor.escrow[this.state.escrow];

    // if it exists, then we display its value
    return (
      <div>
        <p>Candidate 1: {candidates && candidates.value[0]}</p>
        <p>Candidate 2: {candidates && candidates.value[1]}</p>
        <p>Escrow account: {escrow && escrow.value}</p>
      </div>
    );
  }
}

export default ReadCandidates;