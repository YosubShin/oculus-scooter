
// These variables allow the script to power the wheels of the car.
var FrontLeftWheel : WheelCollider;
var FrontRightWheel : WheelCollider;
var steeringStrength : float = 30;

// These variables are for the gears, the array is the list of ratios. The script
// uses the defined gear ratios to determine how much torque to apply to the wheels.
var GearRatio : float[];
var CurrentGear : int = 0;

// These variables are just for applying torque to the wheels and shifting gears.
// using the defined Max and Min Engine RPM, the script can determine what gear the
// car needs to be in.
var EngineTorque : float = 600.0;
var MaxEngineRPM : float = 3000.0;
var MinEngineRPM : float = 1000.0;
private var EngineRPM : float = 0.0;

var initialAngle : float;

var w : WWW;
var wIssuedAt : long = System.DateTime.Now.Ticks / 10000;

var throttleValue : int = 0;

function Start () {
	// I usually alter the center of mass to make the car more stable. I'ts less likely to flip this way.
	rigidbody.centerOfMass += Vector3(0, -1.0, .15);
	
	initialAngle = SerialRead.GetAngle();
	
	gameObject.Find("player_graphic").animation.wrapMode = WrapMode.Once;
}

function Update () {
	if (Input.GetKeyDown(KeyCode.C)) {
		print("reset is pressed");
		initialAngle = SerialRead.GetAngle();
	}
	
	if (Input.GetKeyDown(KeyCode.R)) {
		print("Respawn");
		
	}
	
	// This is to limith the maximum speed of the car, adjusting the drag probably isn't the best way of doing it,
	// but it's easy, and it doesn't interfere with the physics processing.
	rigidbody.drag = rigidbody.velocity.magnitude * 1250;
	
	// Compute the engine RPM based on the average RPM of the two wheels, then call the shift gear function
	EngineRPM = (FrontLeftWheel.rpm + FrontRightWheel.rpm)/2 * GearRatio[CurrentGear];
	ShiftGears();

	// set the audio pitch to the percentage of RPM to the maximum RPM plus one, this makes the sound play
	// up to twice it's pitch, where it will suddenly drop when it switches gears.
	audio.pitch = Mathf.Abs(EngineRPM / MaxEngineRPM) + 1.0 ;
	// this line is just to ensure that the pitch does not reach a value higher than is desired.
	if ( audio.pitch > 2.0 ) {
		audio.pitch = 2.0;
	}

	// finally, apply the values to the wheels.	The torque applied is divided by the current gear, and
	// multiplied by the user input variable.
//	FrontLeftWheel.motorTorque = EngineTorque / GearRatio[CurrentGear] * Input.GetAxis("Vertical");
//	FrontRightWheel.motorTorque = EngineTorque / GearRatio[CurrentGear] * Input.GetAxis("Vertical");

	var normalizedThrottleValue : float = throttleValue / 20.0;
	
	var keyboardVerticalInput = Input.GetAxis("Vertical");
	if (keyboardVerticalInput != 0) {
		normalizedThrottleValue = keyboardVerticalInput / 2.0;
	}
	FrontLeftWheel.motorTorque = EngineTorque / GearRatio[CurrentGear] * normalizedThrottleValue;
	FrontRightWheel.motorTorque = EngineTorque / GearRatio[CurrentGear] * normalizedThrottleValue;
	
	FrontLeftWheel.brakeTorque = 50;
	FrontRightWheel.brakeTorque = 50;
	
//	print("vertical" + Input.GetAxis("Vertical"));
		
	// the steer angle is an arbitrary value multiplied by the user input.
//	FrontLeftWheel.steerAngle = steeringStrength * Input.GetAxis("Horizontal");
//	FrontRightWheel.steerAngle = steeringStrength * Input.GetAxis("Horizontal");
	
	var theAngle = SerialRead.GetAngle() - initialAngle;
	FrontLeftWheel.steerAngle = theAngle;
	FrontRightWheel.steerAngle = theAngle;
	
//	print(theAngle);
//	requestThrottleValue();
//	print(SerialRead.GetAngle().ToString());
	if (w == null || System.DateTime.Now.Ticks / 10000 - wIssuedAt > 1000) {
//		print(normalizedThrottleValue + " " + rigidbody.velocity.magnitude);
		gameObject.Find("debugtext").GetComponentInChildren(TextMesh).text = "Speed: " + rigidbody.velocity.magnitude.ToString("F1") + " Gas: "+ (normalizedThrottleValue).ToString("F1")+ " Steering: "+(theAngle).ToString("F1");
		wIssuedAt = System.DateTime.Now.Ticks / 10000;
		requestThrottleValue();
	}
	
	if (rigidbody.velocity.magnitude > 0.1) {
		gameObject.Find("player_graphic").animation.wrapMode = WrapMode.Loop;
		gameObject.Find("player_graphic").animation.Play();
	} else {
		gameObject.Find("player_graphic").animation.wrapMode = WrapMode.Once;
	}
}

function requestThrottleValue() {
	var url = "https://api.spark.io/v1/devices/54ff70066672524833180167/get_acc";
	var form : WWWForm = new WWWForm();
	form.AddField("args", "400");
	form.AddField("access_token", "a92eccfad1ac502cc262d68a6e40f62f72435005");
	
	w = WWW(url, form);
	yield w;
	if (!String.IsNullOrEmpty(w.error))
	{
		print(w.error);
	}
	else
	{
		var resultString = w.text;
		var parsed = SimpleJSON.JSON.Parse(resultString);
//		var throttleString : string = parsed["return_value"].AsInt;
//		print(int.TryParse(throttleString, 0));
		
		throttleValue = parsed["return_value"].AsInt;
		
//		var json = new JSON();
//		json.serialized = resultString;
	}
}

function ShiftGears() {
	// this funciton shifts the gears of the vehcile, it loops through all the gears, checking which will make
	// the engine RPM fall within the desired range. The gear is then set to this "appropriate" value.
	if ( EngineRPM >= MaxEngineRPM ) {
		var AppropriateGear : int = CurrentGear;
		
		for ( var i = 0; i < GearRatio.length; i ++ ) {
			if ( FrontLeftWheel.rpm * GearRatio[i] < MaxEngineRPM ) {
				AppropriateGear = i;
				break;
			}
		}
		
		CurrentGear = AppropriateGear;
	}
	
	if ( EngineRPM <= MinEngineRPM ) {
		AppropriateGear = CurrentGear;
		
		for ( var j = GearRatio.length-1; j >= 0; j -- ) {
			if ( FrontLeftWheel.rpm * GearRatio[j] > MinEngineRPM ) {
				AppropriateGear = j;
				break;
			}
		}
		
		CurrentGear = AppropriateGear;
	}
}