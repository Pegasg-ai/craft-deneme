using System.Collections.Generic;
using Unity.Netcode;
using UnityEngine;

/// <summary>
/// HIGH-PERFORMANCE PLAYER CONTROLLER
/// Features: Client-Side Prediction, Server Reconciliation, Quake-style Movement (Air Strafe, Bunny Hop).
/// </summary>
public class NetworkPlayerController : NetworkBehaviour
{
    [Header("Movement Settings")]
    [SerializeField] private float moveSpeed = 10f;
    [SerializeField] private float jumpForce = 5f;
    [SerializeField] private float gravity = 20f;
    [SerializeField] private float airAcceleration = 20f; // For air strafing
    [SerializeField] private float maxAirSpeed = 12f;

    [Header("Prediction Settings")]
    [SerializeField] private float snapDistance = 4f; // If error is too big, snap.
    [SerializeField] private float reconcileRate = 10f; // Smooth lerp speed.

    // Networking State
    public struct InputPayload : INetworkSerializable
    {
        public int Tick;
        public Vector2 MoveInput;
        public bool JumpPressed;
        public Quaternion LookRotation;

        public void NetworkSerialize<T>(BufferSerializer<T> serializer) where T : IReaderWriter
        {
            serializer.SerializeValue(ref Tick);
            serializer.SerializeValue(ref MoveInput);
            serializer.SerializeValue(ref JumpPressed);
            serializer.SerializeValue(ref LookRotation);
        }
    }

    public struct StatePayload : INetworkSerializable
    {
        public int Tick;
        public Vector3 Position;
        public Vector3 Velocity;

        public void NetworkSerialize<T>(BufferSerializer<T> serializer) where T : IReaderWriter
        {
            serializer.SerializeValue(ref Tick);
            serializer.SerializeValue(ref Position);
            serializer.SerializeValue(ref Velocity);
        }
    }

    // Prediction Buffer
    private const int BUFFER_SIZE = 1024;
    private InputPayload[] _inputBuffer;
    private StatePayload[] _stateBuffer;
    private StatePayload _latestServerState;
    private StatePayload _lastProcessedState;
    
    // Components
    private CharacterController _characterController;
    private Vector3 _velocity;
    private int _currentTick = 0;

    private void Awake()
    {
        _characterController = GetComponent<CharacterController>();
        _inputBuffer = new InputPayload[BUFFER_SIZE];
        _stateBuffer = new StatePayload[BUFFER_SIZE];
    }

    public override void OnNetworkSpawn()
    {
        base.OnNetworkSpawn();
        // Setup initial server state to avoid nulls
        _latestServerState = new StatePayload
        {
            Position = transform.position,
            Velocity = Vector3.zero,
            Tick = 0
        };
    }

    private void FixedUpdate()
    {
        if (IsClient)
        {
            // Update current tick for local prediction
            _currentTick++; 
            
            // 1. Sample Input
            InputPayload input = new InputPayload
            {
                Tick = _currentTick,
                MoveInput = new Vector2(Input.GetAxisRaw("Horizontal"), Input.GetAxisRaw("Vertical")),
                JumpPressed = Input.GetButton("Jump"),
                LookRotation = transform.rotation
            };

            // 2. Store Input for Reconciliation
            int bufferIndex = _currentTick % BUFFER_SIZE;
            _inputBuffer[bufferIndex] = input;

            // 3. Process Physics LOCALLY (Prediction)
            ProcessMovement(input);

            // 4. Send to Server
            SendInputServerRpc(input);
        }
        
        // Note: Server processes input via the RPC
    }

    private void Update()
    {
        if (IsClient && !IsOwner)
        {
            // For other players, just smooth interpolate to latest server state
            // In a real prod environment, use a Snapshot Interpolation system here.
            transform.position = Vector3.Lerp(transform.position, _latestServerState.Position, Time.deltaTime * reconcileRate);
        }
    }

    [ServerRpc]
    private void SendInputServerRpc(InputPayload input)
    {
        // Server Validation: Can check if input packet is too far in future/past
        // Apply Move
        ProcessMovement(input);

        // Update State
        StatePayload state = new StatePayload
        {
            Tick = input.Tick,
            Position = transform.position,
            Velocity = _velocity
        };

        // Send Result back to Client
        _lastProcessedState = state;
        SendStateClientRpc(state);
    }

