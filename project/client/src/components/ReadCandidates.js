import React from "react";

class ReadCandidates extends React.Component {
  componentDidMount() {
    const { drizzle, drizzleState } = this.props;
    console.log(drizzle);
    console.log(drizzleState);
  }

  render() {
    return <div>ReadCandidates Component</div>;
  }
}

export default ReadCandidates;