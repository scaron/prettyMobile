/* ================================================================================
	prettyMobile v1.0
	Copyright 2009, Stéphane Caron
	Released under http://creativecommons.org/licenses/by/2.5/
	More information: http://www.no-margin-for-errors.com/projects/prettyMobile/
=================================================================================== */


/* ------------------------------------------------------------------------
	Bind the nav functions, init variables
------------------------------------------------------------------------- */
	var pageWidth = 0; // Used for the Portrait/Landscpae mode
	var animationDuration = 1000; // Animation duration, used for the callback (please see the CSS for animation speed)
	var hashHistory = new Array();
	var urlHistory = new Array();
	var titleHistory = new Array();
	var hashPrefix = '#_' // To prevent page scroll
	var bottomMargin = 20 // So the content is not flush with the bottom of the page
	var isLoading = false;

	// Document readyness
	if(/Safari/i.test(navigator.userAgent)){
		var _timer=setInterval(function(){
			if(/loaded|complete/.test(document.readyState)){
				clearInterval(_timer)
				documentReady();
			}
		}, 10);
	}

	// Use $ as Sizzle selector
	window.$ = function(selector){
		return Sizzle(selector);
	};

	function documentReady() {
		var ajax = new ajaxRequest('ajax/index.html',function(responseHTML){
			location.hash = '_home';
			hashHistory[hashHistory.length] = 'home';
			urlHistory[urlHistory.length] = 'ajax/index.html';
			titleHistory[titleHistory.length] = $('h1')[0].innerHTML;
			
			$('.pm_in-viewport')[0].innerHTML = responseHTML;
			bindFunctions();
			updateOrientation();

			setInterval(checkHistory, 1000);
		});
		ajax.loadPage();
	};
	
	function bindFunctions(){
		for (var i = $('a[rel*=next]').length - 1; i >= 0; i--){
			$('a[rel*=next]')[i].onclick = function() {
				this.className = this.className + ' loading';
				changePage('next',this.href,this.id,this.title);
				return false;
			}
		};
		
		for (var i = $('a[rel*=previous]').length - 1; i >= 0; i--){
			$('a[rel*=previous]')[i].onclick = function() {
				this.className = this.className + ' loading';
				changePage('previous',this.href,this.id,this.title);
				return false;
			}
		};
		
		for (var i = $('a[rel*=back]').length - 1; i >= 0; i--){
			$('a[rel*=back]')[i].onclick = function() {
				this.className = this.className + ' loading';
				history.back();
				return false;
			}
		};
		
		for (var i = $('a[rel*=tabs]').length - 1; i >= 0; i--){
			$('a[rel*=tabs]')[i].onclick = function() {
				this.className = this.className + ' loading';
				changePage('tabs',this.href,this.id,this.title);
				return false;
			}
		};
		
		// Make sure a user can't click on "swiping" item
		for (var i = $('a[rel*=swipe]').length - 1; i >= 0; i--){
			$('a[rel*=swipe]')[i].onclick = function() {
				this.className = this.className + ' loading';
				return false;
			}
		};

		// // Bind the swipe gestures
		swipe();
	}


