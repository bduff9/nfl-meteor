/* Functions */
/* Global */

function setCookie(cookie, value, exp, path) {
  var cValue = cookie + '=' + value;
  if (exp) {
    cValue = cValue + '; expires=' + exp.toUTCString();
  }
  if (path) {
    cValue = cValue + '; path=' + path;
  }
  document.cookie = cValue;
}

function checkCookie(cName, defaultVal){
  var ARRcookies = document.cookie.split(';'), i, x, y, cVal;
  for (i = ARRcookies.length; i--;) {
    x = ARRcookies[i].substr(0, ARRcookies[i].indexOf('='));
    y = ARRcookies[i].substr(ARRcookies[i].indexOf('=') + 1);
    x = x.replace(/^\s+|\s+$/g, '');
    if (x === cName) {
      cVal = unescape(y);
    }
  }
  if (cVal) {
    return cVal;
  }
  return defaultVal;
}

function printYear() {
  var d = new Date(),
      $year = jQuery('#currentYear'),
      year;
  d.setMonth(d.getMonth() - 7);
  year = d.getFullYear();
  if ($year.length) {
    $year.text(year);
  } else {
    document.write(year);
  }
}

function getTimestamp() {
  var now = new Date(),
      date = [now.getFullYear(), now.getMonth() + 1, now.getDate()],
      time = [now.getHours(), now.getMinutes(), now.getSeconds()];
  for (var i = 0, j = time.length; i < j; i++) {
    if (time[i] < 10) {
      time[i] = '0' + time[i];
    }
    if (date[i] < 10) {
      date[i] = '0' + date[i];
    }
  }
  return date.join('-') + ' ' + time.join(':');
}

function setChatState() {
  var state = getChatState(),
      user = jQuery('#myUserId').val(),
      url = 'NFL.M00015s?action_mode=update&one_step=1&USERID=' + user,
      url2 = 'NFL.I00015s?redirect=NFL.I00015s',
      timestamp;
  if (!state) {
    timestamp = '';
  } else {
    timestamp = getTimestamp();
  }
  jQuery.ajax({ url:url + '&CHATHIDDEN=' + timestamp }).done(function(html) {
    jQuery('#myChatState').val(timestamp);
    jQuery.ajax({ url:url2 });
  });
}

function getChatState() {
  var state = jQuery('#myChatState').val();
  try {
    return (state.length === 0);
  } catch(e) {
    return false;
  }
}

function setSlideState(slider) {
  var state = checkCookie(slider, '0');
  state = parseInt(state, 10) * -1 + 1;
  setCookie(slider, state, null, '/');
}

function getSlideState(slider) {
  var state = checkCookie(slider, '0');
  return (state == 1);
}

function setWeek(week, redirect) {
  var url = 'NFL.I00035s?save_session=1&WEEK=' + week,
      currApp = 'NFL' + window.location.href.split('/NFL')[1];
  if (redirect) {
    window.location.href = url + '&redirect=' + currApp;
  } else {
    jQuery.ajax({ url:url });
  }
}

function postComment() {
  var message = jQuery.trim(jQuery('#message_post').val()),
    url = 'NFL.M00070s?action_mode=add&USERID=${visitor.user?upper_case}&ACTION=COMMENT&MESSAGE=';
  message = encodeURIComponent(message);
  if (message.length > 250) {
    alert('Message can not be longer than 250 characters');
  } else {
    url = url + message;
    jQuery.get(url, function() {
      reloadMessageBoard();
    });
  }
}

function reloadMessageBoard() {
  var url = 'NFL.Menus?impTags=1';
  jQuery.get(url, function(data) {
    jQuery('#message_board').html(data);
  });
}

/* mrcSignon2 - Login */

/* Mobile Menu */
function viewPicks(btn, val) {
  jQuery(btn).parent('td').load('NFL.R00050s?run=1&S_USERID=1&sort_typ=1&cur_sort_col=CALCULA002&top10=150&data=1&R001=' + val);
  return false;
}

