using Unity.Netcode;
using UnityEngine;
using UnityEngine.UI;

/// <summary>
/// LOBBY MANAGER (TURKISH UI)
/// Handles simple Host/Join logic.
/// </summary>
public class LobbyManager : MonoBehaviour
{
    [Header("UI References")]
    [SerializeField] private Button btnHost;
    [SerializeField] private Button btnJoin;
    [SerializeField] private InputField inputIpAddress;
    [SerializeField] private Text statusText;

    private void Start()
    {
        // Add Listeners
        btnHost.onClick.AddListener(OnHostClicked);
        btnJoin.onClick.AddListener(OnJoinClicked);

        // Update UI Text (Turkish)
        statusText.text = "Hazır.";
        if (inputIpAddress.text == "") inputIpAddress.text = "127.0.0.1";
    }

    private void OnHostClicked()
    {
        bool success = NetworkManager.Singleton.StartHost();
        if (success)
        {
            statusText.text = "Sunucu Başlatıldı (Host).";
            Debug.Log("Server started.");
        }
        else
        {
            statusText.text = "Hata: Sunucu başlatılamadı!";
        }
    }

    private void OnJoinClicked()
    {
        string ip = inputIpAddress.text;
        
        // Configure Transport (Assumes Unity Transport)
        var transport = NetworkManager.Singleton.GetComponent<Unity.Netcode.Transports.UTP.UnityTransport>();
        if (transport != null)
        {
            transport.ConnectionData.Address = ip;
        }

        statusText.text = "Bağlanılıyor: " + ip + "...";
        bool success = NetworkManager.Singleton.StartClient();
        
        if (!success)
        {
            statusText.text = "Hata: İstemci başlatılamadı!";
        }
    }

    private void Update()
    {
        if (NetworkManager.Singleton.IsClient && NetworkManager.Singleton.IsConnectedClient)
        {
            statusText.text = "Bağlantı Başarılı. Oyundasınız.";
        }
    }
}
