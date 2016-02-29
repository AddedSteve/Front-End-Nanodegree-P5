/*global ko, Router */
(function () {

    var map;
    var markers = [];

    function initMap () {
      map = new google.maps.Map(document.getElementById('map'), {
        center: {lat: 51.514573, lng: -0.127846},
        zoom: 15
      });

      
    }

    window.onload = initMap();

    

    'use strict';

    var ENTER_KEY = 13;
    var ESCAPE_KEY = 27;

    // A factory function we can use to create binding handlers for specific
    // keycodes.
    function keyhandlerBindingFactory(keyCode) {
        return {
            init: function (element, valueAccessor, allBindingsAccessor, data, bindingContext) {
                var wrappedHandler, newValueAccessor;

                // wrap the handler with a check for the enter key
                wrappedHandler = function (data, event) {
                    if (event.keyCode === keyCode) {
                        valueAccessor().call(this, data, event);
                    }
                };

                // create a valueAccessor with the options that we would want to pass to the event binding
                newValueAccessor = function () {
                    return {
                        keyup: wrappedHandler
                    };
                };

                // call the real event binding's init function
                ko.bindingHandlers.event.init(element, newValueAccessor, allBindingsAccessor, data, bindingContext);
            }
        };
    }

    // a custom binding to handle the enter key
    ko.bindingHandlers.enterKey = keyhandlerBindingFactory(ENTER_KEY);

    // another custom binding, this time to handle the escape key
    ko.bindingHandlers.escapeKey = keyhandlerBindingFactory(ESCAPE_KEY);

    // wrapper to hasFocus that also selects text and applies focus async
    ko.bindingHandlers.selectAndFocus = {
        init: function (element, valueAccessor, allBindingsAccessor, bindingContext) {
            ko.bindingHandlers.hasFocus.init(element, valueAccessor, allBindingsAccessor, bindingContext);
            ko.utils.registerEventHandler(element, 'focus', function () {
                element.focus();
            });
        },
        update: function (element, valueAccessor) {
            ko.utils.unwrapObservable(valueAccessor()); // for dependency
            // ensure that element is visible before trying to focus
            setTimeout(function () {
                ko.bindingHandlers.hasFocus.update(element, valueAccessor);
            }, 0);
        }
    };

    // represent a single Location item
    var Location = function (title, completed, position, label) {
        this.title = ko.observable(title);
        this.completed = ko.observable(completed);
        this.position = ko.observableArray(position);
        this.label = ko.observable(label);
        this.editing = ko.observable(false);
    };

    // our main view model
    var ViewModel = function (Locations) {

        // map array of passed in Locations to an observableArray of Location objects
        this.Locations = ko.observableArray(Locations.map(function (Location) {
            return new Location(Location.title, Location.completed);
        }));

        // store the new Location value being entered
        this.current = ko.observable();

        this.showMode = ko.observable('all');

        this.filteredLocations = ko.computed(function () {
            switch (this.showMode()) {
            case 'active':
                return this.Locations().filter(function (Location) {
                    return !Location.completed();
                });
            case 'completed':
                return this.Locations().filter(function (Location) {
                    return Location.completed();
                });
            default:
                return this.Locations();
            }
        }.bind(this));

        // add a new Location, when enter key is pressed
        this.add = function () {
            var current = this.current().trim();
            if (current) {
                this.Locations.push(new Location(current));
                this.current('');
            }
        }.bind(this);

        // remove a single Location
        this.remove = function (Location) {
            this.Locations.remove(Location);
        }.bind(this);

        // remove all completed Locations
        this.removeCompleted = function () {
            this.Locations.remove(function (Location) {
                return Location.completed();
            });
        }.bind(this);

        // edit an item
        this.editItem = function (item) {
            item.editing(true);
            item.previousTitle = item.title();
        }.bind(this);

        // stop editing an item.  Remove the item, if it is now empty
        this.saveEditing = function (item) {
            item.editing(false);

            var title = item.title();
            var trimmedTitle = title.trim();

            // Observable value changes are not triggered if they're consisting of whitespaces only
            // Therefore we've to compare untrimmed version with a trimmed one to chech whether anything changed
            // And if yes, we've to set the new value manually
            if (title !== trimmedTitle) {
                item.title(trimmedTitle);
            }

            if (!trimmedTitle) {
                this.remove(item);
            }
        }.bind(this);

        // cancel editing an item and revert to the previous content
        this.cancelEditing = function (item) {
            item.editing(false);
            item.title(item.previousTitle);
        }.bind(this);

        // count of all completed Locations
        this.completedCount = ko.computed(function () {
            return this.Locations().filter(function (Location) {
                return Location.completed();
            }).length;
        }.bind(this));

        // count of Locations that are not complete
        this.remainingCount = ko.computed(function () {
            return this.Locations().length - this.completedCount();
        }.bind(this));

        // writeable computed observable to handle marking all complete/incomplete
        this.allCompleted = ko.computed({
            //always return true/false based on the done flag of all Locations
            read: function () {
                return !this.remainingCount();
            }.bind(this),
            // set all Locations to the written value (true/false)
            write: function (newValue) {
                this.Locations().forEach(function (Location) {
                    // set even if value is the same, as subscribers are not notified in that case
                    Location.completed(newValue);
                });
            }.bind(this)
        });

        // helper function to keep expressions out of markup
        this.getLabel = function (count) {
            return ko.utils.unwrapObservable(count) === 1 ? 'item' : 'items';
        }.bind(this);

        // internal computed observable that fires whenever anything changes in our Locations
        ko.computed(function () {
            // store a clean copy to local storage, which also creates a dependency on
            // the observableArray and all observables in each item
            localStorage.setItem('Locations-knockoutjs', ko.toJSON(this.Locations));
        }.bind(this)).extend({
            rateLimit: { timeout: 500, method: 'notifyWhenChangesStop' }
        }); // save at most twice per second

        this.Locations.push(new Location("All Star Lanes", true, [51.519879, -0.122544], 'A'));
        this.Locations.push(new Location("Apple Store", false, [51.514270, -0.141909], 'B'));
        this.Locations.push(new Location("The Cock Tavern", true, [51.516785, -0.141403], 'C'));
        this.Locations.push(new Location("Foles", false, [51.514024, -0.129822], 'D'));
        this.Locations.push(new Location("Bar", true, [51.515300, -0.129249], 'E'));

        var contentString = '<div id="content">'+
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
              '</div>';

          

        this.filteredLocations().forEach(function (Location) {
            // set even if value is the same, as subscribers are not notified in that case
            var marker = new google.maps.Marker({
                position: {lat: Location.position()[0], lng: Location.position()[1]},
                label: Location.label(),
                map: map,
                animation: google.maps.Animation.DROP,
                title: 'Hello World!'
            });

            var infowindow = new google.maps.InfoWindow({
                content: contentString
            });

            marker.addListener('click', function toggleBounce() {
              infowindow.open(map, marker);
              if (marker.getAnimation() !== null) {
                marker.setAnimation(null);
              } else {
                marker.setAnimation(google.maps.Animation.BOUNCE);
                setTimeout(function(){ marker.setAnimation(null); }, 750);
              }
            });
        });

        
    };

    // check local storage for Locations
    // var Locations = ko.utils.parseJson(localStorage.getItem('Locations-knockoutjs'));
    var Locations = [];

    // bind a new instance of our view model to the page
    var viewModel = new ViewModel(Locations || []);
    ko.applyBindings(viewModel);

    // set up filter routing
    /*jshint newcap:false */
    Router({ '/:filter': viewModel.showMode }).init();
}()); 


