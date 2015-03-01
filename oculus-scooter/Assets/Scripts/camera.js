#pragma strict

var followObj : Transform;

function Update () {
	transform.LookAt(followObj);
}