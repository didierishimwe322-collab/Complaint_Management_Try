const request = require('supertest');
const express = require('express');
const mysql = require('mysql2/promise');

jest.mock('mysql2/promise');

describe('Complaints API', () => {
  let app;
  let mockDb;

  beforeAll(() => {
    app = express();
    app.use(express.json());

    mockDb = {
      execute: jest.fn()
    };
    mysql.createConnection.mockResolvedValue(mockDb);

    // Helper
    function generateComplaintId() {
      const timestamp = Date.now();
      const random = Math.floor(Math.random() * 1000);
      return `COMP-${timestamp}-${random}`;
    }

    // Routes
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

        const [rows] = await mockDb.execute(query, params);
        res.json(rows);
      } catch (error) {
        res.status(500).json({ error: 'Failed to fetch complaints' });
      }
    });

    app.post('/api/complaints', async (req, res) => {
      const {
        title,
        description,
        category,
        customer_name,
        customer_email,
        customer_phone,
        priority
      } = req.body;

      if (!title || !description || !category || !customer_name) {
        return res.status(400).json({ error: 'Title, description, category, and customer name are required' });
      }

      const complaintId = generateComplaintId();

      try {
        const [result] = await mockDb.execute(
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
        res.status(500).json({ error: 'Failed to register complaint' });
      }
    });

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

        const [result] = await mockDb.execute(query, params);

        if (result.affectedRows === 0) {
          return res.status(404).json({ error: 'Complaint not found' });
        }

        res.json({ message: 'Complaint updated successfully' });
      } catch (error) {
        res.status(500).json({ error: 'Failed to update complaint' });
      }
    });

    app.delete('/api/complaints/:id', async (req, res) => {
      const { id } = req.params;

      try {
        const [result] = await mockDb.execute('DELETE FROM complaints WHERE id = ? OR complaint_id = ?', [id, id]);

        if (result.affectedRows === 0) {
          return res.status(404).json({ error: 'Complaint not found' });
        }

        res.json({ message: 'Complaint deleted successfully' });
      } catch (error) {
        res.status(500).json({ error: 'Failed to delete complaint' });
      }
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/complaints', () => {
    it('should return all complaints', async () => {
      const mockComplaints = [
        {
          id: 1,
          complaint_id: 'COMP-123456-001',
          title: 'Test Complaint',
          status: 'open'
        }
      ];

      mockDb.execute.mockResolvedValue([mockComplaints]);

      const response = await request(app).get('/api/complaints');

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBe(1);
    });

    it('should filter complaints by status', async () => {
      const mockComplaints = [
        {
          id: 1,
          complaint_id: 'COMP-123456-001',
          status: 'open'
        }
      ];

      mockDb.execute.mockResolvedValue([mockComplaints]);

      const response = await request(app)
        .get('/api/complaints')
        .query({ status: 'open' });

      expect(response.status).toBe(200);
      expect(mockDb.execute).toHaveBeenCalled();
    });

    it('should handle database errors', async () => {
      mockDb.execute.mockRejectedValue(new Error('Database error'));

      const response = await request(app).get('/api/complaints');

      expect(response.status).toBe(500);
      expect(response.body.error).toBeDefined();
    });
  });

  describe('POST /api/complaints', () => {
    it('should create a new complaint', async () => {
      const complaintData = {
        title: 'New Complaint',
        description: 'Test description',
        category: 'Service',
        customer_name: 'John Doe'
      };

      mockDb.execute.mockResolvedValue([{ insertId: 1 }]);

      const response = await request(app)
        .post('/api/complaints')
        .send(complaintData);

      expect(response.status).toBe(201);
      expect(response.body.complaint_id).toBeDefined();
      expect(response.body.message).toBe('Complaint registered successfully');
    });

    it('should validate required fields', async () => {
      const complaintData = { title: 'New Complaint' };

      const response = await request(app)
        .post('/api/complaints')
        .send(complaintData);

      expect(response.status).toBe(400);
      expect(response.body.error).toBeDefined();
    });
  });

  describe('PUT /api/complaints/:id', () => {
    it('should update an existing complaint', async () => {
      mockDb.execute.mockResolvedValue([{ affectedRows: 1 }]);

      const response = await request(app)
        .put('/api/complaints/1')
        .send({ status: 'resolved' });

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Complaint updated successfully');
    });

    it('should return 404 for non-existent complaint', async () => {
      mockDb.execute.mockResolvedValue([{ affectedRows: 0 }]);

      const response = await request(app)
        .put('/api/complaints/999')
        .send({ status: 'resolved' });

      expect(response.status).toBe(404);
    });
  });

  describe('DELETE /api/complaints/:id', () => {
    it('should delete a complaint', async () => {
      mockDb.execute.mockResolvedValue([{ affectedRows: 1 }]);

      const response = await request(app).delete('/api/complaints/1');

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Complaint deleted successfully');
    });

    it('should return 404 if complaint not found', async () => {
      mockDb.execute.mockResolvedValue([{ affectedRows: 0 }]);

      const response = await request(app).delete('/api/complaints/999');

      expect(response.status).toBe(404);
    });
  });
});
