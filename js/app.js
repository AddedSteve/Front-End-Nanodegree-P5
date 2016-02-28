/*global ko, Router */
(function () {

    var map;

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

    // represent a single todo item
    var Todo = function (title, completed, position, label) {
        this.title = ko.observable(title);
        this.completed = ko.observable(completed);
        this.position = ko.observableArray(position);
        this.label = ko.observable(label);
        this.editing = ko.observable(false);
    };

    // our main view model
    var ViewModel = function (todos) {

        // map array of passed in todos to an observableArray of Todo objects
        this.todos = ko.observableArray(todos.map(function (todo) {
            return new Todo(todo.title, todo.completed);
        }));

        // store the new todo value being entered
        this.current = ko.observable();

        this.showMode = ko.observable('all');

        this.filteredTodos = ko.computed(function () {
            switch (this.showMode()) {
            case 'active':
                return this.todos().filter(function (todo) {
                    return !todo.completed();
                });
            case 'completed':
                return this.todos().filter(function (todo) {
                    return todo.completed();
                });
            default:
                return this.todos();
            }
        }.bind(this));

        // add a new todo, when enter key is pressed
        this.add = function () {
            var current = this.current().trim();
            if (current) {
                this.todos.push(new Todo(current));
                this.current('');
            }
        }.bind(this);

        // remove a single todo
        this.remove = function (todo) {
            this.todos.remove(todo);
        }.bind(this);

        // remove all completed todos
        this.removeCompleted = function () {
            this.todos.remove(function (todo) {
                return todo.completed();
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

        // count of all completed todos
        this.completedCount = ko.computed(function () {
            return this.todos().filter(function (todo) {
                return todo.completed();
            }).length;
        }.bind(this));

        // count of todos that are not complete
        this.remainingCount = ko.computed(function () {
            return this.todos().length - this.completedCount();
        }.bind(this));

        // writeable computed observable to handle marking all complete/incomplete
        this.allCompleted = ko.computed({
            //always return true/false based on the done flag of all todos
            read: function () {
                return !this.remainingCount();
            }.bind(this),
            // set all todos to the written value (true/false)
            write: function (newValue) {
                this.todos().forEach(function (todo) {
                    // set even if value is the same, as subscribers are not notified in that case
                    todo.completed(newValue);
                });
            }.bind(this)
        });

        // helper function to keep expressions out of markup
        this.getLabel = function (count) {
            return ko.utils.unwrapObservable(count) === 1 ? 'item' : 'items';
        }.bind(this);

        // internal computed observable that fires whenever anything changes in our todos
        ko.computed(function () {
            // store a clean copy to local storage, which also creates a dependency on
            // the observableArray and all observables in each item
            localStorage.setItem('todos-knockoutjs', ko.toJSON(this.todos));
        }.bind(this)).extend({
            rateLimit: { timeout: 500, method: 'notifyWhenChangesStop' }
        }); // save at most twice per second

        this.todos.push(new Todo("Bowling", false, [51.519879, -0.122544], 'A'));
        this.todos.push(new Todo("Computer Store", true, [51.514270, -0.141909], 'B'));
        this.todos.push(new Todo("Pub", false, [51.516785, -0.141403], 'C'));
        this.todos.push(new Todo("Book Store", false, [51.514024, -0.129822], 'D'));
        this.todos.push(new Todo("Bar", false, [51.515300, -0.129249], 'E'));


        this.filteredTodos().forEach(function (todo) {
            // set even if value is the same, as subscribers are not notified in that case
            var marker = new google.maps.Marker({
                position: {lat: todo.position()[0], lng: todo.position()[1]},
                label: todo.label(),
                map: map,
                title: 'Hello World!'
            });
            marker.addListener('click', toggleBounce);
        });

        function toggleBounce() {
          if (marker.getAnimation() !== null) {
            marker.setAnimation(null);
          } else {
            marker.setAnimation(google.maps.Animation.BOUNCE);
          }
        }
       
      //   var marker = new google.maps.Marker({
      //   position: {lat: this.todos.length, lng: this.todos.length},
      //   label: "A",
      //   map: map,
      //   title: 'Hello World!'
      // });

      // var marker2 = new google.maps.Marker({
      //   position: {lat: 51.514270, lng: -0.141909},
      //   label: "B",
      //   map: map,
      //   title: 'Hello World!'
      // });

      // var marker3 = new google.maps.Marker({
      //   position: {lat: 51.516785, lng: -0.141403},
      //   label: "C",
      //   map: map,
      //   title: 'Hello World!'
      // });

      // var marker2 = new google.maps.Marker({
      //   position: {lat: 51.514024, lng: -0.129822},
      //   label: "D",
      //   map: map,
      //   title: 'Hello World!'
      // });

      // var marker2 = new google.maps.Marker({
      //   position: {lat: 51.515300, lng: -0.129249},
      //   label: "E",
      //   map: map,
      //   title: 'Hello World!'
      // });
    };

    // check local storage for todos
    // var todos = ko.utils.parseJson(localStorage.getItem('todos-knockoutjs'));
    var todos = [];

    // bind a new instance of our view model to the page
    var viewModel = new ViewModel(todos || []);
    ko.applyBindings(viewModel);

    // set up filter routing
    /*jshint newcap:false */
    Router({ '/:filter': viewModel.showMode }).init();
}()); 


