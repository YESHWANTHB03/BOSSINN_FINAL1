import React, { useState, useEffect } from 'react';
import { db } from '../../firebase/config';
import { collection, getDocs, query, where, doc, getDoc } from 'firebase/firestore';
import { ShoppingBag, Plus, Minus, ShoppingCart } from 'lucide-react';
import { toast } from 'react-toastify';
import { ShopPurchaseService } from './ShopPurchaseService';

type InventoryItem = {
  id: string;
  itemName: string;
  quantity: number;
  unitPrice: number;
  category: string;
};

type BookedRoom = {
  id: string;
  roomId: string;
  customerName: string;
  roomNumber: number;
};

type CartItem = {
  inventoryId: string;
  itemName: string;
  quantity: number;
  unitPrice: number;
};

const Shop = () => {
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
  const [bookedRooms, setBookedRooms] = useState<BookedRoom[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRoom, setSelectedRoom] = useState<string>('');
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [checkoutModal, setCheckoutModal] = useState(false);
  const [processingCheckout, setProcessingCheckout] = useState(false);

  useEffect(() => {
    fetchInventoryAndRooms();
  }, []);

  const fetchInventoryAndRooms = async () => {
    try {
      // Fetch inventory items
      const inventoryCollection = collection(db, 'inventory');
      const inventorySnapshot = await getDocs(inventoryCollection);
      const inventoryList = inventorySnapshot.docs
        .map(doc => ({
          id: doc.id,
          ...doc.data()
        }))
        .filter(item => item.quantity > 0) as InventoryItem[];
      
      setInventoryItems(inventoryList);

      // Fetch checkins (active bookings)
      const checkinsCollection = collection(db, 'checkins');
      const checkinsQuery = query(checkinsCollection, where('isCheckedOut', '==', false));
      const checkinsSnapshot = await getDocs(checkinsQuery);
      
      // Get room details for each checkin
      const bookingsList = await Promise.all(
        checkinsSnapshot.docs.map(async (checkinDoc) => {
          const checkinData = checkinDoc.data();
          const roomDoc = await getDoc(doc(db, 'rooms', checkinData.roomId));
          const roomData = roomDoc.data();
          
          return {
            id: checkinDoc.id,
            roomId: checkinData.roomId,
            customerName: checkinData.guestName,
            roomNumber: roomData?.roomNumber || 0
          };
        })
      );
      
      setBookedRooms(bookingsList);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to fetch data');
      setLoading(false);
    }
  };

  const addToCart = (item: InventoryItem) => {
    if (!selectedRoom) {
      toast.error('Please select a room first');
      return;
    }
    
    const existingItem = cartItems.find(cartItem => cartItem.inventoryId === item.id);
    
    if (existingItem) {
      if (existingItem.quantity >= item.quantity) {
        toast.error('Cannot add more than available stock');
        return;
      }
      
      setCartItems(cartItems.map(cartItem => 
        cartItem.inventoryId === item.id 
          ? { ...cartItem, quantity: cartItem.quantity + 1 } 
          : cartItem
      ));
    } else {
      setCartItems([
        ...cartItems,
        {
          inventoryId: item.id,
          itemName: item.itemName,
          quantity: 1,
          unitPrice: item.unitPrice
        }
      ]);
    }
  };

  const removeFromCart = (inventoryId: string) => {
    const existingItem = cartItems.find(item => item.inventoryId === inventoryId);
    
    if (existingItem) {
      if (existingItem.quantity === 1) {
        setCartItems(cartItems.filter(item => item.inventoryId !== inventoryId));
      } else {
        setCartItems(cartItems.map(item => 
          item.inventoryId === inventoryId 
            ? { ...item, quantity: item.quantity - 1 } 
            : item
        ));
      }
    }
  };

  const handleCheckout = async () => {
    if (!selectedRoom || cartItems.length === 0) return;
    
    setProcessingCheckout(true);
    try {
      // Use the ShopPurchaseService to process the purchase
      await ShopPurchaseService.processPurchase(selectedRoom, cartItems);
      
      toast.success('Purchase added to room bill successfully');
      setCartItems([]);
      setCheckoutModal(false);
      fetchInventoryAndRooms(); // Refresh inventory data
    } catch (error) {
      console.error('Error processing purchase:', error);
      toast.error('Failed to process purchase');
    } finally {
      setProcessingCheckout(false);
    }
  };

  // Calculate total amount
  const totalAmount = cartItems.reduce(
    (total, item) => total + item.quantity * item.unitPrice, 
    0
  );

  // Get unique categories
  const categories = ['all', ...new Set(inventoryItems.map(item => item.category))].sort();

  // Filter inventory by search term and category
  const filteredInventory = inventoryItems.filter(item => {
    const matchesSearch = item.itemName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filterCategory === 'all' || item.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-800 mb-8">Shop</h1>
      
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Select Room
                </label>
                <select
                  value={selectedRoom}
                  onChange={(e) => setSelectedRoom(e.target.value)}
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                >
                  <option value="">Select a room</option>
                  {bookedRooms.map((room) => (
                    <option key={room.id} value={room.id}>
                      Room {room.roomNumber} - {room.customerName}
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="mb-6 flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <input
                    type="text"
                    placeholder="Search items..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <select
                    value={filterCategory}
                    onChange={(e) => setFilterCategory(e.target.value)}
                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  >
                    {categories.map((category) => (
                      <option key={category} value={category}>
                        {category === 'all' ? 'All Categories' : category}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredInventory.map((item) => (
                  <div
                    key={item.id}
                    className="border rounded-lg p-4 hover:shadow-md transition-shadow duration-200"
                  >
                    <div className="flex items-center justify-center mb-3">
                      <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                        <ShoppingBag className="h-6 w-6 text-blue-600" />
                      </div>
                    </div>
                    <h3 className="text-center font-medium mb-1">{item.itemName}</h3>
                    <p className="text-center text-sm text-gray-500 mb-2">{item.category}</p>
                    <p className="text-center font-semibold mb-4">₹{item.unitPrice.toFixed(2)}</p>
                    <p className="text-center text-sm text-gray-600 mb-3">
                      Available: {item.quantity}
                    </p>
                    <button
                      onClick={() => addToCart(item)}
                      disabled={!selectedRoom}
                      className={`w-full py-1 rounded-md flex items-center justify-center ${
                        selectedRoom
                          ? 'bg-blue-600 text-white hover:bg-blue-700'
                          : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      } transition-colors duration-200`}
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Add to Cart
                    </button>
                  </div>
                ))}
              </div>
              
              {filteredInventory.length === 0 && (
                <div className="text-center py-8">
                  <ShoppingBag className="h-12 w-12 mx-auto text-gray-400 mb-3" />
                  <h3 className="text-lg font-medium text-gray-900 mb-1">No items found</h3>
                  <p className="text-gray-500">
                    {searchTerm || filterCategory !== 'all'
                      ? "No items match your search criteria."
                      : "No items available in inventory."}
                  </p>
                </div>
              )}
            </div>
          </div>
          
          <div>
            <div className="bg-white rounded-lg shadow-md p-6 sticky top-8">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">Your Cart</h2>
                <span className="px-3 py-1 bg-blue-100 text-blue-800 text-sm font-medium rounded-full">
                  {cartItems.reduce((total, item) => total + item.quantity, 0)} items
                </span>
              </div>
              
              {selectedRoom ? (
                <div className="mb-4 text-sm">
                  <div className="text-gray-600">Selected Room:</div>
                  <div className="font-medium">
                    Room {bookedRooms.find(room => room.id === selectedRoom)?.roomNumber} - 
                    {bookedRooms.find(room => room.id === selectedRoom)?.customerName}
                  </div>
                </div>
              ) : (
                <div className="mb-4 p-3 bg-yellow-50 text-yellow-800 text-sm rounded-md">
                  Please select a room to continue shopping
                </div>
              )}
              
              {cartItems.length === 0 ? (
                <div className="text-center py-8">
                  <ShoppingCart className="h-12 w-12 mx-auto text-gray-400 mb-3" />
                  <p className="text-gray-500">Your cart is empty</p>
                </div>
              ) : (
                <>
                  <div className="space-y-4 mb-6 max-h-80 overflow-y-auto">
                    {cartItems.map((item) => (
                      <div key={item.inventoryId} className="flex justify-between items-center border-b pb-3">
                        <div>
                          <h3 className="font-medium">{item.itemName}</h3>
                          <p className="text-sm text-gray-500">₹{item.unitPrice.toFixed(2)} x {item.quantity}</p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => removeFromCart(item.inventoryId)}
                            className="p-1 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors duration-200"
                          >
                            <Minus className="h-4 w-4 text-gray-600" />
                          </button>
                          <span className="w-8 text-center">{item.quantity}</span>
                          <button
                            onClick={() => {
                              const inventoryItem = inventoryItems.find(invItem => invItem.id === item.inventoryId);
                              if (inventoryItem && item.quantity < inventoryItem.quantity) {
                                addToCart(inventoryItem);
                              } else {
                                toast.error('Cannot add more than available stock');
                              }
                            }}
                            className="p-1 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors duration-200"
                          >
                            <Plus className="h-4 w-4 text-gray-600" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  <div className="space-y-3 pt-4 border-t">
                    <div className="flex justify-between font-medium">
                      <span>Total:</span>
                      <span>₹{totalAmount.toFixed(2)}</span>
                    </div>
                    
                    <button
                      onClick={() => setCheckoutModal(true)}
                      disabled={!selectedRoom || cartItems.length === 0}
                      className={`w-full py-2 rounded-md ${
                        selectedRoom && cartItems.length > 0
                          ? 'bg-blue-600 text-white hover:bg-blue-700'
                          : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      } transition-colors duration-200`}
                    >
                      Checkout
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
      
      {/* Checkout Confirmation Modal */}
      {checkoutModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full">
            <h2 className="text-xl font-bold mb-4">Confirm Purchase</h2>
            <div className="max-h-60 overflow-y-auto mb-4">
              {cartItems.map((item) => (
                <div key={item.inventoryId} className="flex justify-between py-2 border-b">
                  <div>
                    <p className="font-medium">{item.itemName}</p>
                    <p className="text-sm text-gray-500">₹{item.unitPrice.toFixed(2)} x {item.quantity}</p>
                  </div>
                  <p className="font-medium">₹{(item.unitPrice * item.quantity).toFixed(2)}</p>
                </div>
              ))}
            </div>
            
            <div className="flex justify-between font-medium text-lg mb-6">
              <span>Total Amount:</span>
              <span>₹{totalAmount.toFixed(2)}</span>
            </div>
            
            <p className="mb-6 text-sm text-gray-600">
              This amount will be added to the room bill. Confirm to proceed with the purchase.
            </p>
            
            <div className="flex justify-end space-x-4">
              <button
                onClick={() => setCheckoutModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors duration-200"
                disabled={processingCheckout}
              >
                Cancel
              </button>
              <button
                onClick={handleCheckout}
                disabled={processingCheckout}
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 transition-colors duration-200 flex items-center"
              >
                {processingCheckout ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
                    Processing...
                  </>
                ) : (
                  'Confirm Purchase'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Shop;