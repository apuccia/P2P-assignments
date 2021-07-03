import './App.css';
import React from 'react'
import { DrizzleContext } from "@drizzle/react-plugin";
import { Drizzle } from "@drizzle/store";
import SimpleTabs from "./components/SimpleTabs";
import LinearProgress from '@material-ui/core/LinearProgress';

// import drizzle functions and contract artifact
import Mayor from "./contracts/Mayor.json";

// let drizzle know what contracts we want and how to access our test blockchain
const options = {
  contracts: [Mayor],
  web3: {
    fallback: {
      type: "ws",
      url: "ws:localhost:9545",
    },
  },
};

// setup the drizzle store and drizzle
const drizzle = new Drizzle(options);

const App = () => {

  return (
    <DrizzleContext.Provider drizzle={drizzle}>
      <DrizzleContext.Consumer>
        {drizzleContext => {
          const { drizzle, drizzleState, initialized } = drizzleContext;

          if (!initialized) {
            return <LinearProgress />
          }

          return (
            <SimpleTabs drizzle={drizzle} drizzleState={drizzleState} />
          )
        }}
      </DrizzleContext.Consumer>
    </DrizzleContext.Provider>);
}

export default App;
