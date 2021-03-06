import '../event.css';

import React from 'react';
import { RouteComponentProps, withRouter } from 'react-router-dom';
import Paper from '@material-ui/core/Paper';
import Grid from '@material-ui/core/Grid';
import Divider from '@material-ui/core/Divider';
import { connect } from 'react-redux';
import { getSession } from 'app/shared/reducers/authentication';
import { getEvent, getEventParticipations, getEventRewards } from '../event.reducer';
import { createStyles, withStyles } from '@material-ui/core/styles';
import ApplyList from '../../../components/card/apply-list';
import CompletionList from '../../../components/card/completion-list';
import Typography from '@material-ui/core/Typography';
import RewardList from '../../../components/card/reward-list';
import Button from '@material-ui/core/Button';
import Avatar from '@material-ui/core/Avatar';
import { convertDate } from 'app/shared/util/date-utils';
import queryString from 'query-string';
import { getUser } from 'app/pages/users/users.reducer';
import HomeStatus from 'app/components/card/home-status';
import axios from 'axios';
import { API_PREFIX, GROUP_ID, URL_USERS } from 'app/config/constants';

const styles = theme =>
    createStyles({
        root: {
            flexGrow: 1
        },
        paper: {
            padding: theme.spacing.unit * 2,
            textAlign: 'left',
            color: theme.palette.text.secondary
        },
        item: {
            marginTop: '20px'
        },
        'divider-margin': {
            margin: '10px',
            backgroundColor: 'transparent'
        },
        'history-back-btn': {
            'margin-top': '20px'
        }
    });

const mainContent = (classes, event, user) => (
    <React.Fragment>
        <Paper className={ classes.paper }>
            <Typography component="h2" variant="h2">
                { event.title }
            </Typography>
            <Grid>
                <Grid item className={ classes.item }>
                    <Avatar style={ { float: 'left' } }>H</Avatar>
                    <div style={ { float: 'left', paddingLeft: '10px' } }>
                        <Typography component="h6" variant="h6">
                            { user.name }
                        </Typography>
                        <Typography variant="subtitle1" color="textSecondary">
                            { convertDate(event.createdAt) }
                        </Typography>
                    </div>
                </Grid>
            </Grid>
            <div style={ { clear: 'both', paddingTop: '15px' } }>
                <Typography className={ classes.item } variant="h6" color="textSecondary">보상금</Typography>
                <Typography variant="h6">
                    { event.tokens }
                </Typography>
                <Typography className={ classes.item } variant="h6" color="textSecondary">참여신청기간</Typography>
                <Typography variant="h6">
                    { convertDate(event.startDate) } ~ { convertDate(event.finishDate) }
                </Typography>
                <Typography className={ classes.item } variant="h6" color="textSecondary">내용</Typography>
                <Typography variant="h6">
                    { event.description }
                </Typography>
            </div>
        </Paper>
    </React.Fragment>
);

const sidebarContent = (classes, user, eventId, event, rewards, participations, rewardedUsers, participantUsers, getRewards, getParticipant) => (
    <Paper className={ classes.paper }>
        <ApplyList eventId={ eventId } tokens={event.tokens} rewards={rewards} rewardedUsers={ rewardedUsers } participantUsers={participantUsers} refreshParticipants={getParticipant} refreshRewards={getRewards}/>
        <Divider variant="middle" className={ classes['divider-margin']}/>
        <CompletionList eventId={ eventId } rewardedUsers={ rewardedUsers }/>
    </Paper>
);

const gridContainer = (classes, leftXs, rightXs, event, rewards, user, eventId, participations, rewardedUsers, participantUsers, getRewards, getParticipant) => (
    <Grid container spacing={ 24 }>
        <Grid item xs={ leftXs }>
            { mainContent(classes, event, user) }
            <Divider variant="middle" className={ classes['divider-margin']}/>
            <RewardList rewardedUsers={ rewardedUsers }/>
        </Grid>
        <Grid item xs={ rightXs }>
            { sidebarContent(classes, user, eventId, event, rewards, participations, rewardedUsers, participantUsers, getRewards, getParticipant) }
        </Grid>
    </Grid>
);

export interface IEventDetailPageProp extends StateProps, DispatchProps, RouteComponentProps {
    classes: any;
    match: any;
}

export interface IEventDetailState {
    rewardedUsers: any;
    participantUsers: any;
}

export class EventDetailPage extends React.Component<IEventDetailPageProp, IEventDetailState> {
    constructor(props) {
        super(props);
        this.state = {
            rewardedUsers: null,
            participantUsers: null
        };
    }

