using System.Collections.Generic;
using Unity.Netcode;
using UnityEngine;

/// <summary>
/// VOXEL WORLD MANAGER
/// Features: Infinite chunk management, Network Delta Sync (Bandwidth Optimization).
/// </summary>
public class VoxelWorld : NetworkBehaviour
{
    [Header("World Settings")]
    public GameObject chunkPrefab; // Must have VoxelChunk component
    public int renderDistance = 4;
    
    // Chunk Management
    private Dictionary<Vector3Int, VoxelChunk> _chunks = new Dictionary<Vector3Int, VoxelChunk>();
    private Queue<Vector3Int> _updateQueue = new Queue<Vector3Int>();

    private void Start()
    {
        // In a real game, listen for player spawn to start generating around them
        if (IsServer)
        {
            GenerateWorld(Vector3Int.zero);
        }
    }

    private void GenerateWorld(Vector3Int centerChunk)
    {
        for (int x = -renderDistance; x <= renderDistance; x++)
        {
            for (int z = -renderDistance; z <= renderDistance; z++)
            {
                CreateChunk(new Vector3Int(centerChunk.x + x, 0, centerChunk.z + z));
            }
        }
    }

    private void CreateChunk(Vector3Int coord)
    {
        if (_chunks.ContainsKey(coord)) return;

        GameObject go = Instantiate(chunkPrefab, coord * VoxelChunk.CHUNK_SIZE, Quaternion.identity);
        VoxelChunk chunk = go.GetComponent<VoxelChunk>();
        
        // Simple terrain generation for testing
        GenerateTerrainData(chunk, coord);
        
        chunk.RegenerateMesh();
        
        // Network Spawn
        go.GetComponent<NetworkObject>().Spawn();
        
        _chunks.Add(coord, chunk);
    }

    private void GenerateTerrainData(VoxelChunk chunk, Vector3Int chunkCoord)
    {
        // Simple flat floor logic
        for (int x = 0; x < VoxelChunk.CHUNK_SIZE; x++)
        {
            for (int z = 0; z < VoxelChunk.CHUNK_SIZE; z++)
            {
                for (int y = 0; y < 4; y++)
                {
                    chunk.SetBlock(x, y, z, 1); // 1 = Stone
                }
            }
        }
    }

    // --- NETWORK DELTA SYNC ---

    /// <summary>
    /// Call this from Client or Server to modify a block.
    /// Handles the network request automatically.
    /// </summary>
    public void ModifyBlock(Vector3 worldPos, byte blockType)
    {
        ModifyBlockServerRpc(worldPos, blockType);
    }

    [ServerRpc(RequireOwnership = false)]
    private void ModifyBlockServerRpc(Vector3 worldPos, byte blockType)
    {
        // Validation (Anti-Cheat): Check distance, cooldowns, etc.
        
        // Apply on Server
        ApplyBlockModification(worldPos, blockType);

        // Broadcast to all clients (Delta Sync - only send this change, not whole chunk)
        ModifyBlockClientRpc(worldPos, blockType);
    }

    [ClientRpc]
    private void ModifyBlockClientRpc(Vector3 worldPos, byte blockType)
    {
        if (IsServer) return; // Server already applied it
        ApplyBlockModification(worldPos, blockType);
    }

    private void ApplyBlockModification(Vector3 worldPos, byte blockType)
    {
        Vector3Int chunkCoord = GetChunkCoord(worldPos);
        Vector3Int localPos = GetLocalPos(worldPos, chunkCoord);

        if (_chunks.TryGetValue(chunkCoord, out VoxelChunk chunk))
        {
            chunk.SetBlock(localPos.x, localPos.y, localPos.z, blockType);
            
            // Mark for mesh update
            // We batch this: multiple explosions in one frame shouldn't freeze game
            if (!_updateQueue.Contains(chunkCoord))
            {
                _updateQueue.Enqueue(chunkCoord);
            }
        }
    }

    private void Update()
    {
        // Batch Processing: Only regenerate a few chunks per frame to keep FPS high
        int updatesProcessed = 0;
        int maxUpdatesPerFrame = 2;

        while (_updateQueue.Count > 0 && updatesProcessed < maxUpdatesPerFrame)
        {
            Vector3Int coord = _updateQueue.Dequeue();
            if (_chunks.TryGetValue(coord, out VoxelChunk chunk))
            {
                chunk.RegenerateMesh();
            }
            updatesProcessed++;
        }
    }

    // --- HELPERS ---

    private Vector3Int GetChunkCoord(Vector3 pos)
    {
        int x = Mathf.FloorToInt(pos.x / VoxelChunk.CHUNK_SIZE);
        int z = Mathf.FloorToInt(pos.z / VoxelChunk.CHUNK_SIZE);
        return new Vector3Int(x, 0, z); // Assuming Y is handled within one chunk column for now
    }

    private Vector3Int GetLocalPos(Vector3 pos, Vector3Int chunkCoord)
    {
        int x = Mathf.FloorToInt(pos.x) - chunkCoord.x * VoxelChunk.CHUNK_SIZE;
        int y = Mathf.FloorToInt(pos.y);
        int z = Mathf.FloorToInt(pos.z) - chunkCoord.z * VoxelChunk.CHUNK_SIZE;
        return new Vector3Int(x, y, z);
    }
}
