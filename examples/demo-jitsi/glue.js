/**
 *  Introduction:
 *  -------------
 *  glue.js is a sample application that spotlights OXJS,
 *  the JavaScript SDK developed by Junction Networks.
 *
 *  OX was implemented for the purpose of abstracting the
 *  low level XMPP messaging used for real-time events.
 *  In this light, developers could focus entirely on the
 *  business requirements of their application.
 *
 *  Use OXJS if you need to build a web application that
 *  features real-time call events. Use the sample code in
 *  glue.js to guide you in your development using OX against
 *  Junction's XMPP based API.
 *
 *  glue.js will illustrate how to :
 *
 *    - Make SIP calls
 *    - Retrieve notifications of call states
 *      (eg. Whether the call was answered, terminated, etc.)
 *    - Manage your Roster
 *
 *
 *  Getting Started:
 *  ----------------
 *  In order to work around Same Origin Policy issues, add the following
 *  snippet to your Apache config file:
 *
 *      SSLProxyEngine on
 *      ProxyPass /http-bind https://my.onsip.com/http-bind
 *      ProxyPassReverse /http-bind http://my.onsip.com/http-bind
 *
 *  To run this Demo application you'll need to point your root web
 *  folder to the root directory of your OXJS download.
 *  For instance :
 *      http://localhost/OXJS/examples/demo-strophe/index.html
 *  You can access API documentation via
 *      http://localhost/OXJS/doc/public/index.html
 *
 */

/* globals DemoApp Jitsi $ */
DemoApp = {};

function htmlEnc(str) {
  return str.split(/&/).join("&amp;")
            .split(/;/).join("&semi;")
            .split(/</).join("&lt;")
            .split(/>/).join("&gt;");
}

function logMessage(xml, outbound) {
  var sent = (!!outbound) ? 'outbound' : 'inbound',
      msg  = "<div class='msg %s'>" + htmlEnc(xml) + "</div>";
  if (window.console && window.console.debug) {
    console.debug('(' + sent + ') - ' + xml);
  }
  msg = msg.replace(/%s/, sent);
  $('#message_pane_inner').append(msg);
  $('#message_pane_inner :last').get(0).scrollIntoView();
}

function _getFormValue(formID, inputName) {
  return $('form#' + formID + ' input[name=' + inputName + ']').val();
}

function _addOutput(selector, msg) {
  $(selector).append("<li>" + msg + "</li>");
}

function _generateHangupTemplate(id){
  var divEl = "" +
    "<h4>Hangup Call (callId " + id + ")</h4>" +
    "<div>" +
      "<form id=\"hangup-call-" + id + "\" action=\"#\">" +
        "<table>" +
          "<tr>" +
            "<td><input type=\"submit\" value=\"Submit\"/></td>" +
          "</tr>" +
        "</table>" +
      "</form>" +
    "</div>";

  return divEl;
}

function _generatePickupTemplate(id){
  var divEl = "" +
    "<h4>Pickup Call (callId " + id + ")</h4>" +
    "<div>" +
      "<form id=\"pickup-call-" + id + "\" action=\"#\">" +
        "<table>" +
          "<tr>" +
            "<td><input type=\"submit\" value=\"Submit\"/></td>" +
          "</tr>" +
        "</table>" +
      "</form>" +
    "</div>";
  return divEl;
}

function loadApplet(codebase) {
  DemoApp.Jitsi = DemoApp.Jitsi.extend({
    applet: Jitsi.Connection.extend({
      appletAdapter: Jitsi.Applet.extend({
        codebase: codebase,
        appletID: "jitsi-app"
      })
    }),

    init: Jitsi.Function.around(function () {
      this.applet.Call.registerHandler('onCallEvent',
                                       this._handleCallEvents);
      this.applet.Loader.registerHandler('onLoadEvent',
                                         this._handleLoadEvents);
      this.applet.Register.registerHandler('onRegisterEvent',
                                           this._handleRegisterEvents);
    })
  });

  $('#register').bind('submit', function (e) {
    e.preventDefault();
    logMessage('sendEvent: register',true);
    DemoApp.Jitsi.register(this.id);
  });

  $('#unregister').bind('submit', function (e) {
    e.preventDefault();
    logMessage('SendEvent: unregister',true);
    DemoApp.Jitsi.unregister(this.id);
  });

  $('#create-call').bind('submit', function (e) {
    e.preventDefault();
    logMessage('sendEvent: create',true);
    DemoApp.Jitsi.createCall(this.id);
  });

  /**
  $('#pickup-call').bind('submit', function(e) {
    e.preventDefault();
    logMessage('sendEvent: answer',true);
    DemoApp.Jitsi.answerCall(this.id);
  });

  $('#hangup-call').bind('submit', function (e) {
    e.preventDefault();
    logMessage('sendEvent: hangup',true);
    DemoApp.Jitsi.hangup(this.id);
  });
   **/
}

