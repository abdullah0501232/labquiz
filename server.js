const express = require('express');
const fs = require('fs').promises;
const path = require('path');

const app = express();
const PORT = 3000;

const FOOD_FILE = path.join(__dirname, 'data', 'food.json');
const ORDERS_FILE = path.join(__dirname, 'data', 'orders.json');

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

const readJsonFile = async (filePath) => {
  const data = await fs.readFile(filePath, 'utf-8');
  return JSON.parse(data);
};

const writeJsonFile = async (filePath, data) => {
  await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf-8');
};

app.get('/food', async (req, res) => {
  try {
    const foods = await readJsonFile(FOOD_FILE);
    res.json(foods);
  } catch (error) {
    res.status(500).json({ message: 'Failed to load food items.' });
  }
});

app.get('/orders', async (req, res) => {
  try {
    const orders = await readJsonFile(ORDERS_FILE);
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: 'Failed to load orders.' });
  }
});

app.post('/orders', async (req, res) => {
  try {
    const { customerName, email, phone, address, items, totalAmount } = req.body;

    if (!customerName || !phone || !address || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: 'Invalid order data. Customer details and cart items are required.' });
    }

    const orders = await readJsonFile(ORDERS_FILE);
    const newOrder = {
      id: Date.now(),
      customerName: customerName.trim(),
      email: email ? email.trim() : '',
      phone: phone.trim(),
      address: address.trim(),
      items,
      totalAmount: Number(totalAmount),
      createdAt: new Date().toISOString()
    };

    orders.push(newOrder);
    await writeJsonFile(ORDERS_FILE, orders);

    res.status(201).json({
      message: 'Order placed successfully!',
      order: newOrder
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to save order.' });
  }
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
