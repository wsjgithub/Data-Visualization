/*
* Assignment 1 Data Visualization
*Eric Wang
*/
//ajax=======================
var googleDistanceKey = "AIzaSyDFr5SMhfJSNFVLUWhzmLEorS8i8NsNzTM";
var googleGeocodingKey = "AIzaSyDxhvKWDvW2_1FiJPVptBeAdo3KcwrQMIY";
var allBalls = [];
var dataDisplayed;

function getData(_origin,_destination){
  var transportation = "";
  var origin = parseLocation(_origin);
  var destination = parseLocation(_destination);
  var originReqeust = "https://maps.googleapis.com/maps/api/geocode/json?address="+origin+"&key="+googleGeocodingKey;
  var destinationReqeust = "https://maps.googleapis.com/maps/api/geocode/json?address="+destination+"&key="+googleGeocodingKey;
  var originLocation;
  var destinationLocation;
  ($("#transportation input:radio")).each(function(){
    if($(this).prop("checked")){
      transportation = $(this).prop("value");
    }
  });
  $.getJSON(originReqeust, { get_param: 'value' }, function(data) {
      console.log("origin");
      console.log(data.results[0].geometry.location);
      originLocation = data.results[0].geometry.location;
  }).done(function(){

    $.getJSON(destinationReqeust, { get_param: 'value' }, function(data) {
        console.log("destination");
        console.log(data.results[0].geometry.location);
        destinationLocation = data.results[0].geometry.location;
    }).done(function(){
      var carbonRequest = "https://api.commutegreener.com/api/co2/emissions?startLat="+originLocation.lat+"&startLng="+originLocation.lng+"&endLat="+destinationLocation.lat+"&endLng="+destinationLocation.lng+"&format=json"
      $.ajax({
        dataType: 'jsonp',
        url: carbonRequest,
        data: { get_param: 'value' },
        success: function(data) {
            var emission = {car:data.emissions[7].totalCo2,
                            train:data.emissions[2].totalCo2,
                            plane:data.emissions[9].totalCo2};
            var distance = data.emissions[7].routedDistance;
            console.log("transportation"+emission[transportation]);
            console.log("routed distance"+distance);
            //put animation here @@@@@@@@@@@@@@@@@@@@@@@@@
            animate(Math.round(emission[transportation]/1000));
            //show data on cavas
            if(dataDisplayed){
              dataDisplayed.visible = false;
            }
            dataDisplayed = new PointText({
          	  point: [10, view.viewSize.height-80],
          	  fillColor: 'rgb(50,60,80)',
              fontSize:20,
              content: 'CO2 Emission: '+(emission[transportation]/1000).toFixed(1)+" kg"+"\nDistance: "+(distance/1609).toFixed(1)+" miles"+"\nEach ball represents 1 kg of CO2"
            });
        }
      });

    });

  });

};


//Unused code ==============================================
function getDistance(_origin,_destination){
  var origin = _origin;
  var destination = _destination;
  var distanceRequest = "https://maps.googleapis.com/maps/api/distancematrix/json?units=metric&origins="+origin+"&destinations="+destination+"&key="+googleDistanceKey;

  $.getJSON(distanceRequest, { get_param: 'value' }, function(data) {
      console.log(data.rows[0].elements[0].distance.value);
  });

}
//Unused ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^


//animation ===============================================================
var fires = [];
var intervalID;
var ballInterval = 50;
function animate(number){
  console.log("animate"+number);
  //testing
  for(var i=0;i<allBalls.length;i++){
    allBalls[i].hide();
  }
  if(number<=0){
    return;
  }
  window.clearInterval(intervalID);
  var counter =0;
  intervalID = window.setInterval(function(){
    if(counter>=number){
      window.clearInterval(intervalID);
    }
    var position = new Point(Math.random()*100+0.5*view.viewSize.width-50,view.viewSize.height*0.9-Math.random()*50),
      vector = (Point.random() - 0.5) * 30;
      ball = new Ball(position, vector);
      allBalls.push(ball);
      counter++;
      // if(counter>=number){
      //   window.clearInterval(intervalID);
      // }
  },ballInterval);

  for(var i=0;i<fires.length;i++){
    fires[i].hide();
  }
  for(var i=0;i<6;i++){
    // var f = new Fire(Math.random()*600+100,700-Math.random()*200,Math.random()*100+50,0,Math.random()+5);
    var f = new Fire(0.5*view.viewSize.width,view.viewSize.height*0.9,Math.random()*number+Math.round(number)*0.6,0,Math.random()+5);
    fires.push(f);
  }
}
//animation ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^

//read input=================================================
$("#submit").on("click",function(){

  var origin = $("#origin input").val();
  var destination = $("#destination input").val();
  if(origin!==""&&destination!==""){
    origin = parseLocation(origin);
    destination = parseLocation(destination);
      getData(origin,destination);
    } else{
    $("#error").html("Please provide an input");
    console.log("provide an input");
  }
  $(".city-list").css("display","none");
});
$("#demo").on("click",function(){
  getData("New York NY","Rochester NY");
});
$("#demo1").on("click",function(){
  getData("Los Angeles CA","Seattle WA");
});