DemoApp.Jitsi = Jitsi.Base.extend({
  _handleCallEvents: function (callItem) {
    var l = "";
    if (callItem.data && callItem.data.details){
      var type = callItem.data.type;
      l = JSON.stringify(callItem.data);
      l = "Received Call Event: " + type + " - " + l;
      logMessage(l,false);
      if (callItem.data.type == 'confirmed'){
        var cid = callItem.callID;
        var tmpl = _generateHangupTemplate(cid);
        var innerHtml = $("hangup-container").html();
        var that = this;
        $("#hangup-container").html(innerHtml + tmpl);
        $(".jitsi.hangup").show();
        $('#hangup-call-' + cid).bind('submit', function (e) {
          e.preventDefault();
          logMessage('sendEvent: hangup', true);
          that.hangup();
        });

      }
    }
  },

  _handleRegisterEvents: function(uaItem) {
    var username, l;
    if (uaItem) {
      if (uaItem.data.type){
        if (uaItem.data.type == 'registered') {
          $('#logged_out_pane').hide();
          $('#logged_in_pane').show();
          $('#applet-config').hide();
          username = _getFormValue('register', 'username');
          $('#logged_in_as').html(username);
        } else if (uaItem.data.type == 'unregistered') {
          $('#logged_out_pane').show();
          $('#logged_in_pane').hide();
          $('#logged_in_as').html("");
          $('#applet-config').show();
        }
        l = JSON.stringify(uaItem.data);
        l = "Recieved Register Event: " + uaItem.data.type + " - " + l;
        logMessage(l,false);
      }
    }
  },

  _handleLoadEvents: function (loadItem) {
    logMessage(JSON.stringify(loadItem.data),false);
    var msg = "";
    if (loadItem) {
      if (loadItem.type) {
        if (loadItem.data && loadItem.data.details) {
          msg = loadItem.data.details.message;
        }
        $("#load-state").text(loadItem.type);
        $("#load-status-message").text(msg);
        document.getElementById("load-progress").value = loadItem.data.details.progress;
      }
    }

    if (loadItem.type == "loaded")
      $("#logged_out_pane").show();
  },

  register: function (formID) {
    var username = _getFormValue(formID, 'username'),
        authUsername = _getFormValue(formID, 'auth-username'),
        passwd  = _getFormValue(formID, 'password');

    var displayName = "test";
    if (username && username.length)
    {
      var idx = username.indexOf('@');
      if (idx != -1){
        displayName = username.substr(0, idx);
      }
    }

    return this.applet.Register.register(username, displayName,
                                         authUsername, passwd);
  },

  unregister: function(formID) {
    this.applet.Register.unregister();
  },

  createCall: function (formID) {
    var to = _getFormValue(formID, 'to');
    return this.applet.Call.create(to);
  },

  answerCall: function(formID) {
    return this.applet.Call.answer();
  },

  hangup: function(formID) {
    return this.applet.Call.hangup();
  }

});

var onerror = function (e) {
  return false;
};

$(document).ready(function() {
  var parsedHash = function(hash) {
    hash = hash.replace(/^(#)/,"");

    var hashParts = hash.split(",");
    var ret = {};
    var tmp;

    for (var i=0;i<hashParts.length;i++) {
      tmp = hashParts[i].split("=");
      ret[tmp[0]] = tmp[1];
    }
    return ret;
  }(location.hash);

  var codebase=parsedHash.codebase || Jitsi.Applet.codebase;
  $('#applet-codebase').val(codebase);

  $('#applet-load').click(function() {
    $("#load-progress").css({visibility: 'visible'});

    var codebase = $('#applet-codebase').val();
    loadApplet(codebase);
  });
});