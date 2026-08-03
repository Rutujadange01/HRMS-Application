import { db } from '../config/firebase';
import { collection, onSnapshot, doc, setDoc, updateDoc, deleteDoc, getDocs } from 'firebase/firestore';

export const assetService = {
  // --- Assets ---

  // Subscribe to real-time Assets stream
  subscribeAssets: (onUpdate) => {
    if (!db) {
      onUpdate([]);
      return () => {};
    }
    try {
      const colRef = collection(db, 'assets');
      const unsubscribe = onSnapshot(colRef, (snapshot) => {
        const list = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
        onUpdate(list);
      }, (error) => {
        console.warn("Assets onSnapshot listener error:", error.message);
        onUpdate([]);
      });
      return unsubscribe;
    } catch (e) {
      console.warn("Error subscribing to assets:", e.message);
      return () => {};
    }
  },

  getAssets: async () => {
    try {
      if (db) {
        const snapshot = await getDocs(collection(db, 'assets'));
        return snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      }
    } catch (e) {
      console.warn("Get assets error:", e.message);
    }
    return [];
  },

  addAsset: async (assetData) => {
    const assetId = assetData.AssetID || ('asset_' + Date.now());
    const payload = {
      ...assetData,
      id: assetId,
      AssetID: assetId,
    };
    try {
      if (db) {
        const ref = doc(db, 'assets', assetId);
        await setDoc(ref, payload);
      }
    } catch (e) {
      console.warn("Add asset error:", e.message);
      throw e;
    }
    return payload;
  },

  updateAsset: async (id, updatedFields) => {
    try {
      if (db && id) {
        const ref = doc(db, 'assets', id);
        await updateDoc(ref, updatedFields);
      }
    } catch (e) {
      console.warn("Update asset error:", e.message);
      throw e;
    }
    return { id, ...updatedFields };
  },

  deleteAsset: async (id) => {
    try {
      if (db && id) {
        const ref = doc(db, 'assets', id);
        await deleteDoc(ref);
      }
    } catch (e) {
      console.warn("Delete asset error:", e.message);
      throw e;
    }
    return { id };
  },

  // --- Asset Deployments ---

  // Subscribe to real-time Deployments stream
  subscribeDeployments: (onUpdate) => {
    if (!db) {
      onUpdate([]);
      return () => {};
    }
    try {
      const colRef = collection(db, 'asset_deployments');
      const unsubscribe = onSnapshot(colRef, (snapshot) => {
        const list = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
        onUpdate(list);
      }, (error) => {
        console.warn("Asset Deployments onSnapshot error:", error.message);
        onUpdate([]);
      });
      return unsubscribe;
    } catch (e) {
      console.warn("Error subscribing to asset deployments:", e.message);
      return () => {};
    }
  },

  getDeployments: async () => {
    try {
      if (db) {
        const snapshot = await getDocs(collection(db, 'asset_deployments'));
        return snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      }
    } catch (e) {
      console.warn("Get deployments error:", e.message);
    }
    return [];
  },

  addDeployment: async (deploymentData) => {
    const deploymentId = deploymentData.DeploymentID || ('dep_' + Date.now());
    const payload = {
      ...deploymentData,
      id: deploymentId,
      DeploymentID: deploymentId,
    };
    try {
      if (db) {
        const ref = doc(db, 'asset_deployments', deploymentId);
        await setDoc(ref, payload);
      }
    } catch (e) {
      console.warn("Add deployment error:", e.message);
      throw e;
    }
    return payload;
  },

  updateDeployment: async (id, updatedFields) => {
    try {
      if (db && id) {
        const ref = doc(db, 'asset_deployments', id);
        await updateDoc(ref, updatedFields);
      }
    } catch (e) {
      console.warn("Update deployment error:", e.message);
      throw e;
    }
    return { id, ...updatedFields };
  }
};