/* I00020s - Picks */

// Init Picks
function initPicks() {
  // Get status of week's picks
  var started = jQuery('#COMPLETE').val(),
      max = jQuery('ul#bank li.points').length,
      totalGames = jQuery('ul#bank li.points').length,
      missedGames = jQuery('tr.DISABLED').length,
      pointTotals = [];
  // Set colors of point divs
  jQuery('li.points').each(function(){
    if (jQuery.trim(jQuery(this).text()) === '') {
      jQuery(this).remove();
    } else {
      ptval = parseInt(jQuery(this).text());
      perc = ptval / max;
      red = parseInt((1 - perc) * 510);
      green = parseInt(510 * perc);
      blue = 0;
      if (green > 255) { green = 255; }
      if (red > 255) { red = 255; }
      jQuery(this).css('background-color', 'rgb(' + red + ',' + green + ',' + blue + ')');
    }
  });
  // Remove points for any missed games
  while (missedGames > 0) {
    pointTotals.push('' + totalGames);
    totalGames--;
    missedGames--;
  }
  jQuery('ul#bank li.points').each(function() {
    if (pointTotals.indexOf(jQuery(this).text()) > -1) {
      jQuery(this).addClass('invisible');
    }
  });
  // Initialize selections
  jQuery('.collapse li.points').each(function() {
    var currpts = jQuery(this).text();
    jQuery(this).parent('ul').removeClass('sorted');
    jQuery(this).parents('tr.game').addClass('completed');
    jQuery('#bank li.points').each(function() {
      if (currpts === jQuery(this).text()) {
        jQuery(this).addClass('invisible');
      }
    });
  });
  jQuery('#bank').data('saved', jQuery('#bank').html());
  if (jQuery('#COMPLETE').val() === 'Y' || jQuery('input[name="CALCULA004"]').val() === 'OVER' || jQuery('tr.game').length == jQuery('tr.DISABLED').length) {
    jQuery('input[type="reset"]').hide();
    jQuery('input[type="submit"]').hide();
    jQuery('#SCORE').prop('disabled', true);
    jQuery('.sorter').sortable("destroy");
  }
  jQuery('tr.DISABLED').each(function() {
    jQuery(this).find('ul').addClass('DISABLED').find('li').addClass('DISABLED');
  });
}

// Reset picks to blank
function resetpicks() {
  var url = 'NFL.M00050s?action_mode=update&one_step=1',
      url2 = 'NFL.M00050s?action_mode=add&one_step=1',
      url3 = 'NFL.M00030s?action_mode=update&one_step=1&COMPLETE=N',
      url4 = 'NFL.M00030s?action_mode=update',
      user = jQuery('#currentUser').val(),
      week = jQuery('#currentWeek').val(),
      message = 'Are you sure you want to reset this entire page?  This cannot be undone!',
      team1 = jQuery('.lastgame1').text(),
      team2 = jQuery('.lastgame2').text(),
      totalGames, missedGames, pointTotals;
  if (confirm(message)) {
    jQuery('tr.game').each(function() {
      var points = 0,
          pick = '',
          id = jQuery(this).data('id');
      jQuery.ajax({ url:url + '&GAMEID=' + id + '&USERID=' + user + '&PICK=' + pick + '&POINTS=' + points }).success(function(html) {
        if (jQuery.trim(jQuery('.errortext1', html).text()) !== '') {
          jQuery.ajax({ url:url2 + '&GAMEID=' + id + '&USERID=' + user + '&PICK=' + pick + '&POINTS=' + points });
        }
      });
    });
    jQuery('#bank').html(jQuery('#bank').data('saved'));
    jQuery('.game li').remove();
    jQuery('.game ul').addClass('sorted');
    jQuery('#bank li').removeClass('invisible');
    jQuery('tr.game').removeClass('completed');
    jQuery('#SCORE').val(0);
    jQuery.ajax({ url:url3 + '&WEEK=' + week + '&USERID=' + user }).success(function(html) {
      jQuery('#enterTiebreaker').load(url4 + '&WEEK=' + week + '&USERID=' + user + '&CALCULA001=' + team1 + '&CALCULA002=' + team2 + '&impTags=1');
    });
    // Remove points for any missed games
    totalGames = jQuery('ul#bank li.points').length;
    missedGames = jQuery('tr.DISABLED').length;
    pointTotals = [];
    while (missedGames > 0) {
      pointTotals.push('' + totalGames);
      totalGames--;
      missedGames--;
    }
    jQuery('ul#bank li.points').each(function() {
      if (pointTotals.indexOf(jQuery(this).text()) > -1) {
        jQuery(this).addClass('invisible');
      }
    });
    return false;
  } else {
    return false;
  }
}

