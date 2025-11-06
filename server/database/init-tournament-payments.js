import { query } from './db.js';

/**
 * Автоматически создает таблицу tournament_payments, если она не существует
 * Вызывается при запуске сервера
 */
export async function initTournamentPayments() {
  try {
    console.log('💳 Checking tournament_payments table...');
    
    // Проверяем, существует ли таблица
    const checkTable = await query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'tournament_payments'
      );
    `);
    
    const tableExists = checkTable.rows[0].exists;
    
    if (tableExists) {
      console.log('✅ Table tournament_payments already exists');
      return;
    }
    
    console.log('📝 Creating tournament_payments table...');
    
    // Создаем таблицу
    await query(`
      CREATE TABLE tournament_payments (
        id SERIAL PRIMARY KEY,
        game_id INTEGER NOT NULL REFERENCES games(id) ON DELETE CASCADE,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        registration_id INTEGER REFERENCES game_registrations(id) ON DELETE CASCADE,
        amount DECIMAL(10, 2) NOT NULL,
        payment_method VARCHAR(50) NOT NULL,
        status VARCHAR(20) DEFAULT 'pending',
        confirmed_by INTEGER REFERENCES users(id),
        confirmed_at TIMESTAMP,
        refunded_at TIMESTAMP,
        refund_reason TEXT,
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT tp_status_check CHECK (status IN ('pending', 'confirmed', 'refunded')),
        CONSTRAINT tp_amount_positive CHECK (amount > 0)
      );
    `);
    
    // Создаем индексы
    await query(`
      CREATE INDEX idx_tp_game_user ON tournament_payments(game_id, user_id);
    `);
    
    await query(`
      CREATE INDEX idx_tp_status ON tournament_payments(status);
    `);
    
    await query(`
      CREATE INDEX idx_tp_registration ON tournament_payments(registration_id);
    `);
    
    await query(`
      CREATE INDEX idx_tp_created_at ON tournament_payments(created_at);
    `);
    
    console.log('✅ Table tournament_payments created successfully!');
  } catch (error) {
    // Если таблица уже существует или другая ошибка - просто логируем
    if (error.code === '42P07') { // duplicate_table
      console.log('✅ Table tournament_payments already exists (detected by error)');
    } else {
      console.error('⚠️ Error creating tournament_payments table:', error.message);
      // Не бросаем ошибку, чтобы сервер мог запуститься
    }
  }
}

/**
 * Создает все необходимые таблицы для турниров
 */
export async function initAllTournamentTables() {
  try {
    console.log('🎰 Initializing all tournament tables...');
    
    // 1. tournament_payments
    await initTournamentPayments();
    
    // 2. tournament_actions_log
    await initTournamentActionsLog();
    
    // 3. tournament_point_structure
    await initTournamentPointStructure();
    
    console.log('✅ All tournament tables initialized!');
  } catch (error) {
    console.error('⚠️ Error initializing tournament tables:', error.message);
  }
}

/**
 * Создает таблицу tournament_actions_log
 */
async function initTournamentActionsLog() {
  try {
    const checkTable = await query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'tournament_actions_log'
      );
    `);
    
    if (checkTable.rows[0].exists) {
      console.log('✅ Table tournament_actions_log already exists');
      return;
    }
    
    console.log('📝 Creating tournament_actions_log table...');
    
    await query(`
      CREATE TABLE tournament_actions_log (
        id SERIAL PRIMARY KEY,
        game_id INTEGER NOT NULL REFERENCES games(id) ON DELETE CASCADE,
        admin_id INTEGER NOT NULL REFERENCES users(id),
        action_type VARCHAR(50) NOT NULL,
        target_user_id INTEGER REFERENCES users(id),
        details JSONB,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    
    // Добавляем constraint для action_type (с проверкой существования)
    await query(`
      DO $$ 
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'tal_action_type_check'
        ) THEN
          ALTER TABLE tournament_actions_log ADD CONSTRAINT tal_action_type_check
          CHECK (action_type IN (
            'open_registration',
            'close_registration',
            'confirm_payment',
            'mark_no_show',
            'restore_player',
            'start_tournament',
            'assign_seat',
            'finalize_results',
            'cancel_tournament'
          ));
        END IF;
      END $$;
    `);
    
    // Создаем индексы (с проверкой существования)
    const indexes = [
      { name: 'idx_tal_game_id', sql: 'CREATE INDEX idx_tal_game_id ON tournament_actions_log(game_id);' },
      { name: 'idx_tal_admin_id', sql: 'CREATE INDEX idx_tal_admin_id ON tournament_actions_log(admin_id);' },
      { name: 'idx_tal_action_type', sql: 'CREATE INDEX idx_tal_action_type ON tournament_actions_log(action_type);' },
      { name: 'idx_tal_created_at', sql: 'CREATE INDEX idx_tal_created_at ON tournament_actions_log(created_at);' }
    ];
    
    for (const idx of indexes) {
      try {
        const exists = await query(`
          SELECT EXISTS (
            SELECT 1 FROM pg_indexes 
            WHERE schemaname = 'public' 
            AND indexname = $1
          );
        `, [idx.name]);
        
        if (!exists.rows[0].exists) {
          await query(idx.sql);
        }
      } catch (e) {
        // Игнорируем ошибки создания индекса (может уже существовать)
        console.warn(`⚠️ Could not create index ${idx.name}:`, e.message);
      }
    }
    
    console.log('✅ Table tournament_actions_log created successfully!');
  } catch (error) {
    if (error.code === '42P07') {
      console.log('✅ Table tournament_actions_log already exists');
    } else {
      console.error('⚠️ Error creating tournament_actions_log table:', error.message);
    }
  }
}

/**
 * Создает таблицу tournament_point_structure
 */
async function initTournamentPointStructure() {
  try {
    const checkTable = await query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'tournament_point_structure'
      );
    `);
    
    if (checkTable.rows[0].exists) {
      console.log('✅ Table tournament_point_structure already exists');
      return;
    }
    
    console.log('📝 Creating tournament_point_structure table...');
    
    await query(`
      CREATE TABLE tournament_point_structure (
        id SERIAL PRIMARY KEY,
        game_id INTEGER NOT NULL REFERENCES games(id) ON DELETE CASCADE,
        place_from INTEGER NOT NULL,
        place_to INTEGER NOT NULL,
        points INTEGER NOT NULL,
        prize_percentage DECIMAL(5, 2),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT tps_valid_range CHECK (place_from <= place_to),
        CONSTRAINT tps_positive_points CHECK (points >= 0)
      );
    `);
    
    await query(`CREATE INDEX idx_tps_game_id ON tournament_point_structure(game_id);`);
    await query(`CREATE INDEX idx_tps_places ON tournament_point_structure(place_from, place_to);`);
    
    console.log('✅ Table tournament_point_structure created successfully!');
  } catch (error) {
    if (error.code === '42P07') {
      console.log('✅ Table tournament_point_structure already exists');
    } else {
      console.error('⚠️ Error creating tournament_point_structure table:', error.message);
    }
  }
}

