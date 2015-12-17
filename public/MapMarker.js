
LLtoXYZ = function( radius, ll )
{
  var lat = ll.latitude;
  var lon = ll.longitude;
  var theta = (Math.PI/180.0) * (90.0 - lat);
  var phi = (Math.PI/180.0) * (180.0 + lon);
  return PTtoXYZ( radius, phi, theta );
}

PTtoXYZ = function( radius, phi, theta )
{
    var x = - radius * Math.cos( phi ) * Math.sin( theta );
	  var y = radius * Math.cos( theta );
		var z = radius * Math.sin( phi ) * Math.sin( theta );
    return {x:x,y:y,z:z};
}

TextSprite = function( myString, myCoords, callback )
  {
    var canvas = document.createElement('canvas');
    var ctx = canvas.getContext('2d');
    var fsize = 20;
    var myFont = fsize + "px Open Sans,sans-serif";
    ctx.font = myFont;
    var metrics = ctx.measureText(myString);
    canvas.width = metrics.width * 2 + 10;
    canvas.height = fsize * 4;
    ctx.fillStyle = "rgba(255,255,255,0.0)";
    ctx.fillRect(canvas.width/2, 0, canvas.width, canvas.height/4);
    ctx.fillStyle = "rgba(255,255,255,1.0)";
    ctx.fillRect(canvas.width/2-2, 0, 4, canvas.height/2);
    ctx.fillStyle = "rgba(255,255,255,1.0)";//"rgb(0,0,0)";
    ctx.font = myFont;
    ctx.fillText(myString, canvas.width/2 + 2, fsize * 0.75);

    var loader = new THREE.TextureLoader();

    loader.load( canvas.toDataURL(),
    function ( spriteMap ) {
      spriteMap.minFilter = THREE.NearestFilter;
      var spriteMaterial = new THREE.SpriteMaterial({ map: spriteMap,
                                                      fog: true,
                                                      depthWrite: false,
                                                      depthTest: false } );

      var sprite = new THREE.Sprite( spriteMaterial );
      sprite.scale.set( canvas.width * 0.1, canvas.height * 0.1, 0 );
      sprite.position.set( myCoords.x, myCoords.y, myCoords.z );
      callback(sprite);
    	},
      undefined,
    	function ( xhr ) {
    		console.log( 'An error happened' );
    	}
   )
  };
