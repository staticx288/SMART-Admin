/**
 * SMART-ID Generator
 * Generates unique IDs for the Tech Identity System
 * Supports: MOD (Modules), EQP (Equipment), NOD (Nodes/Hubs), DOM (Domains)
 */

export type SmartIdType = 'MOD' | 'EQP' | 'NOD' | 'DOM';

interface SmartIdOptions {
  prefix?: string; // For domain IDs like "AI-DOM", "AUDIT-DOM"
  suffix?: string; // For future extensions
}

export class SmartIdGenerator {
  private static usedIds: Set<string> = new Set();
  
  /**
   * Generate a unique SMART-ID for the specified type
   * @param type The type of SMART-ID to generate
   * @param options Optional configuration for specialized IDs
   * @returns A unique SMART-ID string
   */
  static generate(type: SmartIdType, options?: SmartIdOptions): string {
    let attempts = 0;
    const maxAttempts = 100;
    
    while (attempts < maxAttempts) {
      let smartId: string;
      
      if (type === 'DOM' && options?.prefix) {
        // Domain module IDs: Compliance-DOM-12345, Standards-DOM-88777
        const randomNum = Math.floor(Math.random() * 90000) + 10000;
        smartId = `${options.prefix}-${type}-${randomNum}`;
      } else {
        // Standard IDs: MOD-12345, EQP-67890, NOD-54321, DOM-25365
        const randomNum = Math.floor(Math.random() * 90000) + 10000;
        smartId = `${type}-${randomNum}`;
      }
      
      // Ensure uniqueness
      if (!this.usedIds.has(smartId)) {
        this.usedIds.add(smartId);
        console.log(`🆔 Generated SMART-ID: ${smartId}`);
        return smartId;
      }
      
      attempts++;
    }
    
    throw new Error(`Failed to generate unique SMART-ID for type ${type} after ${maxAttempts} attempts`);
  }
  
  /**
   * Generate a Module SMART-ID (MOD-xxxxx)
   */
  static generateModuleId(): string {
    return this.generate('MOD');
  }
  
  /**
   * Generate an Equipment SMART-ID (EQP-xxxxx)
   */
  static generateEquipmentId(): string {
    return this.generate('EQP');
  }
  
  /**
   * Generate a Node/Hub SMART-ID (NOD-xxxxx)
   */
  static generateNodeId(): string {
    return this.generate('NOD');
  }
  
  /**
   * Generate a Domain SMART-ID
   * @param prefix Optional prefix for domain modules (Compliance, Standards, etc.)
   * @returns DOM-xxxxx for main domain or Prefix-DOM-xxxxx for domain modules
   */
  static generateDomainId(prefix?: string): string {
    return this.generate('DOM', prefix ? { prefix } : undefined);
  }
  
  /**
   * Validate a SMART-ID format
   */
  static validate(smartId: string): boolean {
    const patterns = [
      /^MOD-\d{5}$/,           // MOD-12345
      /^EQP-\d{5}$/,           // EQP-67890
      /^NOD-\d{5}$/,           // NOD-54321
      /^DOM-\d{5}$/,           // DOM-12345 (main domain)
      /^[A-Z]+-DOM-\d{5}$/,    // Compliance-DOM-12345, Standards-DOM-88777
    ];
    
    return patterns.some(pattern => pattern.test(smartId));
  }
  
  /**
   * Get the type from a SMART-ID
   */
  static getType(smartId: string): SmartIdType | null {
    if (smartId.startsWith('MOD-')) return 'MOD';
    if (smartId.startsWith('EQP-')) return 'EQP';
    if (smartId.startsWith('NOD-')) return 'NOD';
    if (smartId.startsWith('DOM-') || smartId.includes('-DOM-')) return 'DOM';
    return null;
  }
  
  /**
   * Initialize the generator by loading existing IDs to prevent duplicates
   */
  static async initialize(existingIds: string[] = []): Promise<void> {
    this.usedIds.clear();
    existingIds.forEach(id => {
      if (this.validate(id)) {
        this.usedIds.add(id);
      }
    });
    
    console.log(`🆔 SMART-ID Generator initialized with ${this.usedIds.size} existing IDs`);
  }
  
  /**
   * Get statistics about generated IDs
   */
  static getStats(): { total: number; byType: Record<string, number> } {
    const byType: Record<string, number> = {};
    
    this.usedIds.forEach(id => {
      const type = this.getType(id);
      if (type) {
        byType[type] = (byType[type] || 0) + 1;
      }
    });
    
    return {
      total: this.usedIds.size,
      byType
    };
  }
}

export default SmartIdGenerator;