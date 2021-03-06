const express = require('express');

const router = express.Router();
const bcrypt = require('bcrypt');

const db = require('../database/MyDB')

router.post('/login', async (req, res, next) => {
    const { id, password } = req.body
    const user = await db.findOne('users', id);
    
    // 1. ID 체크
    if (!user) {
        res.send('<script type="text/javascript"> alert("해당 ID가 없습니다."); window.location.href = "/"</script>');
    } else {
        // 2. Password 체크
        bcrypt.compare(password, user.password, (err,isMatch) => {
            if (!isMatch) 
                res.send('<script type="text/javascript"> alert("비밀번호가 틀렸습니다."); window.location.href = "/"</script>');
        });
        // 3. ID와 Password가 맞다면 세션에 추가하고 Cookie 생성
        const sid = createSid(req.sm);
        req.sm.set(sid, id);
        res.cookie('sid', sid);
        res.send('<script type="text/javascript"> alert("로그인 되었습니다."); window.location.href = "/"</script>');
    }
});


router.get('/logout', (req, res, next) => {
    const sid = req.cookies.sid
    if(sid) req.sm.deleteSession(sid);
    res.clearCookie('sid');
    res.redirect('/');
})



function createSid(sm){
    const length = 15;
    const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'

    // 이미 존재하는 sid이면 반복해서 생성
    while(true){
        let sid = ''
        for(let i=0;i<length;i++){
            sid += possible.charAt(Math.floor(Math.random() * possible.length));
        }
        if (!sm.hashTable.has(sid)) return sid
    }
}
module.exports = router;
