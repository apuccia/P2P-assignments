import React from 'react';
import { makeStyles } from '@material-ui/core/styles';
import Card from '@material-ui/core/Card';
import CardContent from '@material-ui/core/CardContent';
import CardHeader from '@material-ui/core/CardHeader';
import CardMedia from '@material-ui/core/CardMedia';
import Typography from '@material-ui/core/Typography';

const useStyles = makeStyles({
    root: {
        maxWidth: 370,
    },

    media: {
        height: 500,
    },
});

export default function Candidate(props) {
    const classes = useStyles();
    console.log(props.imgloc);
    return (
        <Card className={classes.root}>
            <CardHeader
                title="Name of the candidate"
            />
            <CardMedia
                className={classes.media}
                image={props.imgloc}
                title={props.name}
            />
            <CardContent>
                <Typography variant="h7" color="textPrimary" component="p">
                    {props.slogan}
                </Typography>
                <Typography variant="body2" color="textSecondary" component="p">
                    {props.address}
                </Typography>
            </CardContent>
        </Card>
    );
}