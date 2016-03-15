var map;
var markers = [];
var clientID = "IQDJFYLUCO1UJ45322HIZZOVQWAQCEJ5NQHWP30X4IJ0RL5G";
var clientSecret = "2DWL5WIZLGY44PN54M5CC0WUN0FD1OA1ULJYO0N322B5AXYV";

var cityData = [];

var config = {
    apiKey: 'IQDJFYLUCO1UJ45322HIZZOVQWAQCEJ5NQHWP30X4IJ0RL5G',
    authUrl: 'https://foursquare.com/',
    apiUrl: 'https://api.foursquare.com/'
  };

// $.getJSON('https://api.foursquare.com/v2/venues/search?ll=40.7,-74' +
//     '&query=mcdonalds&client_id=' + clientID + 
//     '&client_secret=' + clientSecret,

//     function(data) {
//         $.each(data.response.venues, function(i,venues){
//             console.log(venues.name);
//        });
// });

var foursquare = function (data, callback) {
    //foursqaure
    var clientId = "IQDJFYLUCO1UJ45322HIZZOVQWAQCEJ5NQHWP30X4IJ0RL5G";
    var clientSecret = "2DWL5WIZLGY44PN54M5CC0WUN0FD1OA1ULJYO0N322B5AXYV";
    var foursquareUrl = "https://api.foursquare.com/v2/venues/search?ll=51.45889,0.13946&query=" + 
    data.title() + "&client_id=" + clientId + '&client_secret=' + clientSecret + "&v=20160309";
    //    console.log(foursquareUrl);
       // console.log(data);

    $.ajax({
        url: foursquareUrl,
        dataType: 'json',
        data: "",
        success: function (data) {
            callback(null, data);
        },
        error: function (e) {
            //here we are handling errors incase foursquare fails
            callback(e);
            alert("failed to load foursquare");
        }
    });

};

function initMap () {
  map = new google.maps.Map(document.getElementById('map'), {
    center: {lat: 51.514573, lng: -0.127846},
    zoom: 15
  });

  
}

window.onload = initMap();

// represent a single Location item
var Location = function (title, position, label) {
    this.title = ko.observable(title);
    this.position = ko.observableArray(position);
    this.label = ko.observable(label);
    this.cityLocation = "tbd";
};

var Locations = [
    new Location("All Star Lanes", [51.519879, -0.122544]),
    new Location("Apple Store", [51.514270, -0.141909]),
    new Location("The Cock Tavern", [51.516785, -0.141403]),
    new Location("Foyles Book Store", [51.514024, -0.129822]),
    new Location("Hamleys", [51.513423, -0.140100])
];

// our main view model
var viewModel = {

    // map array of passed in Locations to an observableArray of Location objects
    filteredLocations: ko.observableArray(Locations.slice()),

    filteredMarkers: ko.observableArray(),

    query: ko.observable(''),

    search: function(value) {
        // remove all the current locations, which removes them from the view
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

            foursquare(self, function (e, data){

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
            // console.log(cityForLocation);

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

    setMapOnAll: function(map) {

        for (var i = 0; i < viewModel.filteredMarkers().length; i++) {
            viewModel.filteredMarkers()[i].setMap(map);
        }
    },

    getWikipediaInformation: function(subject){
        
    },

    contentString:'<div id="content">'+
          '<div id="siteNotice">'+
          '</div>'+
          '<h1 id="firstHeading" class="firstHeading">Uluru</h1>'+
          '<div id="bodyContent">'+
          '<p><b>Uluru</b>, also referred to as <b>Ayers Rock</b>, is a large ' +
          'sandstone rock formation in the southern part of the '+
          'Northern Territory, central Australia. It lies 335&#160;km (208&#160;mi) '+
          'south west of the nearest large town, Alice Springs; 450&#160;km '+
          '(280&#160;mi) by road. Kata Tjuta and Uluru are the two major '+
          'features of the Uluru - Kata Tjuta National Park. Uluru is '+
          'sacred to the Pitjantjatjara and Yankunytjatjara, the '+
          'Aboriginal people of the area. It has many springs, waterholes, '+
          'rock caves and ancient paintings. Uluru is listed as a World '+
          'Heritage Site.</p>'+
          '<p>Attribution: Uluru, <a href="https://en.wikipedia.org/w/index.php?title=Uluru&oldid=297882194">'+
          'https://en.wikipedia.org/w/index.php?title=Uluru</a> '+
          '(last visited June 22, 2009).</p>'+
          '</div>'+
          '</div>',
};

// bind a new instance of our view model to the page

viewModel.query.subscribe(viewModel.search);

viewModel.applyMarkers(viewModel.filteredLocations());

viewModel.getWikipediaInformation();

ko.applyBindings(viewModel);