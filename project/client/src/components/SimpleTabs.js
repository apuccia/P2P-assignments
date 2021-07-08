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
import IconButton from "@material-ui/core/IconButton";
import MenuIcon from "@material-ui/icons/Menu";
import Menu from "@material-ui/core/Menu";
import MenuItem from "@material-ui/core/MenuItem";
import Avatar from "@material-ui/core/Avatar";

import ComputeEnvelopeForm from "./ComputeEnvelopeForm";
import OpenEnvelopeForm from "./OpenEnvelopeForm";
import ReadCandidates from "./ReadCandidates";
import ShowResult from "./ShowResult";

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
  const [anchorEl, setAnchorEl] = React.useState(null);

  const [computeEnvelope, setComputeEnvelope] = React.useState(false);
  const [openEnvelope, setOpenEnvelope] = React.useState(false);
  const [candidates, setCandidates] = React.useState(null);
  const [escrow, setEscrow] = React.useState(null);
  const [balance, setBalance] = React.useState(null);

  useEffect(() => {
    const { drizzle } = props;
    const mayorContract = drizzle.contracts.Mayor;
    const tokenContract = drizzle.contracts.SOUToken;

    const candidates = mayorContract.methods["get_candidates"].cacheCall();
    const escrow = mayorContract.methods["escrow"].cacheCall();
    const balance = tokenContract.methods["balanceOf"].cacheCall(
      props.drizzleState.accounts[0]
    );

    setCandidates(candidates);
    setEscrow(escrow);
    setBalance(balance);
  }, [props]);

  const handleChange = (event, newValue) => {
    setValue(newValue);
    setComputeEnvelope(false);
    setOpenEnvelope(false);
  };

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleComputeEnvelope = () => {
    setAnchorEl(null);
    setComputeEnvelope(true);
    setOpenEnvelope(false);
    setValue(false);
  };

  const handleOpenEnvelope = () => {
    setComputeEnvelope(false);
    setOpenEnvelope(true);
    setAnchorEl(null);
    setValue(false);
  };

  const showBalance = () => {
    const { SOUToken } = props.drizzleState.contracts;

    if (balance == null) {
      return null;
    }

    // using the saved `dataKey`, get the variable we're interested in
    const balanceValue = SOUToken.balanceOf[balance];

    return balanceValue && balanceValue.value / 10 ** 18;
  };

  return (
    <div className={classes.root}>
      <AppBar position="static">
        <Toolbar>
          <Grid container spacing={3}>
            <Grid item align="left">
              <IconButton onClick={handleClick} edge="start" color="inherit">
                <MenuIcon />
              </IconButton>

              <Menu
                anchorEl={anchorEl}
                keepMounted
                open={Boolean(anchorEl)}
                onClose={handleClose}
              >
                <MenuItem onClick={handleComputeEnvelope}>
                  Compute Envelope
                </MenuItem>
                <MenuItem onClick={handleOpenEnvelope}>Open Envelope</MenuItem>
              </Menu>
            </Grid>
            <Grid item xs align="center">
              <Typography variant="h4" color="inherit">
                Valadilène Voting System
              </Typography>
            </Grid>
            <Grid item align="right">
              <Typography
                variant="h5"
                color="inherit"
                style={{ marginTop: "5px" }}
              >
                {balance ? showBalance() : ""}
              </Typography>
            </Grid>
            <Grid item align="right">
              <Avatar src={soulPic} />
            </Grid>
          </Grid>
        </Toolbar>

        <Tabs
          value={value}
          onChange={handleChange}
          aria-label="simple tabs example"
        >
          <Tab label="Home" {...a11yProps(0)} />
          <Tab label="The candidates" {...a11yProps(1)} />
          <Tab label="See result" {...a11yProps(2)} />
        </Tabs>
      </AppBar>

      <TabPanel value={value} index={0}>
        <Typography className={classes.title} variant="body1" noWrap>
          Main description
        </Typography>
      </TabPanel>
      <TabPanel value={value} index={1}>
        <ReadCandidates
          drizzle={props.drizzle}
          drizzleState={props.drizzleState}
          candidates={candidates}
        />
      </TabPanel>
      <TabPanel value={value} index={2}>
        <ShowResult
          candidates={candidates}
          drizzle={props.drizzle}
          drizzleState={props.drizzleState}
          escrow={escrow}
        />
      </TabPanel>

      {computeEnvelope ? (
        <ComputeEnvelopeForm
          drizzle={props.drizzle}
          drizzleState={props.drizzleState}
        />
      ) : (
        <div></div>
      )}
      {openEnvelope ? (
        <OpenEnvelopeForm
          drizzle={props.drizzle}
          drizzleState={props.drizzleState}
        />
      ) : (
        <div></div>
      )}
    </div>
  );
}

export default SimpleTabs;
