/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { 
  getFirestore, 
  collection, 
  getDocs, 
  setDoc, 
  doc, 
  query, 
  orderBy,
  Firestore 
} from 'firebase/firestore';
import { initializeApp, getApps } from 'firebase/app';
import firebaseConfig from '../firebase-applet-config.json';
import { Material, PurchaseOrder, WarehouseEntry } from './types';

let db: Firestore | null = null;

try {
  const apps = getApps();
  const app = apps.length > 0 ? apps[0] : initializeApp(firebaseConfig);
  db = getFirestore(app);
} catch (err) {
  console.warn("Could not initialize firestore database client:", err);
}

// Ensure database collection references work cleanly
export const fetchMaterialsFromCloud = async (): Promise<Material[] | null> => {
  if (!db) return null;
  try {
    const colRef = collection(db, 'materials');
    const snapshot = await getDocs(colRef);
    if (snapshot.empty) return null;
    return snapshot.docs.map(doc => doc.data() as Material);
  } catch (err) {
    console.error("Error fetching materials from Firestore:", err);
    return null;
  }
};

export const saveMaterialToCloud = async (material: Material): Promise<boolean> => {
  if (!db) return false;
  try {
    const docRef = doc(db, 'materials', material.code);
    await setDoc(docRef, material, { merge: true });
    return true;
  } catch (err) {
    console.error("Error saving material to Firestore:", err);
    return false;
  }
};

export const fetchOrdersFromCloud = async (): Promise<PurchaseOrder[] | null> => {
  if (!db) return null;
  try {
    const colRef = collection(db, 'orders');
    const q = query(colRef, orderBy('date', 'desc'));
    const snapshot = await getDocs(q);
    if (snapshot.empty) return null;
    return snapshot.docs.map(doc => doc.data() as PurchaseOrder);
  } catch (err) {
    console.error("Error fetching orders from Firestore:", err);
    return null;
  }
};

export const saveOrderToCloud = async (order: PurchaseOrder): Promise<boolean> => {
  if (!db) return false;
  try {
    const docRef = doc(db, 'orders', order.id);
    await setDoc(docRef, order, { merge: true });
    return true;
  } catch (err) {
    console.error("Error saving purchase order to Firestore:", err);
    return false;
  }
};

export const fetchWarehouseFromCloud = async (): Promise<WarehouseEntry[] | null> => {
  if (!db) return null;
  try {
    const colRef = collection(db, 'warehouse_entries');
    const snapshot = await getDocs(colRef);
    if (snapshot.empty) return null;
    return snapshot.docs.map(doc => doc.data() as WarehouseEntry);
  } catch (err) {
    console.error("Error fetching warehouse entries from Firestore:", err);
    return null;
  }
};

export const saveWarehouseEntryToCloud = async (entry: WarehouseEntry): Promise<boolean> => {
  if (!db) return false;
  try {
    const docRef = doc(db, 'warehouse_entries', entry.id);
    await setDoc(docRef, entry, { merge: true });
    return true;
  } catch (err) {
    console.error("Error saving warehouse entry to Firestore:", err);
    return false;
  }
};
