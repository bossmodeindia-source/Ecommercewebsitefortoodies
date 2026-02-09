import { Product, User } from '../types';

const ADMIN_PASSWORD = '9886510858@Tcbadmin'; // Change this in production
const PRODUCTS_KEY = 'toodies_products';
const USERS_KEY = 'toodies_users';
const CURRENT_USER_KEY = 'toodies_current_user';
const ADMIN_AUTH_KEY = 'toodies_admin_auth';
const ORDERS_KEY = 'toodies_orders';
const ADMIN_SETTINGS_KEY = 'toodies_admin_settings';

export const storageUtils = {
  // Admin Authentication
  verifyAdminPassword: (password: string): boolean => {
    return password === ADMIN_PASSWORD;
  },

  setAdminAuth: (isAuthenticated: boolean) => {
    localStorage.setItem(ADMIN_AUTH_KEY, JSON.stringify(isAuthenticated));
  },

  isAdminAuthenticated: (): boolean => {
    const auth = localStorage.getItem(ADMIN_AUTH_KEY);
    return auth ? JSON.parse(auth) : false;
  },

  logoutAdmin: () => {
    localStorage.removeItem(ADMIN_AUTH_KEY);
  },

  // Products
  getProducts: (): Product[] => {
    const products = localStorage.getItem(PRODUCTS_KEY);
    return products ? JSON.parse(products) : [];
  },

  saveProducts: (products: Product[]) => {
    localStorage.setItem(PRODUCTS_KEY, JSON.stringify(products));
  },

  addProduct: (product: Product) => {
    const products = storageUtils.getProducts();
    products.push(product);
    storageUtils.saveProducts(products);
  },

  updateProduct: (productId: string, updatedProduct: Product) => {
    const products = storageUtils.getProducts();
    const index = products.findIndex(p => p.id === productId);
    if (index !== -1) {
      products[index] = updatedProduct;
      storageUtils.saveProducts(products);
    }
  },

  deleteProduct: (productId: string) => {
    const products = storageUtils.getProducts();
    const filtered = products.filter(p => p.id !== productId);
    storageUtils.saveProducts(filtered);
  },

  // Users
  getUsers: (): User[] => {
    const users = localStorage.getItem(USERS_KEY);
    return users ? JSON.parse(users) : [];
  },

  saveUsers: (users: User[]) => {
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
  },

  registerUser: (email: string, mobile: string, password: string): User => {
    const users = storageUtils.getUsers();
    const newUser: User = {
      id: Date.now().toString(),
      email,
      mobile,
      password,
      cart: [],
      orders: []
    };
    users.push(newUser);
    storageUtils.saveUsers(users);
    return newUser;
  },

  loginUser: (emailOrMobile: string, password: string): User | null => {
    const users = storageUtils.getUsers();
    const user = users.find(
      u => (u.email === emailOrMobile || u.mobile === emailOrMobile) && u.password === password
    );
    if (user) {
      localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
      return user;
    }
    return null;
  },

  getCurrentUser: (): User | null => {
    const user = localStorage.getItem(CURRENT_USER_KEY);
    return user ? JSON.parse(user) : null;
  },

  updateCurrentUser: (user: User) => {
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
    const users = storageUtils.getUsers();
    const index = users.findIndex(u => u.id === user.id);
    if (index !== -1) {
      users[index] = user;
      storageUtils.saveUsers(users);
    }
  },

  logoutUser: () => {
    localStorage.removeItem(CURRENT_USER_KEY);
  },

  // Orders
  getOrders: (): any[] => {
    const orders = localStorage.getItem(ORDERS_KEY);
    return orders ? JSON.parse(orders) : [];
  },

  saveOrders: (orders: any[]) => {
    localStorage.setItem(ORDERS_KEY, JSON.stringify(orders));
  },

  createOrder: (order: any) => {
    const orders = storageUtils.getOrders();
    orders.push(order);
    storageUtils.saveOrders(orders);
    
    // Update user's orders
    const user = storageUtils.getCurrentUser();
    if (user) {
      user.orders.push(order);
      user.cart = [];
      storageUtils.updateCurrentUser(user);
    }
    
    return order;
  },

  updateOrderTracking: (orderId: string, trackingNumber: string, trackingUrl: string) => {
    const orders = storageUtils.getOrders();
    const index = orders.findIndex(o => o.id === orderId);
    if (index !== -1) {
      orders[index].trackingNumber = trackingNumber;
      orders[index].trackingUrl = trackingUrl;
      storageUtils.saveOrders(orders);
      
      // Update user's order as well
      const users = storageUtils.getUsers();
      const userIndex = users.findIndex(u => u.id === orders[index].userId);
      if (userIndex !== -1) {
        const orderIdx = users[userIndex].orders.findIndex(o => o.id === orderId);
        if (orderIdx !== -1) {
          users[userIndex].orders[orderIdx].trackingNumber = trackingNumber;
          users[userIndex].orders[orderIdx].trackingUrl = trackingUrl;
          storageUtils.saveUsers(users);
        }
      }
    }
  },

  updateOrderStatus: (orderId: string, status: string) => {
    const orders = storageUtils.getOrders();
    const index = orders.findIndex(o => o.id === orderId);
    if (index !== -1) {
      orders[index].status = status;
      storageUtils.saveOrders(orders);
      
      // Update user's order as well
      const users = storageUtils.getUsers();
      const userIndex = users.findIndex(u => u.id === orders[index].userId);
      if (userIndex !== -1) {
        const orderIdx = users[userIndex].orders.findIndex(o => o.id === orderId);
        if (orderIdx !== -1) {
          users[userIndex].orders[orderIdx].status = status;
          storageUtils.saveUsers(users);
        }
      }
    }
  },

  // Admin Settings
  getAdminSettings: (): { whatsappNumber: string; gmail: string } => {
    const settings = localStorage.getItem(ADMIN_SETTINGS_KEY);
    return settings ? JSON.parse(settings) : { whatsappNumber: '', gmail: '' };
  },

  saveAdminSettings: (whatsappNumber: string, gmail: string) => {
    localStorage.setItem(ADMIN_SETTINGS_KEY, JSON.stringify({ whatsappNumber, gmail }));
  }
};