import { useEffect } from "react";
import React from "react";
import PropTypes from "prop-types";
import { makeStyles } from "@material-ui/core/styles";
import AppBar from "@material-ui/core/AppBar";
import Tabs from "@material-ui/core/Tabs";
import Tab from "@material-ui/core/Tab";
import Grid from "@material-ui/core/Grid";
import Typography from "@material-ui/core/Typography";
import Box from "@material-ui/core/Box";
import Toolbar from "@material-ui/core/Toolbar";
import Avatar from "@material-ui/core/Avatar";

import ComputeEnvelopeForm from "./ComputeEnvelopeForm";
import OpenEnvelopeForm from "./OpenEnvelopeForm";
import ReadCandidates from "./ReadCandidates";
import ShowResult from "./ShowResult";
import ShowBalance from "./ShowBalance";
import Home from "./Home";

import soulPic from "../media/soul.png";

function TabPanel(props) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box p={3}>
          <Typography component={"span"}>{children}</Typography>
        </Box>
      )}
    </div>
  );
}

TabPanel.propTypes = {
  children: PropTypes.node,
  index: PropTypes.any.isRequired,
  value: PropTypes.any.isRequired,
};

function a11yProps(index) {
  return {
    id: `simple-tab-${index}`,
    "aria-controls": `simple-tabpanel-${index}`,
  };
}

const useStyles = makeStyles((theme) => ({
  root: {
    flexGrow: 1,
    backgroundColor: theme.palette.background.paper,
  },
}));

function SimpleTabs(props) {
  const classes = useStyles();
  const [value, setValue] = React.useState(0);

  const [dataKeyCandidates, setCandidates] = React.useState(null);
  const [dataKeyEscrow, setEscrow] = React.useState(null);

  useEffect(() => {
    const mayorContract = props.drizzle.contracts.Mayor;

    const dataKeyCandidates =
      mayorContract.methods["get_candidates"].cacheCall();
    const dataKeyEscrow = mayorContract.methods["escrow"].cacheCall();

    setCandidates(dataKeyCandidates);
    setEscrow(dataKeyEscrow);
  }, [dataKeyCandidates, dataKeyEscrow, props.drizzle.contracts.Mayor]);

  const handleChange = (event, newValue) => {
    setValue(newValue);
  };

  return (
    <div className={classes.root}>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h4" color="inherit" align="center">
            Valadilène Voting System
          </Typography>
        </Toolbar>

        <Grid container>
          <Grid item>
            <Tabs
              value={value}
              onChange={handleChange}
              aria-label="simple tabs example"
            >
              <Tab label="Home" {...a11yProps(0)} />
              <Tab label="The candidates" {...a11yProps(1)} />
              <Tab label="Cast envelope" {...a11yProps(2)} />
              <Tab label="Open envelope" {...a11yProps(2)} />
              <Tab label="See result" {...a11yProps(2)} />
            </Tabs>
          </Grid>

          <Grid container justify="flex-end" style={{ marginTop: "-50px" }}>
            <Grid item>
              <ShowBalance
                drizzle={props.drizzle}
                drizzleState={props.drizzleState}
              ></ShowBalance>
            </Grid>
            <Grid item>
              <Avatar src={soulPic} style={{ marginRight: "50px" }} />
            </Grid>
          </Grid>
        </Grid>
      </AppBar>

      <TabPanel value={value} index={0}>
        <Home drizzle={props.drizzle} drizzleState={props.drizzleState}></Home>
      </TabPanel>
      <TabPanel value={value} index={1}>
        <ReadCandidates
          drizzle={props.drizzle}
          drizzleState={props.drizzleState}
          dataKeyCandidates={dataKeyCandidates}
        />
      </TabPanel>
      <TabPanel value={value} index={2}>
        <ComputeEnvelopeForm
          drizzle={props.drizzle}
          drizzleState={props.drizzleState}
          dataKeyCandidates={dataKeyCandidates}
        />
      </TabPanel>
      <TabPanel value={value} index={3}>
        <OpenEnvelopeForm
          drizzle={props.drizzle}
          drizzleState={props.drizzleState}
          dataKeyCandidates={dataKeyCandidates}
        />
      </TabPanel>

      <TabPanel value={value} index={4}>
        <ShowResult
          dataKeyCandidates={dataKeyCandidates}
          drizzle={props.drizzle}
          drizzleState={props.drizzleState}
          dataKeyEscrow={dataKeyEscrow}
        />
      </TabPanel>
    </div>
  );
}

export default SimpleTabs;
