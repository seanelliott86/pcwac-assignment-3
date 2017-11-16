//Maps variables
var mapStyle = [{"featureType":"all","stylers":[{"saturation":0},{"hue":"#e7ecf0"}]},{"featureType":"road","stylers":[{"saturation":-70}]},{"featureType":"transit","stylers":[{"visibility":"off"}]},{"featureType":"poi","stylers":[{"visibility":"off"}]},{"featureType":"water","stylers":[{"visibility":"simplified"},{"saturation":-60}]}],
	iconPaths = "M71.1 64.1c41.5-40.6 91.4-61 149.7-61 58.3 0 108.2 20.3 149.7 61 41.5 40.6 62.3 89.7 62.3 147.1 0 45.9-17.7 101.2-53 165.7 -35.3 64.5-70.7 117.5-106 159l-53 61c-6.2-6.2-13.9-14.8-23.2-25.8 -9.3-11.1-26.1-32.5-50.4-64.3C123 474.9 101.6 444 83.1 414c-18.6-30-35.6-64-51-102C16.6 274 8.8 240.4 8.8 211.2 8.8 153.8 29.6 104.8 71.1 64.1zM167.2 263.6c14.6 14.6 32.5 21.9 53.7 21.9s39.1-7.3 53.7-21.9c14.6-14.6 21.9-32 21.9-52.3 0-20.3-7.3-37.8-21.9-52.3C260 144.3 242.1 137 220.9 137s-39.1 7.3-53.7 21.9c-14.6 14.6-21.9 32-21.9 52.3C145.3 231.5 152.6 249 167.2 263.6z",
	markers = [],
	isDraggable = siteHelpers.mediaquery('desktop') ? true : false,
	mapElement,	input, map, autocompleteFeild, updateFields, aria, autocomplete, openElement,
	googleMapElm = document.querySelector('.js-google-map'),
	hasInfoWindow = googleMapElm.getAttribute('data-info-window'),
	infowindow,
	autoCompleteElem = document.querySelector('.jq-places-autocomplete'),
	locationBtn = document.querySelectorAll('.js-local-click');

function loadAPI(callback) {
	addScript( 'https://maps.googleapis.com/maps/api/js?libraries=places&callback=' + callback);
}


function init(){
	var googleLoaded = typeof google === 'object' && typeof google.maps === 'object';

	if(googleMapElm != null){
		googleLoaded ? renderGoogleMap() : window.onload = loadAPI('renderGoogleMap');
	}
	else if(autoCompleteElem != null){
		googleLoaded ? initialize() : window.onload = loadAPI('initialize');
	}
}

// Generic geolocation script
function geolocate() {
	if (navigator.geolocation) {
		navigator.geolocation.getCurrentPosition(function(position) {
			var pos = {
				lat: position.coords.latitude,
				lng: position.coords.longitude
			};
		  	var geolocation = new google.maps.LatLng(position.coords.latitude, position.coords.longitude);
			var circle = new google.maps.Circle({
				center: geolocation,
				radius: position.coords.accuracy
			});

			if(autoCompleteElem != null) autocomplete.setBounds(circle.getBounds());

			return pos;
		});
	}
	else{
		var pos = new google.maps.LatLng(-24.994167, 134.866944);
		return pos;
	}
}

function renderGoogleMap() {

	// Creating a new map
	map = new google.maps.Map(googleMapElm, {
		zoom: 0,
		styles: mapStyle,
		mapTypeControl: false,
		draggable: isDraggable
	});

	// restrict auto complete to the users location
	var test = geolocate();

	if(autoCompleteElem != null){
		autocomplete = new google.maps.places.Autocomplete(autoCompleteElem,{ types: ['geocode'] });

		autocomplete.addListener('place_changed', function() {
			var place = autocomplete.getPlace();
			if (!place.geometry) {
				window.alert("Autocomplete's returned place contains no geometry");
				return;
			}

			var argObj ={
					Latitude: place.geometry.location.lat(),
					Longitude: place.geometry.location.lng()
				};

				argObj = JSON.stringify(argObj);

			CallStoreLookup(argObj, this);

		});
	}

	setMarkerPoints(map);
}

function storeLookupCallback(arg, context){
	var data = JSON.parse(arg);
	setMarkerPoints(map, data);
}

function setMapOnAll(map) {
  for (var i = 0; i < markers.length; i++) {
    markers[i].setMap(map);
  }
}

/*function clearMarkers() {
  setMapOnAll(null);
  showInfoWindow(false);
}

function deleteMarkers() {
  clearMarkers();
  markers = [];
}*/