// Save but don't submit picks
function savepicks() {
  var message = 'Your picks have not been submitted yet.  If you click OK, your progress thus far will be saved and you will need to submit your picks later.  Save current progress and exit to the menu?',
      user = jQuery('#currentUser').val(),
      url = 'NFL.M00050s?action_mode=URD&one_step=1',
      url2 = 'NFL.M00050s?action_mode=AUR&one_step=1';
  if (confirm(message)) {
    jQuery('tr.game').each(function() {
      var pick = jQuery(this).find('ul').has('li').data('team'),
          points = jQuery(this).find('li').text(),
          id = jQuery(this).find('ul').has('li').data('id');
      if (id !== undefined) {
        jQuery.ajax({ url:url + '&GAMEID=' + id + '&USERID=' + user + '&PICK=' + pick + '&POINTS=' + points }).success(function(html) {
          if (jQuery.trim(jQuery('.errortext1', html).text()) !== '') {
            jQuery.ajax({ url:url2 + '&GAMEID=' + id + '&USERID=' + user + '&PICK=' + pick + '&POINTS=' + points });
          }
        });
      }
    });
    jQuery('#COMPLETE').val('I');
    jQuery('input[name=all_redir]').val('NFL.Menus');
    return true;
  } else {
    return false;
  }
}

// Submit picks for week
function submitpicks() {
  var err1 = 'You have not finished picking your games yet!',
      err2 = 'Please put in a valid score for the tie breaker!',
      message = 'Are you sure you want to submit this week\'s picks?  You cannot change them once they have been submitted.',
      user = jQuery('#currentUser').val(),
      week = jQuery('#currentWeek').val(),
      url = 'NFL.M00050s?action_mode=URD&one_step=1',
      url2 = 'NFL.M00050s?action_mode=AUR&one_step=1',
      url3 = 'NFL.M00070s?action_mode=AUR&one_step=1';
  if (jQuery('#bank li').not('.invisible').length > 0) {
    alert(err1);
    return false;
  } else if (jQuery('#SCORE').val() < 1) {
    alert(err2);
    return false;
  } else if (confirm(message)) {
    jQuery('tr.game').each(function() {
      var pick = jQuery(this).find('ul').has('li').data('team'),
          points = jQuery(this).find('li').text(),
          id = jQuery(this).find('ul').has('li').data('id');
      if (id !== undefined) {
        jQuery.ajax({ url:url + '&GAMEID=' + id + '&USERID=' + user + '&PICK=' + pick + '&POINTS=' + points }).success(function(html) {
          if (jQuery.trim(jQuery('.errortext1', html).text()) !== '') {
            jQuery.ajax({ url:url2 + '&GAMEID=' + id + '&USERID=' + user + '&PICK=' + pick + '&POINTS=' + points });
          }
        });
      }
    });
    jQuery('#COMPLETE').val('Y');
    jQuery('input[name=all_redir]').val('NFL.R00040s?run=2');
    jQuery.ajax({ url:url3 + '&USERID=' + user + '&ACTION=SETPICKS&MESSAGE=Submitted picks for week ' + week, async:false });
    return true;
  } else {
    return false;
  }
}

