// The database config for my Firebase acct
var config = {
    apiKey: "AIzaSyB3OTKnscA9uQXfdcKUkuPOANkEF-lUVA0",
    authDomain: "projectcodingcamp.firebaseapp.com",
    databaseURL: "https://projectcodingcamp.firebaseio.com",
    projectId: "projectcodingcamp",
    storageBucket: "projectcodingcamp.appspot.com",
    messagingSenderId: "277978229879"
  };
  
// Inititalize the database
firebase.initializeApp(config);

// Assign my database ref for folder TrainScheduler to a variable
var db = firebase.database();
var jjdb = db.ref("TrainScheduler");

// Assign the connections to database to a variable
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

// A f(X) for passing a category query and get the json object from the Giphy API
function queryGiphy (cat) {

    var queryURL = "https://api.giphy.com/v1/gifs/search?q="+cat+"&api_key=dc6zaTOxFJmzC&limit=1";

    $.ajax({
        url: queryURL,
        method: "GET"
        }).then(function(response) {
        console.log(response);
        
        // Write a new Gif card to window with the returned gif attached
        var newGifDiv = $('<div class="card gif-card" style="width:100%;">');
        newGifDiv.append('<img src="'+response.data[0].images.original.url+'" frameBorder="0" class = "card-img-top my-img" data-animate="'+response.data[0].images.original.url+'" data-still="'+response.data[0].images.original_still.url+'" data-state="animate" allowFullScreen></iframe>');
        $("#gifrow").append(newGifDiv);
        
    });            
}
// Call the giphy function and pass ita specific train search
queryGiphy("train+midnight");

// Initialize the train data to empty at page load
var name = "";
var dest = "";
var time = 0;
var rawfreq = "";

// A dummy variable to keep track of the trains added (for future use)
var numTrains = 0;

// A f(x) for pushing each user inputed train and its data to the database
function makeTrain () {
  jjdb.push({
      Train: name,
      Destination: dest,
      StartTime: time,
      Freq: rawfreq,
      dateAdded: firebase.database.ServerValue.TIMESTAMP
  });
}

// Capture Submit Click
$("#add-train").on("click", function(event) {
    event.preventDefault();
    
    // Grab all the train info from the user inputs and assign to global train variables
    name = $("#name-input").val().trim();
    dest = $("#dest-input").val().trim();
    time = $("#time-input").val();
    console.log(time);
    rawfreq = $("#min-input").val().trim();

    // Code for the push and then calling the database function for printing all current trains
    makeTrain();
    readFromDb();
    // Reset the input fields
    $('input').val("");
});

$("#kill-train").on("click", function(event) {
  event.preventDefault();
  
  // Grab all the train info from the user inputs and assign to global train variables
  del_name = $("#name-input").val().trim();
  
  // Code for the push and then calling the database function for printing all current trains
  jjdb.orderByChild('Train').equalTo(del_name)
    .once('value').then(function(snapshot) {
        snapshot.forEach(function(childSnapshot) {
        //remove each child
        jjdb.child(childSnapshot.key).remove();
    });
});
  // Reset the input fields
  $('input').val("");
});

// A debugging f(x) for console logging each current database train object
function consoleTrain (child){
    console.log(child.val().Train);
    console.log(child.val().Destination);
    console.log(child.val().StartTime);
    console.log(child.val().Freq);
    console.log(child.val().dateAdded);
}

// A f(x) for printing each train and its data to the html
function printTrain (child,next,min) {
    var tr = $("<tr>"+numTrains+"></tr>");
    tr.append("<td>"+child.val().Train+"</td>");
    tr.append("<td>"+child.val().Destination+"</td>");
    tr.append("<td>"+child.val().StartTime+"</td>");
    tr.append("<td>"+child.val().Freq+"</td>");
    tr.append('<td id="next-train-'+numTrains+'">'+next+"</td>");
    tr.append('<td id="mins-'+numTrains+'">'+min+"</td>");
    $("tbody").append(tr);
}

// The main f(x) for taking each stored train and calculating its next time to and of arrival  
function calcNextTrain (childSnap) {

  // Calculate the time elapsed from the first train time till now    
    var totalMinAway = moment(moment()).diff(moment(childSnap.val().StartTime,"HH:mm"), "minutes");
  // Convert the first train time to elapsed min from midnight
    var firstTime = moment(moment(childSnap.val().StartTime,"HH:mm")).diff(moment("00:00","HH:mm"),"minutes");
  // Set a variable for the last time the train ran and set it to 0 based on the initial start train time 
    var lastTime = 0;

  // Increment the last time variable by the interval until it passes the time elapsed from start till now
    while (lastTime<totalMinAway){
      lastTime = lastTime + parseInt(childSnap.val().Freq);
    }

  // Set the next train time in minutes to the time elapsed from start (last time variable) plus the first time it ran in mins
    var nextTime = lastTime + firstTime;
  // Convert the next train time to a moment of adding the next train time in mins to midnight  
    var nextTimeMom = moment("00:00","HH:mm").add(nextTime,'minutes').format('HH:mm');

  // Set the last time in mins that the train ran by subtracting the interval  
  lastTime=nextTime-parseInt(childSnap.val().Freq);

  // Convert the last time in mins to correct HH:mm format for moment.js
  var h =  parseInt(lastTime / 60);
  var m = lastTime % 60;
  var lastTimeMom = h+":"+m;

  // Calculate the current mins away by subtracting the time time elapsed from last train till now from the interval
  var curMinAway =childSnap.val().Freq-moment(moment()).diff((moment(lastTimeMom,"HH:mm")),"minutes");

  // Call the print all train data f(x) including our calculated next time in correct format and time away to html
  printTrain(childSnap,nextTimeMom,curMinAway);
}

// Set an interval variable
var intervalId;

// A f(x) for setting event child added handler to the database   
function readFromDb () {

  jjdb.orderByChild('Destination').on("child_added", function(snapshot) {
      
  // Log everything that's coming out of each train child snapshot
      consoleTrain(snapshot);
      // Call the f(x) for printing the train info and pass the train snapshot
      calcNextTrain(snapshot);
      // Turn off the child handler after 1 sec to prevent stacking handlers
      setTimeout (jjdb.off(),1000);
    
  // Handle the errors
  }, function(errorObject) {
      console.log("Errors handled: " + errorObject.code);
  });
}

// Call the database function to print current trains upon page load
readFromDb();
// Call the database function to print current trains every min to update real-time
setInterval(function(){
    $("tbody").empty();
    readFromDb();
},1000*60);

// Print the current time to the html initially and every subsequent second
$("#nowTime").text(moment().format("MMMM Do YYYY HH:mm:ss"));
setInterval(function() {
    $("#nowTime").text(moment().format("MMMM Do YYYY HH:mm:ss"));
},1000);

$(function () {
    $('[data-toggle="tooltip"]').tooltip()
  })