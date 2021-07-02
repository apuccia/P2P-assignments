import React from 'react';
import ReactDOM from 'react-dom';
import { DrizzleProvider } from "@drizzle/react-plugin";
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';

import Mayor from "./contracts/Mayor.json";
const options = {
  contracts: [Mayor],
  web3: {
    fallback: {
      type: "ws",
      url: "ws:localhost:9545",
    },
  },
};

ReactDOM.render(
  <DrizzleProvider options={options}>
    <App />
  </DrizzleProvider>,
  document.getElementById("root")
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
