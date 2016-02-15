var map;
var marker;
var Longitude = -1.8822221000000354;
var Latitude = 50.72569620000001;
var zoom = 20;
var bounds = new google.maps.LatLngBounds();
var markers;
var new_marker;
var C;
var infowindow = new google.maps.InfoWindow();
var ib;

function LoadMap() {

    // Create an array of styles.
    var styles = [
        {
            stylers: [
                { saturation: -100 }, { lightness: -100 }
            ]
        },{
            featureType: "all",
            elementType: "all",

        }
    ];

    // Create a new StyledMapType object, passing it the array of styles,
    // as well as the name to be displayed on the map type control.
    //var styledMap = new google.maps.StyledMapType(styles, {name: "Styled Map"});

    var myOptions = {
        zoom: zoom,
        center: new google.maps.LatLng(Latitude, Longitude),
        mapTypeControl: false,
        scaleControl: false,
        streetViewControl: true,
        overviewMapControl: false,
        zoomControl: true,
        mapTypeControlOptions: {
            style:google.maps.MapTypeControlStyle.DROPDOWN_MENU,
            position:google.maps.ControlPosition.LEFT_BOTTOM 
        },
        zoomControlOptions: {
            style: google.maps.ZoomControlStyle.SMALL
        },
        panControl: false,
        mapTypeId: google.maps.MapTypeId.ROADMAP
    }

    map = new google.maps.Map(document.getElementById("map"), myOptions);
}