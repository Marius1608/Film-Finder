// lib/utils.js - Modul cu funcții utilitare diverse
import crypto from 'crypto';
import { format, parseISO } from 'date-fns';
import ro from 'date-fns/locale/ro';


export function generateHash(str) {
  return crypto.createHash('sha256').update(str).digest('hex');
}


export function formatDate(isoDate, formatStr = 'dd MMMM yyyy') {
  if (!isoDate) return '';
  
  try {
    const date = parseISO(isoDate);
    return format(date, formatStr, { locale: ro });
  } catch (error) {
    console.error('Error formatting date:', error);
    return isoDate;
  }
}


export function formatRating(rating, max = 10) {
  if (!rating) return '☆☆☆☆☆';
  
  const normalizedRating = (rating / max) * 5;
  const fullStars = Math.floor(normalizedRating);
  const halfStar = normalizedRating % 1 >= 0.5;
  
  let stars = '★'.repeat(fullStars);
  
  if (halfStar) {
    stars += '½';
  }
  
  stars += '☆'.repeat(5 - fullStars - (halfStar ? 1 : 0));
  
  return stars;
}


export function generateSlug(text) {
  if (!text) return '';
  
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '') 
    .replace(/\s+/g, '-') 
    .replace(/-+/g, '-') 
    .trim();
}


export function truncateText(text, maxLength = 100) {
  if (!text || text.length <= maxLength) return text;
  
  return text.substring(0, maxLength) + '...';
}


export function getPagination(total, limit, page = 1) {
  return {
    total,
    pages: Math.ceil(total / limit),
    current: page,
    limit,
    hasNext: page < Math.ceil(total / limit),
    hasPrev: page > 1
  };
}


export function areObjectsEqual(obj1, obj2) {
  if (obj1 === obj2) return true;
  if (!obj1 || !obj2) return false;
  
  const keys1 = Object.keys(obj1);
  const keys2 = Object.keys(obj2);
  
  if (keys1.length !== keys2.length) return false;
  
  return keys1.every(key => {
    if (typeof obj1[key] === 'object' && typeof obj2[key] === 'object') {
      return areObjectsEqual(obj1[key], obj2[key]);
    }
    return obj1[key] === obj2[key];
  });
}

export function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}


export function isEmptyObject(obj) {
  return obj && Object.keys(obj).length === 0 && obj.constructor === Object;
}


export function groupBy(array, key) {
  return array.reduce((result, item) => {
    const groupKey = item[key];
    if (!result[groupKey]) {
      result[groupKey] = [];
    }
    result[groupKey].push(item);
    return result;
  }, {});
}


export function generateId() {
  return Math.random().toString(36).substring(2, 9);
}


export function moveArrayItem(array, fromIndex, toIndex) {
  const result = [...array];
  const [removed] = result.splice(fromIndex, 1);
  result.splice(toIndex, 0, removed);
  return result;
}


export function debounce(func, wait) {
  let timeout;
  return function(...args) {
    const context = this;
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(context, args), wait);
  };
}


export function throttle(func, limit) {
  let inThrottle;
  return function(...args) {
    const context = this;
    if (!inThrottle) {
      func.apply(context, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}