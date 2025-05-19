import { db } from '../../firebase/config';
import { 
  collection, 
  addDoc, 
  getDocs, 
  query, 
  where, 
  updateDoc, 
  doc, 
  increment, 
  Timestamp,
  runTransaction
} from 'firebase/firestore';
import { toast } from 'react-toastify';

type CartItem = {
  inventoryId: string;
  itemName: string;
  quantity: number;
  unitPrice: number;
};

export const ShopPurchaseService = {
  processPurchase: async (checkinId: string, cartItems: CartItem[]) => {
    try {
      if (!checkinId || cartItems.length === 0) {
        throw new Error('Invalid purchase data');
      }
      
      const totalAmount = cartItems.reduce(
        (total, item) => total + item.quantity * item.unitPrice, 
        0
      );

      await runTransaction(db, async (transaction) => {
        // Update inventory quantities
        for (const item of cartItems) {
          const inventoryRef = doc(db, 'inventory', item.inventoryId);
          const inventoryDoc = await transaction.get(inventoryRef);
          
          if (!inventoryDoc.exists()) {
            throw new Error(`Inventory item ${item.inventoryId} not found`);
          }
          
          const currentQuantity = inventoryDoc.data().quantity;
          if (currentQuantity < item.quantity) {
            throw new Error(`Insufficient quantity for ${item.itemName}`);
          }
          
          transaction.update(inventoryRef, {
            quantity: increment(-item.quantity)
          });
        }

        // Create purchase records
        const purchasePromises = cartItems.map(item => 
          addDoc(collection(db, 'purchases'), {
            checkinId,
            inventoryId: item.inventoryId,
            itemName: item.itemName,
            quantity: item.quantity,
            amount: item.quantity * item.unitPrice,
            paymentStatus: 'pending',
            createdAt: Timestamp.now()
          })
        );
        
        await Promise.all(purchasePromises);
        
        // Update the checkin's pending amount
        const checkinRef = doc(db, 'checkins', checkinId);
        transaction.update(checkinRef, {
          initialPayment: increment(-totalAmount)
        });
        
        // Add a payment entry for the shop purchase
        await addDoc(collection(db, 'checkins', checkinId, 'payments'), {
          amount: -totalAmount,
          mode: 'shop',
          type: 'shop-purchase',
          timestamp: Timestamp.now(),
          description: `Shop purchase (${cartItems.length} items)`
        });
      });

      return { success: true, message: 'Purchase processed successfully' };
    } catch (error) {
      console.error('Error processing purchase:', error);
      throw error;
    }
  },
  
  getPurchasesByCheckin: async (checkinId: string) => {
    try {
      const purchasesQuery = query(
        collection(db, 'purchases'), 
        where('checkinId', '==', checkinId)
      );
      
      const purchasesSnapshot = await getDocs(purchasesQuery);
      return purchasesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error('Error fetching purchases:', error);
      throw error;
    }
  }
};