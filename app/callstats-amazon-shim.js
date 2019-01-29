/*globals Twilio:false, callstats:false, CallstatsTwilio:false */
/*jshint unused:false*/

/*! callstats Amazon SHIM version = 1.0.0 */

(function (global) {
  var CallstatsAmazonShim = function(callstats) {
    CallstatsAmazonShim.callstats = callstats;
    // pc is available in this functional scope
    var pc = undefined;
    var confId;
    var callType;
    var SoftphoneErrorTypes;
    var RTCErrorTypes;

    function subscribeToAmazonContactEvents(contact) {
      CallstatsAmazonShim.remoteId = contact.getActiveInitialConnection().getEndpoint().phoneNumber + "";
      if (contact.getActiveInitialConnection()
          && contact.getActiveInitialConnection().getEndpoint()) {
          console.log("New contact is from " + contact.getActiveInitialConnection().getEndpoint().phoneNumber);
      } else {
          console.log("This is an existing contact for this agent");
      }
      if (contact.getActiveInitialConnection()
        && contact.getActiveInitialConnection().getType()) {
          callType = contact.getActiveInitialConnection().getType();
      }
      contact.onSession(handleSessionCreated);
    }

    function subscribeToAmazonAgentEvents(agent) {
      agent.onSoftphoneError(handleErrors);
      agent.onMuteToggle(handleOnMuteToggle);
    }

    function handleOnMuteToggle(obj) {
      if (!pc || !confId) {
        return;
      }
      if (obj) {
        if (obj.muted) {
          CallstatsAmazonShim.callstats.sendFabricEvent(pc, 
            CallstatsAmazonShim.callstats.fabricEvent.audioMute, confId);
        } else {
          CallstatsAmazonShim.callstats.sendFabricEvent(pc, 
            CallstatsAmazonShim.callstats.fabricEvent.audioUnmute, confId);
        }
      }
    }

    function handleErrors(error) {
      if (!error) {
        return;
      }
      var conferenceId = confId;
      if (!conferenceId) {
        conferenceId= localId + ":" + (CallstatsAmazonShim.remoteId || localId);
      } 
      if (error.errorType === SoftphoneErrorTypes.MICROPHONE_NOT_SHARED) {
        CallstatsAmazonShim.callstats.reportError(null, conferenceId, CallstatsAmazonShim.callstats.webRTCFunctions.getUserMedia, error);
      } else if (error.errorType === SoftphoneErrorTypes.SIGNALLING_CONNECTION_FAILURE) {
        CallstatsAmazonShim.callstats.reportError(null, conferenceId, CallstatsAmazonShim.callstats.webRTCFunctions.signalingError, error);
      } else if (error.errorType === SoftphoneErrorTypes.SIGNALLING_HANDSHAKE_FAILURE) {
        CallstatsAmazonShim.callstats.reportError(pc, conferenceId, CallstatsAmazonShim.callstats.webRTCFunctions.setLocalDescription, error);
        if (callType) {
          CallstatsAmazonShim.callstats.sendCallDetails(pc, conferenceId, {callType: callType, role: 'agent'});
        }
      } else if (error.errorType === SoftphoneErrorTypes.ICE_COLLECTION_TIMEOUT) {
        CallstatsAmazonShim.callstats.reportError(pc, conferenceId, CallstatsAmazonShim.callstats.webRTCFunctions.iceConnectionFailure, error);
        if (callType) {
          CallstatsAmazonShim.callstats.sendCallDetails(pc, conferenceId, {callType: callType, role: 'agent'});
        }
      } else if (error.errorType === SoftphoneErrorTypes.WEBRTC_ERROR) {
        switch(error.endPointUrl) {
          case RTCErrorTypes.SET_REMOTE_DESCRIPTION_FAILURE:
            CallstatsAmazonShim.callstats.reportError(pc, conferenceId, CallstatsAmazonShim.callstats.webRTCFunctions.setRemoteDescription, error);
            if (callType) {
              CallstatsAmazonShim.callstats.sendCallDetails(pc, conferenceId, {callType: callType, role: 'agent'});
            }
            break;
        }
      }
    }

    function handleSessionCreated(session) {
      confId = CallstatsAmazonShim.localUserID + ":" + CallstatsAmazonShim.remoteId;
      pc = session._pc;
      try {
        CallstatsAmazonShim.callstats.addNewFabric(pc, CallstatsAmazonShim.remoteId, CallstatsAmazonShim.callstats.fabricUsage.multiplex, confId);
      } catch(error) {
        console.log('addNewFabric error ', error);
      }
      if (callType) {
        CallstatsAmazonShim.callstats.sendCallDetails(pc, confId, {callType: callType, role: 'agent'});
      }
    }

    CallstatsAmazonShim.prototype.initialize = function initialize(connect, appID, appSecret, localUserID, params, csInitCallback, csCallback) {
      CallstatsAmazonShim.callstatsAppID = appID;
      CallstatsAmazonShim.callstatsAppSecret = appSecret;
      CallstatsAmazonShim.localUserID = localUserID;
      CallstatsAmazonShim.csInitCallback = csInitCallback;
      CallstatsAmazonShim.csCallback = csCallback;
      CallstatsAmazonShim.callstats.initialize(appID, appSecret, localUserID, csInitCallback, csCallback, params);
      CallstatsAmazonShim.intialized = true;
      connect.contact(subscribeToAmazonContactEvents);
      connect.agent(subscribeToAmazonAgentEvents);
      SoftphoneErrorTypes = connect.SoftphoneErrorTypes;
      RTCErrorTypes = connect.RTCErrors;
      return CallstatsAmazonShim.callstats;
    };

    CallstatsAmazonShim.prototype.sendUserFeedback = function sendUserFeedback(feedback, callback) {
      if (!confId) {
        return;
      }
      CallstatsAmazonShim.callstats.sendUserFeedback(confId, feedback, callback);
    };

    CallstatsAmazonShim.prototype.sendFabricEvent = function sendFabricEvent(feedback, callback) {
      if (!pc || !confId) {
        return;
      }
      CallstatsAmazonShim.callstats.sendFabricEvent(pc, fabricEvent, confId, eventData);
    };

    CallstatsAmazonShim.prototype.sendLogs = function sendLogs(confId, domError) {
      if (!pc || !confId) {
        return;
      }
      CallstatsAmazonShim.callstats.reportError(pc, confId, 
        CallstatsAmazonShim.callStats.webRTCFunctions.applicationError, domError);
    };
  };
  if (("function" === typeof define) && (define.amd)) { /* AMD support */
  define('callstats-amazon-client', ['callstats'], function(callstats) {
    global.CallstatsAmazonShim = new CallstatsAmazonShim(callstats);
    return  global.CallstatsAmazonShim;
  });
  } else { /* Browsers and Web Workers*/
    var callstats = new window.callstats();
    global.CallstatsAmazonShim = new CallstatsAmazonShim(callstats);
  }
}(this));
