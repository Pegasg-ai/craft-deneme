using Unity.Netcode;
using Unity.Netcode.Transports.UTP;
using UnityEngine;

/// <summary>
/// GAME BOOTSTRAP
/// Automatically sets up the NetworkManager if it's missing.
/// </summary>
public class GameBootstrap : MonoBehaviour
{
    private void Awake()
    {
        if (NetworkManager.Singleton == null)
        {
            Debug.Log("Creating Network Manager...");
            GameObject nm = new GameObject("NetworkManager");
            
            // Add NetworkManager
            NetworkManager networkManager = nm.AddComponent<NetworkManager>();
            
            // Add Transport (Unity Transport)
            UnityTransport transport = nm.AddComponent<UnityTransport>();
            networkManager.NetworkConfig = new NetworkConfig();
            
            // Assign Transport
            // Note: In runtime code we can't easily assign the 'NetworkTransport' field via script 
            // without reflection or internal setup in some versions, 
            // but UTP usually auto-registers if it's the only one.
            
            // For safety, this script is mostly a helper to warn the user, 
            // as complete NM setup via script is complex.
            Debug.LogWarning("NetworkManager created. PLEASE ASSIGN PlayerPrefab IN INSPECTOR!");
            
            DontDestroyOnLoad(nm);
        }
    }
}