/* ------------------------------------------------------------------------
	Change page functions
------------------------------------------------------------------------- */

	changePage = function(direction,page,hash,title,callback){
		// Load the content
		isLoading = true;
		var ajax = new ajaxRequest(page,function(responseHTML){
			isLoading = false;
			
			for (var i = $('.loading').length - 1; i >= 0; i--){
				currentClass = $('.loading')[i].className;
				$('.loading')[i].className = currentClass.substr(0,currentClass.indexOf('loading')) + currentClass.substr(7+currentClass.indexOf('loading'),currentClass.length);
			};
			
			$pm_outofviewport = $('.pm_out-of-viewport')[0]; // used for the tab switching
			$('.pm_out-of-viewport')[0].innerHTML = responseHTML;
			
			fixHeight(direction);
			
			window.scrollTo(0, 1);
			
			window.location.hash = hashPrefix + hash;
			
			if(window.location.hash == "" || window.location.hash == hashPrefix + "home"){
				$('#pm_header .pm_back')[0].style.display = "none";
			}else{
				$('#pm_header .pm_back')[0].style.display = "block";
			}
			
			console.log(title);
			if(title != undefined && title != "" && title != $('.pm_page-title')[0].innerHTML){
				fade($('.pm_page-title')[0]);
				setTimeout(function(){
					$('.pm_page-title')[0].innerHTML = title;
					fade($('.pm_page-title')[0]);
				},(animationDuration/2));
			}
			
			hashHistory[hashHistory.length] = hash;
			urlHistory[urlHistory.length] = page;
			titleHistory[titleHistory.length] = title;
			
			//Slide depending on the direction
			if(direction == 'next'){
				$('.pm_in-viewport')[0].className = $('.pm_in-viewport')[0].className + ' pm_slideOutLeft';
				$('.pm_in-viewport')[0].style.left = '-' + pageWidth;

				$('.pm_out-of-viewport')[0].className = $('.pm_out-of-viewport')[0].className + ' pm_slideInLeft';
				$('.pm_out-of-viewport')[0].style.left = 0;
				
				// Once it's done, reclass the divs properly
				setTimeout(function(){
					$('.pm_slideOutLeft')[0].className = 'pm_out-of-viewport';
					$('.pm_slideInLeft')[0].className = 'pm_in-viewport';
					
					// Rebind the function
					bindFunctions();
					
					if(callback) callback();
				},animationDuration);
			}else if(direction == 'previous'){
				$('.pm_in-viewport')[0].className = $('.pm_in-viewport')[0].className + ' pm_slideOutRight';
				$('.pm_in-viewport')[0].style.left = pageWidth;

				$('.pm_out-of-viewport')[0].className = $('.pm_out-of-viewport')[0].className + ' pm_slideInRight';
				$('.pm_out-of-viewport')[0].style.left = 0;
				
				// Once it's done, reclass the divs properly
				setTimeout(function(){
					$('.pm_slideOutRight')[0].className = 'pm_out-of-viewport';
					$('.pm_slideInRight')[0].className = 'pm_in-viewport';
	
					// Rebind the function
					bindFunctions();
	
					if(callback) callback();
				},animationDuration);
			}else{
				$('.pm_in-viewport')[0].style.left = pageWidth;
				$('.pm_in-viewport')[0].className = 'pm_out-of-viewport';
				$pm_outofviewport.className = 'pm_in-viewport';
				$pm_outofviewport.style.left = 0;
				
				// Rebind the function
				bindFunctions();
			}
		});
		ajax.loadPage();
	}


/* ------------------------------------------------------------------------
	Swipe Nav
------------------------------------------------------------------------- */

	swipe = function(toSwipe){
		if($('.pm_in-viewport a[rel*=swipe]').length == 0) return; // Make sure we can swipe
		
		// Fadeout the gallery caption
		setTimeout(function(){ fade($('.pm_in-viewport .pm_gallery_count')[0]); },2000);

		var startingX = 0; // The swipe init pos
		var dx = 0; // The swipe differente (back/next)

		$('.pm_in-viewport a[rel*=swipe] img')[0].ontouchstart = function(evt){
			evt.preventDefault(); // prevent window scrolling!
			touch = evt.touches[0];
			startingX = touch.pageX;
		}
		
		$('.pm_in-viewport a[rel*=swipe] img')[0].ontouchmove = function(evt){
			evt.preventDefault(); // prevent window scrolling!
			touch = evt.touches[0];
			dx = startingX - touch.pageX;
		}
		$('.pm_in-viewport a[rel*=swipe] img')[0].ontouchend = function(evt){
			if(dx > -10 && dx < 10){
				// When the user clicks, show the current picture, then fade it out.
				$('.pm_in-viewport #pm_gallery_count')[0].style.opacity = 1;
				$('.pm_in-viewport #pm_gallery_count')[0].FadeState = 2;

				// Fadeout the gallery caption
				setTimeout(function(){ fade($('.pm_in-viewport .pm_gallery_count')[0]); },2000);
			}
			
			if(dx > 50) { // Next motion
				if($('.pm_in-viewport a[rel*=last]').length != 0) return; // Make sure we can swipe next
				changePage('next',this.parentNode.href,this.parentNode.id)
			}else if(dx < 50){ // Previous motion
				if($('.pm_in-viewport a[rel*=first]').length != 0) return; // Make sure we can swipe next
				history.back();
			}
		}
	}


