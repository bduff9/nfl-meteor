const mountNode = document.getElementById('appContainer'),
    Modal = ReactBootstrap.Modal,
    Button = ReactBootstrap.Button;

const SurvivorPool = React.createClass({

  //propTypes: {},
  //mixins: [],

  getInitialState: function() {
    return {
      teams:this.props.teams,
      weeks:this.props.weeks,
      makePick:0,
      data:[],
      user:this.props.user
    }
  },
  //getDefaultProps: function() {},

  //componentWillMount : function() {},
  //componentWillReceiveProps: function() {},
  //componentWillUnmount : function() {},

  // Custom functions
  _getWeekUsed: function(team) {
    return this.state.weeks.filter(function(week) {
      return week.PICK === team;
    });
  },
  _isTeamUsed: function(team) {
    var weekObj = this._getWeekUsed(team);
    if (weekObj.length) return ' used';
    return '';
  },
  _getButton: function(week) {
    if (week.PICK_o) {
      return ' btn-success';
    } else if (week.CALCULA002 === 'false') {
      return ' btn-primary';
    } else {
      return ' btn-danger';
    }
  },
  _getOtherTeam: function(week) {
    if (week.PICK === week.HTEAM) return week.VTEAM;
    return week.HTEAM;
  },
  _getColors: function(pickedTeam) {
    var styling = { borderColor:'', backgroundColor:'' },
        teamObj = this.state.teams.filter(function(team, i) {
          return team.SHORT === pickedTeam;
        })[0];
    styling.borderColor = teamObj.COLOR2;
    styling.backgroundColor = teamObj.COLOR;
    return styling;
  },
  _hasLost: function(week) {
    var weekLost = this.state.weeks.filter(function(aWeek, i) {
      return aWeek.CALCULA003.indexOf('danger') > -1;
    })[0];
    if (weekLost && week.WEEK > weekLost.WEEK) {
      return ' invisible';
    }
    return '';
  },
  _open: function(week) {
    var url = '/mrcjava/rest/NFL/I00075s/get?mrcuser=' + this.props.user + '&mrcpswd=Y&slnk=1&WEEK=' + week + '&x=' + Math.random();
    jQuery.getJSON(url, function(data) {
      this.setState({ makePick:data[0].WEEK, data:data });
    }.bind(this));
  },
  _close: function(update) {
    if (update) {
      jQuery.getJSON(this.props.weekUrl, function(weeks) {
        this.setState({ weeks:weeks, makePick:0, data:[] });
      }.bind(this));
    } else {
      this.setState({ makePick:0, data:[] });
    }
  },

  render: function() {
    var that = this;
    return (
      <div className="container-fluid main-app">
        <div className="row">
          <div className="col-xs-12">
            <h1 className="text-center">Survivor Pool</h1>
          </div>
        </div>
        <div className="row">
          <div className="col-md-2 sideBar">
            {this.state.teams.map(function(team, i) {
              return (
                <div className="col-md-3 col-xs-2" key={'team' + i}>
                  <div className="survivor-logo">
                    <div className={'center-block logo ' + team.SHORT.toLowerCase() + that._isTeamUsed(team.SHORT)}></div>
                    {that._isTeamUsed(team.SHORT) ? <span className="badge">{that._getWeekUsed(team.SHORT)[0].WEEK}</span> : ''}
                  </div>
                </div>
              );
            })}
          </div>
          <div className="col-md-9 col-xs-12 main">
            <table className="games">
              <tr>
                {this.state.weeks.map(function(week, i){
                  return (
                    <td key={'week' + i}>
                      <div className={'h3 text-center ' + week.CALCULA003}>
                        {week.CALCULA003.indexOf('danger') > -1 ? <i className="fa fa-lg fa-times"></i> : '' }
                        {week.CALCULA003.indexOf('success') > -1 ? <i className="fa fa-lg fa-check"></i> : '' }
                        <u>Week {week.WEEK}</u>
                      </div>
                      <div className={(week.PICK_o ? 'picked' : 'to-pick') + (week.CALCULA001 === 'true' ? ' over' : '') + that._hasLost(week)}>
                        <button type="button" className={'center-block btn' + that._getButton(week)} onClick={that._open.bind(that, week.WEEK)}>
                          <i className="fa fa-large fa-pencil-square-o"></i>
                          &nbsp; Pick Team
                        </button>
                        {week.PICK_o ? (<div>
                          <div className="picked-team center-block" style={that._getColors(week.PICK)}>
                            <div className={'center-block logo ' + week.PICK.toLowerCase()}></div>
                          </div>
                          <div className="center-block text-center">-over-</div>
                          <div className="not-picked-team center-block">
                            <div className={'center-block logo ' + that._getOtherTeam(week).toLowerCase()}></div>
                          </div>
                        </div>) : ''}
                      </div>
                    </td>
                  )
                })}
              </tr>
            </table>
          </div>
        </div>
        <WeekModal {...this.state} _close={this._close} _getWeekUsed={this._getWeekUsed} />
      </div>
    );
  }

});

