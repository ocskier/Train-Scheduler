var config = {
    apiKey: "AIzaSyB3OTKnscA9uQXfdcKUkuPOANkEF-lUVA0",
    authDomain: "projectcodingcamp.firebaseapp.com",
    databaseURL: "https://projectcodingcamp.firebaseio.com",
    projectId: "projectcodingcamp",
    storageBucket: "projectcodingcamp.appspot.com",
    messagingSenderId: "277978229879"
  };
  
      firebase.initializeApp(config);

var db = firebase.database();
var jjdb = db.ref("TrainScheduler");

var connectionsRef = db.ref("/connections");

// '.info/connected' is a special location provided by Firebase that is updated
// every time the client's connection state changes.
// '.info/connected' is a boolean value, true if the client is connected and false if they are not.
var connectedRef = db.ref(".info/connected");

// When the client's connection state changes...
connectedRef.on("value", function(snap) {

  // If they are connected..
  if (snap.val()) {

    // Add user to the connections list.
    var con = connectionsRef.push(true);
    // Remove user from the connection list when they disconnect.
    con.onDisconnect().remove();
  }
});

jjdb.on("value", function(snapshot) {

   
  
  // If any errors are experienced, log them to console.
  }, function(errorObject) {
    console.log("The read failed: " + errorObject.code);
  });


  var name = "";
  var dest = "";
  var time = 0;
  var rawfreq = "";

  function makeTrain (ref) {
    ref.push({
        Train: name,
        Destination: dest,
        StartTime: time,
        Freq: rawfreq,
        dateAdded: firebase.database.ServerValue.TIMESTAMP
    });
}

  // Capture Button Click
  $("#add-train").on("click", function(event) {
    event.preventDefault();
    
    // YOUR TASK!!!
    // Code in the logic for storing and retrieving the most recent user.
    // Don't forget to provide initial data to your Firebase database.
    name = $("#name-input").val().trim();
    dest = $("#dest-input").val().trim();
    time = $("#time-input").val();
    console.log(time);
    var randomFormat = "HH:mm";
    var convertedTime = moment(time,randomFormat);
    console.log(convertedTime);
    rawfreq = $("#min-input").val().trim();

    // Code for the push
    makeTrain (jjdb);
  });

  jjdb.on("child_added", function(childSnap) {
      
    // Log everything that's coming out of snapshot
    console.log(childSnap.val().Train);
    console.log(childSnap.val().Destination);
    console.log(childSnap.val().StartTime);
    console.log(childSnap.val().Freq);
    console.log(childSnap.val().dateAdded);
    
    var momStartTime = moment(childSnap.val().StartTime,"HH:mm");
    var totalMinAway = moment(moment()).diff(momStartTime, "minutes");
    console.log(momStartTime);
    var curTime = totalMinAway;
    console.log(curTime);

    var firstTime = moment(momStartTime).diff(moment("00:00","HH:mm"),"minutes");
    
    var lastTime = 0;
    console.log(lastTime);
    while (lastTime<curTime){
        lastTime = lastTime + parseInt(childSnap.val().Freq);
        console.log(lastTime);
    }

    var nextTime = lastTime + firstTime;
    console.log(nextTime);
   
    var nextTimeMom = moment("00:00","HH:mm").add(nextTime,'minutes').format('HH:mm');
    console.log(nextTimeMom);

    lastTime=(lastTime-parseInt(childSnap.val().Freq)) +firstTime;
    console.log(lastTime);

    var h =  parseInt(lastTime / 60);
    var m = lastTime % 60;
    var lastTimeMom = h+":"+m;
    console.log(lastTimeMom);

    var curMinAway =childSnap.val().Freq-moment(moment()).diff((moment(lastTimeMom,"HH:mm")),"minutes");
    console.log(curMinAway);

    // full list of items to the well
    var tr = $("<tr></tr>");
    tr.append("<td>"+childSnap.val().Train+"</td>");
    tr.append("<td>"+childSnap.val().Destination+"</td>");
    tr.append("<td>"+childSnap.val().StartTime+"</td>");
    tr.append("<td>"+childSnap.val().Freq+"</td>");
    tr.append("<td>"+nextTimeMom+"</td>");
    tr.append("<td>"+curMinAway+"</td>");
    $("tbody").append(tr);

    // Handle the errors
  }, function(errorObject) {
    console.log("Errors handled: " + errorObject.code);
  });