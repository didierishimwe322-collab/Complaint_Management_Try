const express = require('express');
const mysql = require('mysql2/promise');
const path = require('path');
const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

// Database configuration
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'password',
  database: process.env.DB_NAME || 'complaint_management_system'
};

let db;
let dbConnected = false;

async function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Initialize database connection (replaced — adds retries and pool)
async function initDB() {
  const maxAttempts = Number(process.env.DB_CONNECT_ATTEMPTS || 8);
  const baseDelayMs = 2000;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      db = mysql.createPool({
        ...dbConfig,
        waitForConnections: true,
        connectionLimit: 10,
        connectTimeout: 10000
      });

      // quick health check
      await db.execute('SELECT 1');

      // Create complaints table
      await db.execute(`
        CREATE TABLE IF NOT EXISTS complaints (
          id INT AUTO_INCREMENT PRIMARY KEY,
          complaint_id VARCHAR(50) UNIQUE NOT NULL,
          title VARCHAR(255) NOT NULL,
          description TEXT NOT NULL,
          category VARCHAR(100) NOT NULL,
          status ENUM('open', 'in_progress', 'resolved', 'closed') DEFAULT 'open',
          priority ENUM('low', 'medium', 'high', 'critical') DEFAULT 'medium',
          assigned_to VARCHAR(100),
          customer_name VARCHAR(255) NOT NULL,
          customer_email VARCHAR(255),
          customer_phone VARCHAR(20),
          resolution_notes TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          resolved_at TIMESTAMP NULL
        )
      `);

      // Create categories table
      await db.execute(`
        CREATE TABLE IF NOT EXISTS categories (
          id INT AUTO_INCREMENT PRIMARY KEY,
          name VARCHAR(100) NOT NULL UNIQUE,
          description TEXT,
          color VARCHAR(7),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        )
      `);

      // Create compliments table
      await db.execute(`
        CREATE TABLE IF NOT EXISTS compliments (
          id INT AUTO_INCREMENT PRIMARY KEY,
          compliment_id VARCHAR(50) UNIQUE NOT NULL,
          message TEXT NOT NULL,
          sender VARCHAR(255),
          recipient VARCHAR(255),
          category VARCHAR(100),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);

      dbConnected = true;
      console.log('Database connected and tables ensured');
      return;
    } catch (err) {
      console.error(`DB connection attempt ${attempt}/${maxAttempts} failed:`, err.message || err);
      try { if (db && db.end) await db.end(); } catch (_) {}
      dbConnected = false;
      if (attempt < maxAttempts) {
        const wait = baseDelayMs * attempt;
        console.log(`Waiting ${wait}ms before retrying...`);
        await delay(wait);
      } else {
        console.error('All DB connection attempts failed. Server will continue but DB APIs will return 503.');
        // fallback that rejects quickly for existing code paths
        db = { execute: async () => { throw new Error('DB not connected'); } };
      }
    }
  }
}

// Middleware to fail fast when DB is not connected
function requireDB(req, res, next) {
  if (!dbConnected) {
    return res.status(503).json({ error: 'Database not connected' });
  }
  next();
}

// Helper function to generate complaint ID
function generateComplaintId() {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 1000);
  return `COMP-${timestamp}-${random}`;
}

// Helper to generate compliment ID (new)
function generateComplimentId() {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 1000);
  return `COMP-LT-${timestamp}-${random}`;
}

// Routes
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ============ COMPLAINTS CRUD ============

// GET all complaints with filters
app.get('/api/complaints', async (req, res) => {
  try {
    const { status, priority, category } = req.query;
    let query = 'SELECT * FROM complaints WHERE 1=1';
    const params = [];

    if (status) {
      query += ' AND status = ?';
      params.push(status);
    }
    if (priority) {
      query += ' AND priority = ?';
      params.push(priority);
    }
    if (category) {
      query += ' AND category = ?';
      params.push(category);
    }

    query += ' ORDER BY created_at DESC';

    const [rows] = await db.execute(query, params);
    res.json(rows);
  } catch (error) {
    console.error('Error fetching complaints:', error);
    res.status(500).json({ error: 'Failed to fetch complaints' });
  }
});

// GET single complaint by ID
app.get('/api/complaints/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const [rows] = await db.execute(
      'SELECT * FROM complaints WHERE id = ? OR complaint_id = ?',
      [id, id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Complaint not found' });
    }

    res.json(rows[0]);
  } catch (error) {
    console.error('Error fetching complaint:', error);
    res.status(500).json({ error: 'Failed to fetch complaint' });
  }
});

// POST new complaint
app.post('/api/complaints', async (req, res) => {
  const { title, description, category, customer_name, customer_email, customer_phone, priority } = req.body;

  if (!title || !description || !category || !customer_name) {
    return res.status(400).json({ error: 'Title, description, category, and customer name are required' });
  }

  const complaintId = generateComplaintId();

  try {
    const [result] = await db.execute(
      'INSERT INTO complaints (complaint_id, title, description, category, customer_name, customer_email, customer_phone, priority, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [complaintId, title, description, category, customer_name, customer_email || null, customer_phone || null, priority || 'medium', 'open']
    );
    res.status(201).json({
      id: result.insertId,
      complaint_id: complaintId,
      title,
      description,
      category,
      status: 'open',
      priority: priority || 'medium',
      message: 'Complaint registered successfully'
    });
  } catch (error) {
    console.error('Error creating complaint:', error);
    res.status(500).json({ error: 'Failed to register complaint' });
  }
});

// PUT update complaint
app.put('/api/complaints/:id', async (req, res) => {
  const { id } = req.params;
  const { title, description, category, status, priority, assigned_to, resolution_notes } = req.body;

  try {
    let query = 'UPDATE complaints SET ';
    const updates = [];
    const params = [];

    if (title !== undefined) {
      updates.push('title = ?');
      params.push(title);
    }
    if (description !== undefined) {
      updates.push('description = ?');
      params.push(description);
    }
    if (category !== undefined) {
      updates.push('category = ?');
      params.push(category);
    }
    if (status !== undefined) {
      updates.push('status = ?');
      params.push(status);
    }
    if (priority !== undefined) {
      updates.push('priority = ?');
      params.push(priority);
    }
    if (assigned_to !== undefined) {
      updates.push('assigned_to = ?');
      params.push(assigned_to);
    }
    if (resolution_notes !== undefined) {
      updates.push('resolution_notes = ?');
      params.push(resolution_notes);
    }
    if (status === 'resolved' || status === 'closed') {
      updates.push('resolved_at = NOW()');
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    query += updates.join(', ') + ' WHERE id = ? OR complaint_id = ?';
    params.push(id, id);

    const [result] = await db.execute(query, params);

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Complaint not found' });
    }

    res.json({ message: 'Complaint updated successfully' });
  } catch (error) {
    console.error('Error updating complaint:', error);
    res.status(500).json({ error: 'Failed to update complaint' });
  }
});

// DELETE complaint
app.delete('/api/complaints/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const [result] = await db.execute('DELETE FROM complaints WHERE id = ? OR complaint_id = ?', [id, id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Complaint not found' });
    }

    res.json({ message: 'Complaint deleted successfully' });
  } catch (error) {
    console.error('Error deleting complaint:', error);
    res.status(500).json({ error: 'Failed to delete complaint' });
  }
});

// GET complaint statistics
app.get('/api/complaints-stats', async (req, res) => {
  try {
    const [stats] = await db.execute(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status = 'open' THEN 1 ELSE 0 END) as open_count,
        SUM(CASE WHEN status = 'in_progress' THEN 1 ELSE 0 END) as in_progress_count,
        SUM(CASE WHEN status = 'resolved' THEN 1 ELSE 0 END) as resolved_count,
        SUM(CASE WHEN status = 'closed' THEN 1 ELSE 0 END) as closed_count
      FROM complaints
    `);
    res.json(stats[0]);
  } catch (error) {
    console.error('Error fetching statistics:', error);
    res.status(500).json({ error: 'Failed to fetch statistics' });
  }
});

