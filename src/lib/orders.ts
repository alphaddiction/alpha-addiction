import { promises as fs } from 'fs';
import path from 'path';
import { Order } from '@/types/order';

const DATA_DIR = path.join(process.cwd(), 'src', 'data');
const FILE_PATH = path.join(DATA_DIR, 'orders.json');

// In-memory cache fallback for environments without file persistence (like Vercel serverless)
let inMemoryOrders: Order[] = [];

// Initialize memory cache or create file if not exists
async function ensureStore() {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
    try {
      const data = await fs.readFile(FILE_PATH, 'utf-8');
      inMemoryOrders = JSON.parse(data) as Order[];
    } catch {
      // File doesn't exist or is empty
      await fs.writeFile(FILE_PATH, JSON.stringify([], null, 2));
      inMemoryOrders = [];
    }
  } catch (error) {
    console.warn('⚠️ Warning: File system not fully writable. Falling back to in-memory store.', error);
  }
}

export async function getOrders(): Promise<Order[]> {
  await ensureStore();
  try {
    const data = await fs.readFile(FILE_PATH, 'utf-8');
    inMemoryOrders = JSON.parse(data) as Order[];
    return inMemoryOrders;
  } catch {
    return inMemoryOrders;
  }
}

export async function getOrderById(id: string): Promise<Order | null> {
  const orders = await getOrders();
  return orders.find(o => o.id === id) || null;
}

export async function getOrderByPayPalId(paypalOrderId: string): Promise<Order | null> {
  const orders = await getOrders();
  return orders.find(o => o.paypalOrderId === paypalOrderId) || null;
}

export async function saveOrder(order: Order): Promise<Order> {
  await ensureStore();
  const orders = await getOrders();
  const index = orders.findIndex(o => o.id === order.id);

  if (index >= 0) {
    orders[index] = order;
  } else {
    orders.push(order);
  }

  inMemoryOrders = orders;

  try {
    await fs.writeFile(FILE_PATH, JSON.stringify(orders, null, 2));
  } catch (error) {
    console.error('❌ Failed to write order to file system:', error);
  }

  return order;
}

export async function updateOrder(id: string, updates: Partial<Order>): Promise<Order> {
  const order = await getOrderById(id);
  if (!order) {
    throw new Error(`Order with ID ${id} not found.`);
  }

  const updatedOrder: Order = {
    ...order,
    ...updates,
    updatedAt: new Date().toISOString(),
  };

  return saveOrder(updatedOrder);
}

export function generateLocalOrderId(): string {
  const timestamp = Date.now().toString().slice(-6);
  const random = Math.floor(1000 + Math.random() * 9000);
  return `AA-${timestamp}-${random}`;
}

export async function deleteOrder(id: string): Promise<boolean> {
  await ensureStore();
  const orders = await getOrders();
  const index = orders.findIndex(o => o.id === id);
  if (index >= 0) {
    orders.splice(index, 1);
    inMemoryOrders = orders;
    try {
      await fs.writeFile(FILE_PATH, JSON.stringify(orders, null, 2));
      return true;
    } catch (error) {
      console.error('❌ Failed to delete order:', error);
      return false;
    }
  }
  return false;
}
