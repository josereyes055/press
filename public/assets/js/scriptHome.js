$(function() {

	// Initialize the Reveal.js library with the default config options
	// See more here https://github.com/hakimel/reveal.js#configuration

	Reveal.initialize({
		history: true,		// Every slide will change the URL
		controls: false,
		width: 1280,
		height: 720,
	});
	//Reveal.toggleOverview( false );
	
	// Connect to the socket

	var socket = io();

	// Variable initialization

	var form = $('form.login');
	var secretTextBox = form.find('input[type=text]');
	var presentation = $('.reveal');

	var key = "", text = "", animationTimeout;

	// When the page is loaded it asks you for a key and sends it to the server

	form.submit(function(e){

		e.preventDefault();

		//key = secretTextBox.val().trim();
		key = "Dilian";

		// If there is a key, send it to the server-side
		// through the socket.io channel with a 'load' event.

		if(key.length) {
			socket.emit('load', {
				key: key
			});
		}

	});

	$("#creencia").submit(function( e ){
		e.preventDefault();
		text = $("#newIdea").val();
		
		
		if( text !== ""){
			$("#newIdea").val("");
			socket.emit('ideaRecieved', {
				idea: text, 
				holder: "#ideaHolder"
			});
		}
		
	});

	$("#proposito").submit(function( e ){
		e.preventDefault();
		text = $("#newPurpose").val();
		
		
		if( text !== ""){
			$("#newPurpose").val("");
			socket.emit('ideaRecieved', {
				idea: text, 
				holder: "#purposeHolder"
			});
		}
		
	});

	var votationEnabled = false;
	var numVotes = 0;
	
	
	
	$(document).on('click', '.postit', function( e ) {
		obj = e.target;
		id = obj.id;
		

		if( votationEnabled ){
			numVotes ++;
			if( numVotes >= 5){
				votationEnabled = false;
			}
			socket.emit('ideaVoted', {
				id: id
			});
		}
		
  	});
	// The server will either grant or deny access, depending on the secret key

	socket.on('access', function(data){

		// Check if we have "granted" access.
		// If we do, we can continue with the presentation.

		if(data.access === "granted") {

			// Unblur everything
			presentation.removeClass('blurred');

			form.hide();

			var ignore = false;

			$(window).on('hashchange', function(){

				// Notify other clients that we have navigated to a new slide
				// by sending the "slide-changed" message to socket.io

				if(ignore){
					// You will learn more about "ignore" in a bit
					return;
				}

				var hash = window.location.hash;

				socket.emit('slide-changed', {
					hash: hash,
					key: key
				});
			});

			socket.on('navigate', function(data){
	
				// Another device has changed its slide. Change it in this browser, too:

				window.location.hash = data.hash;

				// The "ignore" variable stops the hash change from
				// triggering our hashchange handler above and sending
				// us into a never-ending cycle.

				ignore = true;

				setInterval(function () {
					ignore = false;
				},100);

			});

			socket.on('enableVotation', function(){
				$("#creencia").hide();
				$(".placeHolder").addClass("voting");
				votationEnabled = true;
			});

			socket.on('enableVotation2', function(){
				$("#proposito").hide();
				$(".placeHolder").addClass("voting");
				numVotes = 0;
				votationEnabled = true;
			});



			socket.on('newIdea', function(data){

				$(data.holder).append( '<div class="postit" id="'+data.key+'">'+data.idea+'<span id="vote'+data.key+'">0</span></div>' );
		
			});

			socket.on('voteRecieved', function(data){

				obj = document.getElementById("vote"+data.id);
				cant = parseInt( obj.innerHTML);
				cant ++;
				obj.innerHTML = cant;

			});

			
			socket.on('command', function(data){

				switch( data.command){
					case "play":
						$('#'+data.id).get(0).play();
						break;
					case "stop":
						$('#'+data.id).get(0).pause();
						break;
					case "seek":
						video = document.getElementById(data.id);
						//console.log( data.time );
						tiempo = Math.floor( data.time );
						video.currentTime = tiempo;
						break;
				}
		
			});

		}
		else {

			// Wrong secret key

			clearTimeout(animationTimeout);

			// Addding the "animation" class triggers the CSS keyframe
			// animation that shakes the text input.

			secretTextBox.addClass('denied animation');
			
			animationTimeout = setTimeout(function(){
				secretTextBox.removeClass('animation');
			}, 1000);

			form.show();
		}

	});

});