const WeekModal = React.createClass({
  // Define class props and mixins
  //mixins: [],
  //propTypes: {},
  //getDefaultProps: function() {},

  // Mounting events
  //getInitialState: function() {},
  //componentWillMount: function() {},
  //componentDidMount: function() {},

  // Updating events
  componentWillReceiveProps: function(nextProps) {
    var week = nextProps.weeks.filter(function(aWeek, i) {
      return aWeek.WEEK === nextProps.makePick;
    }.bind(this))[0];
    this.setState({ week:week });
  },
  //shouldComponentUpdate: function(nextProps, nextState) {},
  //componentWillUpdate: function(nextProps, nextState) {},
  //componentDidUpdate: function(prevProps, prevState) {},

  // Unmounting events
  //componentWillUnmount : function() {},

  // Custom functions
  _makePick: function(gameid, pick) {
    var url = '/mrcjava/rest/NFL/M00025s/put',
        obj = { mrcuser:this.props.user, mrcpswd:'Y', slnk:1, USERID:this.props.user, WEEK:this.props.makePick, GAMEID:gameid, PICK:pick };
    jQuery.getJSON(url, obj, function(result) {
      this.props._close(true);
    }.bind(this));
  },

  render: function() {
    return (
      <Modal show={this.props.makePick > 0} onHide={this.props._close}>
        <Modal.Header closeButton>
          <Modal.Title>Week {this.props.makePick}</Modal.Title>
        </Modal.Header>
        <Modal.Body className="popup">
          <div id="mrcMainContent" style={{ width:'65%', padding:'0' }}>
            {this.props.data.map(function(game, i) {
             return (
               <div className="survivor-matchups pull-left" key={'game' + i}>
                 <Button bsStyle={this.state.week.PICK === game.VTEAM ? 'success' : 'default'} title={game.VTEAM} onClick={this._makePick.bind(this, game.GAMEID, game.VTEAM)} disabled={this.props._getWeekUsed(game.VTEAM).length > 0}>
                   <div className={'logo ' + game.VTEAM.toLowerCase()}></div>
                 </Button>
                 <i className="fa fa-lg fa-at"></i>
                 <Button bsStyle={this.state.week.PICK === game.HTEAM ? 'success' : 'default'} title={game.HTEAM} onClick={this._makePick.bind(this, game.GAMEID, game.HTEAM)} disabled={this.props._getWeekUsed(game.HTEAM).length > 0}>
                   <div className={'logo ' + game.HTEAM.toLowerCase()}></div>
                 </Button>
               </div>
            )}.bind(this))}
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button onClick={this.props._close}><i className="fa fa-lg fa-times"></i> Close</Button>
        </Modal.Footer>
      </Modal>
    );
  }

});

var user = jQuery('#user').val(),
    teamUrl = '/mrcjava/rest/NFL/I00100s/get?mrcuser=' + user + '&mrcpswd=Y&rls_SHORT=NS&val_SHORT=BON TIE&x=' + Math.random(),
    weekUrl = '/mrcjava/rest/NFL/I00160s/get?mrcuser=' + user + '&mrcpswd=Y&slnk=1&USERID=' + user + '&x=' + Math.random();
jQuery.when( jQuery.getJSON(teamUrl), jQuery.getJSON(weekUrl) ).done(function(teamResp, weekResp) {
  React.render(<SurvivorPool teams={teamResp[0]} weeks={weekResp[0]} user={user} weekUrl={weekUrl} />, mountNode);
});