import supabase from '../db';

/**
 * Base Model class for common database operations
 * All models should extend this class
 */
export abstract class BaseModel {
  protected static tableName: string;
  
  /**
   * Find all records in the table
   */
  static async findAll<T>(): Promise<T[]> {
    const { data, error } = await supabase
      .from(this.tableName)
      .select('*');
    
    if (error) {
      throw new Error(`Error fetching ${this.tableName}: ${error.message}`);
    }
    
    return data || [];
  }
  
  /**
   * Find a record by ID
   */
  static async findById<T>(id: number): Promise<T | null> {
    const { data, error } = await supabase
      .from(this.tableName)
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') {
        return null; // No record found
      }
      throw new Error(`Error fetching ${this.tableName} by ID: ${error.message}`);
    }
    
    return data;
  }
  
  /**
   * Create a new record
   */
  static async create<T>(data: Partial<T>): Promise<T> {
    const { data: result, error } = await supabase
      .from(this.tableName)
      .insert([data])
      .select()
      .single();
    
    if (error) {
      throw new Error(`Error creating ${this.tableName}: ${error.message}`);
    }
    
    return result;
  }
  
  /**
   * Update a record by ID
   */
  static async updateById<T>(id: number, data: Partial<T>): Promise<T | null> {
    const { data: result, error } = await supabase
      .from(this.tableName)
      .update(data)
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') {
        return null; // No record found
      }
      throw new Error(`Error updating ${this.tableName}: ${error.message}`);
    }
    
    return result;
  }
  
  /**
   * Delete a record by ID
   */
  static async deleteById(id: number): Promise<boolean> {
    const { error } = await supabase
      .from(this.tableName)
      .delete()
      .eq('id', id);
    
    if (error) {
      throw new Error(`Error deleting ${this.tableName}: ${error.message}`);
    }
    
    return true;
  }
  
  /**
   * Find records by a specific field
   */
  static async findBy<T>(field: string, value: any): Promise<T[]> {
    const { data, error } = await supabase
      .from(this.tableName)
      .select('*')
      .eq(field, value);
    
    if (error) {
      throw new Error(`Error finding ${this.tableName} by ${field}: ${error.message}`);
    }
    
    return data || [];
  }
  
  /**
   * Find one record by a specific field
   */
  static async findOneBy<T>(field: string, value: any): Promise<T | null> {
    const { data, error } = await supabase
      .from(this.tableName)
      .select('*')
      .eq(field, value)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') {
        return null; // No record found
      }
      throw new Error(`Error finding ${this.tableName} by ${field}: ${error.message}`);
    }
    
    return data;
  }
  
  /**
   * Count total records
   */
  static async count(): Promise<number> {
    const { count, error } = await supabase
      .from(this.tableName)
      .select('*', { count: 'exact', head: true });
    
    if (error) {
      throw new Error(`Error counting ${this.tableName}: ${error.message}`);
    }
    
    return count || 0;
  }
}