/* ------------------------------------------------------------------------------------------------------------------------
	fade function taken from: http://www.switchonthecode.com/tutorials/javascript-tutorial-simple-fade-animation
------------------------------------------------------------------------------------------------------------------------- */

	function fade(element) {
		if(element == null)
			return;

		if(element.FadeState == null) {
			if(element.style.opacity == null || element.style.opacity == '' || element.style.opacity == '1') {
				element.FadeState = 2;
			} else {
				element.FadeState = -2;
			}
		}

		if(element.FadeState == 1 || element.FadeState == -1) {
			element.FadeState = element.FadeState == 1 ? -1 : 1;
			element.FadeTimeLeft = (animationDuration/2) - element.FadeTimeLeft;
		} else {
			element.FadeState = element.FadeState == 2 ? -1 : 1;
			element.FadeTimeLeft = (animationDuration/2);
			setTimeout(function(){
				animateFade(new Date().getTime(),element);
			},33);
		}  
	}
	
	function animateFade(lastTick, element){  
		var curTick = new Date().getTime();
		var elapsedTicks = curTick - lastTick;

		if(element.FadeTimeLeft <= elapsedTicks) {
			element.style.opacity = element.FadeState == 1 ? '1' : '0';
			element.FadeState = element.FadeState == 1 ? 2 : -2;
			return;
		}

		element.FadeTimeLeft -= elapsedTicks;
		var newOpVal = element.FadeTimeLeft/(animationDuration/2);
		if(element.FadeState == 1)
		newOpVal = 1 - newOpVal;

		element.style.opacity = newOpVal;
		element.style.filter = 'alpha(opacity = ' + (newOpVal*100) + ')';

		setTimeout(function(){
			animateFade(curTick,element);
		},33);
	}


/* ------------------------------------------------------------------------
	fix the page height
------------------------------------------------------------------------- */

	function fixHeight(direction){
		for (var i = $('#pm_container,.pm_content-container').length - 1; i >= 0; i--){
			$('#pm_container,.pm_content-container')[i].style.height = '';
		};

		if(direction == 'next' || direction == 'previous' || direction == 'tabs'){
			($('.pm_out-of-viewport')[0].offsetHeight + $('#pm_header')[0].offsetHeight > window.innerHeight) ? pageHeight = $('.pm_out-of-viewport')[0].offsetHeight + $('#pm_header')[0].offsetHeight + bottomMargin : pageHeight = window.innerHeight;
		}else{
			($('.pm_in-viewport')[0].offsetHeight + $('#pm_header')[0].offsetHeight > window.innerHeight) ? pageHeight = $('.pm_in-viewport')[0].offsetHeight + $('#pm_header').offsetHeight + bottomMargin : pageHeight = window.innerHeight;
		}
		
		for (var i = $('#pm_container,.pm_content-container').length - 1; i >= 0; i--){
			$('#pm_container,.pm_content-container')[i].style.height = pageHeight + 'px';
		};
	}
	
	
/* ------------------------------------------------------------------------
	To see if the user changes page
------------------------------------------------------------------------- */
	
	function checkHistory(){
		if(window.location.hash != hashPrefix + hashHistory[hashHistory.length-1] && hashHistory.length != 0){
			for (var i = hashHistory.length - 1; i >= 0; i--){
				if(hashPrefix + hashHistory[i] == window.location.hash){
					if(!isLoading)
						changePage('previous',urlHistory[i],hashHistory[i],titleHistory[i]);
				}
			};
		}
	}


/* ------------------------------------------------------------------------
	Ajax function
------------------------------------------------------------------------- */

	function ajaxRequest(url, callback) {
		self = this; // To fix scoping issue
		
		self.loadPage = function(){
			self.http_request = new XMLHttpRequest();
			self.http_request.onreadystatechange = this.loadDone;
			self.http_request.open('GET', url, true);
			self.http_request.send();
		}
		
		self.loadDone = function(){
			if (self.http_request.readyState == 4) {
				if (self.http_request.status == 200) {
					callback(self.http_request.responseText);
				} else {
					alert('There was a problem with the request.');
				}
			}
		}
	}



/* ------------------------------------------------------------------------
	Orientation functions
------------------------------------------------------------------------- */

	updateOrientation = function() {
		var orientation = window.orientation;
		switch(orientation) {
			case 0:
				pageWidth = 320;
				$('body')[0].className = "pm_portrait";
	        break; 
			case 90:
				pageWidth = 480;
				$('body')[0].className = "pm_landscape";
			break;
			case -90: 
				pageWidth = 480;
				$('body')[0].className = "pm_landscape";
	        break;
			default:
				pageWidth = 320;
				$('body')[0].className = "pm_portrait";
			break;
		}
		pageWidth += 'px';

		$('.pm_out-of-viewport')[0].style.left = pageWidth;
		fixHeight();
	};