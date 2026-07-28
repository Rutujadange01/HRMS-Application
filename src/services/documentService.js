import { db } from '../config/firebase';
import { collection, onSnapshot, doc, setDoc, updateDoc, deleteDoc, query, where } from 'firebase/firestore';
import { storage } from '../config/firebase';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';

export const documentService = {
  // Subscribe to real-time attachments for a specific user
  subscribeUserAttachments: (userId, onUpdate) => {
    if (!db || !userId) {
      onUpdate([]);
      return () => {};
    }

    try {
      const colRef = collection(db, 'attachments');
      const q = query(colRef, where('UserID', '==', userId));
      
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const list = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
        onUpdate(list);
      }, (error) => {
        console.warn("Attachments onSnapshot listener error:", error.message);
        onUpdate([]);
      });
      return unsubscribe;
    } catch (error) {
      console.warn("Failed to subscribe to attachments:", error.message);
      onUpdate([]);
      return () => {};
    }
  },

  addAttachment: async (attachmentData) => {
    try {
      const docId = attachmentData.AttachmentId || attachmentData.id;
      const docRef = doc(db, 'attachments', docId);
      await setDoc(docRef, attachmentData);
    } catch (error) {
      console.warn("Error adding attachment:", error.message);
      throw error;
    }
  },

  updateAttachment: async (attachmentId, updatedFields) => {
    try {
      const docRef = doc(db, 'attachments', attachmentId);
      await updateDoc(docRef, updatedFields);
    } catch (error) {
      console.warn("Error updating attachment:", error.message);
      throw error;
    }
  },

  deleteAttachment: async (attachmentId, fileUrl = null) => {
    try {
      const docRef = doc(db, 'attachments', attachmentId);
      await deleteDoc(docRef);
      if (fileUrl) {
        try {
          const storageRef = ref(storage, fileUrl);
          await deleteObject(storageRef);
        } catch (storageErr) {
          console.warn('Failed to delete storage file:', storageErr.message);
        }
      }
    } catch (error) {
      console.warn('Error deleting attachment:', error.message);
      throw error;
    }
  },

  // Upload a file to Firebase Storage and return the download URL
  uploadFile: async (uri, fileName, userId) => {
    if (!storage) throw new Error("Firebase Storage is not initialized.");
    
    try {
      const response = await fetch(uri);
      const blob = await response.blob();
      
      const storageRef = ref(storage, `attachments/${userId}/${Date.now()}_${fileName}`);
      const snapshot = await uploadBytes(storageRef, blob);
      const downloadURL = await getDownloadURL(snapshot.ref);
      
      return downloadURL;
    } catch (error) {
      console.error("Error uploading file:", error);
      throw error;
    }
  }
};