    [ClientRpc]
    private void SendStateClientRpc(StatePayload serverState)
    {
        if (!IsOwner)
        {
            _latestServerState = serverState;
            return;
        }

        // --- RECONCILIATION LOGIC ---

        // 1. Calculate the State we THOUGHT we were at for this tick
        int bufferIndex = serverState.Tick % BUFFER_SIZE;
        StatePayload clientState = _stateBuffer[bufferIndex];

        // 2. Calculate Error
        float error = Vector3.Distance(serverState.Position, clientState.Position);

        // 3. If Error is significant, Re-Simulate
        if (error > 0.05f) 
        {
            // Debug.Log($"Reconciling! Error: {error}");

            // Snap to correct server position
            _characterController.enabled = false;
            transform.position = serverState.Position; 
            _velocity = serverState.Velocity;
            _characterController.enabled = true;

            // Re-simulate all inputs from serverTick + 1 to currentTick
            int startTick = serverState.Tick + 1;
            int inputsToReplay = _currentTick - startTick;

            for (int i = 0; i < inputsToReplay; i++)
            {
                int replayTick = startTick + i;
                int replayIndex = replayTick % BUFFER_SIZE;
                InputPayload input = _inputBuffer[replayIndex];
                
                ProcessMovement(input);
                
                // Update revised state in history
                _stateBuffer[replayIndex] = new StatePayload
                {
                    Tick = input.Tick,
                    Position = transform.position,
                    Velocity = _velocity
                };
            }
        }
    }

    /// <summary>
    /// Core physics logic. Shared by Client (prediction) and Server (authority).
    /// </summary>
    private void ProcessMovement(InputPayload input)
    {
        Vector3 wishDir = new Vector3(input.MoveInput.x, 0, input.MoveInput.y);
        wishDir = input.LookRotation * wishDir;
        wishDir.y = 0;
        wishDir.Normalize();

        if (_characterController.isGrounded)
        {
            // Ground Movement
            ApplyFriction();
            Accelerate(wishDir, moveSpeed, groundAcceleration); // Need to define groundAcceleration
            
            if (input.JumpPressed)
            {
                _velocity.y = jumpForce;
            }
        }
        else
        {
            // Air Movement (Air Strafing)
            // In Redmatch/Source engine style, we project velocity onto wishDir
            Accelerate(wishDir, maxAirSpeed, airAcceleration);
            
            // Gravity
            _velocity.y -= gravity * Time.fixedDeltaTime;
        }

        // Apply Character Controller Move
        _characterController.Move(_velocity * Time.fixedDeltaTime);
        
        // Save State (for reconciliation lookups)
        if (IsOwner || IsServer)
        {
            int idx = input.Tick % BUFFER_SIZE;
            _stateBuffer[idx] = new StatePayload
            {
                Tick = input.Tick,
                Position = transform.position,
                Velocity = _velocity
            };
        }
    }

    [Header("Physics Tuning")]
    [SerializeField] private float groundAcceleration = 50f;
    [SerializeField] private float friction = 6f;

    private void ApplyFriction()
    {
        Vector3 vec = _velocity;
        vec.y = 0;
        float speed = vec.magnitude;
        float drop = 0;

        // Only apply friction if we are moving
        if (_characterController.isGrounded)
        {
            float control = (speed < friction) ? friction : speed;
            drop = control * friction * Time.fixedDeltaTime;
        }

        float newSpeed = speed - drop;
        if (newSpeed < 0) newSpeed = 0;
        if (speed > 0) newSpeed /= speed;

        _velocity.x *= newSpeed;
        _velocity.z *= newSpeed;
    }

    private void Accelerate(Vector3 wishDir, float wishSpeed, float accel)
    {
        float currentSpeed = Vector3.Dot(_velocity, wishDir);
        float addSpeed = wishSpeed - currentSpeed;
        
        if (addSpeed <= 0) return;

        float accelSpeed = accel * wishSpeed * Time.fixedDeltaTime;
        if (accelSpeed > addSpeed) accelSpeed = addSpeed;

        _velocity.x += accelSpeed * wishDir.x;
        _velocity.z += accelSpeed * wishDir.z;
    }
}
