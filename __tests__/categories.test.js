const request = require('supertest');
const express = require('express');
const mysql = require('mysql2/promise');

jest.mock('mysql2/promise');

describe('Categories API', () => {
  let app;
  let mockDb;

  beforeAll(() => {
    app = express();
    app.use(express.json());

    mockDb = {
      execute: jest.fn(),
    };
    mysql.createConnection.mockResolvedValue(mockDb);

    // Setup routes
    app.get('/api/categories', async (req, res) => {
      try {
        const [rows] = await mockDb.execute('SELECT * FROM categories ORDER BY created_at DESC');
        res.json(rows);
      } catch (error) {
        res.status(500).json({ error: 'Failed to fetch categories' });
      }
    });

    app.get('/api/categories/:id', async (req, res) => {
      const { id } = req.params;
      
      try {
        const [rows] = await mockDb.execute('SELECT * FROM categories WHERE id = ?', [id]);
        
        if (rows.length === 0) {
          return res.status(404).json({ error: 'Category not found' });
        }
        
        res.json(rows[0]);
      } catch (error) {
        res.status(500).json({ error: 'Failed to fetch category' });
      }
    });

    app.post('/api/categories', async (req, res) => {
      const { name, description, color } = req.body;
      
      if (!name) {
        return res.status(400).json({ error: 'Category name is required' });
      }

      try {
        const [result] = await mockDb.execute(
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
        res.status(500).json({ error: 'Failed to create category' });
      }
    });

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

        const [result] = await mockDb.execute(query, params);
        
        if (result.affectedRows === 0) {
          return res.status(404).json({ error: 'Category not found' });
        }
        
        res.json({ message: 'Category updated successfully' });
      } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
          return res.status(409).json({ error: 'Category name already exists' });
        }
        res.status(500).json({ error: 'Failed to update category' });
      }
    });

    app.delete('/api/categories/:id', async (req, res) => {
      const { id } = req.params;

      try {
        const [result] = await mockDb.execute('DELETE FROM categories WHERE id = ?', [id]);
        
        if (result.affectedRows === 0) {
          return res.status(404).json({ error: 'Category not found' });
        }
        
        res.json({ message: 'Category deleted successfully' });
      } catch (error) {
        res.status(500).json({ error: 'Failed to delete category' });
      }
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/categories', () => {
    it('should return all categories', async () => {
      const mockCategories = [
        {
          id: 1,
          name: 'Product Quality',
          color: '#FF0000',
        },
      ];

      mockDb.execute.mockResolvedValue([mockCategories]);

      const response = await request(app).get('/api/categories');

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
    });
  });

  describe('POST /api/categories', () => {
    it('should create a new category', async () => {
      const categoryData = {
        name: 'New Category',
        description: 'Test category',
        color: '#0000FF',
      };

      mockDb.execute.mockResolvedValue([{ insertId: 1 }]);

      const response = await request(app)
        .post('/api/categories')
        .send(categoryData);

      expect(response.status).toBe(201);
      expect(response.body.message).toBe('Category created successfully');
    });

    it('should handle duplicate category names', async () => {
      const categoryData = {
        name: 'Existing Category',
      };

      const error = new Error('Duplicate entry');
      error.code = 'ER_DUP_ENTRY';
      mockDb.execute.mockRejectedValue(error);

      const response = await request(app)
        .post('/api/categories')
        .send(categoryData);

      expect(response.status).toBe(409);
    });
  });

  describe('PUT /api/categories/:id', () => {
    it('should update a category', async () => {
      mockDb.execute.mockResolvedValue([{ affectedRows: 1 }]);

      const response = await request(app)
        .put('/api/categories/1')
        .send({ name: 'Updated Category' });

      expect(response.status).toBe(200);
    });
  });

  describe('DELETE /api/categories/:id', () => {
    it('should delete a category', async () => {
      mockDb.execute.mockResolvedValue([{ affectedRows: 1 }]);

      const response = await request(app).delete('/api/categories/1');

      expect(response.status).toBe(200);
    });
  });
});
