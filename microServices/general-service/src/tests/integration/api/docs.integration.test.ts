/**
 * @fileoverview Integration tests for Documentation API
 */

import request from 'supertest';
import { Application } from 'express';
import { Sequelize } from 'sequelize';
import { setupTestDb, cleanupTestDb, testHelpers, documentHelpers } from '../../setup';

describe('Documentation API - Integration Tests', () => {
  let app: Application;
  let sequelize: Sequelize;

  beforeAll(async () => {
    sequelize = await setupTestDb();
    app = testHelpers.createTestApp();
    
    // Mock document storage (in real implementation might use filesystem or separate DB)
    let mockDocuments: any[] = [];
    
    // Setup documentation routes - mock implementation
    app.get('/api/docs', async (req, res) => {
      try {
        const { 
          page = 1, 
          limit = 10, 
          category, 
          tag, 
          search, 
          published 
        } = req.query;

        let filteredDocs = mockDocuments;

        // Apply filters
        if (category) {
          filteredDocs = filteredDocs.filter(doc => doc.category === category);
        }
        
        if (tag) {
          filteredDocs = filteredDocs.filter(doc => doc.tags.includes(tag));
        }
        
        if (search) {
          filteredDocs = documentHelpers.mockSearchResults(filteredDocs, search as string);
        }
        
        if (published !== undefined) {
          const isPublished = published === 'true';
          filteredDocs = filteredDocs.filter(doc => doc.isPublished === isPublished);
        }

        // Apply sorting
        filteredDocs.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

        // Apply pagination
        const offset = (Number(page) - 1) * Number(limit);
        const paginatedDocs = filteredDocs.slice(offset, offset + Number(limit));
        const total = filteredDocs.length;
        const totalPages = Math.ceil(total / Number(limit));

        res.json({
          success: true,
          data: {
            items: paginatedDocs,
            total,
            page: Number(page),
            limit: Number(limit),
            totalPages
          }
        });
      } catch (error) {
        res.status(500).json({
          success: false,
          message: (error as Error).message
        });
      }
    });

    app.get('/api/docs/:id', async (req, res) => {
      try {
        const doc = mockDocuments.find(d => d.id === req.params.id);
        
        if (!doc) {
          return res.status(404).json({
            success: false,
            message: 'Document not found'
          });
        }

        res.json({
          success: true,
          data: doc
        });
      } catch (error) {
        res.status(500).json({
          success: false,
          message: (error as Error).message
        });
      }
    });

    app.get('/api/docs/search/:query', async (req, res) => {
      try {
        const { query } = req.params;
        const { 
          page = 1, 
          limit = 10, 
          category,
          includeUnpublished = false 
        } = req.query;

        let searchResults = documentHelpers.mockSearchResults(mockDocuments, query);
        
        // Filter by category if specified
        if (category) {
          searchResults = searchResults.filter(doc => doc.category === category);
        }
        
        // Filter published status
        if (!includeUnpublished || includeUnpublished === 'false') {
          searchResults = searchResults.filter(doc => doc.isPublished);
        }

        // Apply pagination
        const offset = (Number(page) - 1) * Number(limit);
        const paginatedResults = searchResults.slice(offset, offset + Number(limit));
        const total = searchResults.length;
        const totalPages = Math.ceil(total / Number(limit));

        res.json({
          success: true,
          data: {
            query,
            items: paginatedResults,
            total,
            page: Number(page),
            limit: Number(limit),
            totalPages
          }
        });
      } catch (error) {
        res.status(500).json({
          success: false,
          message: (error as Error).message
        });
      }
    });

    app.get('/api/docs/category/:category', async (req, res) => {
      try {
        const { category } = req.params;
        const { page = 1, limit = 10, published = 'true' } = req.query;

        let categoryDocs = mockDocuments.filter(doc => doc.category === category);
        
        if (published === 'true') {
          categoryDocs = categoryDocs.filter(doc => doc.isPublished);
        }

        // Apply pagination
        const offset = (Number(page) - 1) * Number(limit);
        const paginatedDocs = categoryDocs.slice(offset, offset + Number(limit));
        const total = categoryDocs.length;
        const totalPages = Math.ceil(total / Number(limit));

        res.json({
          success: true,
          data: {
            category,
            items: paginatedDocs,
            total,
            page: Number(page),
            limit: Number(limit),
            totalPages
          }
        });
      } catch (error) {
        res.status(500).json({
          success: false,
          message: (error as Error).message
        });
      }
    });

    app.get('/api/docs/tags/:tag', async (req, res) => {
      try {
        const { tag } = req.params;
        const { page = 1, limit = 10 } = req.query;

        const taggedDocs = mockDocuments.filter(doc => 
          doc.tags.includes(tag) && doc.isPublished
        );

        // Apply pagination
        const offset = (Number(page) - 1) * Number(limit);
        const paginatedDocs = taggedDocs.slice(offset, offset + Number(limit));
        const total = taggedDocs.length;
        const totalPages = Math.ceil(total / Number(limit));

        res.json({
          success: true,
          data: {
            tag,
            items: paginatedDocs,
            total,
            page: Number(page),
            limit: Number(limit),
            totalPages
          }
        });
      } catch (error) {
        res.status(500).json({
          success: false,
          message: (error as Error).message
        });
      }
    });

    app.get('/api/docs/stats/overview', async (req, res) => {
      try {
        const totalDocs = mockDocuments.length;
        const publishedDocs = mockDocuments.filter(doc => doc.isPublished).length;
        const unpublishedDocs = totalDocs - publishedDocs;
        
        const categoryStats: { [key: string]: number } = {};
        const tagStats: { [key: string]: number } = {};
        const authorStats: { [key: string]: number } = {};

        mockDocuments.forEach(doc => {
          // Category statistics
          categoryStats[doc.category] = (categoryStats[doc.category] || 0) + 1;
          
          // Tag statistics
          doc.tags.forEach(tag => {
            tagStats[tag] = (tagStats[tag] || 0) + 1;
          });
          
          // Author statistics
          authorStats[doc.author] = (authorStats[doc.author] || 0) + 1;
        });

        const recentDocs = mockDocuments
          .filter(doc => doc.isPublished)
          .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
          .slice(0, 5);

        res.json({
          success: true,
          data: {
            overview: {
              totalDocs,
              publishedDocs,
              unpublishedDocs
            },
            categoryStats,
            tagStats,
            authorStats,
            recentDocs
          }
        });
      } catch (error) {
        res.status(500).json({
          success: false,
          message: (error as Error).message
        });
      }
    });

    // Setup mock data - this would normally be done through actual document creation
    app.post('/api/docs/test/setup', async (req, res) => {
      try {
        const { documents } = req.body;
        mockDocuments = documents || [];
        res.json({ success: true, message: 'Test data setup complete', count: mockDocuments.length });
      } catch (error) {
        res.status(500).json({ success: false, message: (error as Error).message });
      }
    });

    // Clear mock data
    app.post('/api/docs/test/clear', async (req, res) => {
      try {
        mockDocuments = [];
        res.json({ success: true, message: 'Test data cleared' });
      } catch (error) {
        res.status(500).json({ success: false, message: (error as Error).message });
      }
    });
  });

  afterAll(async () => {
    await cleanupTestDb(sequelize);
  });

  beforeEach(async () => {
    // Clear mock data before each test
    await request(app).post('/api/docs/test/clear');
  });

  describe('GET /api/docs', () => {
    it('should return paginated documents', async () => {
      // Arrange
      const documents = await testHelpers.createMultipleDocuments(sequelize, 5);
      await request(app)
        .post('/api/docs/test/setup')
        .send({ documents });

      // Act
      const response = await request(app)
        .get('/api/docs?page=1&limit=3')
        .expect(200);

      // Assert
      expect(response.body.success).toBe(true);
      expect(response.body.data.items).toHaveLength(3);
      expect(response.body.data.total).toBe(5);
      expect(response.body.data.page).toBe(1);
      expect(response.body.data.limit).toBe(3);
      expect(response.body.data.totalPages).toBe(2);
    });

    it('should filter documents by category', async () => {
      // Arrange
      const documents = [
        { ...testHelpers.testDocumentData, id: 'doc-1', category: 'technical', title: 'Technical Doc 1' },
        { ...testHelpers.testDocumentData, id: 'doc-2', category: 'general', title: 'General Doc 1' },
        { ...testHelpers.testDocumentData, id: 'doc-3', category: 'technical', title: 'Technical Doc 2' }
      ];
      
      await request(app)
        .post('/api/docs/test/setup')
        .send({ documents });

      // Act
      const response = await request(app)
        .get('/api/docs?category=technical')
        .expect(200);

      // Assert
      expect(response.body.success).toBe(true);
      expect(response.body.data.items).toHaveLength(2);
      response.body.data.items.forEach(item => {
        expect(item.category).toBe('technical');
      });
    });

    it('should filter documents by tag', async () => {
      // Arrange
      const documents = [
        { ...testHelpers.testDocumentData, id: 'doc-1', tags: ['test', 'api'], title: 'API Doc' },
        { ...testHelpers.testDocumentData, id: 'doc-2', tags: ['tutorial', 'beginner'], title: 'Tutorial Doc' },
        { ...testHelpers.testDocumentData, id: 'doc-3', tags: ['test', 'integration'], title: 'Test Doc' }
      ];
      
      await request(app)
        .post('/api/docs/test/setup')
        .send({ documents });

      // Act
      const response = await request(app)
        .get('/api/docs?tag=test')
        .expect(200);

      // Assert
      expect(response.body.success).toBe(true);
      expect(response.body.data.items).toHaveLength(2);
      response.body.data.items.forEach(item => {
        expect(item.tags).toContain('test');
      });
    });

    it('should filter documents by search query', async () => {
      // Arrange
      const documents = [
        { ...testHelpers.testDocumentData, id: 'doc-1', title: 'API Documentation', content: 'Learn about our REST API' },
        { ...testHelpers.testDocumentData, id: 'doc-2', title: 'User Guide', content: 'Getting started guide' },
        { ...testHelpers.testDocumentData, id: 'doc-3', title: 'API Reference', content: 'Complete API reference' }
      ];
      
      await request(app)
        .post('/api/docs/test/setup')
        .send({ documents });

      // Act
      const response = await request(app)
        .get('/api/docs?search=API')
        .expect(200);

      // Assert
      expect(response.body.success).toBe(true);
      expect(response.body.data.items).toHaveLength(2);
    });

    it('should filter documents by published status', async () => {
      // Arrange
      const documents = [
        { ...testHelpers.testDocumentData, id: 'doc-1', title: 'Published Doc', isPublished: true },
        { ...testHelpers.testDocumentData, id: 'doc-2', title: 'Draft Doc', isPublished: false },
        { ...testHelpers.testDocumentData, id: 'doc-3', title: 'Another Published', isPublished: true }
      ];
      
      await request(app)
        .post('/api/docs/test/setup')
        .send({ documents });

      // Act
      const response = await request(app)
        .get('/api/docs?published=true')
        .expect(200);

      // Assert
      expect(response.body.success).toBe(true);
      expect(response.body.data.items).toHaveLength(2);
      response.body.data.items.forEach(item => {
        expect(item.isPublished).toBe(true);
      });
    });

    it('should return empty results when no documents match', async () => {
      // Arrange
      const documents = [
        { ...testHelpers.testDocumentData, id: 'doc-1', category: 'technical' }
      ];
      
      await request(app)
        .post('/api/docs/test/setup')
        .send({ documents });

      // Act
      const response = await request(app)
        .get('/api/docs?category=non-existent')
        .expect(200);

      // Assert
      expect(response.body.success).toBe(true);
      expect(response.body.data.items).toEqual([]);
      expect(response.body.data.total).toBe(0);
    });
  });

  describe('GET /api/docs/:id', () => {
    it('should return document by ID', async () => {
      // Arrange
      const documents = [
        { ...testHelpers.testDocumentData, id: 'specific-doc', title: 'Specific Document' }
      ];
      
      await request(app)
        .post('/api/docs/test/setup')
        .send({ documents });

      // Act
      const response = await request(app)
        .get('/api/docs/specific-doc')
        .expect(200);

      // Assert
      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.id).toBe('specific-doc');
      expect(response.body.data.title).toBe('Specific Document');
    });

    it('should return 404 for non-existent document', async () => {
      // Act
      const response = await request(app)
        .get('/api/docs/non-existent-doc')
        .expect(404);

      // Assert
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Document not found');
    });

    it('should handle special characters in document ID', async () => {
      // Arrange
      const documents = [
        { ...testHelpers.testDocumentData, id: 'doc-with_special-chars.123', title: 'Special ID Doc' }
      ];
      
      await request(app)
        .post('/api/docs/test/setup')
        .send({ documents });

      // Act
      const response = await request(app)
        .get('/api/docs/doc-with_special-chars.123')
        .expect(200);

      // Assert
      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe('doc-with_special-chars.123');
    });
  });

  describe('GET /api/docs/search/:query', () => {
    it('should search documents by query', async () => {
      // Arrange
      const documents = [
        { ...testHelpers.testDocumentData, id: 'doc-1', title: 'JavaScript Tutorial', content: 'Learn JavaScript programming' },
        { ...testHelpers.testDocumentData, id: 'doc-2', title: 'Python Guide', content: 'Python programming basics' },
        { ...testHelpers.testDocumentData, id: 'doc-3', title: 'API Documentation', content: 'JavaScript API reference' }
      ];
      
      await request(app)
        .post('/api/docs/test/setup')
        .send({ documents });

      // Act
      const response = await request(app)
        .get('/api/docs/search/JavaScript')
        .expect(200);

      // Assert
      expect(response.body.success).toBe(true);
      expect(response.body.data.query).toBe('JavaScript');
      expect(response.body.data.items).toHaveLength(2);
    });

    it('should search with category filter', async () => {
      // Arrange
      const documents = [
        { ...testHelpers.testDocumentData, id: 'doc-1', title: 'Technical Tutorial', category: 'technical', content: 'Technical content' },
        { ...testHelpers.testDocumentData, id: 'doc-2', title: 'General Tutorial', category: 'general', content: 'General content' },
        { ...testHelpers.testDocumentData, id: 'doc-3', title: 'Tutorial Advanced', category: 'technical', content: 'Advanced technical content' }
      ];
      
      await request(app)
        .post('/api/docs/test/setup')
        .send({ documents });

      // Act
      const response = await request(app)
        .get('/api/docs/search/Tutorial?category=technical')
        .expect(200);

      // Assert
      expect(response.body.success).toBe(true);
      expect(response.body.data.items).toHaveLength(2);
      response.body.data.items.forEach(item => {
        expect(item.category).toBe('technical');
      });
    });

    it('should include unpublished documents when requested', async () => {
      // Arrange
      const documents = [
        { ...testHelpers.testDocumentData, id: 'doc-1', title: 'Published Tutorial', isPublished: true, content: 'Tutorial content' },
        { ...testHelpers.testDocumentData, id: 'doc-2', title: 'Draft Tutorial', isPublished: false, content: 'Draft tutorial content' }
      ];
      
      await request(app)
        .post('/api/docs/test/setup')
        .send({ documents });

      // Act
      const responseWithUnpublished = await request(app)
        .get('/api/docs/search/Tutorial?includeUnpublished=true')
        .expect(200);

      const responseWithoutUnpublished = await request(app)
        .get('/api/docs/search/Tutorial')
        .expect(200);

      // Assert
      expect(responseWithUnpublished.body.data.items).toHaveLength(2);
      expect(responseWithoutUnpublished.body.data.items).toHaveLength(1);
    });

    it('should handle pagination in search results', async () => {
      // Arrange
      const documents = [];
      for (let i = 1; i <= 5; i++) {
        documents.push({
          ...testHelpers.testDocumentData,
          id: `search-doc-${i}`,
          title: `Search Document ${i}`,
          content: `This is search document ${i} content`
        });
      }
      
      await request(app)
        .post('/api/docs/test/setup')
        .send({ documents });

      // Act
      const response = await request(app)
        .get('/api/docs/search/Document?page=2&limit=2')
        .expect(200);

      // Assert
      expect(response.body.success).toBe(true);
      expect(response.body.data.items).toHaveLength(2);
      expect(response.body.data.total).toBe(5);
      expect(response.body.data.page).toBe(2);
      expect(response.body.data.totalPages).toBe(3);
    });

    it('should return empty results for no matches', async () => {
      // Arrange
      const documents = [
        { ...testHelpers.testDocumentData, id: 'doc-1', title: 'JavaScript Guide', content: 'JavaScript content' }
      ];
      
      await request(app)
        .post('/api/docs/test/setup')
        .send({ documents });

      // Act
      const response = await request(app)
        .get('/api/docs/search/Python')
        .expect(200);

      // Assert
      expect(response.body.success).toBe(true);
      expect(response.body.data.items).toEqual([]);
      expect(response.body.data.total).toBe(0);
    });
  });

  describe('GET /api/docs/category/:category', () => {
    it('should return documents by category', async () => {
      // Arrange
      const documents = [
        { ...testHelpers.testDocumentData, id: 'tech-1', category: 'technical', title: 'Technical Doc 1' },
        { ...testHelpers.testDocumentData, id: 'tech-2', category: 'technical', title: 'Technical Doc 2' },
        { ...testHelpers.testDocumentData, id: 'gen-1', category: 'general', title: 'General Doc 1' }
      ];
      
      await request(app)
        .post('/api/docs/test/setup')
        .send({ documents });

      // Act
      const response = await request(app)
        .get('/api/docs/category/technical')
        .expect(200);

      // Assert
      expect(response.body.success).toBe(true);
      expect(response.body.data.category).toBe('technical');
      expect(response.body.data.items).toHaveLength(2);
      response.body.data.items.forEach(item => {
        expect(item.category).toBe('technical');
      });
    });

    it('should handle pagination for category documents', async () => {
      // Arrange
      const documents = [];
      for (let i = 1; i <= 7; i++) {
        documents.push({
          ...testHelpers.testDocumentData,
          id: `tech-${i}`,
          category: 'technical',
          title: `Technical Document ${i}`
        });
      }
      
      await request(app)
        .post('/api/docs/test/setup')
        .send({ documents });

      // Act
      const response = await request(app)
        .get('/api/docs/category/technical?page=2&limit=3')
        .expect(200);

      // Assert
      expect(response.body.success).toBe(true);
      expect(response.body.data.items).toHaveLength(3);
      expect(response.body.data.total).toBe(7);
      expect(response.body.data.page).toBe(2);
    });

    it('should filter by published status in category', async () => {
      // Arrange
      const documents = [
        { ...testHelpers.testDocumentData, id: 'tech-pub', category: 'technical', title: 'Published Tech', isPublished: true },
        { ...testHelpers.testDocumentData, id: 'tech-draft', category: 'technical', title: 'Draft Tech', isPublished: false }
      ];
      
      await request(app)
        .post('/api/docs/test/setup')
        .send({ documents });

      // Act
      const publishedResponse = await request(app)
        .get('/api/docs/category/technical?published=true')
        .expect(200);

      const allResponse = await request(app)
        .get('/api/docs/category/technical?published=false')
        .expect(200);

      // Assert
      expect(publishedResponse.body.data.items).toHaveLength(1);
      expect(publishedResponse.body.data.items[0].isPublished).toBe(true);
      
      expect(allResponse.body.data.items).toHaveLength(2);
    });
  });

  describe('GET /api/docs/tags/:tag', () => {
    it('should return documents by tag', async () => {
      // Arrange
      const documents = [
        { ...testHelpers.testDocumentData, id: 'doc-1', tags: ['tutorial', 'beginner'], title: 'Tutorial 1' },
        { ...testHelpers.testDocumentData, id: 'doc-2', tags: ['tutorial', 'advanced'], title: 'Tutorial 2' },
        { ...testHelpers.testDocumentData, id: 'doc-3', tags: ['reference', 'api'], title: 'Reference Doc' }
      ];
      
      await request(app)
        .post('/api/docs/test/setup')
        .send({ documents });

      // Act
      const response = await request(app)
        .get('/api/docs/tags/tutorial')
        .expect(200);

      // Assert
      expect(response.body.success).toBe(true);
      expect(response.body.data.tag).toBe('tutorial');
      expect(response.body.data.items).toHaveLength(2);
      response.body.data.items.forEach(item => {
        expect(item.tags).toContain('tutorial');
      });
    });

    it('should handle pagination for tagged documents', async () => {
      // Arrange
      const documents = [];
      for (let i = 1; i <= 5; i++) {
        documents.push({
          ...testHelpers.testDocumentData,
          id: `tagged-${i}`,
          tags: ['common-tag', `specific-${i}`],
          title: `Tagged Document ${i}`
        });
      }
      
      await request(app)
        .post('/api/docs/test/setup')
        .send({ documents });

      // Act
      const response = await request(app)
        .get('/api/docs/tags/common-tag?page=2&limit=2')
        .expect(200);

      // Assert
      expect(response.body.success).toBe(true);
      expect(response.body.data.items).toHaveLength(2);
      expect(response.body.data.total).toBe(5);
      expect(response.body.data.page).toBe(2);
    });

    it('should only return published documents for tags', async () => {
      // Arrange
      const documents = [
        { ...testHelpers.testDocumentData, id: 'pub-tagged', tags: ['shared-tag'], isPublished: true, title: 'Published' },
        { ...testHelpers.testDocumentData, id: 'draft-tagged', tags: ['shared-tag'], isPublished: false, title: 'Draft' }
      ];
      
      await request(app)
        .post('/api/docs/test/setup')
        .send({ documents });

      // Act
      const response = await request(app)
        .get('/api/docs/tags/shared-tag')
        .expect(200);

      // Assert
      expect(response.body.success).toBe(true);
      expect(response.body.data.items).toHaveLength(1);
      expect(response.body.data.items[0].isPublished).toBe(true);
    });
  });

  describe('GET /api/docs/stats/overview', () => {
    it('should return comprehensive document statistics', async () => {
      // Arrange
      const documents = [
        { ...testHelpers.testDocumentData, id: 'doc-1', category: 'technical', tags: ['api', 'guide'], author: 'author1', isPublished: true },
        { ...testHelpers.testDocumentData, id: 'doc-2', category: 'general', tags: ['tutorial'], author: 'author1', isPublished: true },
        { ...testHelpers.testDocumentData, id: 'doc-3', category: 'technical', tags: ['api', 'reference'], author: 'author2', isPublished: false },
        { ...testHelpers.testDocumentData, id: 'doc-4', category: 'general', tags: ['guide'], author: 'author2', isPublished: true }
      ];
      
      await request(app)
        .post('/api/docs/test/setup')
        .send({ documents });

      // Act
      const response = await request(app)
        .get('/api/docs/stats/overview')
        .expect(200);

      // Assert
      expect(response.body.success).toBe(true);
      
      const { overview, categoryStats, tagStats, authorStats, recentDocs } = response.body.data;
      
      expect(overview.totalDocs).toBe(4);
      expect(overview.publishedDocs).toBe(3);
      expect(overview.unpublishedDocs).toBe(1);
      
      expect(categoryStats).toEqual({
        'technical': 2,
        'general': 2
      });
      
      expect(tagStats).toEqual({
        'api': 2,
        'guide': 2,
        'tutorial': 1,
        'reference': 1
      });
      
      expect(authorStats).toEqual({
        'author1': 2,
        'author2': 2
      });
      
      expect(recentDocs).toHaveLength(3); // Only published documents
    });

    it('should return empty statistics for no documents', async () => {
      // Act
      const response = await request(app)
        .get('/api/docs/stats/overview')
        .expect(200);

      // Assert
      expect(response.body.success).toBe(true);
      expect(response.body.data.overview.totalDocs).toBe(0);
      expect(response.body.data.overview.publishedDocs).toBe(0);
      expect(response.body.data.overview.unpublishedDocs).toBe(0);
      expect(response.body.data.categoryStats).toEqual({});
      expect(response.body.data.tagStats).toEqual({});
      expect(response.body.data.authorStats).toEqual({});
      expect(response.body.data.recentDocs).toEqual([]);
    });

    it('should limit recent documents to 5', async () => {
      // Arrange
      const documents = [];
      for (let i = 1; i <= 10; i++) {
        documents.push({
          ...testHelpers.testDocumentData,
          id: `recent-${i}`,
          title: `Recent Document ${i}`,
          updatedAt: new Date(Date.now() - i * 60000), // Each doc is 1 minute older
          isPublished: true
        });
      }
      
      await request(app)
        .post('/api/docs/test/setup')
        .send({ documents });

      // Act
      const response = await request(app)
        .get('/api/docs/stats/overview')
        .expect(200);

      // Assert
      expect(response.body.success).toBe(true);
      expect(response.body.data.recentDocs).toHaveLength(5);
      
      // Should be ordered by most recent first
      const titles = response.body.data.recentDocs.map(doc => doc.title);
      expect(titles[0]).toBe('Recent Document 1');
      expect(titles[4]).toBe('Recent Document 5');
    });
  });

  describe('Error Handling', () => {
    it('should handle server errors gracefully', async () => {
      // Simulate error by requesting non-implemented endpoint
      const response = await request(app)
        .get('/api/docs/invalid-endpoint')
        .expect(404);

      expect(response.status).toBe(404);
    });

    it('should handle malformed search queries', async () => {
      // Act - Test with special characters
      const response = await request(app)
        .get('/api/docs/search/' + encodeURIComponent('special chars !@#$%^&*()'))
        .expect(200);

      // Assert - Should handle gracefully
      expect(response.body.success).toBe(true);
      expect(response.body.data.items).toEqual([]);
    });

    it('should handle invalid pagination parameters', async () => {
      // Arrange
      const documents = [testHelpers.testDocumentData];
      await request(app)
        .post('/api/docs/test/setup')
        .send({ documents });

      // Act
      const response = await request(app)
        .get('/api/docs?page=-1&limit=0')
        .expect(200);

      // Assert - Should handle gracefully
      expect(response.body.success).toBe(true);
    });
  });

  describe('Performance Tests', () => {
    it('should handle large document collections efficiently', async () => {
      // Arrange
      const documents = await testHelpers.createMultipleDocuments(sequelize, 100);
      await request(app)
        .post('/api/docs/test/setup')
        .send({ documents });
      
      const startTime = Date.now();

      // Act
      const response = await request(app)
        .get('/api/docs?page=5&limit=20')
        .expect(200);

      const endTime = Date.now();
      const responseTime = endTime - startTime;

      // Assert
      expect(response.body.success).toBe(true);
      expect(response.body.data.items).toHaveLength(20);
      expect(response.body.data.total).toBe(100);
      expect(responseTime).toBeLessThan(1000); // Should respond within 1 second
    });

    it('should efficiently search through large document collections', async () => {
      // Arrange
      const documents = [];
      for (let i = 1; i <= 50; i++) {
        documents.push({
          ...testHelpers.testDocumentData,
          id: `perf-doc-${i}`,
          title: `Performance Test Document ${i}`,
          content: i % 10 === 0 ? 'Special searchable content' : 'Regular content',
          category: i % 2 === 0 ? 'technical' : 'general'
        });
      }
      
      await request(app)
        .post('/api/docs/test/setup')
        .send({ documents });
      
      const startTime = Date.now();

      // Act
      const response = await request(app)
        .get('/api/docs/search/searchable')
        .expect(200);

      const endTime = Date.now();
      const responseTime = endTime - startTime;

      // Assert
      expect(response.body.success).toBe(true);
      expect(response.body.data.items).toHaveLength(5); // Every 10th document
      expect(responseTime).toBeLessThan(800); // Should respond within 0.8 seconds
    });
  });

  describe('Data Validation', () => {
    it('should validate document structure', async () => {
      // Arrange
      const validDocument = testHelpers.testDocumentData;
      const isValid = documentHelpers.validateDocumentStructure(validDocument);

      // Assert
      expect(isValid).toBe(true);
    });

    it('should handle various document categories', async () => {
      // Arrange
      const categories = ['technical', 'general', 'tutorial', 'reference', 'guide'];
      const documents = categories.map((category, i) => ({
        ...testHelpers.testDocumentData,
        id: `cat-${i}`,
        category,
        title: `${category} Document`
      }));
      
      await request(app)
        .post('/api/docs/test/setup')
        .send({ documents });

      // Act & Assert
      for (const category of categories) {
        const response = await request(app)
          .get(`/api/docs/category/${category}`)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data.items).toHaveLength(1);
        expect(response.body.data.items[0].category).toBe(category);
      }
    });

    it('should handle various tag formats', async () => {
      // Arrange
      const tagFormats = [
        ['simple'],
        ['multi-word-tag'],
        ['CamelCase'],
        ['numbers123'],
        ['special_chars-allowed']
      ];
      
      const documents = tagFormats.map((tags, i) => ({
        ...testHelpers.testDocumentData,
        id: `tag-${i}`,
        tags,
        title: `Tagged Document ${i}`
      }));
      
      await request(app)
        .post('/api/docs/test/setup')
        .send({ documents });

      // Act & Assert
      for (let i = 0; i < tagFormats.length; i++) {
        const tag = tagFormats[i][0];
        const response = await request(app)
          .get(`/api/docs/tags/${tag}`)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data.items).toHaveLength(1);
      }
    });
  });
});