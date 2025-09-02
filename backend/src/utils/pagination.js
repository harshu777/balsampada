const paginate = (query) => {
  const page = parseInt(query.page) || 1;
  const limit = parseInt(query.limit) || 10;
  const skip = (page - 1) * limit;
  const sort = query.sort || '-createdAt';
  
  // Parse sort string (e.g., "-createdAt,name" -> { createdAt: -1, name: 1 })
  const sortObj = {};
  if (sort) {
    const sortFields = sort.split(',');
    sortFields.forEach(field => {
      if (field.startsWith('-')) {
        sortObj[field.substring(1)] = -1;
      } else {
        sortObj[field] = 1;
      }
    });
  }
  
  return {
    page,
    limit,
    skip,
    sort: sortObj
  };
};

const paginateResponse = (data, page, limit, total) => {
  const totalPages = Math.ceil(total / limit);
  
  return {
    data,
    pagination: {
      total,
      page,
      limit,
      totalPages,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1
    }
  };
};

// Advanced query builder with filters
const buildQuery = (queryParams, allowedFields = []) => {
  const query = {};
  const excludeFields = ['page', 'limit', 'sort', 'fields'];
  
  // Build filter query
  Object.keys(queryParams).forEach(key => {
    if (!excludeFields.includes(key) && (allowedFields.length === 0 || allowedFields.includes(key))) {
      const value = queryParams[key];
      
      // Handle different operators
      if (typeof value === 'string') {
        // Handle comparison operators (gte, gt, lte, lt, ne)
        if (value.includes(':')) {
          const [operator, val] = value.split(':');
          if (['gte', 'gt', 'lte', 'lt', 'ne'].includes(operator)) {
            query[key] = { [`$${operator}`]: isNaN(val) ? val : Number(val) };
          } else {
            query[key] = value;
          }
        } else if (value.includes(',')) {
          // Handle multiple values (OR condition)
          query[key] = { $in: value.split(',') };
        } else {
          // Exact match or regex for strings
          if (key.includes('name') || key.includes('title') || key.includes('description')) {
            query[key] = { $regex: value, $options: 'i' };
          } else {
            query[key] = value;
          }
        }
      } else {
        query[key] = value;
      }
    }
  });
  
  return query;
};

// Field selection helper
const selectFields = (fieldsStr) => {
  if (!fieldsStr) return '';
  
  // Convert comma-separated fields to space-separated for mongoose
  // Handle exclusions with minus sign
  return fieldsStr.split(',').map(field => {
    if (field.startsWith('-')) {
      return `-${field.substring(1)}`;
    }
    return field;
  }).join(' ');
};

module.exports = {
  paginate,
  paginateResponse,
  buildQuery,
  selectFields
};