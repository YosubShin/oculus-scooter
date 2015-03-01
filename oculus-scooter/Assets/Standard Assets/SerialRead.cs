using UnityEngine;
using System.Collections;
using System.IO.Ports;

public class SerialRead : MonoBehaviour {

	private static float angle;

	SerialPort sp = new SerialPort("/dev/tty.usbmodem1411", 19200);

	// Use this for initialization
	void Start () 
	{
		sp.ReadTimeout = 100;
		sp.Open();
	}
	
	// Update is called once per frame
	void Update ()
	{
		if(sp.IsOpen)
		{
			try 
			{
				angle = -1.0f * float.Parse(sp.ReadLine());
			}
			catch(System.Exception)
			{
				sp.BaseStream.Flush();
				throw;
			}
		}
	}

	public static float GetAngle() 
	{
		return angle;
	}
}