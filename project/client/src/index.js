import React from "react";
import ReactDOM from "react-dom";

import { DrizzleProvider } from "@drizzle/react-plugin";
import { Drizzle, generateStore, EventActions } from "@drizzle/store";
import { TX_ERROR } from "@drizzle/store/src/transactions/constants";

import Typography from "@material-ui/core/Typography";

import { toast } from "react-toastify";

import "./index.css";
import App from "./App";
import reportWebVitals from "./reportWebVitals";
import Mayor from "./contracts/Mayor.json";

import cand1 from "./media/cand1.png";
import cand2 from "./media/cand2.png";

export const dappInfo = {
  candidates: [
    {
      name: "Prova Pippo",
      slogan: "Avanti savoia",
      pic: cand1,
    },
    {
      name: "Pluto Pippo",
      slogan: "sdrogolo",
      pic: cand2,
    },
  ],
};

// let drizzle know what contracts we want and how to access our test blockchain
const drizzleOptions = {
  contracts: [Mayor],
  web3: {
    fallback: {
      type: "ws",
      url: "ws:localhost:9545",
    },
  },
  events: {
    Mayor: ["EnvelopeCast", "EnvelopeOpen", "Approval"],
  },
};

const contractEventNotifier = (store) => (next) => (action) => {
  const success = String.fromCodePoint(0x2714);
  const err = String.fromCodePoint(0x274c);

  // manage events
  if (action.type === EventActions.EVENT_FIRED) {
    const contractEvent = action.event.event;
    const values = action.event.returnValues;
    var display;

    switch (contractEvent) {
      case "EnvelopeCast":
        display = (
          <p>
            ({success} {contractEvent}) Envelope casted with success.
            <br />
            <b>Voter address</b>: {values._voter}
          </p>
        );
        break;
      case "EnvelopeOpen":
        display = (
          <p>
            ({success} {contractEvent}) Envelope opened with success.
            <br />
            <b>Voter address</b>: {values._voter}
            <br />
            <b>Souls token added</b>: {values._soul}
            <br />
            <b>Candidate address</b>: {values._sygil}
          </p>
        );
        break;
      case "Approval":
        display = (
          <p>
            ({success} {contractEvent}) Token transfer delegation with success.
            <br />
            <b>Owner address</b>: {values.owner}
            <br />
            <b>Spender address</b>: {values.spender}
            <br />
            <b>Souls</b>: {values.value}
          </p>
        );
        break;
      default:
        display = "";
    }

    console.log(action.event.returnValues);
    toast.success(
      <Typography variant="subtitle1" color="textPrimary" component="div">
        {display}
      </Typography>,
      { position: toast.POSITION.TOP_RIGHT }
    );
  }
  // manage transaction errors (require and modifiers)
  else if (action.type === TX_ERROR) {
    // get the json string from the error string
    var msg = action.error.message;
    msg = msg.substring(msg.indexOf("'") + 1, msg.length - 1);

    // parse the json string and get the reason msg (i.e. require/modifier message)
    const parsed = JSON.parse(msg);
    const reason =
      parsed.value.data.data[Object.keys(parsed.value.data.data)[0]].reason;

    toast.error(
      <Typography variant="subtitle1" color="textPrimary" component="p">
        {err} {reason}
      </Typography>,
      { position: toast.POSITION.TOP_RIGHT }
    );
  }
  return next(action);
};

const appMiddlewares = [contractEventNotifier];

const store = generateStore({
  drizzleOptions,
  appMiddlewares,
});

// setup the drizzle store and drizzle
const drizzle = new Drizzle(drizzleOptions, store);

ReactDOM.render(
  <DrizzleProvider options={drizzleOptions}>
    <App drizzle={drizzle} />
  </DrizzleProvider>,
  document.getElementById("root")
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
