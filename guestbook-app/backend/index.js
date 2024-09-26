const express = require('express'); // Express 모듈 가져오기
const cors = require('cors'); // CORS 설정을 위한 모듈
const { Pool } = require('pg'); // PostgreSQL과 연결하기 위한 pg 모듈
require('dotenv').config(); // 환경 변수 설정을 위한 dotenv 모듈

// 환경변수 출력
console.log(process.env.DATABASE_URL);

const app = express(); // Express 애플리케이션 생성
app.use(cors()); // 모든 도메인에서의 CORS 허용
app.use(express.json()); // JSON 형식의 요청 본문을 자동으로 파싱

// PostgreSQL 연결 설정
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: false, // SSL 설정 (필요시 변경)
});

// 방명록 항목 추가 API
app.post('/api/guestbook', async (req, res) => {
    const { name, message, password } = req.body;
    try {
        const result = await pool.query(
            'INSERT INTO guestbook (name, message, password) VALUES ($1, $2, $3) RETURNING *',
            [name, message, password]
        );
        res.json(result.rows[0]);
    } catch (err) {
        console.error('방명록 항목 추가 중 오류:', err.message);
        res.status(500).json({ error: err.message });
    }
});

// 방명록 목록 가져오기 API
app.get('/api/guestbook', async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT g.*, COALESCE(like_count, 0) as like_count
            FROM guestbook g
            LEFT JOIN (
                SELECT guestbook_id, COUNT(*) as like_count
                FROM likes
                GROUP BY guestbook_id
            ) l ON g.id = l.guestbook_id
            ORDER BY g.id DESC
        `);
        res.json(result.rows);
    } catch (err) {
        console.error('방명록 목록 가져오기 중 오류:', err.message);
        res.status(500).json({ error: err.message });
    }
});

// 방명록 항목 수정 API
app.put('/api/guestbook/:id', async (req, res) => {
    const { id } = req.params;
    const { message, password } = req.body;
    try {
        const result = await pool.query('SELECT password FROM guestbook WHERE id = $1', [id]);
        if (result.rows.length > 0 && result.rows[0].password === password) {
            const updateResult = await pool.query(
                'UPDATE guestbook SET message = $1 WHERE id = $2 RETURNING id, name, message, created_at',
                [message, id]
            );
            res.json(updateResult.rows[0]);
        } else {
            res.status(403).json({ error: '비밀번호가 일치하지 않습니다.' });
        }
    } catch (err) {
        console.error('방명록 항목 수정 중 오류:', err.message);
        res.status(500).json({ error: err.message });
    }
});

// 방명록 항목 삭제 API
app.delete('/api/guestbook/:id', async (req, res) => {
    const { id } = req.params;
    const { password } = req.body;
    try {
        const result = await pool.query('SELECT password FROM guestbook WHERE id = $1', [id]);
        if (result.rows.length > 0 && result.rows[0].password === password) {
            await pool.query('DELETE FROM guestbook WHERE id = $1', [id]);
            res.json({ message: '삭제되었습니다.' });
        } else {
            res.status(403).json({ error: '비밀번호가 일치하지 않습니다.' });
        }
    } catch (err) {
        console.error('방명록 항목 삭제 중 오류:', err.message);
        res.status(500).json({ error: err.message });
    }
});

// 좋아요 추가 API
app.post('/api/guestbook/:id/like', async (req, res) => {
    const { id } = req.params;
    const { userId } = req.body;
    if (!userId) {
        return res.status(400).json({ error: 'userId가 필요합니다.' });
    }
    try {
        const existingLike = await pool.query('SELECT * FROM likes WHERE guestbook_id = $1 AND user_id = $2', [
            id,
            userId,
        ]);
        if (existingLike.rows.length > 0) {
            return res.status(400).json({ error: '이미 좋아요를 눌렀습니다.' });
        }
        const result = await pool.query('INSERT INTO likes (guestbook_id, user_id) VALUES ($1, $2) RETURNING *', [
            id,
            userId,
        ]);
        res.json(result.rows[0]);
    } catch (err) {
        console.error('좋아요 추가 중 오류:', err.message);
        res.status(500).json({ error: err.message });
    }
});

// 좋아요 수 조회 API
app.get('/api/guestbook/:id/likes', async (req, res) => {
    const { id } = req.params;
    try {
        const result = await pool.query('SELECT COUNT(*) AS like_count FROM likes WHERE guestbook_id = $1', [id]);
        res.json({ like_count: result.rows[0].like_count });
    } catch (err) {
        console.error('좋아요 수 조회 중 오류:', err.message);
        res.status(500).json({ error: err.message });
    }
});

// 메시지 검색 API
app.get('/api/guestbook/search', async (req, res) => {
    const { query } = req.query; // 검색어는 쿼리 파라미터로 전달됨
    try {
        const result = await pool.query(
            'SELECT * FROM guestbook WHERE message ILIKE $1 ORDER BY id DESC',
            [`%${query}%`] // 검색어가 메시지에 포함된 항목을 찾음
        );
        res.json(result.rows);
    } catch (err) {
        console.error('메시지 검색 중 오류:', err.message);
        res.status(500).json({ error: err.message });
    }
});

// 서버 실행
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
