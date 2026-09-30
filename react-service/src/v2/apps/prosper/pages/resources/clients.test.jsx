import clients from './clients';

describe('clients data', () => {
  test('should export an array of client objects', () => {
    expect(Array.isArray(clients)).toBe(true);
    expect(clients.length).toBeGreaterThan(0);
  });

  test('should have valid client structure', () => {
    const validClient = clients.find(client => 
      client.name && client.company && client.paragraph
    );
    
    expect(validClient).toBeDefined();
    expect(validClient).toHaveProperty('src');
    expect(validClient).toHaveProperty('name');
    expect(validClient).toHaveProperty('company');
    expect(validClient).toHaveProperty('paragraph');
    expect(validClient).toHaveProperty('link');
  });

  test('should include ARM Concepts client', () => {
    const armConcepts = clients.find(client => client.company === 'ARM Concepts Limited');
    expect(armConcepts).toBeDefined();
    expect(armConcepts.name).toBe('Ezio Muratore');
    expect(armConcepts.paragraph).toBe('clients-say-text-4');
    expect(armConcepts.link).toBe('https://armconcepts.co.uk');
  });

  test('should include Base UFH client', () => {
    const baseUFH = clients.find(client => client.company === 'Base UFH');
    expect(baseUFH).toBeDefined();
    expect(baseUFH.name).toBe('Shane Cox');
    expect(baseUFH.paragraph).toBe('clients-say-text-1');
    expect(baseUFH.link).toBe('https://baseufh.co.uk/');
  });

  test('should handle clients with null src gracefully', () => {
    const clientsWithNullSrc = clients.filter(client => client.src === null);
    expect(clientsWithNullSrc.length).toBeGreaterThan(0);
    
    clientsWithNullSrc.forEach(client => {
      expect(client).toHaveProperty('name');
      expect(client).toHaveProperty('company');
      expect(client).toHaveProperty('paragraph');
    });
  });

  test('should handle clients with null link gracefully', () => {
    const clientsWithNullLink = clients.filter(client => client.link === null);
    expect(clientsWithNullLink.length).toBeGreaterThan(0);
    
    clientsWithNullLink.forEach(client => {
      expect(client).toHaveProperty('name');
      expect(client).toHaveProperty('company');
      expect(client).toHaveProperty('paragraph');
    });
  });
});