/* R00150s - What-if Analysis */

// Rank players based on picks
function rankPlayers(a, b) {
  var a_points = parseInt(jQuery(a).find('td.myPoints').text(), 10),
      b_points = parseInt(jQuery(b).find('td.myPoints').text(), 10),
      a_correct = parseInt(jQuery(a).find('td.myCorrect').text(), 10),
      b_correct = parseInt(jQuery(b).find('td.myCorrect').text(), 10),
      a_tiebreaker = parseInt(jQuery(a).find('td.actualScore').text(), 10) - parseInt(jQuery(a).find('td.myGuess').text(), 10),
      b_tiebreaker = parseInt(jQuery(b).find('td.actualScore').text(), 10) - parseInt(jQuery(b).find('td.myGuess').text(), 10);
  if (a_points > b_points) {
    return -1;
  } else if (a_points < b_points) {
    return 1;
  } else if (a_correct > b_correct) {
    return -1;
  } else if (a_correct < b_correct) {
    return 1;
  } else if (a_tiebreaker < 0 && b_tiebreaker >= 0) {
    return 1;
  } else if (a_tiebreaker >= 0 && b_tiebreaker < 0) {
    return -1;
  } else if (Math.abs(a_tiebreaker) < Math.abs(b_tiebreaker)) {
    return -1;
  } else if (Math.abs(a_tiebreaker) > Math.abs(b_tiebreaker)) {
    return 1;
  } else {
    return 0;
  }
}