function setMarkerPoints(map, dataAdded) {
	var bounds = new google.maps.LatLngBounds(),
		data = (dataAdded !== undefined) ? dataAdded : locationData;

	//deleteMarkers()
	if(data.length !== 0){
		data.forEach(function(marker, index){

			var latLng = new google.maps.LatLng(marker.placeLatitude, marker.placeLongitude);
            bounds.extend(latLng);

            var icon = {
				path: iconPaths,
			    fillColor: '#00447B',
			    fillOpacity: 1,
			    anchor: new google.maps.Point(210,595),
			    strokeWeight: 0,
			    scale: 0.06
			};

            // Creating a marker and putting it on the map
            var marker = new google.maps.Marker({
                position: latLng,
                map: map,
                title: marker.StoreName + " " + marker.StoreDetail,
                icon: icon,
                placeID: marker.placeID,
                storeName: marker.StoreName,
                storeDetail: marker.StoreDetail,
                directions: marker.StoreDirection
            });

            var content = 'Test';

            markers.push(marker);

            map.fitBounds(bounds);

            function zoomLevel(){	
            	var zoomChangeBoundsListener = 
				    google.maps.event.addListener(map, 'bounds_changed', function(event) {
				        if (this.getZoom()){
				            this.setZoom(16);
				        }
					});
				setTimeout(function(){google.maps.event.removeListener(zoomChangeBoundsListener)}, 2000);
            };

            function infoWindowShowHide(marker,justClose){
            	debugger
            	if(hasInfoWindow === "false") return false;

            	if(infowindow) infowindow.close();

            	if(justClose != true){
            		infowindow = new google.maps.InfoWindow();
		           	infowindow.setContent(content);
		           	infowindow.open(map,marker);
            	}
            }

            if(data.length == 1) zoomLevel();

		    google.maps.event.addListener(marker, 'click', function () {

	           	for (var j = 0; j < markers.length; j++) {
			    	var defaultIcon = marker.getIcon();
			    	defaultIcon.fillColor='#00447B';
					markers[j].setIcon(defaultIcon); 
			    }

			    var activeIcon = marker.getIcon();
			    	activeIcon.fillColor='#2CBAAA';
					marker.setIcon(activeIcon);

				infoWindowShowHide(marker, false)

	           	map.panTo(marker.getPosition());

            });

            google.maps.event.addListener(map, 'click', function () {
            	infoWindowShowHide(null, true)

                for (var j = 0; j < markers.length; j++) {
			    	var defaultIcon = marker.getIcon();
			    	defaultIcon.fillColor='#00447B';
					markers[j].setIcon(defaultIcon); 
			    }
            });

            google.maps.event.addDomListener(window, "resize", function() {
				google.maps.event.trigger(map, "resize");
				map.fitBounds(bounds);

				if(data.length == 1) zoomLevel();
			});

		});
	}

	map.fitBounds(bounds);
}


// Autocomplete address functions
function initialize() {

	// autocomplete address variables
	autocompleteFeild =  document.querySelector('.jq-places-autocomplete'),
	updateFields =  document.querySelectorAll('.jq-ac-fields'),
	aria =  document.querySelector('.jq-aria-ac');

	//
	geolocate()

	// Create the autocomplete object, restricting the search
	// to geographical location types.
	//autocomplete = new google.maps.places.Autocomplete(autocompleteFeild,{ types: ['geocode'] });

	// When the user selects an address from the dropdown,
	// populate the address fields in the form.
	google.maps.event.addListener(autocomplete, 'place_changed', function() {
		fillInAddress();
	});
}


function fillInAddress() {
	// Get the place details from the autocomplete object.
	var place = autocomplete.getPlace();

	forEach(updateFields, function (index, value) {
		value.value = '';
		value.disabled = false;
	});


	// Get each component of the address from the place details
	// and fill the corresponding field on the form.

	for (var i = 0; i < place.address_components.length; i++) {
		var addressType = place.address_components[i].types[0],
			field = document.querySelector("[data-ac-field='" + addressType + "']");

		if(addressType == "subpremise" || addressType == "street_number" || addressType == "route" || addressType == "sublocality_level_1"){
			var val,
				field = document.querySelector("[data-ac-field='address']");

			if(addressType == "subpremise")
				val = place.address_components[i]["long_name"]+" /";
			else
				val = (field.value != "") ? field.value + " " + place.address_components[i]["long_name"] : place.address_components[i]["long_name"];

			field.value = val;
		}
		else{
			var field = document.querySelector("[data-ac-field='" + addressType + "']");
			if(field != null)
				field.value = place.address_components[i]["long_name"];
		}
	}
}

forEach(locationBtn, function (index, value) {
 	value.addEventListener('click', function (e) {

 		e.preventDefault();

 		forEach(locationBtn, function (index, value) {
 			value.classList.remove('is-active');
 		});

 		this.classList.add('is-active');
		locationClick(this.getAttribute('data-place-id'))
	}, false);
});

function locationClick(id){

	forEach(markers, function (index, value) {
		if(value.placeID === parseInt(id)) {
			google.maps.event.trigger(value, 'click');
			map.setZoom(16);
		}
	});
}