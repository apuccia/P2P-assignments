import React from "react";

import { DrizzleContext } from "@drizzle/react-plugin";
import LinearProgress from "@material-ui/core/LinearProgress";

import "./App.css";
import SimpleTabs from "./components/SimpleTabs";

const App = (props) => {
  return (
    <DrizzleContext.Consumer>
      {(drizzleContext) => {
        const { drizzle, drizzleState, initialized } = drizzleContext;

        if (!initialized) {
          return <LinearProgress />;
        }

        return (
          <div>
            <SimpleTabs drizzle={drizzle} drizzleState={drizzleState} />
          </div>
        );
      }}
    </DrizzleContext.Consumer>
  );
};

export default App;
