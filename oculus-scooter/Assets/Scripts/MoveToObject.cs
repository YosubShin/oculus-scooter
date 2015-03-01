// Written by Stephen P S AKA Zergling103 - Yoshiegg900@hotmail.com - 25-12-2011

using UnityEngine;
using System.Collections;

public class MoveToObject : MonoBehaviour {

	public Transform objectToMoveTowards;
	public float speed;
	public float turnSpeed;
	
	// Update is called once per frame
	void Update () {
	    float ts = Mathf.Clamp01(turnSpeed * Time.deltaTime);
		transform.rotation = Quaternion.Slerp(transform.rotation, Quaternion.LookRotation(objectToMoveTowards.position - transform.position), ts); 
		
		float s = Mathf.Clamp01(speed * Time.deltaTime);
		//transform.position += (objectToMoveTowards.position - transform.position).normalized * s;
		transform.position += transform.forward * s;
		
		Debug.DrawLine(transform.position,objectToMoveTowards.position, Color.cyan);
	}
}
