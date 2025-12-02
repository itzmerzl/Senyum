import { create } from 'zustand';

const useCartStore = create((set, get) => ({
  items: [],
  customer: null,
  discount: 0,
  discountType: 'percentage', // 'percentage' or 'fixed'
  
  // Add item to cart
  addItem: (product, quantity = 1) => {
    const items = get().items;
    const existingItem = items.find(item => item.productId === product.id);
    
    if (existingItem) {
      set({
        items: items.map(item =>
          item.productId === product.id
            ? { ...item, quantity: item.quantity + quantity }
            : item
        )
      });
    } else {
      set({
        items: [...items, {
          productId: product.id,
          productName: product.name,
          sku: product.sku,
          unitPrice: product.sellingPrice,
          quantity: quantity,
          discount: 0,
          subtotal: product.sellingPrice * quantity
        }]
      });
    }
  },
  
  // Update item quantity
  updateQuantity: (productId, quantity) => {
    if (quantity <= 0) {
      get().removeItem(productId);
      return;
    }
    
    set({
      items: get().items.map(item =>
        item.productId === productId
          ? { 
              ...item, 
              quantity, 
              subtotal: item.unitPrice * quantity 
            }
          : item
      )
    });
  },
  
  // Update item discount
  updateItemDiscount: (productId, discount) => {
    set({
      items: get().items.map(item =>
        item.productId === productId
          ? { ...item, discount }
          : item
      )
    });
  },
  
  // Remove item
  removeItem: (productId) => {
    set({
      items: get().items.filter(item => item.productId !== productId)
    });
  },
  
  // Set customer
  setCustomer: (customer) => {
    set({ customer });
  },
  
  // Set discount
  setDiscount: (discount, type = 'percentage') => {
    set({ discount, discountType: type });
  },
  
  // Calculate totals
  getSubtotal: () => {
    return get().items.reduce((sum, item) => sum + item.subtotal, 0);
  },
  
  getDiscountAmount: () => {
    const subtotal = get().getSubtotal();
    const { discount, discountType } = get();
    
    if (discountType === 'percentage') {
      return subtotal * (discount / 100);
    }
    return discount;
  },
  
  getTotal: () => {
    const subtotal = get().getSubtotal();
    const discountAmount = get().getDiscountAmount();
    return subtotal - discountAmount;
  },
  
  // Clear cart
  clearCart: () => {
    set({
      items: [],
      customer: null,
      discount: 0,
      discountType: 'percentage'
    });
  },
  
  // Get cart count
  getItemCount: () => {
    return get().items.reduce((sum, item) => sum + item.quantity, 0);
  }
}));

export default useCartStore;