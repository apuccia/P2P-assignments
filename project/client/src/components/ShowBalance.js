import React from "react";

import Typography from "@material-ui/core/Typography";

class ShowBalance extends React.Component {
  state = {
    dataKeyBalance: null,
  };

  componentDidMount = () => {
    const { drizzle } = this.props;
    const contract = drizzle.contracts.SOUToken;

    const dataKeyBalance = contract.methods["balanceOf"].cacheCall(
      this.props.drizzleState.accounts[0]
    );
    this.setState({ dataKeyBalance });
  };

  render() {
    // get the contract state from drizzleState
    const { SOUToken } = this.props.drizzleState.contracts;

    // using the saved `dataKey`, get the variable we're interested in
    const balance = SOUToken.balanceOf[this.state.dataKeyBalance];

    // if it exists, then we display its value
    return (
      <Typography variant="h5" color="inherit" style={{ marginTop: "5px" }}>
        {balance && balance.value / 10 ** 18}
      </Typography>
    );
  }
}

export default ShowBalance;
