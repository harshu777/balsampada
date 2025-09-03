/**
 * Base Service Class - Following SOLID principles
 * All services should extend this base class
 */

class BaseService {
  constructor(model, cacheService = null) {
    this.model = model;
    this.cacheService = cacheService;
  }

  /**
   * Get all records with pagination and filtering
   */
  async getAll(options = {}) {
    const {
      page = 1,
      limit = 10,
      sort = '-createdAt',
      filter = {},
      select = '',
      populate = ''
    } = options;

    const cacheKey = this.getCacheKey('all', options);
    
    // Try cache first
    if (this.cacheService) {
      const cached = await this.cacheService.get(cacheKey);
      if (cached) return cached;
    }

    try {
      const skip = (page - 1) * limit;
      
      const query = this.model.find(filter)
        .limit(limit)
        .skip(skip)
        .sort(sort);

      if (select) query.select(select);
      if (populate) query.populate(populate);

      const [data, total] = await Promise.all([
        query.exec(),
        this.model.countDocuments(filter)
      ]);

      const result = {
        data,
        pagination: {
          total,
          page,
          pages: Math.ceil(total / limit),
          limit
        }
      };

      // Cache the result
      if (this.cacheService) {
        await this.cacheService.set(cacheKey, result, 300); // 5 min cache
      }

      return result;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Get single record by ID
   */
  async getById(id, options = {}) {
    const { populate = '', select = '' } = options;
    const cacheKey = this.getCacheKey('byId', { id, ...options });

    // Try cache first
    if (this.cacheService) {
      const cached = await this.cacheService.get(cacheKey);
      if (cached) return cached;
    }

    try {
      const query = this.model.findById(id);
      
      if (select) query.select(select);
      if (populate) query.populate(populate);

      const result = await query.exec();

      if (!result) {
        const error = new Error(`${this.model.modelName} not found`);
        error.statusCode = 404;
        throw error;
      }

      // Cache the result
      if (this.cacheService) {
        await this.cacheService.set(cacheKey, result, 300);
      }

      return result;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Create new record
   */
  async create(data, options = {}) {
    const { session = null } = options;

    try {
      // Validate data
      await this.validateCreate(data);

      const result = await this.model.create([data], { session });
      
      // Invalidate cache
      if (this.cacheService) {
        await this.invalidateCache();
      }

      // Emit event
      this.emitEvent('created', result[0]);

      return result[0];
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Update record
   */
  async update(id, data, options = {}) {
    const { session = null, runValidators = true } = options;

    try {
      // Validate data
      await this.validateUpdate(id, data);

      const result = await this.model.findByIdAndUpdate(
        id,
        data,
        {
          new: true,
          runValidators,
          session
        }
      );

      if (!result) {
        const error = new Error(`${this.model.modelName} not found`);
        error.statusCode = 404;
        throw error;
      }

      // Invalidate cache
      if (this.cacheService) {
        await this.invalidateCache(id);
      }

      // Emit event
      this.emitEvent('updated', result);

      return result;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Delete record
   */
  async delete(id, options = {}) {
    const { session = null, soft = false } = options;

    try {
      let result;
      
      if (soft) {
        // Soft delete
        result = await this.model.findByIdAndUpdate(
          id,
          { isDeleted: true, deletedAt: new Date() },
          { new: true, session }
        );
      } else {
        // Hard delete
        result = await this.model.findByIdAndDelete(id, { session });
      }

      if (!result) {
        const error = new Error(`${this.model.modelName} not found`);
        error.statusCode = 404;
        throw error;
      }

      // Invalidate cache
      if (this.cacheService) {
        await this.invalidateCache(id);
      }

      // Emit event
      this.emitEvent('deleted', result);

      return result;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Bulk operations
   */
  async bulkCreate(dataArray, options = {}) {
    const { session = null } = options;

    try {
      const results = await this.model.insertMany(dataArray, { session });
      
      if (this.cacheService) {
        await this.invalidateCache();
      }

      this.emitEvent('bulkCreated', results);
      
      return results;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async bulkUpdate(filter, update, options = {}) {
    const { session = null } = options;

    try {
      const result = await this.model.updateMany(filter, update, { session });
      
      if (this.cacheService) {
        await this.invalidateCache();
      }

      this.emitEvent('bulkUpdated', result);
      
      return result;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async bulkDelete(ids, options = {}) {
    const { session = null, soft = false } = options;

    try {
      let result;
      
      if (soft) {
        result = await this.model.updateMany(
          { _id: { $in: ids } },
          { isDeleted: true, deletedAt: new Date() },
          { session }
        );
      } else {
        result = await this.model.deleteMany(
          { _id: { $in: ids } },
          { session }
        );
      }

      if (this.cacheService) {
        await this.invalidateCache();
      }

      this.emitEvent('bulkDeleted', result);
      
      return result;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Search with text index
   */
  async search(query, options = {}) {
    const { page = 1, limit = 10 } = options;
    const skip = (page - 1) * limit;

    try {
      const results = await this.model
        .find({ $text: { $search: query } })
        .skip(skip)
        .limit(limit)
        .exec();

      const total = await this.model.countDocuments({ 
        $text: { $search: query } 
      });

      return {
        data: results,
        pagination: {
          total,
          page,
          pages: Math.ceil(total / limit),
          limit
        }
      };
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Aggregate pipeline
   */
  async aggregate(pipeline, options = {}) {
    try {
      const result = await this.model.aggregate(pipeline, options);
      return result;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Count documents
   */
  async count(filter = {}) {
    const cacheKey = this.getCacheKey('count', filter);
    
    if (this.cacheService) {
      const cached = await this.cacheService.get(cacheKey);
      if (cached !== null) return cached;
    }

    try {
      const count = await this.model.countDocuments(filter);
      
      if (this.cacheService) {
        await this.cacheService.set(cacheKey, count, 60); // 1 min cache
      }

      return count;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Check if record exists
   */
  async exists(filter) {
    try {
      const exists = await this.model.exists(filter);
      return !!exists;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Helper methods to be overridden by child classes
   */
  async validateCreate(data) {
    // Override in child class for custom validation
    return true;
  }

  async validateUpdate(id, data) {
    // Override in child class for custom validation
    return true;
  }

  /**
   * Cache management
   */
  getCacheKey(operation, params) {
    const modelName = this.model.modelName.toLowerCase();
    const paramsStr = JSON.stringify(params);
    return `${modelName}:${operation}:${paramsStr}`;
  }

  async invalidateCache(id = null) {
    if (!this.cacheService) return;

    const modelName = this.model.modelName.toLowerCase();
    
    if (id) {
      // Invalidate specific record cache
      await this.cacheService.delete(`${modelName}:byId:*${id}*`);
    }
    
    // Invalidate list caches
    await this.cacheService.delete(`${modelName}:all:*`);
    await this.cacheService.delete(`${modelName}:count:*`);
  }

  /**
   * Event emission (can be connected to EventEmitter or message queue)
   */
  emitEvent(eventType, data) {
    const event = {
      type: `${this.model.modelName.toLowerCase()}.${eventType}`,
      data,
      timestamp: new Date()
    };
    
    // In production, emit to event bus or message queue
    if (process.env.NODE_ENV === 'development') {
      console.log('Event emitted:', event);
    }
    
    // Example: eventBus.emit(event.type, event);
  }

  /**
   * Error handling
   */
  handleError(error) {
    // MongoDB duplicate key error
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      const customError = new Error(`${field} already exists`);
      customError.statusCode = 409;
      return customError;
    }

    // Validation error
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      const customError = new Error(messages.join(', '));
      customError.statusCode = 400;
      return customError;
    }

    // Cast error (invalid ID format)
    if (error.name === 'CastError') {
      const customError = new Error('Invalid ID format');
      customError.statusCode = 400;
      return customError;
    }

    // Return original error if not handled
    return error;
  }

  /**
   * Transaction helper
   */
  async withTransaction(callback) {
    const session = await this.model.db.startSession();
    session.startTransaction();

    try {
      const result = await callback(session);
      await session.commitTransaction();
      return result;
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }
}

module.exports = BaseService;