function parseLocation(loc){
  var trim = loc.trim();
  //var commat = trim.replace(/,/g, "+"); console.log(replace);
  var replace = trim.replace(/ |,/g, "+");
  var result = replace.replace(/\+([^\+]*)$/,',$1');
  return result;
}
//read input^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^

//fire=============================================================
  var Fire = function(_x,_y,_size,_angle,_movement){
    this.x = _x;
    this.y = _y;
    this.size = _size;
    this.angle = _angle;
    this.movement = _movement;
    var bottomPoint = new Point(this.x,this.y);
    var topPoint = new Point(this.x,this.y-this.size);
    var pathFire = new Path();
    var seg1 = new Segment(bottomPoint,null,null);
    var seg2 = new Segment(topPoint,null,null);
    var seg3 = new Segment(bottomPoint,null,null);
    pathFire.add(seg1,seg2,seg3);
    var red = 150+Math.random();
    var gradient = new Gradient(['white','yellow','red','orange'],true);
    pathFire.fillColor = new Color(gradient,bottomPoint,topPoint);

    //parameter that keep fire out of sync
    var sync = Math.random()*5;

    //rotate
    pathFire.rotate(this.angle);

    //function to move the fire
    this.animate = function(time){
      var vector = pathFire.segments[1].point - pathFire.segments[0].point;
      var yMovement = Math.cos(time*speed+1.2+sync) * this.size*0.05*this.movement;
      var xMovement = Math.cos(time*speed+1.2+sync) * this.size*0.05*this.movement;
      var moveAngle = Math.cos((time+3)*speed) * 10;
      var move = new Point(xMovement*1,yMovement*2);
      move.angle = move.angle+90;
      pathFire.segments[1].point = topPoint+move;
      // pathFire.segments[0].point = bottomPoint+Math.sin(time*speed*0.7+1.2) * 50*this.movement;
      // pathFire.segments[2].point = bottomPoint+Math.sin(time*speed*0.7+1.2) * 50*this.movement;
      pathFire.segments[0].handleOut= new Point({angle:vector.angle+1*moveAngle,length:0.3*vector.length});
      pathFire.segments[2].handleIn= new Point({angle:vector.angle+1*moveAngle,length:0.3*vector.length});
      pathFire.segments[1].handleIn = new Point({angle:vector.angle-210+2*moveAngle,length:0.7*vector.length});
      pathFire.segments[1].handleOut = new Point({angle:vector.angle+210+2*moveAngle,length:0.7*vector.length});
    }
    this.hide = function(){
      pathFire.visible = false;
    }
    this.move = function(x,y){
      pathFire.position = new Point(x,y);
    }

  };


//ball =====================================================================================
/*
*code is taken from Paper js example bouncing balls: http://paperjs.org/examples/bouncing-balls/
*/

var Ball = function(point, vector) {
	if (!vector || vector.isZero()) {
		this.vector = Point.random() * 5-2.5;
	} else {
		this.vector = vector * 2;
	}
	this.point = point;
	this.dampen = 0.2;
	this.gravity = -0.01;
	this.bounce = -0.15;

	var color = {
		hue: Math.random() * 360,
		saturation: 0.3,
		brightness: 1
	};
	var gradient = new Gradient(['white',color ], true);

	// var radius = this.radius = 20 * Math.random() + 10;
  	var radius = this.radius = 20;
	// Wrap CompoundPath in a Group, since CompoundPaths directly
	// applies the transformations to the content, just like Path.
	this.ball = new Path.Circle({radius: radius});
	this.ball.fillColor = new Color(gradient, 0, radius, radius / 8);
	this.item = new Group({
		children: [this.ball],
		transformContent: false,
		position: this.point
	});
}

Ball.prototype.iterate = function() {
	var size = view.size;
	this.vector.y += this.gravity;
	this.vector.x *= 0.99;
	var pre = this.point + this.vector;
	if (pre.x < this.radius || pre.x > size.width - this.radius)
		this.vector.x *= -this.dampen;
	if (pre.y < this.radius || pre.y > size.height - this.radius) {
		//if (Math.abs(this.vector.x) < 3)
		//	this.vector = Point.random() * [150, 100] + [-75, 20];
		this.vector.y *= this.bounce;
	}

	var max = Point.max(this.radius, this.point + this.vector);
	this.item.position = this.point = Point.min(max, size - this.radius);
	this.item.rotate(this.vector.x);
};

Ball.prototype.hide = function(){
  this.ball.visible = false;
}
//Ball^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^


// var textItem = new PointText({
// 	point: [view.viewSize.width*0.05, view.viewSize.height*0.95],
// 	fillColor: 'black',
// 	content: 'Each ball represents 1kg CO2'
// });

var speed = 5;

function onFrame(event) {
	for (var i = 0, l = allBalls.length; i < l; i++){
		allBalls[i].iterate();
  }
  for(var i=0;i<fires.length;i++){
      fires[i].animate(event.time);
    }
}

//form  handling
$("#origin-destination input").on("click",function(){
  $(".city-list").css("display","block");
  $("#error").html("");
  //clear active
  $("#origin-destination input").removeClass("active");
  $(this).addClass("active");
});
$(".city-list ul li").on("click",function(){
  $("#origin-destination input.active").val($(this).html());
});
