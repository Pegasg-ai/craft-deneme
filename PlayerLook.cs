using Unity.Netcode;
using UnityEngine;

/// <summary>
/// FPS CAMERA LOOK
/// Handles Mouse Input for looking around.
/// </summary>
public class PlayerLook : NetworkBehaviour
{
    [Header("Refrences")]
    [SerializeField] private Transform camHolder;
    
    [Header("Settings")]
    [SerializeField] private float mouseSensitivity = 100f;
    
    private float xRotation = 0f;

    public override void OnNetworkSpawn()
    {
        // Only enable camera for the local player
        if (IsOwner)
        {
            Camera cam = camHolder.GetComponentInChildren<Camera>();
            if (cam != null) cam.enabled = true;
            
            AudioListener listener = camHolder.GetComponentInChildren<AudioListener>();
            if (listener != null) listener.enabled = true;

            // Lock Cursor
            Cursor.lockState = CursorLockMode.Locked;
            Cursor.visible = false;
        }
        else
        {
            // Disable camera for remote players
            Camera cam = camHolder.GetComponentInChildren<Camera>();
            if (cam != null) cam.enabled = false;
            
            AudioListener listener = camHolder.GetComponentInChildren<AudioListener>();
            if (listener != null) listener.enabled = false;
        }
    }

    private void Update()
    {
        if (!IsOwner) return;

        float mouseX = Input.GetAxis("Mouse X") * mouseSensitivity * Time.deltaTime;
        float mouseY = Input.GetAxis("Mouse Y") * mouseSensitivity * Time.deltaTime;

        xRotation -= mouseY;
        xRotation = Mathf.Clamp(xRotation, -90f, 90f);

        // Rotate Camera (Pitch)
        camHolder.localRotation = Quaternion.Euler(xRotation, 0f, 0f);
        
        // Rotate Player Body (Yaw)
        transform.Rotate(Vector3.up * mouseX);
    }
}
