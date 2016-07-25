var sync = jQuery('#sync').val() === 'Y',
    user = jQuery('#user').val(),
    data;

const mountNode = document.getElementById('appContainer');

const ScoreBoard = React.createClass({displayName: "ScoreBoard",

  //propTypes: {},
  //mixins: [],

  getInitialState: function() {
    var weeks = this._getWeeks(this.props.data);
    return {
      data:this.props.data,
      weeks:weeks,
      currentWeek:parseInt(weeks[0], 10),
      hasPrev:this._hasPrev(weeks, weeks[0]),
      hasNext:this._hasNext(weeks, weeks[0]),
      sync:this.props.sync,
      user:this.props.user
    };
  },
  //getDefaultProps: function() {},

  componentWillMount: function() {
    if (this.state.sync) setInterval(this._refreshData, 120000);
  },
  componentDidMount: function() {
    if (this.state.sync) this._updateData();
  },
  //componentWillReceiveProps: function(nextProps) {},
  //componentWillUnmount : function() {},

  // Custom functions
  _getWeeks: function(data) {
    var allWeeks = data.map(function(obj, i) {
      return parseInt(obj.WEEK, 10);
    });
    return this._getUnique(allWeeks);
  },
  _getUnique: function(arr) {
    var unique = [];
    for (var i = 0, iLen = arr.length; i < iLen; i++) {
      if (unique.indexOf(arr[i]) === -1) unique.push(arr[i]);
    }
    return unique;
  },
  _hasPrev: function(weeks, currWeek) {
    var prevWeek = currWeek - 1;
    return weeks.indexOf(prevWeek) > -1;
  },
  _hasNext: function(weeks, currWeek) {
    var nextWeek = currWeek + 1;
    return weeks.indexOf(nextWeek) > -1;
  },
  _jumpToWeek: function(dir) {
    var newWeek = this.state.currentWeek + dir,
        weeks = this.state.weeks;
    this.setState({ currentWeek:newWeek, hasPrev:this._hasPrev(weeks, newWeek), hasNext:this._hasNext(weeks, newWeek) });
    document.getElementById('WEEK' + newWeek).scrollIntoView();
  },
  _jumpToWeekBefore: function() {
    this._jumpToWeek(-1);
  },
  _jumpToWeekAhead: function() {
    this._jumpToWeek(1);
  },
  _refreshData: function() {
    var url = '/mrcjava/rest/NFL/I00065s/get' + (location.search ? location.search + '&' : '?') + 'mrcuser={user}&mrcpswd=Y&x=' + Math.random();
    jQuery.ajax({
      url:url,
      success:this._updateData,
      dataType:'json'
    });
  },
  _updateData: function(data) {
    var url = 'NFL.M00140s?action_mode=add&one_step=1';
    if (data) this.setState({ data:data });
    jQuery.ajax({ url:url });
  },

  render: function() {
    var nextArrow, prevArrow;
    if (this.state.hasPrev) prevArrow = React.createElement("i", {className: "fa fa-large fa-caret-left", onClick: this._jumpToWeekBefore})
    if (this.state.hasNext) nextArrow = React.createElement("i", {className: "fa fa-large fa-caret-right", onClick: this._jumpToWeekAhead})
    return (
      React.createElement("div", {className: "scoreBoard"}, 
        React.createElement("h3", {className: "center-block text-center"}, "NFL Scoreboard"), 
        React.createElement("div", {className: "innerScoreboard"}, 
          React.createElement("div", {className: "text-center weekDisp"}, 
            prevArrow, 
            "  ", this.state.weeks.length == 0 ? 'No games to display' : "Week " + this.state.currentWeek, "  ", 
            nextArrow
          ), 
          React.createElement(Scores, React.__spread({},  this.state))
        )
      )
    );
  }

});

const Scores = React.createClass({displayName: "Scores",

  //propTypes: {},
  //mixins: [],

  //getInitialState: function() {},
  //getDefaultProps: function() {},

  //componentWillMount : function() {},
  //componentWillReceiveProps: function() {},
  //componentWillUnmount : function() {},

  // Custom functions
  //_myFunc: function() {},

  render: function() {
    var data = this.props.data,
        rows = [],
        currDay = '',
        statusDisp;
    for (var i = 0, iLen = data.length; i < iLen; i++) {
      if (data[i].CALCULA001 !== currDay) {
        currDay = data[i].CALCULA001;
        rows.push(
          React.createElement("tr", {className: "text-center", key: "head" + i, id: "WEEK" + data[i].WEEK}, 
            React.createElement("td", {colSpan: "3"}, React.createElement("u", null, currDay))
          )
        );
      }
      switch(data[i].STATUS) {
        case 'P':
          statusDisp = data[i].CALCULA002;
          break;
        case '1':
          statusDisp = 'Q1, ' + data[i].CALCULA003;
          break;
        case '2':
          statusDisp = 'Q2, ' + data[i].CALCULA003;
          break;
        case 'H':
          statusDisp = 'Half';
          break;
        case '3':
          statusDisp = 'Q3, ' + data[i].CALCULA003;
          break;
        case '4':
          statusDisp = 'Q4, ' + data[i].CALCULA003;
          break;
        case 'C':
          statusDisp = 'F';
          break;
      }
      rows.push(
        React.createElement("tr", {key: "v" + i, className: data[i].REDZONE === "V" ? "bg-danger" : ""}, 
        React.createElement("td", null, data[i].VTEAM, " ", data[i].HASPOSS === "V" ? React.createElement("i", {className: "fa fa-large fa-lemon-o"}) : ""), 
          React.createElement("td", null, data[i].STATUS === 'P' ? '' : data[i].VSCORE), 
          React.createElement("td", null)
        )
      );
      rows.push(
        React.createElement("tr", {key: "h" + i, className: data[i].REDZONE === "H" ? "bg-danger" : ""}, 
          React.createElement("td", null, data[i].HTEAM, " ", data[i].HASPOSS === "H" ? React.createElement("i", {className: "fa fa-large fa-lemon-o"}) : ""), 
          React.createElement("td", null, data[i].STATUS === 'P' ? '' : data[i].HSCORE), 
          React.createElement("td", null, statusDisp)
        )
      );
      rows.push(
        React.createElement("tr", {className: "divider", key: "d" + i}, 
          React.createElement("td", {colSpan: "3"})
        )
      );
    }
    return (
      React.createElement("div", {className: "scores"}, 
        React.createElement("table", {className: "table table-condensed table-bordered"}, 
          rows
        )
      )
    );
  }

});

var url = '/mrcjava/rest/NFL/I00065s/get' + (location.search ? location.search + '&' : '?') + 'mrcuser=' + user +'&mrcpswd=Y&x=' + Math.random();
jQuery.ajax({
  url:url,
  success:function(data) {
    React.render(React.createElement(ScoreBoard, {data: data, sync: sync, user: user}), mountNode);
  },
  dataType:'json'
});