// ============ CATEGORIES CRUD ============

// GET all categories
app.get('/api/categories', async (req, res) => {
  try {
    const [rows] = await db.execute('SELECT * FROM categories ORDER BY created_at DESC');
    res.json(rows);
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

// GET single category by ID
app.get('/api/categories/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const [rows] = await db.execute('SELECT * FROM categories WHERE id = ?', [id]);

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Category not found' });
    }

    res.json(rows[0]);
  } catch (error) {
    console.error('Error fetching category:', error);
    res.status(500).json({ error: 'Failed to fetch category' });
  }
});

// POST new category
app.post('/api/categories', async (req, res) => {
  const { name, description, color } = req.body;

  if (!name) {
    return res.status(400).json({ error: 'Category name is required' });
  }

  try {
    const [result] = await db.execute(
      'INSERT INTO categories (name, description, color) VALUES (?, ?, ?)',
      [name, description || null, color || '#000000']
    );
    res.status(201).json({
      id: result.insertId,
      name,
      description,
      color: color || '#000000',
      message: 'Category created successfully'
    });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ error: 'Category name already exists' });
    }
    console.error('Error creating category:', error);
    res.status(500).json({ error: 'Failed to create category' });
  }
});

// PUT update category
app.put('/api/categories/:id', async (req, res) => {
  const { id } = req.params;
  const { name, description, color } = req.body;

  try {
    let query = 'UPDATE categories SET ';
    const updates = [];
    const params = [];

    if (name !== undefined) {
      updates.push('name = ?');
      params.push(name);
    }
    if (description !== undefined) {
      updates.push('description = ?');
      params.push(description);
    }
    if (color !== undefined) {
      updates.push('color = ?');
      params.push(color);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    query += updates.join(', ') + ' WHERE id = ?';
    params.push(id);

    const [result] = await db.execute(query, params);

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Category not found' });
    }

    res.json({ message: 'Category updated successfully' });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ error: 'Category name already exists' });
    }
    console.error('Error updating category:', error);
    res.status(500).json({ error: 'Failed to update category' });
  }
});

