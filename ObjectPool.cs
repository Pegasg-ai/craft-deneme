using System.Collections.Generic;
using UnityEngine;

/// <summary>
/// GENERIC OBJECT POOL
/// Optimization: Reuses objects instead of Instantiate/Destroy.
/// </summary>
public class ObjectPool : MonoBehaviour
{
    public static ObjectPool Instance;

    [System.Serializable]
    public struct PoolItem
    {
        public string tag;
        public GameObject prefab;
        public int size;
    }

    public List<PoolItem> items;
    private Dictionary<string, Queue<GameObject>> poolDictionary;

    private void Awake()
    {
        Instance = this;
        poolDictionary = new Dictionary<string, Queue<GameObject>>();

        foreach (PoolItem item in items)
        {
            Queue<GameObject> objectPool = new Queue<GameObject>();

            for (int i = 0; i < item.size; i++)
            {
                GameObject obj = Instantiate(item.prefab);
                obj.SetActive(false);
                objectPool.Enqueue(obj);
            }

            poolDictionary.Add(item.tag, objectPool);
        }
    }

    public GameObject SpawnFromPool(string tag, Vector3 position, Quaternion rotation)
    {
        if (!poolDictionary.ContainsKey(tag))
        {
            Debug.LogWarning("Pool with tag " + tag + " doesn't exist.");
            return null;
        }

        GameObject objectToSpawn = poolDictionary[tag].Dequeue();

        objectToSpawn.SetActive(true);
        objectToSpawn.transform.position = position;
        objectToSpawn.transform.rotation = rotation;

        // Re-enqueue for reuse (Cyclic Buffer style)
        // Note: In refined logic, we would enqueue it back only when it's "Despawned"
        // For simplicity here, we assume the caller will manually return it, 
        // OR we just circle through logic if we had a proper return method.
        // Actually, the standard pattern is Dequeue -> Use -> Enqueue when dead.
        // But for particles/bullets that auto-die, we need a ReturnToPool method.
        
        // This simple implemention assumes we have enough size and just cycles or the object handles its own return.
        // Better implementation:
        return objectToSpawn;
    }

    public void ReturnToPool(string tag, GameObject obj)
    {
        obj.SetActive(false);
        poolDictionary[tag].Enqueue(obj);
    }
}