    componentDidMount() {
        const { rewards } = this.props;
        // const eventId = queryString.parse(this.props.location.search).id;
        // this.props.getEvent(GROUP_ID, eventId);
        // TODO 유저정보 조회시 status, role 파라미터가 필수로 되어있음. 이벤트 상세정보에서 어떠한 사용자가 생성한 정보인지 조회시에는 불필요한정보임. 임시로 고정처리
        // this.props.getUser(GROUP_ID, this.props.event.createdBy);
        this.getData();
    }

    getData() {
        const eventId = queryString.parse(this.props.location.search).id;
        this.props.getEventParticipations(GROUP_ID, eventId);
        this.props.getEventRewards(GROUP_ID, eventId);
    }

    searchUserInfo = async id => {
        const url = `${API_PREFIX}/${GROUP_ID}${URL_USERS}/${id}`;
        const res = await axios.get(url);
        return res;
    }

    moveToList = () => {
        this.props.history.push('/event');
    };

    getSnapshotBeforeUpdate(nextProps, nextState) {
        const { nextRewards, nextParticipations } = nextProps;
        const rewards = this.props.rewards;
        const participations = this.props.participations;

        if (!this.state.rewardedUsers && JSON.stringify(rewards) !== JSON.stringify(nextRewards) && rewards && rewards.docs && rewards.docs.length > 0) {
            this.fetchRewardedUserInfo(rewards.docs);
        }

        if (!this.state.participantUsers && JSON.stringify(participations) !== JSON.stringify(nextParticipations) && participations && participations.docs && participations.docs.length > 0) {
            this.fetchParticipationsUserInfo(participations.docs);
        }

        return null;
    }

    componentDidUpdate() {

    }

    fetchRewardedUserInfo = async rewards => {

        const getUsersPromises = [];
        const rewardedUsers = [];

        rewards.forEach(ele => {
            getUsersPromises.push(this.searchUserInfo(ele.rewardedUser));
            rewardedUsers.push({
                _id: ele._id,
                rewardedUser: ele.rewardedUser,
                createdAt: ele.createdAt,
                rewardToken: ele.tokens
            });
        });

        const rewardedUsersInfo = await axios.all(getUsersPromises);

        rewardedUsersInfo.forEach(ele => {
            rewardedUsers.forEach((rewardedUser, i) => {
                if (rewardedUser.rewardedUser === ele.data._id) {
                    rewardedUsers[i] = {
                        ...rewardedUser,
                        email: ele.data.email,
                        name: ele.data.name
                    };
                }
            });
        });

        this.setState({
            rewardedUsers
        });
    }

    fetchParticipationsUserInfo = async participations => {

        const getUsersPromises = [];
        const participantUsers = [];

        participations.forEach(ele => {
            getUsersPromises.push(this.searchUserInfo(ele.participant));
            participantUsers.push({
                _id: ele._id,
                participantUser: ele.participant,
                createdAt: ele.createdAt
            });
        });

        const participantedUsersInfo = await axios.all(getUsersPromises);

        participantedUsersInfo.forEach(ele => {
            participantUsers.forEach((participantUser, i) => {
                if (participantUser.participantUser === ele.data._id) {
                    participantUsers[i] = {
                        ...participantUser,
                        email: ele.data.email,
                        name: ele.data.name
                    };
                }
            });
        });

        this.setState({
            participantUsers
        });
    }

    render() {
        const { account, user, classes, event, rewards, participations } = this.props;
        const { rewardedUsers, participantUsers } = this.state;
        const eventId = queryString.parse(this.props.location.search).id;

        // console.log(classes['history-back-btn']);
        return (
            <div>
                { gridContainer(classes, 9, 3, event, rewards, user, queryString.parse(this.props.location.search).id, participations, rewardedUsers, participantUsers, this.props.getEventRewards.bind(null, GROUP_ID, eventId), this.props.getEventParticipations.bind(null, GROUP_ID, eventId)) }
                <Button variant="outlined" className={ classes.button + ' ' + classes['history-back-btn']} onClick={ this.moveToList }>
                    &lt; 목록으로 돌아가기
                </Button>
            </div>
        );
    }
}

const mapStateToProps = storeState => ({
        account: storeState.authentication.account,
        isAuthenticated: storeState.authentication.isAuthenticated,
        participations: storeState.event.participations,
        event: storeState.event.event,
        rewards: storeState.event.rewards,
        user: storeState.users.user
});

const mapDispatchToProps = { getSession, getEvent, getEventParticipations, getEventRewards, getUser };

type StateProps = ReturnType<typeof mapStateToProps>;
type DispatchProps = typeof mapDispatchToProps;

// @ts-ignore
export default withRouter(connect(mapStateToProps, mapDispatchToProps)(withStyles(styles)(EventDetailPage)));
