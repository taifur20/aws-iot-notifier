/*

MRAA - Low Level Skeleton Library for Communication on GNU/Linux platforms
Library in C/C++ to interface with Galileo & other Intel platforms, in a structured and sane API with port nanmes/numbering that match boards & with bindings to javascript & python.

Steps for installing MRAA & UPM Library on Intel IoT Platform with IoTDevKit Linux* image
Using a ssh client: 
1. echo "src maa-upm http://iotdk.intel.com/repos/1.1/intelgalactic" > /etc/opkg/intel-iotdk.conf
2. opkg update
3. opkg upgrade

*/
var awsIot = require('aws-iot-device-sdk'); //require for aws iot 
var mraa = require('mraa'); //require mraa for analog/digital read/write
console.log('MRAA Version: ' + mraa.getVersion()); //write the mraa version to the console

var myThingName = 'raspberry-pi';

var thingShadows = awsIot.thingShadow({
   keyPath: './b91fc77cfb-private.pem.key',
  certPath: './b91fc77cfb-certificate.pem.crt',
    caPath: './rootCA.pem',
  clientId: myThingName,
    region: 'us-west-2'
});

mythingstate = {
  "state": {
    "reported": {
      "ip": "unknown"
    }
  }
}

var networkInterfaces = require( 'os' ).networkInterfaces( );
mythingstate["state"]["reported"]["ip"] = networkInterfaces['wlan0'][0]['address'];

var temperaturePin = new mraa.Aio(2); //setup access analog input Analog pin #2 (A2)
var humidityPin = new mraa.Aio(1); //setup access analog input Analog pin #1 (A1)
var temperatureValue = temperaturePin.read(); //read the value of the analog pin
var humidityValue = humidityPin.read();
console.log(temperatureValue); //write the value of the analog pin to the console
console.log(humidityValue);

// calculate humidity
var humVoltage = ((humidityValue*5.0)/1023.0);
var humidity = (3.71*Math.pow(humVoltage,3))-(20.65*Math.pow(humVoltage,2))+(64.81*humVoltage)-27.44;
console.log(humidity);

// calculate temperature
var tmpVoltage = ((temperatureValue*5.0)/1023.0); // convert analog value to voltage
var temperature = (5.26*Math.pow(tmpVoltage,3))-(27.34*Math.pow(tmpVoltage,2))+(68.87*tmpVoltage)-17.81;
console.log(temperature);


  thingShadows.on('connect', function() {
  console.log("Connected...");
  console.log("Registering...");
  thingShadows.register( myThingName );

  // An update right away causes a timeout error, so we wait about 2 seconds
  setTimeout( function() {
    console.log("Updating my IP address...");
    clientTokenIP = thingShadows.update(myThingName, mythingstate);
    console.log("Update:" + clientTokenIP);
  }, 2500 );


  // Code below just logs messages for info/debugging
  thingShadows.on('status',
    function(thingName, stat, clientToken, stateObject) {
       console.log('received '+stat+' on '+thingName+': '+
                   JSON.stringify(stateObject));
    });

  thingShadows.on('update',
      function(thingName, stateObject) {
         console.log('received update '+' on '+thingName+': '+
                     JSON.stringify(stateObject));
      });

  thingShadows.on('delta',
      function(thingName, stateObject) {
         console.log('received delta '+' on '+thingName+': '+
                     JSON.stringify(stateObject));
      });

  thingShadows.on('timeout',
      function(thingName, clientToken) {
         console.log('received timeout for '+ clientToken)
      });

  thingShadows
    .on('close', function() {
      console.log('close');
    });
  thingShadows
    .on('reconnect', function() {
      console.log('reconnect');
    });
  thingShadows
    .on('offline', function() {
      console.log('offline');
    });
  thingShadows
    .on('error', function(error) {
      console.log('error', error);
    });
	
  
  //Watch for temperature & humidity
if(temperature > 35 && humidity < 60){//SNS terget: arn:aws:sns:us-west-2:316723939866:TemperaturAlarm
   thingShadows.publish('arn:aws:sns:us-west-2:316723939866:TemperaturAlarm', 
                        'Your room temperature is greater than 35deg C');
   }
if(humidity > 60 && temperature < 35){
   thingShadows.publish('arn:aws:sns:us-west-2:316723939866:TemperaturAlarm', 
                        'Humidity is greater than 60% which is not desireable');
   }
if(humidity > 60 && temperature > 35){
   thingShadows.publish('arn:aws:sns:us-west-2:316723939866:TemperaturAlarm', 
                        'Both, Humidity & Temperature are in abnormal condition');
   }

});
