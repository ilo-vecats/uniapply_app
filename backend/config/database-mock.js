/**
 * Mock Database Configuration
 * In-memory database for demo/testing without PostgreSQL
 */

// In-memory data storage
const mockData = {
  users: [
    {
      id: 1,
      email: 'admin@uniapply.com',
      password_hash: '$2a$10$rOzJqZqZqZqZqZqZqZqZqOqZqZqZqZqZqZqZqZqZqZqZqZqZqZqZq',
      role: 'admin',
      first_name: 'Admin',
      last_name: 'User',
      phone: null,
      created_at: new Date(),
      updated_at: new Date()
    },
    {
      id: 2,
      email: 'student@test.com',
      password_hash: '$2a$10$rOzJqZqZqZqZqZqZqZqZqOqZqZqZqZqZqZqZqZqZqZqZqZqZqZqZq',
      role: 'student',
      first_name: 'Test',
      last_name: 'Student',
      phone: '1234567890',
      created_at: new Date(),
      updated_at: new Date()
    }
  ],
  universities: [
    { id: 1, name: 'IIT Delhi', code: 'IITD', location: 'New Delhi' },
    { id: 2, name: 'IIT Bombay', code: 'IITB', location: 'Mumbai' },
    { id: 3, name: 'IIT Madras', code: 'IITM', location: 'Chennai' }
  ],
  programs: [
    { id: 1, university_id: 1, name: 'M.Tech Computer Science', code: 'MTECH_CS', degree_type: 'M.Tech', duration: 2, application_fee: 3000 },
    { id: 2, university_id: 2, name: 'M.Tech Data Science', code: 'MTECH_DS', degree_type: 'M.Tech', duration: 2, application_fee: 3500 }
  ],
  applications: [],
  documents: [],
  payments: [],
  support_tickets: []
};

let idCounter = {
  users: 3,
  universities: 4,
  programs: 3,
  applications: 1,
  documents: 1,
  payments: 1,
  support_tickets: 1
};

// Mock query function
async function query(text, params = []) {
  // Simulate database delay
  await new Promise(resolve => setTimeout(resolve, 10));

  const result = {
    rows: [],
    rowCount: 0
  };

  // Simple SQL parser for demo
  const upperText = text.toUpperCase().trim();
  
  // SELECT queries
  if (upperText.startsWith('SELECT')) {
    if (upperText.includes('FROM USERS')) {
      if (upperText.includes('WHERE EMAIL')) {
        result.rows = mockData.users.filter(u => u.email === params[0]);
      } else if (upperText.includes('WHERE ID')) {
        result.rows = mockData.users.filter(u => u.id === params[0]);
      } else {
        result.rows = [...mockData.users];
      }
    } else if (upperText.includes('FROM UNIVERSITIES')) {
      result.rows = [...mockData.universities];
    } else if (upperText.includes('FROM PROGRAMS')) {
      if (upperText.includes('WHERE ID')) {
        result.rows = mockData.programs.filter(p => p.id === params[0]);
      } else {
        result.rows = [...mockData.programs];
      }
    } else if (upperText.includes('FROM APPLICATIONS')) {
      if (upperText.includes('WHERE USER_ID')) {
        result.rows = mockData.applications.filter(a => a.user_id === params[0]);
      } else if (upperText.includes('WHERE ID')) {
        result.rows = mockData.applications.filter(a => a.id === params[0]);
      } else {
        result.rows = [...mockData.applications];
      }
    } else if (upperText.includes('FROM DOCUMENTS')) {
      if (upperText.includes('WHERE APPLICATION_ID')) {
        result.rows = mockData.documents.filter(d => d.application_id === params[0]);
      } else {
        result.rows = [...mockData.documents];
      }
    } else if (upperText.includes('FROM PAYMENTS')) {
      if (upperText.includes('WHERE USER_ID')) {
        result.rows = mockData.payments.filter(p => p.user_id === params[0]);
      } else {
        result.rows = [...mockData.payments];
      }
    } else if (upperText.includes('FROM SUPPORT_TICKETS')) {
      if (upperText.includes('WHERE USER_ID')) {
        result.rows = mockData.support_tickets.filter(t => t.user_id === params[0]);
      } else {
        result.rows = [...mockData.support_tickets];
      }
    }
    result.rowCount = result.rows.length;
  }
  
  // INSERT queries
  else if (upperText.startsWith('INSERT')) {
    if (upperText.includes('INTO USERS')) {
      // Check if user already exists
      const existing = mockData.users.find(u => u.email === params[0]);
      if (existing && upperText.includes('ON CONFLICT')) {
        // Handle ON CONFLICT DO NOTHING
        result.rows = [];
        result.rowCount = 0;
        return result;
      }
      
      const newUser = {
        id: idCounter.users++,
        email: params[0],
        password_hash: params[1],
        role: params[2] || 'student',
        first_name: params[3] || null,
        last_name: params[4] || null,
        phone: params[5] || null,
        created_at: new Date(),
        updated_at: new Date()
      };
      mockData.users.push(newUser);
      
      // Return only specified fields if RETURNING clause exists
      if (upperText.includes('RETURNING')) {
        const returningFields = upperText.match(/RETURNING (.+)/i);
        if (returningFields) {
          const fields = returningFields[1].split(',').map(f => f.trim());
          const returnedUser = {};
          fields.forEach(field => {
            const cleanField = field.replace(/users?\./i, '').trim();
            if (newUser.hasOwnProperty(cleanField)) {
              returnedUser[cleanField] = newUser[cleanField];
            }
          });
          result.rows = [returnedUser];
        } else {
          result.rows = [newUser];
        }
      } else {
        result.rows = [newUser];
      }
      result.rowCount = 1;
    } else if (upperText.includes('INTO APPLICATIONS')) {
      const newApp = {
        id: idCounter.applications++,
        application_id: params[0],
        user_id: params[1],
        program_id: params[2],
        personal_info: typeof params[3] === 'string' ? JSON.parse(params[3]) : params[3],
        academic_history: typeof params[4] === 'string' ? JSON.parse(params[4]) : params[4],
        status: params[5] || 'draft',
        created_at: new Date(),
        updated_at: new Date()
      };
      mockData.applications.push(newApp);
      result.rows = [newApp];
      result.rowCount = 1;
    }
  }
  
  // UPDATE queries
  else if (upperText.startsWith('UPDATE')) {
    if (upperText.includes('APPLICATIONS')) {
      const app = mockData.applications.find(a => a.id === params[params.length - 1]);
      if (app) {
        Object.assign(app, { updated_at: new Date() });
        result.rows = [app];
        result.rowCount = 1;
      }
    }
  }

  return result;
}

// Mock init function
async function init() {
  console.log('✅ Using MOCK database (no PostgreSQL required)');
  console.log('📝 Demo mode: Data stored in memory');
  return Promise.resolve();
}

// Mock pool (for compatibility)
const pool = {
  query,
  on: () => {},
  end: () => Promise.resolve()
};

module.exports = {
  pool,
  query,
  init
};

