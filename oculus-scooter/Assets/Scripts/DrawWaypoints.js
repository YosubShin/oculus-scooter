#pragma strict

function OnDrawGizmos() {
    // Draw a yellow sphere at the transform's position
    Gizmos.color = Color.yellow;
    Gizmos.DrawSphere (transform.position, 1);
}