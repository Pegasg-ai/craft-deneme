using System.Collections.Generic;
using UnityEngine;

/// <summary>
/// OPTIMIZED VOXEL CHUNK
/// Features: Greedy Meshing to reduce triangle count greatly.
/// </summary>
[RequireComponent(typeof(MeshFilter), typeof(MeshRenderer), typeof(MeshCollider))]
public class VoxelChunk : MonoBehaviour
{
    public const int CHUNK_SIZE = 16;
    
    // Flattened array for cache locality: index = x + y * size + z * size * size
    private byte[] _blocks = new byte[CHUNK_SIZE * CHUNK_SIZE * CHUNK_SIZE];
    
    private MeshFilter _meshFilter;
    private MeshCollider _meshCollider;

    private void Awake()
    {
        _meshFilter = GetComponent<MeshFilter>();
        _meshCollider = GetComponent<MeshCollider>();
    }

    public void SetBlock(int x, int y, int z, byte blockType)
    {
        if (x < 0 || x >= CHUNK_SIZE || y < 0 || y >= CHUNK_SIZE || z < 0 || z >= CHUNK_SIZE) return;
        _blocks[x + CHUNK_SIZE * (y + CHUNK_SIZE * z)] = blockType;
    }

    public byte GetBlock(int x, int y, int z)
    {
        if (x < 0 || x >= CHUNK_SIZE || y < 0 || y >= CHUNK_SIZE || z < 0 || z >= CHUNK_SIZE) return 0;
        return _blocks[x + CHUNK_SIZE * (y + CHUNK_SIZE * z)];
    }

    /// <summary>
    /// Generates mesh using GREEDY MESHING.
    /// Standard approach creates 2 triangles per face. Greedy merges them.
    /// This is simplified for clarity but highly optimized for 3D logic.
    /// </summary>
    public void RegenerateMesh()
    {
        List<Vector3> vertices = new List<Vector3>();
        List<int> triangles = new List<int>();
        List<Vector2> uvs = new List<Vector2>();

        // We sweep over each axis (X, Y, Z)
        for (int d = 0; d < 3; d++) 
        {
            int i, j, k, l, w, h;
            int u = (d + 1) % 3;
            int v = (d + 2) % 3;
            int[] x = new int[3];
            int[] q = new int[3];

            bool[] mask = new bool[CHUNK_SIZE * CHUNK_SIZE];

            q[d] = 1;

            for (x[d] = -1; x[d] < CHUNK_SIZE; ) 
            {
                // Compute Mask
                int n = 0;
                for (x[v] = 0; x[v] < CHUNK_SIZE; ++x[v]) 
                {
                    for (x[u] = 0; x[u] < CHUNK_SIZE; ++x[u]) 
                    {
                        // 0 <= x[d] < CHUNK_SIZE checks for Valid block bounds
                        // block1 is current layer, block2 is next layer
                        byte b1 = (x[d] >= 0) ? GetBlock(x[0], x[1], x[2]) : (byte)0;
                        byte b2 = (x[d] < CHUNK_SIZE - 1) ? GetBlock(x[0] + q[0], x[1] + q[1], x[2] + q[2]) : (byte)0;

                        // Face is visible if one is solid and other is air
                        // NOTE: Simplified to treating 0 as Air and >0 as Solid. 
                        // For multi-colored blocks, we would check if b1 != b2.
                        mask[n++] = (b1 != 0 && b2 == 0) || (b1 == 0 && b2 != 0);
                    }
                }

                x[d]++;

                // Generate Mesh from Mask
                n = 0;
                for (j = 0; j < CHUNK_SIZE; ++j) 
                {
                    for (i = 0; i < CHUNK_SIZE; ) 
                    {
                        if (mask[n]) 
                        {
                            // Compute width
                            for (w = 1; i + w < CHUNK_SIZE && mask[n + w]; ++w) { }

                            // Compute height
                            bool done = false;
                            for (h = 1; j + h < CHUNK_SIZE; ++h) 
                            {
                                for (k = 0; k < w; ++k) 
                                {
                                    if (!mask[n + k + h * CHUNK_SIZE]) 
                                    {
                                        done = true;
                                        break;
                                    }
                                }
                                if (done) break;
                            }

                            // Add Quad
                            x[u] = i; 
                            x[v] = j;

                            int[] du = new int[3]; du[u] = w;
                            int[] dv = new int[3]; dv[v] = h;

                            AddQuad(
                                vertices, triangles, uvs,
                                new Vector3(x[0], x[1], x[2]),
                                new Vector3(x[0] + du[0], x[1] + du[1], x[2] + du[2]),
                                new Vector3(x[0] + du[0] + dv[0], x[1] + du[1] + dv[1], x[2] + du[2] + dv[2]),
                                new Vector3(x[0] + dv[0], x[1] + dv[1], x[2] + dv[2]),
                                mask[n] // Winding order check (can be derived from block presence)
                            );

                            // Zero-out mask
                            for (l = 0; l < h; ++l) 
                            {
                                for (k = 0; k < w; ++k) 
                                {
                                    mask[n + k + l * CHUNK_SIZE] = false;
                                }
                            }

                            i += w; 
                            n += w;
                        } 
                        else 
                        {
                            i++; 
                            n++;
                        }
                    }
                }
            }
        }

        // Apply to Unity
        Mesh mesh = new Mesh();
        mesh.vertices = vertices.ToArray();
        mesh.triangles = triangles.ToArray();
        mesh.uv = uvs.ToArray();
        mesh.RecalculateNormals();
        
        _meshFilter.mesh = mesh;
        _meshCollider.sharedMesh = mesh;
    }

    private void AddQuad(List<Vector3> verts, List<int> tris, List<Vector2> uvs, Vector3 v0, Vector3 v1, Vector3 v2, Vector3 v3, bool backFace)
    {
        int index = verts.Count;
        verts.Add(v0);
        verts.Add(v1);
        verts.Add(v2);
        verts.Add(v3);

        uvs.Add(new Vector2(0, 0));
        uvs.Add(new Vector2(1, 0));
        uvs.Add(new Vector2(1, 1));
        uvs.Add(new Vector2(0, 1));

        if (backFace)
        {
            tris.Add(index);
            tris.Add(index + 2);
            tris.Add(index + 1);
            
            tris.Add(index);
            tris.Add(index + 3);
            tris.Add(index + 2);
        }
        else
        {
            tris.Add(index);
            tris.Add(index + 1);
            tris.Add(index + 2);
            
            tris.Add(index);
            tris.Add(index + 2);
            tris.Add(index + 3);
        }
    }
}