/* Events */
jQuery(function() {

/* Global */

  // Set up tabs when no mpowerapps.js
  if (jQuery().tabs) {
    jQuery('div[mrctype=tabs]').tabs();
  }
  
  // Set cookie on sliders
  jQuery('.newsHandle').click(function() {
    setSlideState('News');
  });
  jQuery('.chatHandle').click(function() {
    setChatState();//setSlideState('Chat');
  });
  
  // NFL News
  jQuery('.slideLeft').tabSlideOut({
    tabHandle: '.newsHandle',                     //class of the element that will become your tab
    tabLocation: 'right',                      //side of screen where tab lives, top, right, bottom, or left
    speed: 300,                               //speed of animation
    action: 'click',                          //options: 'click' or 'hover', action to trigger animation
    topPos: '150px',                          //position from the top/ use if tabLocation is left or right
    fixedPosition: true,                      //options: true makes it stick(fixed position) on scroll
    onLoadSlideOut: getSlideState('News')
  });

  // Footer
  jQuery('.chat').tabSlideOut({
    tabHandle: '.chatHandle',                     //class of the element that will become your tab
    tabLocation: 'bottom',                      //side of screen where tab lives, top, right, bottom, or left
    speed: 300,                               //speed of animation
    action: 'click',                          //options: 'click' or 'hover', action to trigger animation
    leftPos: '0px',                          //position from the top/ use if tabLocation is left or right
    fixedPosition: true,                      //options: true makes it stick(fixed position) on scroll
    onLoadSlideOut: getChatState()//getSlideState('Chat')
  });

  // Chat
  jQuery('#addChat').on('click', function() {
    var URL = 'NFL.M00070s?action_mode=add&one_step=1&ACTION=COMMENT&MESSAGE=',
      message = jQuery.trim(jQuery('#chatMsg').val());
    if (message === '') {
      return false;
    } else {
      jQuery('.chatLoading').show();
      URL = URL + message + '&x=' + Math.random();
      jQuery.ajax({ url:URL }).done(function() {
        jQuery('#chatMsg').val('');
        jQuery('#chat').load('NFL.Menus?pageName=Menus_old.html&impTags=2&x=' + Math.random());
      });
      return true;
    }
  });
  jQuery('#updateChat').on('click', function() {
    var id = jQuery(this).data('id'),
      URL = 'NFL.M00070s?action_mode=update&one_step=1&ACTID=',
      message = jQuery.trim(jQuery('#chatMsg').val());
    if (message === '') {
      return false;
    } else {
      jQuery('.chatLoading').show();
      URL = URL + id + '&MESSAGE=' + message + '&x=' + Math.random();
      jQuery.ajax({ url:URL }).done(function(){
        jQuery('#chat').load('NFL.Menus?pageName=Menus_old.html&impTags=2&x=' + Math.random());
        jQuery('#addChat').show();
        jQuery('#chatMsg').val('');
        jQuery('#cancelChat').hide();
        jQuery('#updateChat').hide().data('id', '');
      });
      return true;
    }
  });
  jQuery('#cancelChat').on('click', function() {
    jQuery('#addChat').show();
    jQuery('#chatMsg').val('');
    jQuery('#cancelChat').hide();
    jQuery('#updateChat').hide().data('id', '');
  });
  jQuery(document).on('mouseenter', 'div.aChat', function() {
    var imgs = jQuery(this).find('span.delupd').show();
    imgs.find('.delComment').click(function() {
      jQuery('.chatLoading').show();
      var URL = 'NFL.M00070s?action_mode=delete&one_step=1&ACTID=' + jQuery(this).data('id') + '&x=' + Math.random();
      jQuery.ajax({ url:URL }).done(function() {
        jQuery('#chat').load('NFL.Menus?pageName=Menus_old.html&impTags=2&x=' + Math.random());
      });
    });
    imgs.find('.updComment').click(function(){
      var chat = jQuery(this);
      jQuery('#addChat').hide();
      jQuery('#chatMsg').val(chat.parents('div.aChat').find('span.message').text()).css('width', '83%');
      jQuery('#cancelChat').show();
      jQuery('#updateChat').show().data('id', chat.data('id'));
    });
  });
  jQuery(document).on('mouseleave', 'div.aChat', function() {
    jQuery(this).find('span.delupd').hide().find('img').off('click');
  });
  jQuery(document).on('keyup', '#chatMsg', function(e) {
    if (e.keyCode === 13) {
      if (jQuery('#addChat').css('display') === 'none') {
        jQuery('#updateChat').trigger('click');
      } else {
        jQuery('#addChat').trigger('click');
      }
    }
  });

  // Select week
  jQuery('body').on('click', '.chooseWeek', function() {
    var week = jQuery(this).data('week');
    setWeek(week, true);
  });

  // Switch user
  jQuery('body').on('click', '#switchUser', function() {
    var exdate = new Date(),
      path = '/';
    exdate.setDate(exdate.getDate() - 1);
    setCookie('username', '', exdate, path);
  });

  // Change Week for mobile
  jQuery('body').on('change', '#weeks', function() {
    setWeek(jQuery(this).val(), true);
  });

/* Page */

if (jQuery('#currentYear').length) printYear();

/* mrcSignon2 - Login */

  if (jQuery('#mrcsignon').length) {
    var $error = jQuery('#errorMessage'),
        error = jQuery.trim($error.text());
    if (error) $error.parent('div.alert').removeClass('hidden');
    jQuery('#mrcsignon').formValidation({
      framework: 'bootstrap',
      err: {
        container: 'tooltip'
      },
      icon: {
        valid: 'fa fa-check',
        invalid: 'fa fa-times',
        validating: 'fa fa-refresh'
      },
      fields: {
        mrcuser: {
          threshold:4,
          validators: {
            notEmpty: {
              message: 'Please enter user name'
            }
          }
        }
      }
    })
    .on('success.form.fv', function(e) {
      var $form = jQuery(e.target),
          fv = $form.data('formValidation');
      e.preventDefault();
      fv.defaultSubmit();
    });
  }

/* M00005s - Resend Activation Email */
  if (jQuery('#FORM_M00005').length) {
    jQuery('.errortext, #errorMessage').each(function() {
      var $errLabel = jQuery(this);
      if (jQuery.trim($errLabel.text()) !== '') {
        if ($errLabel.is('#errorMessage')) {
          $errLabel.parent('div.alert').removeClass('hidden');
        } else {
          $errLabel.removeClass('hidden');
        }
      }
    });
    jQuery('#FORM_M00005').formValidation({
      framework: 'bootstrap',
      err: {
        container: 'tooltip'
      },
      icon: {
        valid: 'fa fa-check',
        invalid: 'fa fa-times',
        validating: 'fa fa-refresh'
      },
      addOns: {
        reCaptcha2: {
          element: 'recaptcha2',
          language: 'en',
          theme: 'light',
          siteKey: '6Ld_owsTAAAAAC8VVPDtc1u3OT90wJFWJoHtxA5i',
          timeout: 120,
          message: 'The captcha is not valid'
        }
      },
      fields: {
        EMAIL: {
          threshold:5,
          validators: {
            notEmpty: {
              message: 'Your email is required'
            },
            emailAddress: {
              message: 'Please enter a valid email'
            }
          }
        }
      }
    })
    .on('status.field.fv', function(e, data) {
      var errors = jQuery('i.fa-times').length;
      if (errors) {
        jQuery('#errorMessage').text('Please fix the ' + errors + ((errors === 1) ? ' error' : ' errors') + ' below').parent('.alert').removeClass('hidden');
      } else {
        jQuery('#errorMessage').text('').parent('.alert').addClass('hidden');
      }
    });
  }

/* M00010s - Register */
if (jQuery('#FORM_M00010').length) {
  jQuery('[data-toggle="tooltip"]').tooltip({ html:true });
  jQuery('.errortext, #errorMessage').each(function() {
    var $errLabel = jQuery(this);
    if (jQuery.trim($errLabel.text()) !== '') {
      if ($errLabel.is('#errorMessage')) {
        $errLabel.parent('div.alert').removeClass('hidden');
      } else {
        $errLabel.removeClass('hidden');
      }
    }
  });
  jQuery('#FORM_M00010').formValidation({
    framework: 'bootstrap',
    err: {
      container: 'tooltip'
    },
    icon: {
      valid: 'fa fa-check',
      invalid: 'fa fa-times',
      validating: 'fa fa-refresh'
    },
    addOns: {
      reCaptcha2: {
        element: 'recaptcha2',
        language: 'en',
        theme: 'light',
        siteKey: '6Ld_owsTAAAAAC8VVPDtc1u3OT90wJFWJoHtxA5i',
        timeout: 120,
        message: 'The captcha is not valid'
      }
    },
    fields: {
      USERID: {
        threshold:4,
        validators: {
          notEmpty: {
            message: 'User name is required'
          },
          remote: {
            url: 'NFL.I00030s',
            data: { "slnk":"1" },
            delay: 2000,
            message: 'This user name has already been taken.  Please choose another, or if this is you, press the \'Back\' button below.'
          },
          stringLength: {
            min: 4,
            message: 'Please enter at least 4 characters'
          }
        }
      },
      FNAME: {
        validators: {
          notEmpty: {
            message: 'First name is required'
          }
        }
      },
      LNAME: {
        validators: {
          notEmpty: {
            message: 'Last name is required'
          }
        }
      },
      EMAIL: {
        threshold:5,
        validators: {
          notEmpty: {
            message: 'Your email is required'
          },
          emailAddress: {
            message: 'Please enter a valid email'
          }
        }
      },
      CONFIRMEMAIL: {
        threshold:5,
        validators: {
          notEmpty: {
            message: 'Please enter your email again'
          },
          emailAddress: {
            message: 'Please enter your email again'
          },
          identical: {
            field: 'EMAIL',
            message: 'Please enter your email again'
          }
        }
      }
    }
  })
  .on('status.field.fv', function(e, data) {
    var errors = jQuery('i.fa-times').length;
    if (errors) {
      jQuery('#errorMessage').text('Please fix the ' + errors + ((errors === 1) ? ' error' : ' errors') + ' below').parent('.alert').removeClass('hidden');
    } else {
      jQuery('#errorMessage').text('').parent('.alert').addClass('hidden');
    }
  })
  .on('success.form.fv', function(e) {
    var $form = jQuery(e.target),
        fv = $form.data('formValidation'),
        email = jQuery.trim(jQuery('#EMAIL').val()),
        username = jQuery.trim(jQuery('#USERID').val()),
        msg = 'Thanks for registering!  Please check your email for instructions on completing your registration.  You will not be able to sign in until you activate your account, so if ' + email + ' is not your email, please press \'Cancel\' and correct it.';
    e.preventDefault();
    if (confirm(msg)) {
      jQuery.ajax({ url:'NFL.M00070s?action_mode=add&one_step=1&USERID=' + username + '&ACTION=REGISTER', async:false });
      fv.defaultSubmit();
    }
  });
}

/* Mobile Menu */
  jQuery('body').on('click', '.Ynone, .Nnone', function() {
    var week = jQuery(this).data('week');
    jQuery('td.week' + week).load('NFL.R00050s?run=1&S_USERID=1&sort_typ=1&cur_sort_col=CALCULA002&top10=150&data=1&R001=' + week);
  });

/* I00020s - Picks */

  // Make points draggable
  // Set point divs to be draggable
  if (jQuery().sortable) {
  jQuery('.sorter').sortable({
    connectWith:'.sorted',
    cursor:'move',
    placeholder:'open',
    items:'li.points:not(.DISABLED)',
    cancel:'.DISABLED',
    receive:function(event, ui) {
      var startedUrl1 = 'NFL.M00030s?action_mode=update&one_step=1&COMPLETE=I',
          startedUrl2 = 'NFL.M00030s?action_mode=update',
          url1 = 'NFL.M00050s?action_mode=update&one_step=1',
          url2 = 'NFL.M00050s?action_mode=add&one_step=1',
          team1 = jQuery('.lastgame1').text(),
          team2 = jQuery('.lastgame2').text(),
          started = jQuery('#COMPLETE').val(),
          user = jQuery('#currentUser').val(),
          week = jQuery('#currentWeek').val(),
          id, pick, points;
      if (jQuery(ui.item).parents('tr.game').find('li.points').length > 1) {
        jQuery(ui.sender).sortable('cancel');
      } else if (jQuery(ui.item).parents('tr.game').hasClass('DISABLED')) {
        jQuery(ui.sender).sortable('cancel');
      } else {
        // remove sorted from this row
        jQuery(ui.item).parent('ul.input').removeClass('sorted');
        // add sorted for sending row
        jQuery(ui.sender).addClass('sorted');
        // set completed class
        jQuery(ui.sender).parents('tr.game').removeClass('completed');
        jQuery(ui.item).parents('tr.game').addClass('completed');
        if (started !== 'I') {
          jQuery.ajax({ url:startedUrl1 + '&WEEK=' + week + '&USERID=' + user }).success(function(html) {
            jQuery('#enterTiebreaker').load(startedUrl2 + '&WEEK=' + week + '&USERID=' + user + '&CALCULA001=' + team1 + '&CALCULA002=' + team2 + '&impTags=1');
            started = 'I';
            jQuery('#COMPLETE').val(started);
          });
        }
      }
      if (jQuery(ui.item).parent('ul').hasClass('input')) {
        // construct AJAX call for picking a team
        id = jQuery(ui.item).parent('ul').data('id');
        pick = jQuery(ui.item).parent('ul').data('team');
        points = jQuery(ui.item).text();
        jQuery.ajax({ url:url1 + '&GAMEID=' + id + '&USERID=' + user + '&PICK=' + pick + '&POINTS=' + points }).success(function(html) {
          if (jQuery.trim(jQuery('.errortext1', html).text()) !== '') {
            jQuery.ajax({ url:url2 + '&GAMEID=' + id + '&USERID=' + user + '&PICK=' + pick + '&POINTS=' + points });
          }
        });
      } else {
        // construct AJAX call for deselecting a team
        id = jQuery(ui.sender).data('id');
        if (id !== undefined) {
          pick = '';
          points = 0;
          jQuery.ajax({ url:url1 + '&GAMEID=' + id + '&USERID=' + user + '&PICK=' + pick + '&POINTS=' + points }).success(function(html) {
            if (jQuery.trim(jQuery('.errortext1', html).text()) !== '') {
              jQuery.ajax({ url:url2 + '&GAMEID=' + id + '&USERID=' + user + '&PICK=' + pick + '&POINTS=' + points });
            }
          });
        }
        jQuery('#bank li.invisible').each(function() {
          if (jQuery(this).text() === jQuery(ui.item).text()) {
            jQuery(this).remove();
          }
        });
      }
    }
  }).disableSelection();
  }
  
  // Set divs to display message when clicked
  jQuery('ul.input').click(function() {
    var message = 'Please drag the desired point totals into the proper box.';
    alert(message);
  });

/* R00150s - What-if analysis */

  jQuery('body').delegate('label.ui-button', 'click', function() {
    jQuery('.' + jQuery(this).attr('for')).removeClass('incorrect').addClass('correct');
    jQuery('.' + jQuery(this).data('not')).removeClass('correct').addClass('incorrect');
    jQuery('tbody.stripe tr').each(function() {
      var correct = jQuery(this).find('.correct').length,
          points = 0;
      jQuery(this).find('td.myCorrect').text(correct);
      jQuery(this).find('.correct').each(function() {
        points = points + parseInt(jQuery(this).text(), 10);
      });
      jQuery(this).find('td.myPoints').text(points);
    });
    jQuery('tbody.stripe tr').sort(rankPlayers).appendTo('tbody.stripe');
    jQuery('tbody.stripe tr').each(function(i, el) {
      jQuery(this).find('span.myRank').text((i + 1) + '.');
    });
  });

  jQuery('body').delegate('#lastScore', 'keyup', function() {
    var lastscore = parseInt(jQuery(this).val(), 10);
    if (lastscore > 0) {
      jQuery('td.actualScore').text(lastscore);
      jQuery('tbody.stripe tr').each(function() {
        var myguess = parseInt(jQuery(this).find('td.myGuess').text(), 10);
        if (lastscore < myguess) {
          jQuery(this).find('td.myGuess').removeClass('positive').addClass('negative');
        } else if (lastscore > myguess) {
          jQuery(this).find('td.myGuess').removeClass('positive').removeClass('negative');
        } else {
          jQuery(this).find('td.myGuess').removeClass('negative').addClass('positive');
        }
      });
    } else {
      jQuery('td.actualScore').text('N/A');
    }
    jQuery('tbody.stripe tr').sort(rankPlayers).appendTo('tbody.stripe');
    jQuery('tbody.stripe tr').each(function(i, el) {
      jQuery(this).find('span.myRank').text((i + 1) + '.');
    });
  });
  
  jQuery('body').on('click', '.resetPicks', function() {
    jQuery('.ajax_content').append('<div class="loading_ajax" style="z-index:9999;">Processing<br/><br/><img src="/mrcjava/image/ajax-loader.gif"/></div>');
    jQuery('form').submit();
  });
  
  /* R00160s - View Survivor Pool */
  if (jQuery('#survivorWeek').length) {
    jQuery('#survivorWeek').change(function() {
      var week = this.value,
          url;
      if (week === '') {
        url = 'NFL.R00160s?run=2&data=1';
      } else {
        url = 'NFL.R00155s?run=2&basic=1&R001=' + week;
      }
      jQuery('#survivorContent').load(url);
    });
  }

// End of document.ready
});