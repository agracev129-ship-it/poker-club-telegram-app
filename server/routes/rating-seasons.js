import express from 'express';
import pool from '../database/db.js';

const router = express.Router();

// ============================================================================
// RATING SEASONS API ENDPOINTS
// ============================================================================

// GET /api/rating-seasons - Get all seasons
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        id,
        name,
        start_date,
        end_date,
        is_active,
        created_at,
        updated_at
      FROM rating_seasons
      ORDER BY start_date DESC
    `);
    
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching rating seasons:', error);
    res.status(500).json({ error: 'Failed to fetch rating seasons' });
  }
});

// GET /api/rating-seasons/active - Get active season
router.get('/active', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        id,
        name,
        start_date,
        end_date,
        is_active,
        created_at,
        updated_at
      FROM rating_seasons
      WHERE is_active = TRUE
      LIMIT 1
    `);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'No active season found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching active season:', error);
    res.status(500).json({ error: 'Failed to fetch active season' });
  }
});

// GET /api/rating-seasons/:id - Get season by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await pool.query(`
      SELECT 
        id,
        name,
        start_date,
        end_date,
        is_active,
        created_at,
        updated_at
      FROM rating_seasons
      WHERE id = $1
    `, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Season not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching season:', error);
    res.status(500).json({ error: 'Failed to fetch season' });
  }
});

// POST /api/rating-seasons - Create new season
router.post('/', async (req, res) => {
  const client = await pool.connect();
  
  try {
    const { name, start_date, end_date, is_active } = req.body;
    
    // Validation
    if (!name || !start_date || !end_date) {
      return res.status(400).json({ 
        error: 'Name, start_date, and end_date are required' 
      });
    }
    
    const startDate = new Date(start_date);
    const endDate = new Date(end_date);
    
    if (endDate < startDate) {
      return res.status(400).json({ 
        error: 'End date must be after start date' 
      });
    }
    
    await client.query('BEGIN');
    
    // If this season should be active, deactivate all other seasons
    if (is_active) {
      await client.query(`
        UPDATE rating_seasons 
        SET is_active = FALSE
      `);
    }
    
    // Create new season
    const result = await client.query(`
      INSERT INTO rating_seasons (name, start_date, end_date, is_active)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `, [name, start_date, end_date, is_active || false]);
    
    await client.query('COMMIT');
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error creating season:', error);
    res.status(500).json({ error: 'Failed to create season' });
  } finally {
    client.release();
  }
});

// PUT /api/rating-seasons/:id - Update season
router.put('/:id', async (req, res) => {
  const client = await pool.connect();
  
  try {
    const { id } = req.params;
    const { name, start_date, end_date, is_active } = req.body;
    
    // Check if season exists
    const existing = await client.query(
      'SELECT * FROM rating_seasons WHERE id = $1',
      [id]
    );
    
    if (existing.rows.length === 0) {
      return res.status(404).json({ error: 'Season not found' });
    }
    
    // Validate dates if provided
    if (start_date && end_date) {
      const startDate = new Date(start_date);
      const endDate = new Date(end_date);
      
      if (endDate < startDate) {
        return res.status(400).json({ 
          error: 'End date must be after start date' 
        });
      }
    }
    
    await client.query('BEGIN');
    
    // If this season should be active, deactivate all other seasons
    if (is_active === true) {
      await client.query(`
        UPDATE rating_seasons 
        SET is_active = FALSE
        WHERE id != $1
      `, [id]);
    }
    
    // Build update query dynamically
    const updates = [];
    const values = [];
    let paramCount = 1;
    
    if (name !== undefined) {
      updates.push(`name = $${paramCount}`);
      values.push(name);
      paramCount++;
    }
    
    if (start_date !== undefined) {
      updates.push(`start_date = $${paramCount}`);
      values.push(start_date);
      paramCount++;
    }
    
    if (end_date !== undefined) {
      updates.push(`end_date = $${paramCount}`);
      values.push(end_date);
      paramCount++;
    }
    
    if (is_active !== undefined) {
      updates.push(`is_active = $${paramCount}`);
      values.push(is_active);
      paramCount++;
    }
    
    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }
    
    values.push(id);
    
    const result = await client.query(`
      UPDATE rating_seasons
      SET ${updates.join(', ')}
      WHERE id = $${paramCount}
      RETURNING *
    `, values);
    
    await client.query('COMMIT');
    
    res.json(result.rows[0]);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error updating season:', error);
    res.status(500).json({ error: 'Failed to update season' });
  } finally {
    client.release();
  }
});

// DELETE /api/rating-seasons/:id - Delete season
router.delete('/:id', async (req, res) => {
  const client = await pool.connect();
  
  try {
    const { id } = req.params;
    
    // Check if season exists
    const existing = await client.query(
      'SELECT * FROM rating_seasons WHERE id = $1',
      [id]
    );
    
    if (existing.rows.length === 0) {
      return res.status(404).json({ error: 'Season not found' });
    }
    
    // Check if there are games linked to this season
    const linkedGames = await client.query(
      'SELECT COUNT(*) as count FROM games WHERE season_id = $1',
      [id]
    );
    
    if (parseInt(linkedGames.rows[0].count) > 0) {
      return res.status(400).json({ 
        error: 'Cannot delete season with linked tournaments. Unlink tournaments first.' 
      });
    }
    
    await client.query('BEGIN');
    
    await client.query('DELETE FROM rating_seasons WHERE id = $1', [id]);
    
    await client.query('COMMIT');
    
    res.json({ message: 'Season deleted successfully' });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error deleting season:', error);
    res.status(500).json({ error: 'Failed to delete season' });
  } finally {
    client.release();
  }
});

// POST /api/rating-seasons/:id/set-active - Set season as active
router.post('/:id/set-active', async (req, res) => {
  const client = await pool.connect();
  
  try {
    const { id } = req.params;
    
    // Check if season exists
    const existing = await client.query(
      'SELECT * FROM rating_seasons WHERE id = $1',
      [id]
    );
    
    if (existing.rows.length === 0) {
      return res.status(404).json({ error: 'Season not found' });
    }
    
    await client.query('BEGIN');
    
    // Deactivate all seasons
    await client.query('UPDATE rating_seasons SET is_active = FALSE');
    
    // Activate the selected season
    const result = await client.query(`
      UPDATE rating_seasons
      SET is_active = TRUE
      WHERE id = $1
      RETURNING *
    `, [id]);
    
    await client.query('COMMIT');
    
    res.json(result.rows[0]);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error setting active season:', error);
    res.status(500).json({ error: 'Failed to set active season' });
  } finally {
    client.release();
  }
});

// GET /api/rating-seasons/:id/leaderboard - Get leaderboard for specific season
router.get('/:id/leaderboard', async (req, res) => {
  try {
    const { id } = req.params;
    const limit = parseInt(req.query.limit) || 100;
    
    console.log(`📊 Fetching leaderboard for season ${id}...`);
    
    // First, check if season exists
    const seasonCheck = await pool.query('SELECT * FROM rating_seasons WHERE id = $1', [id]);
    if (seasonCheck.rows.length === 0) {
      console.log(`❌ Season ${id} not found`);
      return res.status(404).json({ error: 'Season not found' });
    }
    console.log(`✅ Season found:`, seasonCheck.rows[0].name);
    
    // Check games in this season
    const gamesCheck = await pool.query('SELECT id, name, season_id FROM games WHERE season_id = $1', [id]);
    console.log(`🎮 Games in season ${id}:`, gamesCheck.rows.length);
    gamesCheck.rows.forEach(game => {
      console.log(`   - Game ${game.id}: ${game.name} (season_id: ${game.season_id})`);
    });
    
    // Get leaderboard based on points from games in this season
    const result = await pool.query(`
      WITH season_stats AS (
        SELECT 
          gr.user_id,
          COUNT(DISTINCT g.id) as games_played,
          SUM(gr.points_earned) as total_points,
          SUM(CASE WHEN ta.finish_place = 1 THEN 1 ELSE 0 END) as wins
        FROM game_registrations gr
        JOIN games g ON gr.game_id = g.id
        LEFT JOIN table_assignments ta ON gr.game_id = ta.game_id AND gr.user_id = ta.user_id
        WHERE g.season_id = $1
          AND gr.status = 'participated'
          AND gr.points_earned IS NOT NULL
        GROUP BY gr.user_id
      )
      SELECT 
        u.id,
        u.telegram_id,
        u.first_name,
        u.last_name,
        u.username,
        u.photo_url,
        COALESCE(ss.games_played, 0) as games_played,
        COALESCE(ss.total_points, 0) as total_points,
        COALESCE(ss.wins, 0) as games_won,
        ROW_NUMBER() OVER (ORDER BY COALESCE(ss.total_points, 0) DESC, COALESCE(ss.games_played, 0) DESC) as rank
      FROM users u
      LEFT JOIN season_stats ss ON u.id = ss.user_id
      WHERE ss.games_played > 0
      ORDER BY total_points DESC, games_played DESC
      LIMIT $2
    `, [id, limit]);
    
    console.log(`✅ Leaderboard for season ${id}:`, result.rows.length, 'players');
    result.rows.forEach((player, idx) => {
      console.log(`   ${idx + 1}. ${player.first_name} ${player.last_name || ''}: ${player.total_points} pts (${player.games_played} games)`);
    });
    
    res.json(result.rows);
  } catch (error) {
    console.error('❌ Error fetching season leaderboard:', error);
    res.status(500).json({ error: 'Failed to fetch season leaderboard' });
  }
});

export default router;




