import {
  Typography,
  List,
  ListItem,
  ListItemAvatar,
  Avatar,
  ListItemText,
  Box,
} from "@material-ui/core";
import indigo from "@material-ui/core/colors/indigo";
import FiberNewOutlinedIcon from "@material-ui/icons/FiberNewOutlined";
import React from "react";

class Home extends React.Component {
  render() {
    return (
      <div>
        <Typography
          variant="h4"
          color="textPrimary"
          component="h4"
          align="center"
        >
          Welcome to the voting system portal!
        </Typography>

        <div style={{ marginTop: "50px" }}>
          <Typography
            variant="body1"
            color="textPrimary"
            component="p"
            align="center"
          >
            The election of Valadilene occurs every 50 years, but this time
            there are two new variations!
          </Typography>
          <Box display="flex" justifyContent="center">
            <List>
              <ListItem>
                <ListItemAvatar>
                  <Avatar style={{ backgroundColor: indigo[500] }}>
                    <FiberNewOutlinedIcon fontSize="large"></FiberNewOutlinedIcon>
                  </Avatar>
                </ListItemAvatar>
                <ListItemText
                  primary={
                    <Typography
                      variant="body1"
                      color="textPrimary"
                      component="p"
                    >
                      Now, there will be more than one candidate that can be
                      chosen. If there is a tie, all the souls go to the escrow
                      account. If there is a winner, the losing voters will
                      receive a refund.
                    </Typography>
                  }
                />
              </ListItem>
              <ListItem>
                <ListItemAvatar>
                  <Avatar style={{ backgroundColor: indigo[500] }}>
                    <FiberNewOutlinedIcon fontSize="large"></FiberNewOutlinedIcon>
                  </Avatar>
                </ListItemAvatar>
                <ListItemText
                  primary={
                    <Typography
                      variant="body1"
                      color="textPrimary"
                      component="p"
                    >
                      The election plan committee formed by Angela, Pamela, and
                      Phyllis decided to create a new ERC20 token that will
                      replace ETH for souls exchange: the SOU token.
                    </Typography>
                  }
                />
              </ListItem>
            </List>
          </Box>
        </div>

        <div style={{ marginTop: "25px" }}>
          <Typography
            variant="body1"
            color="textPrimary"
            component="p"
            align="center"
          >
            In the next tabs, you can see who are the candidates for this
            election. 
          </Typography>
          <Typography
            variant="body1"
            color="textPrimary"
            component="p"
            align="center"
          >
          If you want to vote for a particular candidate, switch to
            the cast envelope tab, after casting an envelope you'll receive
            <b> 100 SOU</b>.
            </Typography>
          <Typography
            variant="body1"
            color="textPrimary"
            component="p"
            align="center"
          >
            Remember that only when the quorum is reached you can open the
            envelope!
          </Typography>
        </div>
        <div style={{ marginTop: "25px" }}>
          <Typography
            variant="body1"
            color="textPrimary"
            component="p"
            align="center"
          >
            When all the envelopes are opened, wait for the escrow account to
            declare the result. Then you can also see how many votes your
            favourite candidate received!
          </Typography>
        </div>
      </div>
    );
  }
}

export default Home;
