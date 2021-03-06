import React from "react";
import ReactDOM from "react-dom";

import { DrizzleContext } from "@drizzle/react-plugin";
import { Drizzle, generateStore, EventActions } from "@drizzle/store";
import { TX_ERROR } from "@drizzle/store/src/transactions/constants";

import Typography from "@material-ui/core/Typography";
import CheckCircleOutlineOutlinedIcon from "@material-ui/icons/CheckCircleOutlineOutlined";
import ErrorOutlineOutlinedIcon from "@material-ui/icons/ErrorOutlineOutlined";

import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import "typeface-roboto";

import "./index.css";
import App from "./App";
import reportWebVitals from "./reportWebVitals";
import Mayor from "./contracts/Mayor.json";
import SOUToken from "./contracts/SOUToken.json";

import solaire from "./media/solaire.jpg";
import drake from "./media/drake.png";
import freeman from "./media/freeman.jpg";

export const dappInfo = {
  candidates: [
    {
      name: "Solaire of Astora",
      slogan: "The sun is a wondrous body. Like a magnificent father!",
      pic: solaire,
    },
    {
      name: "Nathan Drake",
      slogan: "Desperate times, right?",
      pic: drake,
    },
    {
      name: "Dr. Gordon Freeman",
      slogan: "Yeah, I went to MIT. Got a degree in crowbaring.",
      pic: freeman,
    },
  ],
};

// let drizzle know what contracts we want and how to access our test blockchain
const drizzleOptions = {
  contracts: [Mayor, SOUToken],
  web3: {
    fallback: {
      type: "ws",
      url: "ws:localhost:9545",
    },
  },
  events: {
    Mayor: ["EnvelopeCast", "EnvelopeOpen", "NewMayor", "Tie"],
  },
  // https://spectrum.chat/trufflesuite/drizzle/polls-and-syncalways-in-drizzleoptions~4bc46b65-cbb4-48aa-a351-e480bdcb9ac0
  syncAlways: true,
};

const Container = (props) => <div>{props.children}</div>;
const contractEventNotifier =
  (lastSeenEventId) => (store) => (next) => (action) => {
    // manage events
    if (action.type === EventActions.EVENT_FIRED) {
      // this check is needed because metamask sends multiple events
      // https://github.com/trufflesuite/drizzle/issues/7
      // https://github.com/MetaMask/metamask-extension/issues/6668
      if (action.event.id !== lastSeenEventId) {
        lastSeenEventId = action.event.id;
        const contractEvent = action.event.event;
        const values = action.event.returnValues;
        var display;

        switch (contractEvent) {
          case "EnvelopeCast":
            display = (
              <p>
                ({contractEvent}) Envelope casted with success.
                <br />
                <b>Voter address</b>: {values._voter}
              </p>
            );
            break;
          case "EnvelopeOpen":
            display = (
              <p>
                ({contractEvent}) Envelope opened with success.
                <br />
                <b>Voter address</b>: {values._voter}
                <br />
                <b>Souls token spent</b>: {values._soul / 10 ** 18}
                <br />
                <b>Candidate address</b>: {values._symbol}
              </p>
            );
            break;
          case "NewMayor":
            display = (
              <p>
                ({contractEvent}) Mayor declared.
                <br />
                <b>Candidate address</b>: {values._candidate}
              </p>
            );
            break;
          case "Tie":
            display = (
              <p>
                ({contractEvent}) There is a tie!.
                <br />
                <b>Escrow address</b>: {values._escrow}
              </p>
            );
            break;
          default:
            display = "";
        }

        toast.success(
          <Container>
            <CheckCircleOutlineOutlinedIcon />
            <Typography variant="subtitle1" color="textPrimary" component="div">
              {display}
            </Typography>
          </Container>,
          { position: toast.POSITION.TOP_RIGHT }
        );
      }
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
        <Container>
          <ErrorOutlineOutlinedIcon />
          <Typography variant="subtitle1" color="textPrimary" component="p">
            {reason}
          </Typography>
        </Container>,
        { position: toast.POSITION.TOP_RIGHT }
      );
    }

    return next(action);
  };

const appMiddlewares = [contractEventNotifier("")];

const store = generateStore({
  drizzleOptions,
  appMiddlewares,
  disableReduxDevTools: false, // enable ReduxDevTools!
});

// setup the drizzle store and drizzle
const drizzle = new Drizzle(drizzleOptions, store);

ReactDOM.render(
  <DrizzleContext.Provider drizzle={drizzle} options={drizzleOptions}>
    <div>
      <ToastContainer style={{ width: "600px" }} />
      <App />
    </div>
  </DrizzleContext.Provider>,
  document.getElementById("root")
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
