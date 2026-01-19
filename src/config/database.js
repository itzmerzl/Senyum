/**
 * @deprecated THIS FILE IS NO LONGER USED. 
 * The application has migrated to MySQL via Node.js Backend.
 * Please use services in src/services/ for data access.
 */

const deprecatedDb = new Proxy({}, {
  get: function (target, prop) {
    throw new Error(`[DEPRECATED] Direct database access is disabled. Attempted to access: ${prop}. Use API services instead.`);
  }
});

export const db = deprecatedDb;
export const initDatabase = async () => {
  console.warn('⚠️ initDatabase() called but database is deprecated.');
  return true;
};

export default deprecatedDb;
