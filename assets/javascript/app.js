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

var giphyGifPos=0;
function queryGiphy (cat) {

    var queryURL = "https://api.giphy.com/v1/gifs/search?q=" +
    cat + "&api_key=dc6zaTOxFJmzC&limit=1&offset=" + giphyGifPos;

    $.ajax({
        url: queryURL,
        method: "GET"
        }).then(function(response) {
        console.log(response);
        // write all the gifs that were returned 
        for (i=0;i<response.data.length;i++){
            // increment the spot in the database list 
            giphyGifPos++;
            // Increment the total search length by the number returned
            // Write a new Gif card to window with the gif checkbox and fav buttons
            var newGifDiv = $('<div class="card gif-card" style="width:100%;">');
            newGifDiv.append('<img src="'+response.data[0].images.original.url+'" frameBorder="0" class = "card-img-top my-img" data-animate="'+response.data[0].images.original.url+'" data-still="'+response.data[0].images.original_still.url+'" data-state="animate" allowFullScreen></iframe>');
            $("#gifrow").append(newGifDiv);
        }
    });            
}
queryGiphy("train");

  var name = "";
  var dest = "";
  var time = 0;
  var rawfreq = "";

  var numTrains = 0;

  function makeTrain () {
    jjdb.push({
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
    rawfreq = $("#min-input").val().trim();

    // Code for the push
    makeTrain();
    readFromDb();
    $('input').val("");
  });

  function consoleTrain (child){
    console.log(child.val().Train);
    console.log(child.val().Destination);
    console.log(child.val().StartTime);
    console.log(child.val().Freq);
    console.log(child.val().dateAdded);
  }

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

  function calcNextTrain (childSnap) {
      
    var totalMinAway = moment(moment()).diff(moment(childSnap.val().StartTime,"HH:mm"), "minutes");

    var firstTime = moment(moment(childSnap.val().StartTime,"HH:mm")).diff(moment("00:00","HH:mm"),"minutes");
    
    var lastTime = 0;

    while (lastTime<totalMinAway){
        lastTime = lastTime + parseInt(childSnap.val().Freq);
    }

    var nextTime = lastTime + firstTime;
    
    var nextTimeMom = moment("00:00","HH:mm").add(nextTime,'minutes').format('HH:mm');

    lastTime=(lastTime-parseInt(childSnap.val().Freq)) +firstTime;

    var h =  parseInt(lastTime / 60);
    var m = lastTime % 60;
    var lastTimeMom = h+":"+m;

    var curMinAway =childSnap.val().Freq-moment(moment()).diff((moment(lastTimeMom,"HH:mm")),"minutes");

    // full list of items to the well
    printTrain(childSnap,nextTimeMom,curMinAway);
  }

  var intervalId;

  function readFromDb () {
  jjdb.on("child_added", function(snapshot) {
      
    // Log everything that's coming out of snapshot
        consoleTrain(snapshot);
        calcNextTrain(snapshot);
        setTimeout (jjdb.off(),1000);
    
    // Handle the errors
    }, function(errorObject) {
        console.log("Errors handled: " + errorObject.code);
    });
  }

  readFromDb();
  
  setInterval(function(){
    $("tbody").empty();
    readFromDb();
  },1000*60);