// DELETE category
app.delete('/api/categories/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const [result] = await db.execute('DELETE FROM categories WHERE id = ?', [id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Category not found' });
    }

    res.json({ message: 'Category deleted successfully' });
  } catch (error) {
    console.error('Error deleting category:', error);
    res.status(500).json({ error: 'Failed to delete category' });
  }
});

// ============ COMPLIMENTS CRUD ============

// GET all compliments with optional filters (new)
app.get('/api/compliments', async (req, res) => {
  try {
    const { category, recipient } = req.query;
    let query = 'SELECT * FROM compliments WHERE 1=1';
    const params = [];

    if (category) {
      query += ' AND category = ?';
      params.push(category);
    }
    if (recipient) {
      query += ' AND recipient = ?';
      params.push(recipient);
    }

    query += ' ORDER BY created_at DESC';
    const [rows] = await db.execute(query, params);
    res.json(rows);
  } catch (error) {
    console.error('Error fetching compliments:', error);
    res.status(500).json({ error: 'Failed to fetch compliments' });
  }
});

// GET single compliment by id or compliment_id (new)
app.get('/api/compliments/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const [rows] = await db.execute(
      'SELECT * FROM compliments WHERE id = ? OR compliment_id = ?',
      [id, id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Compliment not found' });
    }
    res.json(rows[0]);
  } catch (error) {
    console.error('Error fetching compliment:', error);
    res.status(500).json({ error: 'Failed to fetch compliment' });
  }
});

// POST create compliment (new)
app.post('/api/compliments', async (req, res) => {
  const { message, sender, recipient, category } = req.body;
  if (!message || !recipient) {
    return res.status(400).json({ error: 'Message and recipient are required' });
  }
  const complimentId = generateComplimentId();
  try {
    const [result] = await db.execute(
      'INSERT INTO compliments (compliment_id, message, sender, recipient, category) VALUES (?, ?, ?, ?, ?)',
      [complimentId, message, sender || null, recipient, category || null]
    );
    res.status(201).json({
      id: result.insertId,
      compliment_id: complimentId,
      message,
      sender,
      recipient,
      category,
      message_text: 'Compliment created successfully'
    });
  } catch (error) {
    console.error('Error creating compliment:', error);
    res.status(500).json({ error: 'Failed to create compliment' });
  }
});

// PUT update compliment (new)
app.put('/api/compliments/:id', async (req, res) => {
  const { id } = req.params;
  const { message, sender, recipient, category } = req.body;
  try {
    const updates = [];
    const params = [];

    if (message !== undefined) { updates.push('message = ?'); params.push(message); }
    if (sender !== undefined) { updates.push('sender = ?'); params.push(sender); }
    if (recipient !== undefined) { updates.push('recipient = ?'); params.push(recipient); }
    if (category !== undefined) { updates.push('category = ?'); params.push(category); }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    const query = `UPDATE compliments SET ${updates.join(', ')} WHERE id = ? OR compliment_id = ?`;
    params.push(id, id);

    const [result] = await db.execute(query, params);
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Compliment not found' });
    }
    res.json({ message: 'Compliment updated successfully' });
  } catch (error) {
    console.error('Error updating compliment:', error);
    res.status(500).json({ error: 'Failed to update compliment' });
  }
});

// DELETE compliment (new)
app.delete('/api/compliments/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const [result] = await db.execute('DELETE FROM compliments WHERE id = ? OR compliment_id = ?', [id, id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Compliment not found' });
    }
    res.json({ message: 'Compliment deleted successfully' });
  } catch (error) {
    console.error('Error deleting compliment:', error);
    res.status(500).json({ error: 'Failed to delete compliment' });
  }
});

// Health check endpoint (updated to include DB status)
app.get('/health', async (req, res) => {
  let dbOk = false;
  try {
    if (db && db.execute) {
      await db.execute('SELECT 1');
      dbOk = true;
    }
  } catch (e) {
    dbOk = false;
  }
  const status = dbOk ? 200 : 503;
  res.status(status).json({ status: dbOk ? 'OK' : 'DB_UNAVAILABLE', dbConnected: dbOk, timestamp: new Date().toISOString() });
});

const PORT = process.env.PORT || 3000;

async function startServer() {
  await initDB();
  app.listen(PORT, () => {
    console.log(`Complaint Management System running on port ${PORT}`);
  });
}

startServer();
