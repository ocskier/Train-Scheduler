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
  jjdb.child(name).set ({
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
    setTimeout(function(){
      $("tbody").empty();
      readFromDb();
    },700);

    // Reset the input fields
    $('input').val("");
});

$("tbody").on("click","#update", function(event) {
    event.preventDefault();
    
    // Grab all the train info from the user inputs and assign to global train variables
    var update_Name = $(this).attr("data-name");
    var update_id = update_Name.replace(/\s+/g, '');
    
    console.log(update_Name);
    console.log(update_id);

    var newName = "";
    var newDest = "";
    var newTime = 0;
    var newRawfreq = "";
    
    if ($(this).attr("update-activated")=="false") {
      
      $("#"+update_id+" td:nth-child(1)").empty().append('<input class="form-control" id="update-name-input" style="width:70%;margin:0 auto;" type="text">');
      $("#"+update_id+" td:nth-child(2)").empty().append('<input class="form-control" id="update-dest-input" style="width:70%;margin:0 auto;" type="text">');
      $("#"+update_id+" td:nth-child(3)").empty().append('<input class="form-control" id="update-time-input" type="time">');
      $("#"+update_id+" td:nth-child(4)").empty().append('<input class="form-control" id="update-min-input" style="width:70%;margin:0 auto;" type="text">');
      $("#"+update_id+" td:nth-child(5)").empty();
      $("#"+update_id+" td:nth-child(6)").empty();
      $(this).attr("update-activated","true");
    }

    else {
      newName = $("#update-name-input").val().trim();
      newDest = $("#update-dest-input").val().trim();
      newTime = $("#update-time-input").val();
      console.log(newTime);
      newRawfreq = $("#update-min-input").val().trim();
          
      if (!(newName == "")) {
        jjdb.orderByChild('Train').equalTo(update_Name)
        .once('value').then(function(snapshot) {
            snapshot.forEach(function(childSnapshot) {
              jjdb.child(childSnapshot.key).set  ({
                Train: newName,
                Destination: newDest,
                StartTime: newTime,
                Freq: newRawfreq,
                dateAdded: firebase.database.ServerValue.TIMESTAMP
              });
            });
        });
      }
      setTimeout(function(){
        $("tbody").empty();
        readFromDb();
      },1200);
    }
  });

$("tbody").on("click","#cancel", function(event) {
  event.preventDefault();
  
  // Grab all the train info from the user inputs and assign to global train variables
  var del_name = $(this).attr("data-name");
  console.log(del_name);
  
  // Code for the push and then calling the database function for printing all current trains
  jjdb.orderByChild('Train').equalTo(del_name)
    .once('value').then(function(snapshot) {
        snapshot.forEach(function(childSnapshot) {
        //remove each child
        jjdb.child(childSnapshot.key).remove();
    });
  });
  $(".show").remove();
  setTimeout(function(){
    $("tbody").empty();
    readFromDb();
  },1200);
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
    numTrains++;
    console.log(numTrains);
    var tr = $('<tr id="'+child.val().Train.replace(/\s+/g, '')+'"</tr>');
    tr.append("<td>"+child.val().Train+"</td>");
    tr.append("<td>"+child.val().Destination+"</td>");
    tr.append("<td>"+child.val().StartTime+"</td>");
    tr.append("<td>"+child.val().Freq+"</td>");
    tr.append('<td>'+next+"</td>");
    tr.append('<td>'+min+"</td>");
    var btnRow = $("<td></td>");
    btnRow.append('<button id="update" type="button" class="btn btn-primary btn-sm" data-name="'+child.val().Train+'" update-activated = "false" style="margin:0 8px 4px 0;">Update</button>');
    btnRow.append('<button id="cancel" type="button" class="btn btn-primary btn-sm" style="margin:0 0 4px 8px;" data-toggle="tooltip" data-placement="auto" data-trigger="hover" data-name="'+child.val().Train+'" title="Will take a sec">Cancel</button>');
    tr.append(btnRow);
    $("tbody").append(tr);
}

// The main f(x) for taking each stored train and calculating its next time to and of arrival  
function calcNextTrain (childSnap) {

  // Calculate the time elapsed from the first train time till now    
    var totalMinNow = moment(moment()).diff(moment(childSnap.val().StartTime,"HH:mm"), "minutes");
  // Convert the first train time to elapsed min from midnight
    var firstTime = moment(moment(childSnap.val().StartTime,"HH:mm")).diff(moment("00:00","HH:mm"),"minutes");
  
  // Calculate the current mins away by subtracting the remainder of (time elapsed from start/frequency) from the interval
    var curMinAway = childSnap.val().Freq-(totalMinNow % parseInt(childSnap.val().Freq));

  // Set the next train time in minutes to the time elapsed from start plus mins away plus the first time it ran in mins
    var nextTime = (totalMinNow+curMinAway) + firstTime;

  // Convert the next train time to a moment of adding the next train time in mins to midnight  
    var nextTimeMom = moment("00:00","HH:mm").add(nextTime,'minutes').format('HH:mm');

  // Call the print all train data f(x) including our calculated next time in correct format and time away to html
    printTrain(childSnap,nextTimeMom,curMinAway);
}

// Set an interval variable
var intervalId;

// A f(x) for setting event child added handler to the database   
function readFromDb () {

  numTrains=0;
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

$('body').tooltip({ selector: '[data-toggle="tooltip"]'});
$(function () {
    $('[data-toggle="tooltip"]').tooltip()
  })