var map;
var markers = [];

// Declare function which will be used to interact with Foursquare API to retrieve third-party Location information.
var fetchFourSquareInfo = function (data, callback) {
    var clientId = "IQDJFYLUCO1UJ45322HIZZOVQWAQCEJ5NQHWP30X4IJ0RL5G";
    var clientSecret = "2DWL5WIZLGY44PN54M5CC0WUN0FD1OA1ULJYO0N322B5AXYV";
    var url = "https://api.foursquare.com/v2/venues/search?ll=51.45889,0.13946&query=" + 
    data.title() + "&client_id=" + clientId + '&client_secret=' + clientSecret + "&v=20160309";

    $.ajax({
        url: url,
        dataType: 'json',
        data: "",
        // If data is retrieved successfully, process the data in the desired callback function.
        success: function (data) {
            callback(null, data);
        },
        error: function (e) {
        // If data is not retrieved successfully, alert the use to the error.
            callback(e);
            alert("Foursquare data was not retrieved correctly.");
        }
    });
};

// Declare function to initialise the Google Map on the screen and center on London.
function initMap () {
  map = new google.maps.Map(document.getElementById('map'), {
    center: {lat: 51.514573, lng: -0.127846},
    zoom: 15
  });
}
window.onload = initMap();

// Represent a single Location item with title, position, label, and prepare a variable for City information.
var Location = function (title, position, label) {
    this.title = ko.observable(title);
    this.position = ko.observableArray(position);
    this.label = ko.observable(label);
    this.cityLocation = "tbd";
};

// Create 5 unique locations and keep them in an array.
var Locations = [
    new Location("All Star Lanes", [51.519879, -0.122544]),
    new Location("Apple Store", [51.514270, -0.141909]),
    new Location("The Cock Tavern", [51.516785, -0.141403]),
    new Location("Foyles Book Store", [51.514024, -0.129822]),
    new Location("Hamleys", [51.513423, -0.140100])
];

// Setup the ViewModel for the application.
var viewModel = {

    // Map an array of passed in Locations to an observableArray of filtered Location objects.
    // Also prepare for an observable array of markers to be used on the map.
    // Initially, no filter is applied.
    filteredLocations: ko.observableArray(Locations.slice()),
    filteredMarkers: ko.observableArray(),
    query: ko.observable(''),

    // Create Search functionality to update the filteredlocations depending on values in Input.
    // http://opensoul.org/2011/06/23/live-search-with-knockoutjs/ was referred to as an example of 
    // a way to search filter using knockout.
    search: function(value) {
        viewModel.filteredLocations.removeAll();
        viewModel.setMapOnAll(null);
        viewModel.filteredMarkers.removeAll();

        for(var x in Locations) {
          if(Locations[x].title().toLowerCase().indexOf(value.toLowerCase()) >= 0) {
            viewModel.filteredLocations.push(Locations[x]);
          }
        }
        viewModel.applyMarkers();
      },

    // Create function to create a Map Marker for each filtered Location along with InfoWindows, 
    // animmations, and click listeners.
    applyMarkers: function(filteredLocations) {
        viewModel.filteredLocations().forEach(function (Location) {
            var self = Location;
        // set even if value is the same, as subscribers are not notified in that case
            self.marker = new google.maps.Marker({
                position: {lat: Location.position()[0], lng: Location.position()[1]},
                map: map,
                animation: google.maps.Animation.DROP,
                title: 'Hello World!'
            });

            self.infowindow = new google.maps.InfoWindow({
                  content: 'tbd'
            });

            // Make a call to FourSquare API fetch function to populate the infowwindow with City info.
            fetchFourSquareInfo(self, function (e, data){

                if (e) {
                    alert("foursquare failed");
                } else {
                    // cityForLocation
                    self.infowindow.setContent('<div id="content">'+
                      '<div id="siteNotice">'+
                      '</div>'+
                      '<h1 id="firstHeading" class="firstHeading">' + self.title() + '</h1>'+
                      '<div id="bodyContent">'+
                      '<p><b>' + self.title() + '</b> is located in <b>' + data.response.venues[0].location.city + '</b></p>'+
                      '<p>Data gathered from: <a href="https://foursquare.com/">'+
                      'Foursquare</a> '+
                      '</div>'+
                      '</div>');
                }
            });

            // Add click listeners to Map markers and declare actions.
            self.marker.addListener('click', function toggleBounce() {
              self.infowindow.open(map, self.marker);
              if (self.marker.getAnimation() !== null) {
                self.marker.setAnimation(null);
              } else {
                self.marker.setAnimation(google.maps.Animation.BOUNCE);
                setTimeout(function(){ self.marker.setAnimation(null); }, 750);
              }
            });
            viewModel.filteredMarkers().push(self.marker);
            
        })
        viewModel.setMapOnAll(map);
    },

    // If a list item element is clicked, animate the related map marker.
    listClickAction: function (i) {
        viewModel.filteredLocations()[i].marker.setAnimation(google.maps.Animation.BOUNCE);
        setTimeout(function(){ viewModel.filteredLocations()[i].marker.setAnimation(null); }, 750);
    },

    // Apply all created map markers to the Google map initialised in the webpage.
    setMapOnAll: function(map) {

        for (var i = 0; i < viewModel.filteredMarkers().length; i++) {
            viewModel.filteredMarkers()[i].setMap(map);
        }
    }
};

// Initialise the ViewModel and Knockout bindings.
viewModel.query.subscribe(viewModel.search);

viewModel.applyMarkers(viewModel.filteredLocations());

ko.applyBindings(viewModel);